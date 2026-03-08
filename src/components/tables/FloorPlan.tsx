import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Clock, Check, X, Plus, Lock, Unlock, ShoppingCart, ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRestaurantTables, useOrders as useDbOrders, DbTable } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';

const statusConfig: Record<TableStatus, { bg: string; border: string; label: string; dot: string }> = {
  available: { bg: 'bg-primary/10', border: 'border-primary/30', label: 'Available', dot: 'bg-primary' },
  occupied: { bg: 'bg-warning/10', border: 'border-warning/30', label: 'Occupied', dot: 'bg-warning' },
  reserved: { bg: 'bg-chart-3/10', border: 'border-chart-3/30', label: 'Reserved', dot: 'bg-chart-3' },
  cleaning: { bg: 'bg-muted', border: 'border-border', label: 'Cleaning', dot: 'bg-muted-foreground' },
};

const shapeClass: Record<string, string> = {
  round: 'rounded-full w-20 h-20 sm:w-24 sm:h-24',
  square: 'rounded-xl w-20 h-20 sm:w-24 sm:h-24',
  rect: 'rounded-xl w-28 h-20 sm:w-32 sm:h-24',
};

function timeSince(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function FloorPlan() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: dbTables, loading, addTable, updateTable, deleteTable } = useRestaurantTables();
  const { orders } = useDbOrders();

  const [selected, setSelected] = useState<DbTable | null>(null);
  const [actionDialog, setActionDialog] = useState(false);
  const [seatForm, setSeatForm] = useState({ guestName: '', guestCount: '2' });
  const [editMode, setEditMode] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [addDialog, setAddDialog] = useState(false);
  const [newTable, setNewTable] = useState<{ seats: string; shape: string }>({ seats: '4', shape: 'square' });
  const floorRef = useRef<HTMLDivElement>(null);

  const counts = {
    available: dbTables.filter(t => t.status === 'available').length,
    occupied: dbTables.filter(t => t.status === 'occupied').length,
    reserved: dbTables.filter(t => t.status === 'reserved').length,
    cleaning: dbTables.filter(t => t.status === 'cleaning').length,
  };

  const handleTableClick = (table: DbTable) => {
    if (editMode) return;
    setSelected(table);
    setSeatForm({ guestName: table.guest_name || '', guestCount: (table.guest_count || table.seats).toString() });
    setActionDialog(true);
  };

  const handleUpdate = async (id: string, updates: Partial<DbTable>) => {
    const { error } = await updateTable(id, updates);
    if (error) toast.error('Failed to update table');
    setActionDialog(false);
  };

  const handleAddTable = async () => {
    if (!user) return;
    const maxNumber = dbTables.reduce((max, t) => Math.max(max, t.number), 0);
    const { error } = await addTable({
      user_id: user.id,
      number: maxNumber + 1,
      seats: parseInt(newTable.seats) || 4,
      x: 40,
      y: 40,
      status: 'available',
      shape: newTable.shape,
      guest_name: null,
      guest_count: null,
      occupied_since: null,
    });
    if (error) toast.error('Failed to add table');
    setAddDialog(false);
    setNewTable({ seats: '4', shape: 'square' });
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteTable(id);
    if (error) toast.error('Failed to delete table');
  };

  const getPercentPosition = useCallback((clientX: number, clientY: number) => {
    if (!floorRef.current) return { x: 0, y: 0 };
    const rect = floorRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(90, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(85, ((clientY - rect.top) / rect.height) * 100));
    return { x, y };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent, tableId: string) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    setDragging(tableId);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [editMode]);

  // Local drag position for smooth UX
  const [dragPos, setDragPos] = useState<Record<string, { x: number; y: number }>>({});

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const { x, y } = getPercentPosition(e.clientX, e.clientY);
    setDragPos(prev => ({ ...prev, [dragging]: { x, y } }));
  }, [dragging, getPercentPosition]);

  const handlePointerUp = useCallback(async () => {
    if (!dragging) return;
    const pos = dragPos[dragging];
    if (pos) {
      await updateTable(dragging, { x: pos.x, y: pos.y });
      setDragPos(prev => {
        const next = { ...prev };
        delete next[dragging];
        return next;
      });
    }
    setDragging(null);
  }, [dragging, dragPos, updateTable]);

  const seatGuests = () => {
    if (!selected) return;
    handleUpdate(selected.id, {
      status: 'occupied',
      guest_name: seatForm.guestName || 'Walk-in',
      guest_count: parseInt(seatForm.guestCount) || 2,
      occupied_since: new Date().toISOString(),
    });
  };

  const freeTable = () => {
    if (!selected) return;
    handleUpdate(selected.id, { status: 'cleaning', guest_name: null, guest_count: null, occupied_since: null });
  };

  const markClean = () => {
    if (!selected) return;
    handleUpdate(selected.id, { status: 'available' });
  };

  const markReserved = () => {
    if (!selected) return;
    handleUpdate(selected.id, { status: 'reserved', guest_name: seatForm.guestName || 'Reserved' });
  };

  const cancelReservation = () => {
    if (!selected) return;
    handleUpdate(selected.id, { status: 'available', guest_name: null });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend + Edit toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-4">
          {(Object.entries(statusConfig) as [TableStatus, typeof statusConfig.available][]).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              <span className={`h-3 w-3 rounded-full ${cfg.dot}`} />
              <span className="text-muted-foreground">{cfg.label}</span>
              <span className="font-semibold">{counts[key]}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          {editMode && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAddDialog(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Table
            </Button>
          )}
          <Button
            variant={editMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEditMode(!editMode)}
            className="gap-1.5"
          >
            {editMode ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            {editMode ? 'Lock Layout' : 'Edit Layout'}
          </Button>
        </div>
      </div>

      {/* Floor Plan */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <div
            ref={floorRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className={`relative w-full min-h-[500px] bg-muted/30 rounded-2xl border-2 border-dashed border-border p-4 ${editMode ? 'ring-2 ring-primary/30' : ''}`}
            style={{ touchAction: editMode ? 'none' : 'auto' }}
          >
            <div className="absolute top-3 left-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Entrance ↓</div>
            <div className="absolute bottom-3 right-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Kitchen →</div>
            <div className="absolute top-3 right-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Window</div>
            <div className="absolute bottom-3 left-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Bar Area</div>

            {editMode && (
              <div className="absolute inset-0 pointer-events-none z-0">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={`h-${i}`} className="absolute w-full border-t border-border/20" style={{ top: `${(i + 1) * 10}%` }} />
                ))}
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={`v-${i}`} className="absolute h-full border-l border-border/20" style={{ left: `${(i + 1) * 10}%` }} />
                ))}
              </div>
            )}

            {dbTables.length === 0 && !editMode && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <p className="text-lg font-medium">No tables yet</p>
                <p className="text-sm">Click "Edit Layout" to add tables</p>
              </div>
            )}

            {dbTables.map((table) => {
              const status = table.status as TableStatus;
              const cfg = statusConfig[status] || statusConfig.available;
              const pos = dragPos[table.id] || { x: Number(table.x), y: Number(table.y) };
              return (
                <motion.div
                  key={table.id}
                  className="absolute"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  {editMode && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(table.id); }}
                      className="absolute -top-2 -right-2 z-20 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  <motion.button
                    whileHover={editMode ? {} : { scale: 1.08 }}
                    whileTap={editMode ? {} : { scale: 0.95 }}
                    onClick={() => handleTableClick(table)}
                    onPointerDown={(e) => handlePointerDown(e, table.id)}
                    className={`flex flex-col items-center justify-center border-2 transition-colors ${shapeClass[table.shape] || shapeClass.square} ${cfg.bg} ${cfg.border} hover:shadow-lg ${editMode ? 'cursor-grab active:cursor-grabbing z-10' : 'cursor-pointer'} ${dragging === table.id ? 'shadow-xl ring-2 ring-primary opacity-90' : ''}`}
                  >
                    <span className="font-bold text-sm">T{table.number}</span>
                    <span className="text-[10px] text-muted-foreground">{table.seats} seats</span>
                    {status === 'occupied' && table.occupied_since && (
                      <span className="text-[10px] font-medium text-warning flex items-center gap-0.5 mt-0.5">
                        <Clock className="h-2.5 w-2.5" />{timeSince(table.occupied_since)}
                      </span>
                    )}
                    {table.guest_name && status !== 'available' && (
                      <span className="text-[9px] text-muted-foreground truncate max-w-full px-1">{table.guest_name}</span>
                    )}
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialog} onOpenChange={setActionDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Table {selected?.number}
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${selected ? (statusConfig[selected.status as TableStatus]?.dot || '') : ''}`} />
              <span className="text-sm font-normal text-muted-foreground capitalize">{selected?.status}</span>
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted p-3 text-center">
                  <p className="text-xs text-muted-foreground">Seats</p>
                  <p className="font-bold">{selected.seats}</p>
                </div>
                <div className="rounded-lg bg-muted p-3 text-center">
                  <p className="text-xs text-muted-foreground">Shape</p>
                  <p className="font-bold capitalize">{selected.shape}</p>
                </div>
              </div>

              {selected.status === 'available' && (
                <div className="space-y-3">
                  <div><Label>Guest Name</Label><Input value={seatForm.guestName} onChange={e => setSeatForm(f => ({ ...f, guestName: e.target.value }))} placeholder="Walk-in" /></div>
                  <div><Label>Party Size</Label><Input type="number" min="1" max={selected.seats} value={seatForm.guestCount} onChange={e => setSeatForm(f => ({ ...f, guestCount: e.target.value }))} /></div>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={seatGuests}><Users className="h-4 w-4 mr-1" /> Seat Guests</Button>
                    <Button variant="outline" className="flex-1" onClick={markReserved}>Reserve</Button>
                  </div>
                </div>
              )}

              {selected.status === 'occupied' && (() => {
                const tableOrder = orders.find(o => o.table_number === selected.number && !['completed', 'cancelled'].includes(o.status));
                return (
                  <div className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Guest</span><span className="font-medium">{selected.guest_name}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Party size</span><span className="font-medium">{selected.guest_count}</span></div>
                      {selected.occupied_since && <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-medium">{timeSince(selected.occupied_since)}</span></div>}
                    </div>

                    {tableOrder ? (
                      <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Order</span>
                          <Badge variant="secondary" className="text-[10px]">{tableOrder.status}</Badge>
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {tableOrder.items.map(item => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="truncate">{item.quantity}× {item.menu_item_name}</span>
                              <span className="font-medium text-muted-foreground">${(Number(item.unit_price) * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between text-sm font-bold pt-1 border-t border-border">
                          <span>Total</span>
                          <span>${Number(tableOrder.total).toFixed(2)}</span>
                        </div>
                        <Button size="sm" variant="outline" className="w-full" onClick={() => { setActionDialog(false); navigate('/orders'); }}>
                          <ExternalLink className="h-3.5 w-3.5 mr-1" /> View in Orders
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" className="w-full" onClick={() => { setActionDialog(false); navigate(`/orders?table=${selected.number}&customer=${encodeURIComponent(selected.guest_name || '')}`); }}>
                        <ShoppingCart className="h-4 w-4 mr-1" /> Create Order
                      </Button>
                    )}

                    <Button variant="outline" className="w-full" onClick={freeTable}>
                      <Check className="h-4 w-4 mr-1" /> Free Table
                    </Button>
                  </div>
                );
              })()}

              {selected.status === 'reserved' && (
                <div className="space-y-3">
                  <div><Label>Guest Name</Label><Input value={seatForm.guestName} onChange={e => setSeatForm(f => ({ ...f, guestName: e.target.value }))} /></div>
                  <div><Label>Party Size</Label><Input type="number" min="1" max={selected.seats} value={seatForm.guestCount} onChange={e => setSeatForm(f => ({ ...f, guestCount: e.target.value }))} /></div>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={seatGuests}><Users className="h-4 w-4 mr-1" /> Seat Guests</Button>
                    <Button variant="outline" className="flex-1" onClick={cancelReservation}><X className="h-4 w-4 mr-1" /> Cancel</Button>
                  </div>
                </div>
              )}

              {selected.status === 'cleaning' && (
                <Button className="w-full" onClick={markClean}>
                  <Check className="h-4 w-4 mr-1" /> Mark as Clean
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Table Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Add New Table</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Seats</Label>
              <Input type="number" min="1" max="12" value={newTable.seats} onChange={e => setNewTable(f => ({ ...f, seats: e.target.value }))} />
            </div>
            <div>
              <Label>Shape</Label>
              <Select value={newTable.shape} onValueChange={(v) => setNewTable(f => ({ ...f, shape: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="round">Round</SelectItem>
                  <SelectItem value="square">Square</SelectItem>
                  <SelectItem value="rect">Rectangle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleAddTable}>
              <Plus className="h-4 w-4 mr-1" /> Add Table
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

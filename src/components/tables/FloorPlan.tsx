import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Clock, Check, X, Plus, Minus, Lock, Unlock, ShoppingCart, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrders } from '@/contexts/OrderContext';

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';

export interface RestaurantTable {
  id: string;
  number: number;
  seats: number;
  x: number; // percentage position
  y: number;
  status: TableStatus;
  orderId?: string;
  guestName?: string;
  guestCount?: number;
  occupiedSince?: string;
  shape: 'round' | 'square' | 'rect';
}

const initialTables: RestaurantTable[] = [
  { id: 't-1', number: 1, seats: 2, x: 8, y: 10, status: 'occupied', guestName: 'Alice Chen', guestCount: 2, occupiedSince: new Date(Date.now() - 45 * 60000).toISOString(), shape: 'round' },
  { id: 't-2', number: 2, seats: 2, x: 28, y: 10, status: 'available', shape: 'round' },
  { id: 't-3', number: 3, seats: 4, x: 48, y: 10, status: 'occupied', guestName: 'Bob Martinez', guestCount: 3, occupiedSince: new Date(Date.now() - 20 * 60000).toISOString(), shape: 'square' },
  { id: 't-4', number: 4, seats: 4, x: 70, y: 10, status: 'reserved', guestName: 'Diana Park', shape: 'square' },
  { id: 't-5', number: 5, seats: 6, x: 8, y: 40, status: 'available', shape: 'rect' },
  { id: 't-6', number: 6, seats: 6, x: 35, y: 40, status: 'cleaning', shape: 'rect' },
  { id: 't-7', number: 7, seats: 4, x: 65, y: 40, status: 'occupied', guestName: 'Walk-in', guestCount: 4, occupiedSince: new Date(Date.now() - 60 * 60000).toISOString(), shape: 'square' },
  { id: 't-8', number: 8, seats: 8, x: 20, y: 70, status: 'available', shape: 'rect' },
  { id: 't-9', number: 9, seats: 2, x: 55, y: 70, status: 'available', shape: 'round' },
  { id: 't-10', number: 10, seats: 4, x: 75, y: 70, status: 'reserved', guestName: 'VIP Guest', shape: 'square' },
];

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
  const { orders, setCurrentTable, setCurrentCustomerName } = useOrders();
  const [tables, setTables] = useState<RestaurantTable[]>(initialTables);
  const [selected, setSelected] = useState<RestaurantTable | null>(null);
  const [actionDialog, setActionDialog] = useState(false);
  const [seatForm, setSeatForm] = useState({ guestName: '', guestCount: '2' });
  const [editMode, setEditMode] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [addDialog, setAddDialog] = useState(false);
  const [newTable, setNewTable] = useState<{ seats: string; shape: RestaurantTable['shape'] }>({ seats: '4', shape: 'square' });
  const floorRef = useRef<HTMLDivElement>(null);

  const counts = {
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
    cleaning: tables.filter(t => t.status === 'cleaning').length,
  };

  const handleTableClick = (table: RestaurantTable) => {
    if (editMode) return; // don't open dialog while dragging
    setSelected(table);
    setSeatForm({ guestName: table.guestName || '', guestCount: (table.guestCount || table.seats).toString() });
    setActionDialog(true);
  };

  const updateTable = (id: string, updates: Partial<RestaurantTable>) => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
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

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const { x, y } = getPercentPosition(e.clientX, e.clientY);
    setTables(prev => prev.map(t => t.id === dragging ? { ...t, x, y } : t));
  }, [dragging, getPercentPosition]);

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  const seatGuests = () => {
    if (!selected) return;
    updateTable(selected.id, {
      status: 'occupied',
      guestName: seatForm.guestName || 'Walk-in',
      guestCount: parseInt(seatForm.guestCount) || 2,
      occupiedSince: new Date().toISOString(),
    });
    setActionDialog(false);
  };

  const freeTable = () => {
    if (!selected) return;
    updateTable(selected.id, { status: 'cleaning', guestName: undefined, guestCount: undefined, occupiedSince: undefined, orderId: undefined });
    setActionDialog(false);
  };

  const markClean = () => {
    if (!selected) return;
    updateTable(selected.id, { status: 'available' });
    setActionDialog(false);
  };

  const markReserved = () => {
    if (!selected) return;
    updateTable(selected.id, { status: 'reserved', guestName: seatForm.guestName || 'Reserved' });
    setActionDialog(false);
  };

  const cancelReservation = () => {
    if (!selected) return;
    updateTable(selected.id, { status: 'available', guestName: undefined });
    setActionDialog(false);
  };

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
            {/* Room labels */}
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

            {tables.map((table) => {
              const cfg = statusConfig[table.status];
              return (
                <motion.button
                  key={table.id}
                  whileHover={editMode ? {} : { scale: 1.08 }}
                  whileTap={editMode ? {} : { scale: 0.95 }}
                  onClick={() => handleTableClick(table)}
                  onPointerDown={(e) => handlePointerDown(e, table.id)}
                  className={`absolute flex flex-col items-center justify-center border-2 transition-colors ${shapeClass[table.shape]} ${cfg.bg} ${cfg.border} hover:shadow-lg ${editMode ? 'cursor-grab active:cursor-grabbing z-10' : 'cursor-pointer'} ${dragging === table.id ? 'shadow-xl ring-2 ring-primary opacity-90' : ''}`}
                  style={{ left: `${table.x}%`, top: `${table.y}%` }}
                >
                  <span className="font-bold text-sm">T{table.number}</span>
                  <span className="text-[10px] text-muted-foreground">{table.seats} seats</span>
                  {table.status === 'occupied' && table.occupiedSince && (
                    <span className="text-[10px] font-medium text-warning flex items-center gap-0.5 mt-0.5">
                      <Clock className="h-2.5 w-2.5" />{timeSince(table.occupiedSince)}
                    </span>
                  )}
                  {table.guestName && table.status !== 'available' && (
                    <span className="text-[9px] text-muted-foreground truncate max-w-full px-1">{table.guestName}</span>
                  )}
                </motion.button>
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
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${selected ? statusConfig[selected.status].dot : ''}`} />
              <span className="text-sm font-normal text-muted-foreground capitalize">{selected?.status}</span>
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              {/* Info */}
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
                const tableOrder = orders.find(o => o.tableNumber === selected.number && !['completed', 'cancelled'].includes(o.status));
                return (
                  <div className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Guest</span><span className="font-medium">{selected.guestName}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Party size</span><span className="font-medium">{selected.guestCount}</span></div>
                      {selected.occupiedSince && <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-medium">{timeSince(selected.occupiedSince)}</span></div>}
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
                              <span className="truncate">{item.quantity}× {item.menuItemName}</span>
                              <span className="font-medium text-muted-foreground">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between text-sm font-bold pt-1 border-t border-border">
                          <span>Total</span>
                          <span>${tableOrder.total.toFixed(2)}</span>
                        </div>
                        <Button size="sm" variant="outline" className="w-full" onClick={() => { setActionDialog(false); navigate('/orders'); }}>
                          <ExternalLink className="h-3.5 w-3.5 mr-1" /> View in Orders
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" className="w-full" onClick={() => { setCurrentTable(selected.number); setCurrentCustomerName(selected.guestName || ''); setActionDialog(false); navigate('/orders'); }}>
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
    </div>
  );
}

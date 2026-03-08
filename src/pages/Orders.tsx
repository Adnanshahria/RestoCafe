import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, X, ShoppingCart, Hash, User, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useMenuItems, useCategories, useOrders as useDbOrders, useInvoices } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Local order item type for the cart
interface CartItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
}

const TAX_RATE = 0.1;

// Order list sub-component
function OrderListView({ orders, updateOrderStatus, onComplete }: { orders: any[]; updateOrderStatus: (id: string, status: string) => Promise<void>; onComplete: (order: any) => Promise<void> }) {
  const statusFlow = ['pending', 'preparing', 'served', 'completed'];
  const nextStatus = (s: string) => {
    const i = statusFlow.indexOf(s);
    return i >= 0 && i < statusFlow.length - 1 ? statusFlow[i + 1] : null;
  };
  const statusColors: Record<string, string> = {
    pending: 'bg-warning/15 text-warning',
    preparing: 'bg-chart-3/15 text-chart-3',
    served: 'bg-primary/15 text-primary',
    completed: 'bg-success/15 text-success',
    cancelled: 'bg-destructive/15 text-destructive',
  };

  const active = orders.filter(o => !['completed', 'cancelled'].includes(o.status));
  const completed = orders.filter(o => ['completed', 'cancelled'].includes(o.status));

  return (
    <div className="space-y-4">
      {active.length === 0 && <p className="text-center text-muted-foreground py-10">No active orders</p>}
      {active.map(order => {
        const next = nextStatus(order.status);
        return (
          <Card key={order.id} className="border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">#{order.id.slice(-4)}</span>
                  {order.table_number && <Badge variant="outline">T{order.table_number}</Badge>}
                  {order.customer_name && <span className="text-sm text-muted-foreground">{order.customer_name}</span>}
                </div>
                <Badge className={statusColors[order.status] || ''}>{order.status}</Badge>
              </div>
              <div className="space-y-1 text-sm mb-3">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.quantity}× {item.menu_item_name}</span>
                    <span className="text-muted-foreground">${(item.quantity * Number(item.unit_price)).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold">${Number(order.total).toFixed(2)}</span>
                {next && (
                  <Button size="sm" onClick={async () => {
                    await updateOrderStatus(order.id, next);
                    if (next === 'completed') await onComplete(order);
                  }}>
                    Move to {next}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
      {completed.length > 0 && (
        <div className="pt-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Completed ({completed.length})</h3>
          {completed.slice(0, 5).map(order => (
            <div key={order.id} className="flex items-center justify-between py-2 border-b text-sm">
              <span>#{order.id.slice(-4)} · {order.customer_name || 'Walk-in'}</span>
              <span className="font-medium">${Number(order.total).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const OrdersPage = () => {
  const { user } = useAuth();
  const { data: menuItems, loading: menuLoading } = useMenuItems();
  const { data: categories, loading: catsLoading } = useCategories();
  const { orders, loading: ordersLoading, createOrder, updateOrderStatus } = useDbOrders();
  const { createInvoice } = useInvoices();

  const handleCompleteOrder = useCallback(async (order: any) => {
    await createInvoice({
      order_id: order.id,
      customer_name: order.customer_name || null,
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      discount: Number(order.discount),
      total: Number(order.total),
      payment_method: 'cash',
      paid: true,
    });
    toast.success('Invoice generated!');
  }, [createInvoice]);
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [view, setView] = useState<'new' | 'list'>('new');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentTable, setCurrentTable] = useState<string>(searchParams.get('table') || '');
  const [currentCustomerName, setCurrentCustomerName] = useState(searchParams.get('customer') || '');
  

  const filteredItems = activeCategory === 'all'
    ? menuItems.filter(i => i.available)
    : menuItems.filter(i => i.category_id === activeCategory && i.available);

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const addToCart = (item: typeof menuItems[0]) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.id);
      if (existing) return prev.map(i => i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id: crypto.randomUUID(), menuItemId: item.id, menuItemName: item.name, quantity: 1, unitPrice: Number(item.price) }];
    });
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) setCart(prev => prev.filter(i => i.id !== id));
    else setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

  const clearCart = useCallback(() => {
    setCart([]);
    setCurrentTable('');
    setCurrentCustomerName('');
  }, []);

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    const { error } = await createOrder(
      {
        status: 'pending',
        table_number: currentTable ? parseInt(currentTable) : null,
        customer_id: null,
        customer_name: currentCustomerName || null,
        subtotal,
        tax,
        discount: 0,
        total,
        created_by: user?.id || null,
      },
      cart.map(i => ({
        menu_item_id: i.menuItemId,
        menu_item_name: i.menuItemName,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        notes: null,
      }))
    );
    if (error) toast.error('Failed to create order');
    else { toast.success('Order placed!'); clearCart(); }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); setView('new'); clearCart(); }
      if (e.key === 'Escape') clearCart();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [clearCart]);

  const loading = menuLoading || catsLoading || ordersLoading;
  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">F2: New Order · Esc: Clear</p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === 'new' ? 'default' : 'outline'} size="sm" onClick={() => setView('new')}>
            <Plus className="h-4 w-4 mr-1" /> New Order
          </Button>
          <Button variant={view === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setView('list')}>
            <ShoppingCart className="h-4 w-4 mr-1" /> All Orders ({orders.length})
          </Button>
        </div>
      </div>

      {view === 'list' ? (
        <OrderListView orders={orders} updateOrderStatus={updateOrderStatus} onComplete={handleCompleteOrder} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Button variant={activeCategory === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setActiveCategory('all')}>All</Button>
              {categories.map(c => (
                <Button key={c.id} variant={activeCategory === c.id ? 'default' : 'outline'} size="sm" onClick={() => setActiveCategory(c.id)} className="whitespace-nowrap">{c.name}</Button>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <AnimatePresence mode="popLayout">
                {filteredItems.map(item => (
                  <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}>
                    <button onClick={() => addToCart(item)} className="w-full text-left p-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all">
                      <div className="h-16 rounded-lg bg-muted mb-2 flex items-center justify-center"><span className="text-2xl">🍽️</span></div>
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-primary font-semibold text-sm mt-0.5">${Number(item.price).toFixed(2)}</p>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {filteredItems.length === 0 && <p className="col-span-full text-center text-muted-foreground py-10">No items available</p>}
            </div>
          </div>

          <Card className="border-0 shadow-sm h-fit sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold font-sans flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" /> Current Order
                {cart.length > 0 && <Badge variant="secondary" className="ml-auto">{cart.length} items</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Hash className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="number" placeholder="Table" className="pl-8 h-9" value={currentTable} onChange={e => setCurrentTable(e.target.value)} />
                </div>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Customer" className="pl-8 h-9" value={currentCustomerName} onChange={e => setCurrentCustomerName(e.target.value)} />
                </div>
              </div>
              <Separator />
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                <AnimatePresence>
                  {cart.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Tap menu items to add</p>
                  ) : cart.map(item => (
                    <motion.div key={item.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex items-center gap-2 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.menuItemName}</p>
                        <p className="text-muted-foreground text-xs">${item.unitPrice.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                        <span className="w-6 text-center font-medium">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.id)}><X className="h-3 w-3" /></Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              {cart.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Tax (10%)</span><span>${tax.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-base pt-1"><span>Total</span><span>${total.toFixed(2)}</span></div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={clearCart}>Clear</Button>
                    <Button className="flex-1" onClick={handleSubmitOrder}><Send className="h-4 w-4 mr-1" /> Place Order</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;

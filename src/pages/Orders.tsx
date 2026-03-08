import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, X, ShoppingCart, Hash, User, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useOrders } from '@/contexts/OrderContext';
import { categories, menuItems } from '@/data/mock-data';
import { OrderItem, Order, OrderStatus } from '@/types';
import { OrderList } from '@/components/orders/OrderList';

const TAX_RATE = 0.1;

const OrdersPage = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [view, setView] = useState<'new' | 'list'>('new');
  const {
    orders, addOrder, currentOrder, addToCurrentOrder,
    removeFromCurrentOrder, updateQuantity, clearCurrentOrder,
    currentTable, setCurrentTable, currentCustomerName, setCurrentCustomerName,
  } = useOrders();

  const filteredItems = activeCategory === 'all'
    ? menuItems.filter(i => i.available)
    : menuItems.filter(i => i.categoryId === activeCategory && i.available);

  const subtotal = currentOrder.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const handleAddItem = (item: typeof menuItems[0]) => {
    const orderItem: OrderItem = {
      id: crypto.randomUUID(),
      menuItemId: item.id,
      menuItemName: item.name,
      quantity: 1,
      unitPrice: item.price,
    };
    addToCurrentOrder(orderItem);
  };

  const handleSubmitOrder = () => {
    if (currentOrder.length === 0) return;
    const order: Order = {
      id: `ord-${Date.now()}`,
      items: currentOrder,
      status: 'pending',
      tableNumber: currentTable ?? undefined,
      customerName: currentCustomerName || undefined,
      subtotal,
      tax,
      discount: 0,
      total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addOrder(order);
    clearCurrentOrder();
  };

  // Keyboard shortcut: F2 for new order
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); setView('new'); clearCurrentOrder(); }
      if (e.key === 'Escape') clearCurrentOrder();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [clearCurrentOrder]);

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
        <OrderList />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Menu Grid */}
          <div className="lg:col-span-2 space-y-4">
            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Button
                variant={activeCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory('all')}
              >
                All
              </Button>
              {categories.map(c => (
                <Button
                  key={c.id}
                  variant={activeCategory === c.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(c.id)}
                  className="whitespace-nowrap"
                >
                  {c.name}
                </Button>
              ))}
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <AnimatePresence mode="popLayout">
                {filteredItems.map(item => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      onClick={() => handleAddItem(item)}
                      className="w-full text-left p-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all group"
                    >
                      <div className="h-16 rounded-lg bg-muted mb-2 flex items-center justify-center">
                        <span className="text-2xl">🍽️</span>
                      </div>
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-primary font-semibold text-sm mt-0.5">${item.price.toFixed(2)}</p>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Order Summary */}
          <Card className="border-0 shadow-sm h-fit sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold font-sans flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Current Order
                {currentOrder.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">{currentOrder.length} items</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Table & Customer */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Hash className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Table"
                    className="pl-8 h-9"
                    value={currentTable ?? ''}
                    onChange={e => setCurrentTable(e.target.value ? Number(e.target.value) : null)}
                  />
                </div>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Customer"
                    className="pl-8 h-9"
                    value={currentCustomerName}
                    onChange={e => setCurrentCustomerName(e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              {/* Items */}
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                <AnimatePresence>
                  {currentOrder.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Tap menu items to add
                    </p>
                  ) : (
                    currentOrder.map(item => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.menuItemName}</p>
                          <p className="text-muted-foreground text-xs">${item.unitPrice.toFixed(2)} each</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center font-medium">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCurrentOrder(item.id)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              {currentOrder.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Tax (10%)</span><span>${tax.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-base pt-1"><span>Total</span><span>${total.toFixed(2)}</span></div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={clearCurrentOrder}>Clear</Button>
                    <Button className="flex-1" onClick={handleSubmitOrder}>
                      <Send className="h-4 w-4 mr-1" /> Place Order
                    </Button>
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

import { motion } from 'framer-motion';
import { useOrders } from '@/contexts/OrderContext';
import { OrderStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

const statusFlow: OrderStatus[] = ['pending', 'preparing', 'served', 'completed'];

const statusStyle: Record<OrderStatus, string> = {
  pending: 'bg-warning/15 text-warning border-warning/30',
  preparing: 'bg-chart-3/15 text-chart-3 border-chart-3/30',
  served: 'bg-primary/15 text-primary border-primary/30',
  completed: 'bg-success/15 text-success border-success/30',
  cancelled: 'bg-destructive/15 text-destructive border-destructive/30',
};

export function OrderList() {
  const { orders, updateOrderStatus } = useOrders();

  const nextStatus = (s: OrderStatus): OrderStatus | null => {
    const i = statusFlow.indexOf(s);
    return i >= 0 && i < statusFlow.length - 1 ? statusFlow[i + 1] : null;
  };

  return (
    <div className="space-y-6">
      {statusFlow.map(status => {
        const filtered = orders.filter(o => o.status === status);
        if (filtered.length === 0) return null;
        return (
          <div key={status}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <span className={`inline-block h-2 w-2 rounded-full ${
                status === 'pending' ? 'bg-warning' :
                status === 'preparing' ? 'bg-chart-3' :
                status === 'served' ? 'bg-primary' : 'bg-success'
              }`} />
              {status} ({filtered.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(order => {
                const next = nextStatus(order.status);
                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="border shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">#{order.id.slice(-4)}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusStyle[order.status]}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          {order.tableNumber && <p>Table {order.tableNumber}</p>}
                          {order.customerName && <p>{order.customerName}</p>}
                          <p>{order.items.length} items · ${order.total.toFixed(2)}</p>
                        </div>
                        <div className="text-xs space-y-0.5">
                          {order.items.slice(0, 3).map(i => (
                            <p key={i.id} className="text-muted-foreground">{i.quantity}× {i.menuItemName}</p>
                          ))}
                          {order.items.length > 3 && (
                            <p className="text-muted-foreground">+{order.items.length - 3} more</p>
                          )}
                        </div>
                        {next && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => updateOrderStatus(order.id, next)}
                          >
                            Move to {next} <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

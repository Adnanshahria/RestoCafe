import { Order, OrderStatus } from '@/types';
import { Badge } from '@/components/ui/badge';

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-warning/15 text-warning border-warning/20',
  preparing: 'bg-chart-3/15 text-chart-3 border-chart-3/20',
  served: 'bg-primary/15 text-primary border-primary/20',
  completed: 'bg-success/15 text-success border-success/20',
  cancelled: 'bg-destructive/15 text-destructive border-destructive/20',
};

interface Props {
  orders: Order[];
}

export function RecentOrders({ orders }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="text-left py-3 font-medium">Order</th>
            <th className="text-left py-3 font-medium hidden sm:table-cell">Table</th>
            <th className="text-left py-3 font-medium">Customer</th>
            <th className="text-left py-3 font-medium">Status</th>
            <th className="text-right py-3 font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
              <td className="py-3 font-medium">#{order.id.slice(-4)}</td>
              <td className="py-3 hidden sm:table-cell">{order.tableNumber ? `T-${order.tableNumber}` : '—'}</td>
              <td className="py-3 text-muted-foreground">{order.customerName || 'Walk-in'}</td>
              <td className="py-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[order.status]}`}>
                  {order.status}
                </span>
              </td>
              <td className="py-3 text-right font-medium">${order.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useOrders } from '@/hooks/useSupabaseData';

const colors = [
  'hsl(134, 20%, 55%)',
  'hsl(28, 40%, 65%)',
  'hsl(200, 25%, 60%)',
  'hsl(340, 20%, 65%)',
  'hsl(60, 25%, 55%)',
];

export function TopItemsChart() {
  const { orders } = useOrders();

  // Aggregate item popularity from real orders
  const itemCounts: Record<string, number> = {};
  orders.forEach(o => o.items.forEach(i => {
    itemCounts[i.menu_item_name] = (itemCounts[i.menu_item_name] || 0) + i.quantity;
  }));

  const data = Object.entries(itemCounts)
    .map(([name, orders]) => ({ name, orders }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 5);

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-10">No order data yet</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
        <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(30, 8%, 50%)" />
        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} stroke="hsl(30, 8%, 50%)" />
        <Tooltip
          contentStyle={{
            borderRadius: '12px',
            border: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            fontSize: '13px',
          }}
        />
        <Bar dataKey="orders" radius={[0, 6, 6, 0]} barSize={20}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

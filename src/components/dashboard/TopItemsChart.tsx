import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { name: 'Grilled Salmon', orders: 48 },
  { name: 'Beef Steak', orders: 42 },
  { name: 'Chicken Parm.', orders: 38 },
  { name: 'Caesar Salad', orders: 35 },
  { name: 'Espresso', orders: 62 },
];

const colors = [
  'hsl(134, 20%, 55%)',
  'hsl(28, 40%, 65%)',
  'hsl(200, 25%, 60%)',
  'hsl(340, 20%, 65%)',
  'hsl(60, 25%, 55%)',
];

export function TopItemsChart() {
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

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DailySummary } from '@/types';

interface Props {
  data: DailySummary[];
}

export function RevenueChart({ data }: Props) {
  const chartData = data.map((d) => ({
    date: d.date.slice(5),
    revenue: d.revenue,
    profit: d.profit,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(134, 20%, 55%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(134, 20%, 55%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(28, 40%, 65%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(28, 40%, 65%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(36, 15%, 88%)" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(30, 8%, 50%)" />
        <YAxis tick={{ fontSize: 12 }} stroke="hsl(30, 8%, 50%)" />
        <Tooltip
          contentStyle={{
            borderRadius: '12px',
            border: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            fontSize: '13px',
          }}
        />
        <Area type="monotone" dataKey="revenue" stroke="hsl(134, 20%, 55%)" fill="url(#revGrad)" strokeWidth={2} />
        <Area type="monotone" dataKey="profit" stroke="hsl(28, 40%, 65%)" fill="url(#profitGrad)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

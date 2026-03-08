import { motion } from 'framer-motion';
import { DollarSign, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockDailySummaries, mockOrders, mockCustomers, menuItems } from '@/data/mock-data';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { TopItemsChart } from '@/components/dashboard/TopItemsChart';
import { RecentOrders } from '@/components/dashboard/RecentOrders';

const today = mockDailySummaries[mockDailySummaries.length - 1];

const stats = [
  { title: "Today's Revenue", value: `$${today.revenue.toLocaleString()}`, icon: DollarSign, change: '+12%' },
  { title: 'Orders Today', value: today.orders.toString(), icon: ShoppingCart, change: '+8%' },
  { title: 'Avg Order Value', value: `$${(today.revenue / today.orders).toFixed(0)}`, icon: TrendingUp, change: '+3%' },
  { title: 'Active Customers', value: mockCustomers.length.toString(), icon: Users, change: '+2' },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your restaurant today</p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((s) => (
          <motion.div key={s.title} variants={item}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.title}</p>
                    <p className="text-2xl font-bold mt-1">{s.value}</p>
                    <p className="text-xs text-primary mt-1">{s.change} from yesterday</p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} initial="hidden" animate="show" className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold font-sans">Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart data={mockDailySummaries} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} initial="hidden" animate="show">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold font-sans">Top Items</CardTitle>
            </CardHeader>
            <CardContent>
              <TopItemsChart />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={item} initial="hidden" animate="show">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold font-sans">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentOrders orders={mockOrders} />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;

import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { mockDailySummaries, mockExpenses } from '@/data/mock-data';
import { Expense } from '@/types';

const FinancePage = () => {
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', category: 'Ingredients' });

  const totalRevenue = mockDailySummaries.reduce((s, d) => s + d.revenue, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalProfit = totalRevenue - totalExpenses;

  const handleAdd = () => {
    if (!form.description || !form.amount) return;
    setExpenses(prev => [{
      id: `e-${Date.now()}`,
      description: form.description,
      amount: parseFloat(form.amount),
      category: form.category,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    }, ...prev]);
    setForm({ description: '', amount: '', category: 'Ingredients' });
    setIsOpen(false);
  };

  const cashFlowData = mockDailySummaries.map(d => ({
    date: d.date.slice(5),
    income: d.revenue,
    expenses: d.expenses,
    profit: d.profit,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Finance</h1>
          <p className="text-muted-foreground text-sm mt-1">Income, expenses & profit overview</p>
        </div>
        <Button size="sm" onClick={() => setIsOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Expense</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: 'Total Revenue', value: totalRevenue, icon: TrendingUp, color: 'text-primary' },
          { title: 'Total Expenses', value: totalExpenses, icon: TrendingDown, color: 'text-destructive' },
          { title: 'Net Profit', value: totalProfit, icon: DollarSign, color: 'text-success' },
        ].map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.title}</p>
                  <p className="text-2xl font-bold mt-1">${s.value.toLocaleString()}</p>
                </div>
                <div className={`h-11 w-11 rounded-xl bg-muted flex items-center justify-center ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg font-semibold font-sans">Cash Flow</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(36, 15%, 88%)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
              <Bar dataKey="income" fill="hsl(134, 20%, 55%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="hsl(0, 65%, 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg font-semibold font-sans">Recent Expenses</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expenses.map(e => (
              <div key={e.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">{e.description}</p>
                  <p className="text-xs text-muted-foreground">{e.category} · {e.date}</p>
                </div>
                <span className="font-semibold text-destructive text-sm">-${e.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><Label>Amount ($)</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Ingredients', 'Payroll', 'Utilities', 'Supplies', 'Maintenance', 'Other'].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancePage;

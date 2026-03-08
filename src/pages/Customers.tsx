import { motion } from 'framer-motion';
import { Search, Mail, Phone, Star } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { mockCustomers } from '@/data/mock-data';

const CustomersPage = () => {
  const [search, setSearch] = useState('');
  const filtered = mockCustomers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Customers</h1>
        <p className="text-muted-foreground text-sm mt-1">{mockCustomers.length} registered customers</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search customers..." className="pl-8 h-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{c.name}</h3>
                    <p className="text-xs text-muted-foreground">Since {new Date(c.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-muted p-2">
                    <p className="text-xs text-muted-foreground">Visits</p>
                    <p className="font-bold text-sm">{c.visitCount}</p>
                  </div>
                  <div className="rounded-lg bg-muted p-2">
                    <p className="text-xs text-muted-foreground">Spent</p>
                    <p className="font-bold text-sm">${c.totalSpent.toFixed(0)}</p>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-2">
                    <p className="text-xs text-muted-foreground">Points</p>
                    <p className="font-bold text-sm text-primary">{c.loyaltyPoints}</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {c.email && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{c.email}</div>}
                  {c.phone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{c.phone}</div>}
                  <div className="flex items-center gap-1.5"><Star className="h-3 w-3" />Last visit: {c.lastVisit}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CustomersPage;

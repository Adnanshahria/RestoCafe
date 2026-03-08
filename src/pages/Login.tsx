import { useState } from 'react';
import { motion } from 'framer-motion';
import { UtensilsCrossed, User, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

const Login = () => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) login(name.trim(), role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary mb-4"
          >
            <UtensilsCrossed className="h-8 w-8 text-primary-foreground" />
          </motion.div>
          <h1 className="text-3xl font-bold">RestoCafe</h1>
          <p className="text-muted-foreground mt-1">Restaurant Management System</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="h-12"
                  autoFocus
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Select Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { value: 'cashier' as UserRole, label: 'Cashier', icon: User, desc: 'Take orders & payments' },
                    { value: 'admin' as UserRole, label: 'Admin', icon: ShieldCheck, desc: 'Full access & reports' },
                  ]).map((r) => (
                    <motion.button
                      key={r.value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setRole(r.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-colors ${
                        role === r.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <r.icon className={`h-5 w-5 mb-2 ${role === r.value ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="font-medium text-sm">{r.label}</div>
                      <div className="text-xs text-muted-foreground">{r.desc}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-base" disabled={!name.trim()}>
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;

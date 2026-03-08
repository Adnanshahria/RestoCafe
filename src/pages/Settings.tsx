import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Moon, Sun, Store } from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();
  const { isDark, toggle } = useTheme();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your preferences</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg font-semibold font-sans">Appearance</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDark ? <Moon className="h-5 w-5 text-muted-foreground" /> : <Sun className="h-5 w-5 text-warning" />}
              <div>
                <Label>Dark Mode</Label>
                <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
              </div>
            </div>
            <Switch checked={isDark} onCheckedChange={toggle} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg font-semibold font-sans flex items-center gap-2"><Store className="h-5 w-5" /> Restaurant Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Restaurant Name</Label><Input defaultValue="RestoCafe" /></div>
          <div><Label>Address</Label><Input defaultValue="123 Restaurant Avenue" /></div>
          <div><Label>Phone</Label><Input defaultValue="(555) 123-4567" /></div>
          <div><Label>Tax Rate (%)</Label><Input type="number" defaultValue="10" /></div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg font-semibold font-sans">Account</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{user?.name}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span className="font-medium capitalize">{user?.role}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{user?.email}</span></div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg font-semibold font-sans">Keyboard Shortcuts</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {[
              ['F2', 'New Order'],
              ['Esc', 'Clear / Cancel'],
            ].map(([key, action]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-muted-foreground">{action}</span>
                <kbd className="px-2 py-0.5 rounded bg-muted text-xs font-mono">{key}</kbd>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;

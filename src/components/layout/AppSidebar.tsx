import {
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  Grid3X3,
  FileText,
  DollarSign,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const mainNav = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Orders', url: '/orders', icon: ShoppingCart },
  { title: 'Tables', url: '/tables', icon: Grid3X3 },
  { title: 'Menu', url: '/menu', icon: UtensilsCrossed },
  { title: 'Invoices', url: '/invoices', icon: FileText },
];

const managementNav = [
  { title: 'Finance', url: '/finance', icon: DollarSign },
  { title: 'Customers', url: '/customers', icon: Users },
  { title: 'Analytics', url: '/analytics', icon: BarChart3 },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { user, logout, isAdmin } = useAuth();
  const { isDark, toggle } = useTheme();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const mgmtItems = isAdmin ? managementNav : managementNav.filter(i => i.url !== '/finance');

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Brand */}
        <div className="p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-base font-semibold leading-none font-sans">RestoCafe</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{user?.role === 'admin' ? 'Admin' : 'Cashier'}</p>
            </div>
          )}
        </div>

        <Separator className="mx-3 w-auto" />

        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end={item.url === '/'}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mgmtItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-2">
        <Button variant="ghost" size={collapsed ? 'icon' : 'sm'} className="w-full justify-start" onClick={toggle}>
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed && <span className="ml-2">{isDark ? 'Light mode' : 'Dark mode'}</span>}
        </Button>
        <Button variant="ghost" size={collapsed ? 'icon' : 'sm'} className="w-full justify-start text-destructive hover:text-destructive" onClick={logout}>
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

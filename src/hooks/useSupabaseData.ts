import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// Generic hook for fetching from an API endpoint
export function useTable<T>(endpoint: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const refetch = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const rows = await api.get(`/api/${endpoint}`);
      setData(rows as T[]);
    } catch (err) {
      console.error(`Failed to fetch ${endpoint}:`, err);
    }
    setLoading(false);
  }, [endpoint, isAuthenticated]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, refetch, setData };
}

// Categories
export function useCategories() {
  return useTable<{ id: string; name: string; icon: string | null }>('categories');
}

// Menu items
export interface DbMenuItem {
  id: string;
  name: string;
  price: number;
  category_id: string | null;
  description: string | null;
  image: string | null;
  available: boolean;
  created_at: string;
}

export function useMenuItems() {
  const result = useTable<DbMenuItem>('menu-items');

  const addItem = useCallback(async (item: Omit<DbMenuItem, 'id' | 'created_at'>) => {
    try {
      const data = await api.post('/api/menu-items', item);
      result.refetch();
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }, [result.refetch]);

  const updateItem = useCallback(async (id: string, updates: Partial<DbMenuItem>) => {
    try {
      await api.put(`/api/menu-items/${id}`, updates);
      result.refetch();
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  }, [result.refetch]);

  const deleteItem = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/menu-items/${id}`);
      result.refetch();
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  }, [result.refetch]);

  return { ...result, addItem, updateItem, deleteItem };
}

// Restaurant tables
export interface DbTable {
  id: string;
  user_id: string;
  number: number;
  seats: number;
  x: number;
  y: number;
  status: string;
  shape: string;
  guest_name: string | null;
  guest_count: number | null;
  occupied_since: string | null;
}

export function useRestaurantTables() {
  const result = useTable<DbTable>('tables');

  const addTable = useCallback(async (table: Omit<DbTable, 'id'>) => {
    try {
      const data = await api.post('/api/tables', table);
      result.refetch();
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }, [result.refetch]);

  const updateTable = useCallback(async (id: string, updates: Partial<DbTable>) => {
    try {
      await api.put(`/api/tables/${id}`, updates);
      result.refetch();
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  }, [result.refetch]);

  const deleteTable = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/tables/${id}`);
      result.refetch();
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  }, [result.refetch]);

  return { ...result, addTable, updateTable, deleteTable };
}

// Orders with items
export interface DbOrder {
  id: string;
  status: string;
  table_number: number | null;
  customer_id: string | null;
  customer_name: string | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
  notes: string | null;
}

export function useOrders() {
  const [orders, setOrders] = useState<(DbOrder & { items: DbOrderItem[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refetch = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.get('/api/orders');
      setOrders(data as any);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
    setLoading(false);
  }, [isAuthenticated]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Polling for real-time updates (every 5 seconds)
  useEffect(() => {
    if (!isAuthenticated) return;

    pollingRef.current = setInterval(() => {
      refetch();
    }, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isAuthenticated, refetch]);

  const createOrder = useCallback(async (
    order: Omit<DbOrder, 'id' | 'created_at' | 'updated_at'>,
    items: Omit<DbOrderItem, 'id' | 'order_id'>[]
  ) => {
    try {
      const data = await api.post('/api/orders', { ...order, items });
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }, []);

  const updateOrderStatus = useCallback(async (id: string, status: string) => {
    try {
      await api.patch(`/api/orders/${id}/status`, { status });
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  }, []);

  return { orders, loading, refetch, createOrder, updateOrderStatus };
}

// Customers
export interface DbCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  loyalty_points: number;
  total_spent: number;
  visit_count: number;
  last_visit: string | null;
  created_at: string;
}

export function useCustomers() {
  const result = useTable<DbCustomer>('customers');

  const addCustomer = useCallback(async (c: Partial<DbCustomer>) => {
    try {
      await api.post('/api/customers', c);
      result.refetch();
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  }, [result.refetch]);

  return { ...result, addCustomer };
}

// Expenses
export interface DbExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  created_by: string | null;
  created_at: string;
}

export function useExpenses() {
  const result = useTable<DbExpense>('expenses');

  const addExpense = useCallback(async (e: Omit<DbExpense, 'id' | 'created_at'>) => {
    try {
      await api.post('/api/expenses', e);
      result.refetch();
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  }, [result.refetch]);

  return { ...result, addExpense };
}

// Invoices
export interface DbInvoice {
  id: string;
  order_id: string | null;
  customer_name: string | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method: string;
  paid: boolean;
  created_at: string;
}

export function useInvoices() {
  const result = useTable<DbInvoice>('invoices');

  const createInvoice = useCallback(async (inv: Omit<DbInvoice, 'id' | 'created_at'>) => {
    try {
      await api.post('/api/invoices', inv);
      result.refetch();
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  }, [result.refetch]);

  return { ...result, createInvoice };
}

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Generic hook for fetching a table
export function useTable<T>(table: string, orderBy?: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const refetch = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    let query = supabase.from(table).select('*') as any;
    if (orderBy) query = query.order(orderBy, { ascending: false });
    const { data: rows, error } = await query;
    if (!error && rows) setData(rows as T[]);
    setLoading(false);
  }, [table, orderBy, isAuthenticated]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, refetch, setData };
}

// Categories
export function useCategories() {
  return useTable<{ id: string; name: string; icon: string | null }>('categories', 'name');
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
  const result = useTable<DbMenuItem>('menu_items', 'created_at');

  const addItem = useCallback(async (item: Omit<DbMenuItem, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.from('menu_items').insert(item).select().single();
    if (!error && data) result.refetch();
    return { data, error };
  }, [result.refetch]);

  const updateItem = useCallback(async (id: string, updates: Partial<DbMenuItem>) => {
    const { error } = await supabase.from('menu_items').update(updates).eq('id', id);
    if (!error) result.refetch();
    return { error };
  }, [result.refetch]);

  const deleteItem = useCallback(async (id: string) => {
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (!error) result.refetch();
    return { error };
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
  const result = useTable<DbTable>('restaurant_tables', 'number');

  const addTable = useCallback(async (table: Omit<DbTable, 'id'>) => {
    const { data, error } = await supabase.from('restaurant_tables').insert(table).select().single();
    if (!error) result.refetch();
    return { data, error };
  }, [result.refetch]);

  const updateTable = useCallback(async (id: string, updates: Partial<DbTable>) => {
    const { error } = await supabase.from('restaurant_tables').update(updates).eq('id', id);
    if (!error) result.refetch();
    return { error };
  }, [result.refetch]);

  const deleteTable = useCallback(async (id: string) => {
    const { error } = await supabase.from('restaurant_tables').delete().eq('id', id);
    if (!error) result.refetch();
    return { error };
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

  const refetch = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    const { data: orderRows } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    const { data: itemRows } = await supabase.from('order_items').select('*');

    if (orderRows) {
      const mapped = orderRows.map(o => ({
        ...o,
        items: (itemRows || []).filter(i => i.order_id === o.id),
      }));
      setOrders(mapped as any);
    }
    setLoading(false);
  }, [isAuthenticated]);

  useEffect(() => { refetch(); }, [refetch]);

  const createOrder = useCallback(async (
    order: Omit<DbOrder, 'id' | 'created_at' | 'updated_at'>,
    items: Omit<DbOrderItem, 'id' | 'order_id'>[]
  ) => {
    const { data, error } = await supabase.from('orders').insert(order).select().single();
    if (error || !data) return { error };
    const orderItems = items.map(i => ({ ...i, order_id: data.id }));
    await supabase.from('order_items').insert(orderItems);
    await refetch();
    return { data, error: null };
  }, [refetch]);

  const updateOrderStatus = useCallback(async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    await refetch();
  }, [refetch]);

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
  const result = useTable<DbCustomer>('customers', 'created_at');

  const addCustomer = useCallback(async (c: Partial<DbCustomer>) => {
    const { error } = await supabase.from('customers').insert(c);
    if (!error) result.refetch();
    return { error };
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
  const result = useTable<DbExpense>('expenses', 'created_at');

  const addExpense = useCallback(async (e: Omit<DbExpense, 'id' | 'created_at'>) => {
    const { error } = await supabase.from('expenses').insert(e);
    if (!error) result.refetch();
    return { error };
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
  const result = useTable<DbInvoice>('invoices', 'created_at');

  const createInvoice = useCallback(async (inv: Omit<DbInvoice, 'id' | 'created_at'>) => {
    const { error } = await supabase.from('invoices').insert(inv);
    if (!error) result.refetch();
    return { error };
  }, [result.refetch]);

  return { ...result, createInvoice };
}

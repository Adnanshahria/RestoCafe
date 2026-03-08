import React, { createContext, useContext, useState, useCallback } from 'react';
import { Order, OrderItem, OrderStatus } from '@/types';
import { mockOrders } from '@/data/mock-data';

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  currentOrder: OrderItem[];
  addToCurrentOrder: (item: OrderItem) => void;
  removeFromCurrentOrder: (itemId: string) => void;
  updateQuantity: (itemId: string, qty: number) => void;
  clearCurrentOrder: () => void;
  currentTable: number | null;
  setCurrentTable: (t: number | null) => void;
  currentCustomerName: string;
  setCurrentCustomerName: (n: string) => void;
}

const OrderContext = createContext<OrderContextType>({} as OrderContextType);
export const useOrders = () => useContext(OrderContext);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [currentTable, setCurrentTable] = useState<number | null>(null);
  const [currentCustomerName, setCurrentCustomerName] = useState('');

  const addOrder = useCallback((order: Order) => {
    setOrders(prev => [order, ...prev]);
  }, []);

  const updateOrderStatus = useCallback((id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o));
  }, []);

  const addToCurrentOrder = useCallback((item: OrderItem) => {
    setCurrentOrder(prev => {
      const existing = prev.find(i => i.menuItemId === item.menuItemId);
      if (existing) {
        return prev.map(i => i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, item];
    });
  }, []);

  const removeFromCurrentOrder = useCallback((itemId: string) => {
    setCurrentOrder(prev => prev.filter(i => i.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, qty: number) => {
    if (qty <= 0) {
      setCurrentOrder(prev => prev.filter(i => i.id !== itemId));
    } else {
      setCurrentOrder(prev => prev.map(i => i.id === itemId ? { ...i, quantity: qty } : i));
    }
  }, []);

  const clearCurrentOrder = useCallback(() => {
    setCurrentOrder([]);
    setCurrentTable(null);
    setCurrentCustomerName('');
  }, []);

  return (
    <OrderContext.Provider value={{
      orders, addOrder, updateOrderStatus,
      currentOrder, addToCurrentOrder, removeFromCurrentOrder, updateQuantity, clearCurrentOrder,
      currentTable, setCurrentTable, currentCustomerName, setCurrentCustomerName,
    }}>
      {children}
    </OrderContext.Provider>
  );
};

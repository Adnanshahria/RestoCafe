import { Category, MenuItem, Order, Customer, Expense, DailySummary, Invoice } from '@/types';

export const categories: Category[] = [
  { id: 'cat-1', name: 'Appetizers' },
  { id: 'cat-2', name: 'Main Course' },
  { id: 'cat-3', name: 'Desserts' },
  { id: 'cat-4', name: 'Beverages' },
  { id: 'cat-5', name: 'Sides' },
];

export const menuItems: MenuItem[] = [
  { id: 'm-1', name: 'Caesar Salad', price: 12.5, categoryId: 'cat-1', available: true, description: 'Fresh romaine with classic dressing' },
  { id: 'm-2', name: 'Spring Rolls', price: 8.0, categoryId: 'cat-1', available: true },
  { id: 'm-3', name: 'Bruschetta', price: 9.5, categoryId: 'cat-1', available: true },
  { id: 'm-4', name: 'Grilled Salmon', price: 24.0, categoryId: 'cat-2', available: true },
  { id: 'm-5', name: 'Chicken Parmesan', price: 18.5, categoryId: 'cat-2', available: true },
  { id: 'm-6', name: 'Beef Steak', price: 32.0, categoryId: 'cat-2', available: true },
  { id: 'm-7', name: 'Pasta Carbonara', price: 16.0, categoryId: 'cat-2', available: true },
  { id: 'm-8', name: 'Veggie Burger', price: 14.0, categoryId: 'cat-2', available: false },
  { id: 'm-9', name: 'Tiramisu', price: 10.0, categoryId: 'cat-3', available: true },
  { id: 'm-10', name: 'Cheesecake', price: 9.0, categoryId: 'cat-3', available: true },
  { id: 'm-11', name: 'Espresso', price: 3.5, categoryId: 'cat-4', available: true },
  { id: 'm-12', name: 'Fresh Juice', price: 5.0, categoryId: 'cat-4', available: true },
  { id: 'm-13', name: 'Sparkling Water', price: 2.5, categoryId: 'cat-4', available: true },
  { id: 'm-14', name: 'French Fries', price: 6.0, categoryId: 'cat-5', available: true },
  { id: 'm-15', name: 'Garlic Bread', price: 4.5, categoryId: 'cat-5', available: true },
];

export const mockOrders: Order[] = [
  {
    id: 'ord-1', status: 'completed', tableNumber: 3,
    customerName: 'Alice Chen',
    items: [
      { id: 'oi-1', menuItemId: 'm-4', menuItemName: 'Grilled Salmon', quantity: 1, unitPrice: 24.0 },
      { id: 'oi-2', menuItemId: 'm-11', menuItemName: 'Espresso', quantity: 2, unitPrice: 3.5 },
    ],
    subtotal: 31.0, tax: 3.1, discount: 0, total: 34.1,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: 'ord-2', status: 'preparing', tableNumber: 7,
    customerName: 'Bob Martinez',
    items: [
      { id: 'oi-3', menuItemId: 'm-6', menuItemName: 'Beef Steak', quantity: 2, unitPrice: 32.0 },
      { id: 'oi-4', menuItemId: 'm-14', menuItemName: 'French Fries', quantity: 2, unitPrice: 6.0 },
    ],
    subtotal: 76.0, tax: 7.6, discount: 5, total: 78.6,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: 'ord-3', status: 'pending', tableNumber: 1,
    items: [
      { id: 'oi-5', menuItemId: 'm-1', menuItemName: 'Caesar Salad', quantity: 1, unitPrice: 12.5 },
      { id: 'oi-6', menuItemId: 'm-7', menuItemName: 'Pasta Carbonara', quantity: 1, unitPrice: 16.0 },
      { id: 'oi-7', menuItemId: 'm-9', menuItemName: 'Tiramisu', quantity: 1, unitPrice: 10.0 },
    ],
    subtotal: 38.5, tax: 3.85, discount: 0, total: 42.35,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: 'ord-4', status: 'served', tableNumber: 5,
    customerName: 'Diana Park',
    items: [
      { id: 'oi-8', menuItemId: 'm-5', menuItemName: 'Chicken Parmesan', quantity: 1, unitPrice: 18.5 },
      { id: 'oi-9', menuItemId: 'm-12', menuItemName: 'Fresh Juice', quantity: 1, unitPrice: 5.0 },
    ],
    subtotal: 23.5, tax: 2.35, discount: 0, total: 25.85,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
];

export const mockCustomers: Customer[] = [
  { id: 'c-1', name: 'Alice Chen', email: 'alice@example.com', phone: '+1 555-0101', loyaltyPoints: 340, totalSpent: 892.5, visitCount: 28, lastVisit: '2026-03-07', createdAt: '2025-06-12' },
  { id: 'c-2', name: 'Bob Martinez', email: 'bob@example.com', phone: '+1 555-0102', loyaltyPoints: 210, totalSpent: 567.0, visitCount: 15, lastVisit: '2026-03-08', createdAt: '2025-09-01' },
  { id: 'c-3', name: 'Diana Park', email: 'diana@example.com', phone: '+1 555-0103', loyaltyPoints: 580, totalSpent: 1432.0, visitCount: 42, lastVisit: '2026-03-06', createdAt: '2025-03-20' },
  { id: 'c-4', name: 'Evan Turner', loyaltyPoints: 90, totalSpent: 234.0, visitCount: 7, lastVisit: '2026-02-28', createdAt: '2025-11-15' },
];

export const mockExpenses: Expense[] = [
  { id: 'e-1', description: 'Fresh produce delivery', amount: 320, category: 'Ingredients', date: '2026-03-08', createdAt: '2026-03-08' },
  { id: 'e-2', description: 'Staff wages', amount: 1200, category: 'Payroll', date: '2026-03-07', createdAt: '2026-03-07' },
  { id: 'e-3', description: 'Electricity bill', amount: 180, category: 'Utilities', date: '2026-03-05', createdAt: '2026-03-05' },
  { id: 'e-4', description: 'Kitchen supplies', amount: 95, category: 'Supplies', date: '2026-03-04', createdAt: '2026-03-04' },
];

export const mockDailySummaries: DailySummary[] = [
  { date: '2026-03-01', revenue: 1850, orders: 42, expenses: 620, profit: 1230 },
  { date: '2026-03-02', revenue: 2100, orders: 48, expenses: 580, profit: 1520 },
  { date: '2026-03-03', revenue: 1650, orders: 36, expenses: 490, profit: 1160 },
  { date: '2026-03-04', revenue: 2340, orders: 55, expenses: 710, profit: 1630 },
  { date: '2026-03-05', revenue: 1920, orders: 44, expenses: 530, profit: 1390 },
  { date: '2026-03-06', revenue: 2580, orders: 61, expenses: 650, profit: 1930 },
  { date: '2026-03-07', revenue: 2750, orders: 64, expenses: 1280, profit: 1470 },
  { date: '2026-03-08', revenue: 1480, orders: 32, expenses: 415, profit: 1065 },
];

export const mockInvoices: Invoice[] = [
  {
    id: 'inv-1', orderId: 'ord-1', customerName: 'Alice Chen',
    items: mockOrders[0].items,
    subtotal: 31.0, tax: 3.1, discount: 0, total: 34.1,
    paymentMethod: 'card', createdAt: new Date().toISOString(), paid: true,
  },
];

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import authRoutes from './routes/auth';
import categoriesRoutes from './routes/categories';
import menuRoutes from './routes/menu';
import ordersRoutes from './routes/orders';
import tablesRoutes from './routes/tables';
import customersRoutes from './routes/customers';
import invoicesRoutes from './routes/invoices';
import expensesRoutes from './routes/expenses';
import chatRoutes from './routes/chat';
import uploadRoutes from './routes/upload';

const app = new Hono();

// --- Middleware ---

// CORS
app.use('*', cors({
  origin: '*', // Allows Cloudflare Pages to connect. Can be restricted to actual Pages domain later.
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Security headers
app.use('*', secureHeaders());

// Request logging
app.use('*', logger());

// --- Routes ---
app.route('/api/auth', authRoutes);
app.route('/api/categories', categoriesRoutes);
app.route('/api/menu-items', menuRoutes);
app.route('/api/orders', ordersRoutes);
app.route('/api/tables', tablesRoutes);
app.route('/api/customers', customersRoutes);
app.route('/api/invoices', invoicesRoutes);
app.route('/api/expenses', expensesRoutes);
app.route('/api/chat', chatRoutes);
app.route('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Global error handler
app.onError((err, c) => {
  console.error('Server error:', err.message);
  return c.json({ error: err.message || 'Internal server error' }, 500);
});

export default app;

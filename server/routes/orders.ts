import { Hono } from 'hono';
import { z } from 'zod';
import db from '../db';
import { authMiddleware, type JWTPayload } from '../middleware/auth';

const orders = new Hono();

orders.use('*', authMiddleware);

// GET /api/orders — returns orders with their items
orders.get('/', async (c) => {
  const orderResult = await db.execute('SELECT * FROM orders ORDER BY created_at DESC');
  const itemResult = await db.execute('SELECT * FROM order_items');

  const ordersWithItems = orderResult.rows.map((order) => ({
    ...order,
    items: itemResult.rows.filter((item) => item.order_id === order.id),
  }));

  return c.json(ordersWithItems);
});

// POST /api/orders — create order + items in a transaction
const createOrderSchema = z.object({
  status: z.string().optional().default('pending'),
  table_number: z.number().nullable().optional(),
  customer_id: z.string().nullable().optional(),
  customer_name: z.string().nullable().optional(),
  subtotal: z.number().default(0),
  tax: z.number().default(0),
  discount: z.number().default(0),
  total: z.number().default(0),
  items: z.array(z.object({
    menu_item_id: z.string().nullable().optional(),
    menu_item_name: z.string(),
    quantity: z.number().int().min(1).default(1),
    unit_price: z.number(),
    notes: z.string().nullable().optional(),
  })),
});

orders.post('/', async (c) => {
  const user = c.get('user') as JWTPayload;
  const body = await c.req.json();
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400);
  }

  const { items, ...orderData } = parsed.data;
  const orderId = crypto.randomUUID();

  const statements = [
    {
      sql: 'INSERT INTO orders (id, status, table_number, customer_id, customer_name, subtotal, tax, discount, total, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [
        orderId,
        orderData.status,
        orderData.table_number ?? null,
        orderData.customer_id ?? null,
        orderData.customer_name ?? null,
        orderData.subtotal,
        orderData.tax,
        orderData.discount,
        orderData.total,
        user.userId,
      ],
    },
    ...items.map((item) => ({
      sql: 'INSERT INTO order_items (id, order_id, menu_item_id, menu_item_name, quantity, unit_price, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [
        crypto.randomUUID(),
        orderId,
        item.menu_item_id ?? null,
        item.menu_item_name,
        item.quantity,
        item.unit_price,
        item.notes ?? null,
      ],
    })),
  ];

  await db.batch(statements);

  // Return the created order with items
  const result = await db.execute({ sql: 'SELECT * FROM orders WHERE id = ?', args: [orderId] });
  const itemsResult = await db.execute({ sql: 'SELECT * FROM order_items WHERE order_id = ?', args: [orderId] });

  return c.json({ ...result.rows[0], items: itemsResult.rows }, 201);
});

// PATCH /api/orders/:id/status
const updateStatusSchema = z.object({
  status: z.enum(['pending', 'preparing', 'served', 'completed', 'cancelled']),
});

orders.patch('/:id/status', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400);
  }

  await db.execute({
    sql: "UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?",
    args: [parsed.data.status, id],
  });

  return c.json({ success: true });
});

export default orders;

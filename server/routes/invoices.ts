import { Hono } from 'hono';
import { z } from 'zod';
import db from '../db';
import { authMiddleware } from '../middleware/auth';

const invoices = new Hono();

invoices.use('*', authMiddleware);

// GET /api/invoices
invoices.get('/', async (c) => {
  const result = await db.execute('SELECT * FROM invoices ORDER BY created_at DESC');
  return c.json(result.rows);
});

// POST /api/invoices
const createInvoiceSchema = z.object({
  order_id: z.string().nullable().optional(),
  customer_name: z.string().nullable().optional(),
  subtotal: z.number().default(0),
  tax: z.number().default(0),
  discount: z.number().default(0),
  total: z.number().default(0),
  payment_method: z.enum(['cash', 'card', 'digital']).default('cash'),
  paid: z.boolean().default(false),
});

invoices.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = createInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400);
  }

  const id = crypto.randomUUID();
  const d = parsed.data;

  await db.execute({
    sql: 'INSERT INTO invoices (id, order_id, customer_name, subtotal, tax, discount, total, payment_method, paid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [id, d.order_id ?? null, d.customer_name ?? null, d.subtotal, d.tax, d.discount, d.total, d.payment_method, d.paid ? 1 : 0],
  });

  const result = await db.execute({ sql: 'SELECT * FROM invoices WHERE id = ?', args: [id] });
  return c.json(result.rows[0], 201);
});

// PUT /api/invoices/:id
invoices.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const updates = body;
  const setClauses: string[] = [];
  const args: any[] = [];

  if (updates.paid !== undefined) { setClauses.push('paid = ?'); args.push(updates.paid ? 1 : 0); }
  if (updates.payment_method !== undefined) { setClauses.push('payment_method = ?'); args.push(updates.payment_method); }
  if (updates.customer_name !== undefined) { setClauses.push('customer_name = ?'); args.push(updates.customer_name); }

  if (setClauses.length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }

  args.push(id);
  await db.execute({
    sql: `UPDATE invoices SET ${setClauses.join(', ')} WHERE id = ?`,
    args,
  });

  const result = await db.execute({ sql: 'SELECT * FROM invoices WHERE id = ?', args: [id] });
  return c.json(result.rows[0]);
});

export default invoices;

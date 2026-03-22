import { Hono } from 'hono';
import { z } from 'zod';
import db from '../db';
import { authMiddleware } from '../middleware/auth';

const customers = new Hono();

customers.use('*', authMiddleware);

// GET /api/customers
customers.get('/', async (c) => {
  const result = await db.execute('SELECT * FROM customers ORDER BY created_at DESC');
  return c.json(result.rows);
});

// POST /api/customers
const createCustomerSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  loyalty_points: z.number().int().default(0),
  total_spent: z.number().default(0),
  visit_count: z.number().int().default(0),
  last_visit: z.string().nullable().optional(),
});

customers.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = createCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400);
  }

  const id = crypto.randomUUID();
  const d = parsed.data;

  await db.execute({
    sql: 'INSERT INTO customers (id, name, email, phone, loyalty_points, total_spent, visit_count, last_visit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [id, d.name, d.email ?? null, d.phone ?? null, d.loyalty_points, d.total_spent, d.visit_count, d.last_visit ?? null],
  });

  const result = await db.execute({ sql: 'SELECT * FROM customers WHERE id = ?', args: [id] });
  return c.json(result.rows[0], 201);
});

// PUT /api/customers/:id
customers.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const updates = body;
  const setClauses: string[] = [];
  const args: any[] = [];

  if (updates.name !== undefined) { setClauses.push('name = ?'); args.push(updates.name); }
  if (updates.email !== undefined) { setClauses.push('email = ?'); args.push(updates.email); }
  if (updates.phone !== undefined) { setClauses.push('phone = ?'); args.push(updates.phone); }
  if (updates.loyalty_points !== undefined) { setClauses.push('loyalty_points = ?'); args.push(updates.loyalty_points); }
  if (updates.total_spent !== undefined) { setClauses.push('total_spent = ?'); args.push(updates.total_spent); }
  if (updates.visit_count !== undefined) { setClauses.push('visit_count = ?'); args.push(updates.visit_count); }
  if (updates.last_visit !== undefined) { setClauses.push('last_visit = ?'); args.push(updates.last_visit); }

  if (setClauses.length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }

  args.push(id);
  await db.execute({
    sql: `UPDATE customers SET ${setClauses.join(', ')} WHERE id = ?`,
    args,
  });

  const result = await db.execute({ sql: 'SELECT * FROM customers WHERE id = ?', args: [id] });
  return c.json(result.rows[0]);
});

export default customers;

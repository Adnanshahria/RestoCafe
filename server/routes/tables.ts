import { Hono } from 'hono';
import { z } from 'zod';
import db from '../db';
import { authMiddleware, type JWTPayload } from '../middleware/auth';

const tables = new Hono();

tables.use('*', authMiddleware);

// GET /api/tables
tables.get('/', async (c) => {
  const result = await db.execute('SELECT * FROM restaurant_tables ORDER BY number ASC');
  return c.json(result.rows);
});

// POST /api/tables
const createTableSchema = z.object({
  number: z.number().int(),
  seats: z.number().int().default(4),
  x: z.number().default(50),
  y: z.number().default(50),
  status: z.string().default('available'),
  shape: z.string().default('square'),
  guest_name: z.string().nullable().optional(),
  guest_count: z.number().int().nullable().optional(),
  occupied_since: z.string().nullable().optional(),
});

tables.post('/', async (c) => {
  const user = c.get('user') as JWTPayload;
  const body = await c.req.json();
  const parsed = createTableSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400);
  }

  const id = crypto.randomUUID();
  const d = parsed.data;

  await db.execute({
    sql: 'INSERT INTO restaurant_tables (id, user_id, number, seats, x, y, status, shape, guest_name, guest_count, occupied_since) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [id, user.userId, d.number, d.seats, d.x, d.y, d.status, d.shape, d.guest_name ?? null, d.guest_count ?? null, d.occupied_since ?? null],
  });

  const result = await db.execute({ sql: 'SELECT * FROM restaurant_tables WHERE id = ?', args: [id] });
  return c.json(result.rows[0], 201);
});

// PUT /api/tables/:id
const updateTableSchema = z.object({
  seats: z.number().int().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  status: z.string().optional(),
  shape: z.string().optional(),
  guest_name: z.string().nullable().optional(),
  guest_count: z.number().int().nullable().optional(),
  occupied_since: z.string().nullable().optional(),
});

tables.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = updateTableSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400);
  }

  const updates = parsed.data;
  const setClauses: string[] = [];
  const args: any[] = [];

  if (updates.seats !== undefined) { setClauses.push('seats = ?'); args.push(updates.seats); }
  if (updates.x !== undefined) { setClauses.push('x = ?'); args.push(updates.x); }
  if (updates.y !== undefined) { setClauses.push('y = ?'); args.push(updates.y); }
  if (updates.status !== undefined) { setClauses.push('status = ?'); args.push(updates.status); }
  if (updates.shape !== undefined) { setClauses.push('shape = ?'); args.push(updates.shape); }
  if ('guest_name' in updates) { setClauses.push('guest_name = ?'); args.push(updates.guest_name ?? null); }
  if ('guest_count' in updates) { setClauses.push('guest_count = ?'); args.push(updates.guest_count ?? null); }
  if ('occupied_since' in updates) { setClauses.push('occupied_since = ?'); args.push(updates.occupied_since ?? null); }

  if (setClauses.length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }

  setClauses.push("updated_at = datetime('now')");
  args.push(id);

  await db.execute({
    sql: `UPDATE restaurant_tables SET ${setClauses.join(', ')} WHERE id = ?`,
    args,
  });

  const result = await db.execute({ sql: 'SELECT * FROM restaurant_tables WHERE id = ?', args: [id] });
  return c.json(result.rows[0]);
});

// DELETE /api/tables/:id
tables.delete('/:id', async (c) => {
  const user = c.get('user') as JWTPayload;
  const id = c.req.param('id');

  // Verify ownership or admin role
  const existing = await db.execute({
    sql: 'SELECT user_id FROM restaurant_tables WHERE id = ?',
    args: [id],
  });

  if (existing.rows.length === 0) {
    return c.json({ error: 'Table not found' }, 404);
  }

  if (existing.rows[0].user_id !== user.userId && user.role !== 'admin') {
    return c.json({ error: 'Not authorized to delete this table' }, 403);
  }

  await db.execute({ sql: 'DELETE FROM restaurant_tables WHERE id = ?', args: [id] });
  return c.json({ success: true });
});

export default tables;

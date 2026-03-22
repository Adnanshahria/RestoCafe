import { Hono } from 'hono';
import { z } from 'zod';
import db from '../db';
import { authMiddleware, type JWTPayload } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const categories = new Hono();

categories.use('*', authMiddleware);

// GET /api/categories
categories.get('/', async (c) => {
  const result = await db.execute('SELECT * FROM categories ORDER BY name ASC');
  return c.json(result.rows);
});

// POST /api/categories (admin only)
const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().max(50).nullable().optional(),
});

categories.post('/', requireRole('admin'), async (c) => {
  const body = await c.req.json();
  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400);
  }

  const id = crypto.randomUUID();
  const { name, icon } = parsed.data;

  await db.execute({
    sql: 'INSERT INTO categories (id, name, icon) VALUES (?, ?, ?)',
    args: [id, name, icon || null],
  });

  return c.json({ id, name, icon: icon || null }, 201);
});

// PUT /api/categories/:id (admin only)
categories.put('/:id', requireRole('admin'), async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400);
  }

  const { name, icon } = parsed.data;
  await db.execute({
    sql: 'UPDATE categories SET name = ?, icon = ? WHERE id = ?',
    args: [name, icon || null, id],
  });

  return c.json({ id, name, icon: icon || null });
});

// DELETE /api/categories/:id (admin only)
categories.delete('/:id', requireRole('admin'), async (c) => {
  const id = c.req.param('id');
  await db.execute({ sql: 'DELETE FROM categories WHERE id = ?', args: [id] });
  return c.json({ success: true });
});

export default categories;

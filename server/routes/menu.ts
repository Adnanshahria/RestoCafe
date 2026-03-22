import { Hono } from 'hono';
import { z } from 'zod';
import db from '../db';
import { authMiddleware, type JWTPayload } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const menu = new Hono();

menu.use('*', authMiddleware);

// GET /api/menu-items
menu.get('/', async (c) => {
  const result = await db.execute('SELECT * FROM menu_items ORDER BY created_at DESC');
  return c.json(result.rows);
});

// POST /api/menu-items (admin only)
const createMenuItemSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.number().min(0),
  category_id: z.string().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  image: z.string().max(500).nullable().optional(),
  available: z.boolean().optional().default(true),
});

menu.post('/', requireRole('admin'), async (c) => {
  const body = await c.req.json();
  const parsed = createMenuItemSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400);
  }

  const id = crypto.randomUUID();
  const { name, price, category_id, description, image, available } = parsed.data;

  await db.execute({
    sql: 'INSERT INTO menu_items (id, name, price, category_id, description, image, available) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [id, name, price, category_id || null, description || null, image || null, available ? 1 : 0],
  });

  const result = await db.execute({ sql: 'SELECT * FROM menu_items WHERE id = ?', args: [id] });
  return c.json(result.rows[0], 201);
});

// PUT /api/menu-items/:id (admin only)
const updateMenuItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  price: z.number().min(0).optional(),
  category_id: z.string().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  image: z.string().max(500).nullable().optional(),
  available: z.boolean().optional(),
});

menu.put('/:id', requireRole('admin'), async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = updateMenuItemSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400);
  }

  const updates = parsed.data;
  const setClauses: string[] = [];
  const args: any[] = [];

  if (updates.name !== undefined) { setClauses.push('name = ?'); args.push(updates.name); }
  if (updates.price !== undefined) { setClauses.push('price = ?'); args.push(updates.price); }
  if (updates.category_id !== undefined) { setClauses.push('category_id = ?'); args.push(updates.category_id); }
  if (updates.description !== undefined) { setClauses.push('description = ?'); args.push(updates.description); }
  if (updates.image !== undefined) { setClauses.push('image = ?'); args.push(updates.image); }
  if (updates.available !== undefined) { setClauses.push('available = ?'); args.push(updates.available ? 1 : 0); }

  if (setClauses.length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }

  setClauses.push("updated_at = datetime('now')");
  args.push(id);

  await db.execute({
    sql: `UPDATE menu_items SET ${setClauses.join(', ')} WHERE id = ?`,
    args,
  });

  const result = await db.execute({ sql: 'SELECT * FROM menu_items WHERE id = ?', args: [id] });
  return c.json(result.rows[0]);
});

// DELETE /api/menu-items/:id (admin only)
menu.delete('/:id', requireRole('admin'), async (c) => {
  const id = c.req.param('id');
  await db.execute({ sql: 'DELETE FROM menu_items WHERE id = ?', args: [id] });
  return c.json({ success: true });
});

export default menu;

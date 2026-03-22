import { Hono } from 'hono';
import { z } from 'zod';
import db from '../db';
import { authMiddleware, type JWTPayload } from '../middleware/auth';

const expenses = new Hono();

expenses.use('*', authMiddleware);

// GET /api/expenses
expenses.get('/', async (c) => {
  const result = await db.execute('SELECT * FROM expenses ORDER BY created_at DESC');
  return c.json(result.rows);
});

// POST /api/expenses
const createExpenseSchema = z.object({
  description: z.string().min(1).max(500),
  amount: z.number().min(0),
  category: z.string().min(1).max(100),
  date: z.string().optional(),
});

expenses.post('/', async (c) => {
  const user = c.get('user') as JWTPayload;
  const body = await c.req.json();
  const parsed = createExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400);
  }

  const id = crypto.randomUUID();
  const d = parsed.data;

  await db.execute({
    sql: 'INSERT INTO expenses (id, description, amount, category, date, created_by) VALUES (?, ?, ?, ?, ?, ?)',
    args: [id, d.description, d.amount, d.category, d.date || new Date().toISOString().split('T')[0], user.userId],
  });

  const result = await db.execute({ sql: 'SELECT * FROM expenses WHERE id = ?', args: [id] });
  return c.json(result.rows[0], 201);
});

// PUT /api/expenses/:id
expenses.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const updates = body;
  const setClauses: string[] = [];
  const args: any[] = [];

  if (updates.description !== undefined) { setClauses.push('description = ?'); args.push(updates.description); }
  if (updates.amount !== undefined) { setClauses.push('amount = ?'); args.push(updates.amount); }
  if (updates.category !== undefined) { setClauses.push('category = ?'); args.push(updates.category); }
  if (updates.date !== undefined) { setClauses.push('date = ?'); args.push(updates.date); }

  if (setClauses.length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }

  args.push(id);
  await db.execute({
    sql: `UPDATE expenses SET ${setClauses.join(', ')} WHERE id = ?`,
    args,
  });

  const result = await db.execute({ sql: 'SELECT * FROM expenses WHERE id = ?', args: [id] });
  return c.json(result.rows[0]);
});

export default expenses;

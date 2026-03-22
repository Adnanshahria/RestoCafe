import { Hono } from 'hono';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'crypto';
import db from '../db';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  authMiddleware,
  type JWTPayload,
} from '../middleware/auth';

const auth = new Hono();

// Simple in-memory rate limiter for auth endpoints
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (record.count >= MAX_ATTEMPTS) return false;
  record.count++;
  return true;
}

function generateId(): string {
  return crypto.randomUUID();
}

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1, 'Display name is required').max(100),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// POST /api/auth/register
auth.post('/register', async (c) => {
  const ip = c.req.header('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(ip)) {
    return c.json({ error: 'Too many attempts. Try again later.' }, 429);
  }

  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400);
  }

  const { email, password, displayName } = parsed.data;

  // Check if user already exists
  const existing = await db.execute({
    sql: 'SELECT id FROM users WHERE email = ?',
    args: [email],
  });
  if (existing.rows.length > 0) {
    return c.json({ error: 'Invalid credentials' }, 401); // Don't reveal user exists
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = generateId();
  const profileId = generateId();
  const roleId = generateId();

  // Create user, profile, and default role in a batch
  await db.batch([
    {
      sql: 'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
      args: [userId, email, passwordHash],
    },
    {
      sql: 'INSERT INTO profiles (id, user_id, display_name) VALUES (?, ?, ?)',
      args: [profileId, userId, displayName],
    },
    {
      sql: "INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, 'cashier')",
      args: [roleId, userId],
    },
  ]);

  // Generate tokens
  const role = 'cashier' as const;
  const accessToken = await generateAccessToken({ userId, email, role });
  const refreshToken = await generateRefreshToken(userId);

  // Store refresh token
  const rtId = generateId();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await db.execute({
    sql: 'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
    args: [rtId, userId, refreshToken, expiresAt],
  });

  return c.json({
    token: accessToken,
    refreshToken,
    user: { id: userId, email, role, displayName },
  });
});

// POST /api/auth/login
auth.post('/login', async (c) => {
  const ip = c.req.header('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(ip)) {
    return c.json({ error: 'Too many login attempts. Try again later.' }, 429);
  }

  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400);
  }

  const { email, password } = parsed.data;

  const result = await db.execute({
    sql: 'SELECT u.id, u.email, u.password_hash, ur.role, p.display_name, p.avatar_url FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id LEFT JOIN profiles p ON p.user_id = u.id WHERE u.email = ?',
    args: [email],
  });

  if (result.rows.length === 0) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const user = result.rows[0];
  const validPassword = await bcrypt.compare(password, user.password_hash as string);
  if (!validPassword) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const role = (user.role as 'admin' | 'cashier') || 'cashier';
  const userId = user.id as string;

  const accessToken = await generateAccessToken({ userId, email, role });
  const refreshToken = await generateRefreshToken(userId);

  // Store refresh token
  const rtId = generateId();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await db.execute({
    sql: 'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
    args: [rtId, userId, refreshToken, expiresAt],
  });

  return c.json({
    token: accessToken,
    refreshToken,
    user: {
      id: userId,
      email,
      role,
      displayName: user.display_name || email,
      avatarUrl: user.avatar_url || null,
    },
  });
});

// POST /api/auth/refresh
auth.post('/refresh', async (c) => {
  const body = await c.req.json();
  const { refreshToken } = body;

  if (!refreshToken) {
    return c.json({ error: 'Refresh token required' }, 401);
  }

  try {
    const { userId } = await verifyRefreshToken(refreshToken);

    // Check token exists in DB and not expired
    const result = await db.execute({
      sql: "SELECT id FROM refresh_tokens WHERE token = ? AND user_id = ? AND expires_at > datetime('now')",
      args: [refreshToken, userId],
    });

    if (result.rows.length === 0) {
      return c.json({ error: 'Invalid refresh token' }, 403);
    }

    // Get user info for new access token
    const userResult = await db.execute({
      sql: 'SELECT u.email, ur.role FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id WHERE u.id = ?',
      args: [userId],
    });

    if (userResult.rows.length === 0) {
      return c.json({ error: 'User not found' }, 403);
    }

    const user = userResult.rows[0];
    const role = (user.role as 'admin' | 'cashier') || 'cashier';

    const accessToken = await generateAccessToken({
      userId,
      email: user.email as string,
      role,
    });

    return c.json({ token: accessToken });
  } catch {
    return c.json({ error: 'Invalid refresh token' }, 403);
  }
});

// POST /api/auth/logout
auth.post('/logout', authMiddleware, async (c) => {
  const body = await c.req.json();
  const { refreshToken } = body;

  if (refreshToken) {
    await db.execute({
      sql: 'DELETE FROM refresh_tokens WHERE token = ?',
      args: [refreshToken],
    });
  }

  return c.json({ success: true });
});

// GET /api/auth/me
auth.get('/me', authMiddleware, async (c) => {
  const user = c.get('user') as JWTPayload;

  const result = await db.execute({
    sql: 'SELECT p.display_name, p.avatar_url FROM profiles p WHERE p.user_id = ?',
    args: [user.userId],
  });

  const profile = result.rows[0];

  return c.json({
    id: user.userId,
    email: user.email,
    role: user.role,
    displayName: (profile?.display_name as string) || user.email,
    avatarUrl: (profile?.avatar_url as string) || null,
  });
});

export default auth;

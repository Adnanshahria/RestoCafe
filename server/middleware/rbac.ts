import { Context, Next } from 'hono';
import type { JWTPayload } from './auth';

export function requireRole(...roles: Array<'admin' | 'cashier'>) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as JWTPayload | undefined;
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    if (!roles.includes(user.role)) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }
    await next();
  };
}

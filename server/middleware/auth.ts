import { Context, Next } from 'hono';
import * as jose from 'jose';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is required');
  return new TextEncoder().encode(secret);
};

const getRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET environment variable is required');
  return new TextEncoder().encode(secret);
};

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'cashier';
}

export async function generateAccessToken(payload: JWTPayload): Promise<string> {
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('my-restaurant')
    .setAudience('my-restaurant-users')
    .setExpirationTime('1h')
    .sign(getJwtSecret());
}

export async function generateRefreshToken(userId: string): Promise<string> {
  return new jose.SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('my-restaurant')
    .setExpirationTime('7d')
    .sign(getRefreshSecret());
}

export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  const { payload } = await jose.jwtVerify(token, getJwtSecret(), {
    issuer: 'my-restaurant',
    audience: 'my-restaurant-users',
  });
  return payload as unknown as JWTPayload;
}

export async function verifyRefreshToken(token: string): Promise<{ userId: string }> {
  const { payload } = await jose.jwtVerify(token, getRefreshSecret(), {
    issuer: 'my-restaurant',
  });
  return { userId: payload.userId as string };
}

// Middleware: require valid JWT
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Access token required' }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verifyAccessToken(token);
    c.set('user', payload);
    await next();
  } catch (err: any) {
    if (err?.code === 'ERR_JWT_EXPIRED') {
      return c.json({ error: 'Token expired' }, 401);
    }
    return c.json({ error: 'Invalid token' }, 403);
  }
}

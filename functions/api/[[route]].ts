import { handle } from 'hono/cloudflare-pages';
import app from '../../server/app';

// Cloudflare Pages execution context
export const onRequest = async (context: any) => {
  // Map Cloudflare environment variables to process.env
  // Wait, process might not exist in the Cloudflare edge runtime natively
  if (typeof process === 'undefined') {
    (globalThis as any).process = { env: {} };
  } else if (!process.env) {
    process.env = {};
  }

  // Copy context.env to process.env so our existing code works unmodified
  if (context.env) {
    for (const key in context.env) {
      process.env[key] = context.env[key];
    }
  }

  // Pass to Hono handler
  // Hono's handle() returns a standard Fetch API Response
  // Cloudflare Pages functions can just call the handle wrapper
  return handle(app)(context);
};

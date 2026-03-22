import { handle } from 'hono/cloudflare-pages';
import app from '../../server/app';

export const onRequest = async (context: any) => {
  // 1. Ensure process.env polyfill exists
  if (typeof (globalThis as any).process === 'undefined') {
    (globalThis as any).process = { env: {} };
  } else if (!process.env) {
    (process as any).env = {};
  }

  // 2. Map Cloudflare secrets to process.env
  if (context.env) {
    for (const key in context.env) {
      // Avoid overwriting if already set, but prioritize context.env
      process.env[key] = context.env[key];
    }
  }

  // 3. (Optional) Simple debug log to confirm env keys are present
  // console.log('Env keys:', Object.keys(process.env).join(', '));

  return handle(app)(context);
};

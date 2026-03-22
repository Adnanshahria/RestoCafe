import app from './app';

// Cloudflare Workers fetch handler
export default {
  fetch(request: Request, env: any, ctx: any) {
    // Polyfill process.env for the Worker environment so our lazy db and auth helpers work
    if (typeof process === 'undefined') {
      (globalThis as any).process = { env: {} };
    }
    process.env = { ...process.env, ...env };
    
    return app.fetch(request, env, ctx);
  },
};

import { serve } from '@hono/node-server';
import fs from 'fs';
import path from 'path';
import db from './db';
import app from './app';

// Load .env manually for local Node server
import 'dotenv/config';

// --- Database initialization ---
async function initDatabase() {
  try {
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      
      const statements = schema
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const sql of statements) {
        await db.execute(sql);
      }
      console.log('✅ Local Database schema checked/initialized');
    }
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
  }
}

// --- Start Local Node Server ---
const PORT = parseInt(process.env.SERVER_PORT || '3001', 10);

initDatabase().then(() => {
  serve({
    fetch: app.fetch,
    port: PORT,
  }, (info) => {
    console.log(`🚀 Local Node Server running at http://localhost:${info.port}`);
  });
});

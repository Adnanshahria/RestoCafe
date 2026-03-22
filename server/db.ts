import { createClient, Client } from '@libsql/client';

let client: Client | null = null;

const getClient = () => {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
  }
  return client;
};

const db = {
  execute: (args: any) => getClient().execute(args),
  batch: (args: any) => getClient().batch(args),
};

export default db;

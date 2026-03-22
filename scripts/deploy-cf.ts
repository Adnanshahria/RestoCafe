import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function run() {
  console.log('--- Start Cloudflare Deployment Automation ---');

  // 1. Deploy the backend
  console.log('\nDeploying backend worker...');
  const deployOutput = execSync('npx wrangler deploy', { encoding: 'utf-8' });
  console.log(deployOutput);

  // Parse the deployed URL from output
  const urlMatch = deployOutput.match(/https:\/\/[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+\.workers\.dev/);
  const workerUrl = urlMatch ? urlMatch[0] : null;

  if (!workerUrl) {
    console.error('❌ Could not find the deployed worker URL from the output.');
    process.exit(1);
  }
  console.log(`✅ Backend successfully deployed to: ${workerUrl}`);

  // 2. Load secrets from .env
  console.log('\nReading .env secrets...');
  const envPath = path.join(process.cwd(), '.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  const secrets: Record<string, string> = {};
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim();
        secrets[key] = val;
      }
    }
  });

  const backendSecrets = [
    'TURSO_DATABASE_URL',
    'TURSO_AUTH_TOKEN',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'GROQ_API_KEY'
  ];

  for (const key of backendSecrets) {
    if (secrets[key]) {
      console.log(`Putting backend secret: ${key}`);
      try {
         execSync(`echo "${secrets[key]}" | npx wrangler secret put ${key}`, { stdio: 'inherit' });
      } catch (err) {
         console.log(`Note: secret ${key} might already exist or failed. Moving on.`);
      }
    }
  }

  // 3. Push to Pages ENV
  console.log(`\nPutting Pages Environment Variable VITE_API_URL = ${workerUrl}`);
  try {
     // Cloudflare Pages project name from user's URL: "my-resturant"
     execSync(`echo "${workerUrl}" | npx wrangler pages secret put VITE_API_URL --project-name my-resturant`, { stdio: 'inherit' });
     console.log('✅ Pages variable mapped!');
  } catch (err) {
     console.log(`❌ Failed mapping to Pages. Does the project 'my-resturant' exist on this account?`);
  }

  console.log('\n--- Deployment Steps Complete! ---');
}

run();

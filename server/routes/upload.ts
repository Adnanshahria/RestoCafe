import { Hono } from 'hono';
import { z } from 'zod';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { authMiddleware, type JWTPayload } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const upload = new Hono();

upload.use('*', authMiddleware);

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

// POST /api/upload
upload.post('/', requireRole('admin'), async (c) => {
  const r2Client = getR2Client();
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!r2Client || !bucketName) {
    return c.json({ error: 'Image upload service not configured. Please set R2 credentials.' }, 503);
  }

  const formData = await c.req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return c.json({ error: 'No file provided' }, 400);
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return c.json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP' }, 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    return c.json({ error: 'File too large. Maximum size: 5MB' }, 400);
  }

  const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1];
  const filename = `menu/${crypto.randomUUID()}.${ext}`;

  const buffer = await file.arrayBuffer();

  try {
    await r2Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: filename,
      Body: new Uint8Array(buffer),
      ContentType: file.type,
    }));

    const url = publicUrl ? `${publicUrl}/${filename}` : `https://${bucketName}.r2.dev/${filename}`;

    return c.json({ url });
  } catch (error) {
    console.error('R2 upload error:', error);
    return c.json({ error: 'Failed to upload image' }, 500);
  }
});

export default upload;

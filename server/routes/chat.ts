import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware, type JWTPayload } from '../middleware/auth';

const chat = new Hono();

chat.use('*', authMiddleware);

// Simple in-memory rate limiter for chat
const chatRequests = new Map<string, { count: number; resetAt: number }>();
const CHAT_RATE_WINDOW = 60 * 1000; // 1 minute
const CHAT_MAX_REQUESTS = 20;

function checkChatRateLimit(userId: string): boolean {
  const now = Date.now();
  const record = chatRequests.get(userId);
  if (!record || now > record.resetAt) {
    chatRequests.set(userId, { count: 1, resetAt: now + CHAT_RATE_WINDOW });
    return true;
  }
  if (record.count >= CHAT_MAX_REQUESTS) return false;
  record.count++;
  return true;
}

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().default([]),
});

const SYSTEM_PROMPT = `You are a helpful restaurant management assistant. You help with:
- Menu management and food recommendations
- Order tracking and status updates
- Table management and reservations
- Customer inquiries and loyalty programs
- Financial reports and expense tracking
- General restaurant operations

Be concise, friendly, and professional. If asked about specific data, let the user know they can check the relevant section in the dashboard.`;

// POST /api/chat
chat.post('/', async (c) => {
  const user = c.get('user') as JWTPayload;

  if (!checkChatRateLimit(user.userId)) {
    return c.json({ error: 'Too many chat requests. Please wait a moment.' }, 429);
  }

  const body = await c.req.json();
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400);
  }

  const { message, history } = parsed.data;

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return c.json({ error: 'Chat service not configured' }, 503);
  }

  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message },
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      return c.json({ error: 'Chat service temporarily unavailable' }, 502);
    }

    const data = await response.json() as any;
    const assistantMessage = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    return c.json({
      message: assistantMessage,
      role: 'assistant',
    });
  } catch (error) {
    console.error('Chat error:', error);
    return c.json({ error: 'Chat service error' }, 500);
  }
});

export default chat;

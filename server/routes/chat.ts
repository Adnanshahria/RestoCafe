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

import { TOOL_DEFINITIONS, handleToolCall } from '../utils/chatbot-tools';

const SYSTEM_PROMPT = `You are a helpful restaurant management assistant. You have access to real-time data and can perform actions using tools.
- Use 'get_menu' to see what's on the menu.
- Use 'get_orders' to check order history or status.
- Use 'get_tables' to see table status.
- Use 'create_order' to help users place new orders.
- Use 'update_order_status' to manage the workflow.

Be concise, friendly, and proactive. If a user asks to "do something" (like create an order), use the tools directly instead of just explaining it.`;

type ChatMessage = 
  | { role: 'system' | 'user' | 'assistant'; content: string }
  | { role: 'assistant'; content?: string | null; tool_calls?: any[] }
  | { role: 'tool'; tool_call_id: string; name: string; content: string };

// POST /api/chat
chat.post('/', async (c) => {
  const user = c.get('user' as any) as JWTPayload;

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
    let messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-10).map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user', content: message },
    ];

    // Initial Request to Groq
    let response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        tools: TOOL_DEFINITIONS,
        tool_choice: 'auto',
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      return c.json({ error: 'Chat service temporarily unavailable' }, 502);
    }

    let data = await response.json() as any;
    let messageObj = data.choices[0].message;

    // Process Tool Calls (loop up to 3 times to handle chained calls if needed)
    let iterations = 0;
    while (messageObj.tool_calls && iterations < 3) {
      iterations++;
      messages.push(messageObj);

      for (const toolCall of messageObj.tool_calls) {
        const result = await handleToolCall(
          toolCall.function.name,
          JSON.parse(toolCall.function.arguments),
          user.userId
        );

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: result,
        });
      }

      // Get follow-up response from Groq
      response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          tools: TOOL_DEFINITIONS,
        }),
      });

      if (!response.ok) break;
      data = await response.json();
      messageObj = data.choices[0].message;
    }

    return c.json({
      message: messageObj.content || 'Action completed successfully.',
      role: 'assistant',
    });
  } catch (error) {
    console.error('Chat error:', error);
    return c.json({ error: 'Chat service error' }, 500);
  }
});

export default chat;

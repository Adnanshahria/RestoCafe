import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { useChat, ChatMessage } from './cb_context';

export function ChatMessages() {
  const { messages, isLoading } = useChat();

  return (
    <>
      {messages.map((msg) => (
        <MessageItem key={msg.id} msg={msg} />
      ))}

      {isLoading && <LoadingMessage />}
    </>
  );
}

function MessageItem({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`h-7 w-7 rounded-full flex-shrink-0 flex items-center justify-center ${
        isUser ? 'bg-primary/10' : 'bg-muted'
      }`}>
        {isUser ? (
          <User className="h-3.5 w-3.5 text-primary" />
        ) : (
          <Bot className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>
      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
        isUser
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted/50 border border-border'
      }`}>
        <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
      </div>
    </motion.div>
  );
}

function LoadingMessage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex gap-2"
    >
      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
        <Bot className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="bg-muted/50 border border-border rounded-2xl px-3 py-2">
        <div className="flex gap-1.5 p-1">
          <span className="h-1.5 w-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="h-1.5 w-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="h-1.5 w-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </motion.div>
  );
}

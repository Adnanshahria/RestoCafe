import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChat } from './cb_context';

export function ChatInput() {
  const { input, setInput, isLoading, sendMessage, inputRef } = useChat();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="px-4 py-3 border-t border-border bg-muted/10">
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything..."
          className="flex-1 h-10 text-sm rounded-xl"
          disabled={isLoading}
        />
        <Button
          onClick={sendMessage}
          size="icon"
          className="h-10 w-10 flex-shrink-0 rounded-xl shadow-md active:scale-95 transition-transform"
          disabled={!input.trim() || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

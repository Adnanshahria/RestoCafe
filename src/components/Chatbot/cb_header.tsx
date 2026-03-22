import { Bot, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat } from './cb_context';

export function ChatHeader() {
  const { setIsOpen } = useChat();

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Restaurant Assistant</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Online</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:bg-muted transition-colors"
        onClick={() => setIsOpen(false)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

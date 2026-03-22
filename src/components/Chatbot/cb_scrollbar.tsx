import React from 'react';
import { useChat } from './cb_context';

export function ChatScrollbar({ children }: { children: React.ReactNode }) {
  const { scrollRef } = useChat();

  return (
    <div 
      ref={scrollRef} 
      className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
    >
      {children}
    </div>
  );
}

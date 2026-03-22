import { motion, AnimatePresence } from 'framer-motion';
import { ChatProvider, useChat } from './cb_context';
import { ChatIcon } from './cb_icon';
import { ChatHeader } from './cb_header';
import { ChatScrollbar } from './cb_scrollbar';
import { ChatMessages } from './cb_messages';
import { ChatInput } from './cb_input';

function ChatWindow() {
  const { isOpen } = useChat();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-6rem)] bg-background border border-border rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden backdrop-blur-xl"
        >
          <ChatHeader />
          <ChatScrollbar>
            <ChatMessages />
          </ChatScrollbar>
          <ChatInput />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ChatWidget() {
  return (
    <ChatProvider>
      <ChatIcon />
      <ChatWindow />
    </ChatProvider>
  );
}

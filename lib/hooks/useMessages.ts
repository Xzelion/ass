import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Message } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';
import { MessageQueue } from '../chat/message-queue';
import { MessageHandler } from '../chat/message-handler';
import { useMessageStatus } from './useMessageStatus';
import { useConnection } from './useConnection';

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { messageStatus, updateStatus, clearStatus } = useMessageStatus();
  const connectionStatus = useConnection();

  const sendMessage = useCallback(async (content: string, userId: string) => {
    const tempId = crypto.randomUUID();
    
    // Optimistic update
    const tempMessage: Message = {
      id: tempId,
      content,
      user_id: userId,
      type: 'text',
      created_at: new Date().toISOString(),
      status: 'sending'
    };

    setMessages(prev => [...prev, tempMessage]);
    updateStatus(tempId, 'sending');

    try {
      const message = await MessageHandler.send(content, userId);
      setMessages(prev => 
        prev.map(msg => msg.id === tempId ? { ...message, status: 'sent' } : msg)
      );
      updateStatus(message.id, 'sent');
      clearStatus(tempId);
    } catch (error) {
      console.error('Error sending message:', error);
      updateStatus(tempId, 'error');
      MessageQueue.add({ id: tempId, content });
      
      toast({
        title: "Failed to Send",
        description: "Message will be retried when connection is restored.",
        variant: "destructive",
      });
    }
  }, [toast, updateStatus, clearStatus]);

  // Retry failed messages when connection is restored
  useEffect(() => {
    if (connectionStatus === 'connected') {
      const queue = MessageQueue.getQueue();
      queue.forEach(async (msg) => {
        const result = await MessageQueue.retry(msg.id, msg.content);
        if (result) {
          setMessages(prev => 
            prev.map(m => m.id === msg.id ? { ...result, status: 'sent' } : m)
          );
          clearStatus(msg.id);
        }
      });
    }
  }, [connectionStatus, clearStatus]);

  return { 
    messages, 
    isLoading, 
    error, 
    sendMessage,
    messageStatus 
  };
}
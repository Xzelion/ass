"use client";

import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/lib/types';
import { MessageService } from '@/lib/chat/message-service';
import { useToast } from '@/components/ui/use-toast';

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const data = await MessageService.fetchMessages();
        setMessages(data);
      } catch (error) {
        console.error('Failed to load messages:', error);
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [toast]);

  // Subscribe to new messages
  useEffect(() => {
    const channel = MessageService.subscribeToMessages((newMessage) => {
      setMessages(prev => [...prev, newMessage]);
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const sendMessage = useCallback(async (content: string, userId: string) => {
    try {
      await MessageService.sendMessage(content, userId);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  }, [toast]);

  return {
    messages,
    loading,
    sendMessage
  };
}
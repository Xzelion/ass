"use client";

import { useState, useEffect, useRef } from 'react';
import { ChatUser } from '@/lib/types';
import { PresenceManager } from '@/lib/chat/presence-manager';
import { useToast } from '@/components/ui/use-toast';

export function usePresence(user: ChatUser | null) {
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([]);
  const mountedRef = useRef(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const presenceManager = PresenceManager.getInstance();
    
    const initPresence = async () => {
      try {
        await presenceManager.initialize(user, (users) => {
          if (mountedRef.current) {
            setOnlineUsers(users);
          }
        });
      } catch (error) {
        console.error('Presence initialization error:', error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to chat. Please refresh the page.",
          variant: "destructive"
        });
      }
    };

    initPresence();

    return () => {
      mountedRef.current = false;
      presenceManager.cleanup().catch(console.error);
    };
  }, [user, toast]);

  return onlineUsers;
}
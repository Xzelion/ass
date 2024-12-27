"use client";

import { useState, useEffect } from 'react';
import { ChatUser } from '@/lib/types';
import { PresenceChannel } from '../chat/presence-channel';

export function usePresence(userId?: string) {
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([]);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to presence channel
    PresenceChannel.subscribe(userId, (users) => {
      setOnlineUsers(users);
    });

    return () => {
      PresenceChannel.unsubscribe();
    };
  }, [userId]);

  return onlineUsers;
}
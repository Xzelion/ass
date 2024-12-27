"use client";

import { useState, useEffect } from 'react';
import { ConnectionStatus } from '@/lib/types';
import { ConnectionManager } from '@/lib/chat/connection-manager';
import { useToast } from '@/components/ui/use-toast';

export function useConnection() {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const { toast } = useToast();

  useEffect(() => {
    const manager = ConnectionManager.getInstance();
    
    const unsubscribe = manager.subscribe((newStatus) => {
      setStatus(newStatus);
      
      if (newStatus === 'connected') {
        toast({
          title: "Connected",
          description: "You're back online!"
        });
      } else if (newStatus === 'disconnected') {
        toast({
          title: "Connection Lost",
          description: "Check your internet connection",
          variant: "destructive"
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [toast]);

  return status;
}
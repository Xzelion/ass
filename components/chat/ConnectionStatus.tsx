"use client";

import { Wifi, WifiOff } from 'lucide-react';
import { useConnection } from '@/hooks/useConnection';
import { cn } from '@/lib/utils';

export default function ConnectionStatus() {
  const status = useConnection();

  if (status === 'connected') return null;

  return (
    <div className={cn(
      "fixed bottom-4 right-4 px-4 py-2 rounded-lg flex items-center gap-2",
      "animate-in slide-in-from-bottom-2",
      status === 'connecting' ? 'bg-yellow-500/90' : 'bg-destructive',
      'text-white'
    )}>
      {status === 'connecting' ? (
        <Wifi className="h-4 w-4 animate-pulse" />
      ) : (
        <WifiOff className="h-4 w-4" />
      )}
      <span>
        {status === 'connecting' 
          ? 'Reconnecting...' 
          : 'Connection lost. Check your internet.'}
      </span>
    </div>
  );
}
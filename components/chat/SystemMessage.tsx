"use client";

import { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface SystemMessageProps {
  message: Message;
}

export default function SystemMessage({ message }: SystemMessageProps) {
  return (
    <div className="flex flex-col items-center gap-1 my-3">
      <span className={cn(
        "text-sm px-3 py-1 rounded-full",
        "bg-muted/50 text-muted-foreground"
      )}>
        {message.content}
      </span>
      <span className="text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
      </span>
    </div>
  );
}
export interface ChatUser {
  id: string;
  nickname: string;
  avatar_url?: string;
  is_guest: boolean;
  last_seen: string;
  created_at: string;
}

export interface Message {
  id: string;
  content: string;
  user_id: string;
  type: 'text' | 'system' | 'gif';
  created_at: string;
  chat_users?: ChatUser;
  status?: 'sending' | 'sent' | 'error';
  retry?: () => Promise<void>;
}

export interface PendingMessage {
  id: string;
  content: string;
  retries: number;
}

export interface SystemMessage {
  type: 'join' | 'leave';
  user: ChatUser;
  timestamp: string;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';
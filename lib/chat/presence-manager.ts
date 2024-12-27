import { supabase } from '../supabase';
import { ChatUser } from '../types';

export class PresenceManager {
  private static instance: PresenceManager | null = null;
  private channel: ReturnType<typeof supabase.channel> | null = null;
  private currentUser: ChatUser | null = null;

  private constructor() {}

  static getInstance(): PresenceManager {
    if (!this.instance) {
      this.instance = new PresenceManager();
    }
    return this.instance;
  }

  async initialize(user: ChatUser, onUpdate: (users: ChatUser[]) => void): Promise<void> {
    if (!user?.id) return;

    await this.cleanup();
    this.currentUser = user;

    try {
      this.channel = supabase.channel('online-users');

      await this.channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.channel!.track({
            id: user.id,
            nickname: user.nickname,
            online_at: new Date().toISOString()
          });
        }
      });

      this.channel.on('presence', { event: 'sync' }, () => {
        if (!this.channel) return;
        const state = this.channel.presenceState<ChatUser>();
        const users = Object.values(state).flat();
        onUpdate(users);
      });

    } catch (error) {
      console.error('Failed to initialize presence:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    if (this.channel) {
      try {
        await this.channel.untrack();
        await this.channel.unsubscribe();
      } finally {
        this.channel = null;
        this.currentUser = null;
      }
    }
  }
}
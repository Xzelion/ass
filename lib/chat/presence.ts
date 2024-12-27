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

    // Clean up any existing channel
    await this.cleanup();

    this.currentUser = user;
    this.channel = supabase.channel('online-users');

    try {
      await this.channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.channel!.track({
            id: user.id,
            nickname: user.nickname,
            online_at: new Date().toISOString()
          });
        }
      });

      // Handle presence state changes
      this.channel.on('presence', { event: 'sync' }, () => {
        const state = this.channel!.presenceState<ChatUser>();
        const users = Object.values(state).flat();
        onUpdate(users);
      });

      // Handle join/leave events
      this.channel.on('presence', { event: 'join' }, ({ newPresences }) => {
        const joiner = newPresences[0];
        if (joiner && joiner.id !== user.id) {
          this.createSystemMessage(`${joiner.nickname} joined the chat`);
        }
      });

      this.channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const leaver = leftPresences[0];
        if (leaver && leaver.id !== user.id) {
          this.createSystemMessage(`${leaver.nickname} left the chat`);
        }
      });

    } catch (error) {
      console.error('Failed to initialize presence:', error);
      throw error;
    }
  }

  private async createSystemMessage(content: string): Promise<void> {
    if (!this.currentUser) return;

    try {
      await supabase
        .from('messages')
        .insert([{
          content,
          user_id: this.currentUser.id,
          type: 'system'
        }]);
    } catch (error) {
      console.error('Error creating system message:', error);
    }
  }

  async cleanup(): Promise<void> {
    if (this.channel && this.currentUser) {
      try {
        await this.createSystemMessage(`${this.currentUser.nickname} left the chat`);
        await this.channel.untrack();
        await this.channel.unsubscribe();
      } finally {
        this.channel = null;
        this.currentUser = null;
      }
    }
  }
}
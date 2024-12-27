import { supabase } from '../supabase';
import { ChatUser } from '../types';

export class PresenceService {
  private static instance: PresenceService | null = null;
  private channel: ReturnType<typeof supabase.channel> | null = null;
  private currentUser: ChatUser | null = null;

  private constructor() {}

  static getInstance(): PresenceService {
    if (!this.instance) {
      this.instance = new PresenceService();
    }
    return this.instance;
  }

  async initialize(user: ChatUser, onUpdate: (users: ChatUser[]) => void): Promise<void> {
    if (!user?.id) return;

    this.currentUser = user;
    await this.cleanup();

    this.channel = supabase.channel('presence', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Presence timeout')), 5000);

      this.channel!
        .on('presence', { event: 'sync' }, () => {
          if (!this.channel) return;
          const state = this.channel.presenceState<ChatUser>();
          const users = Object.values(state).flat();
          onUpdate(users);
        })
        .on('presence', { event: 'join' }, async ({ newPresences }) => {
          const joiner = newPresences[0];
          if (joiner && joiner.id !== user.id) {
            await this.createSystemMessage(`${joiner.nickname} joined the chat`);
          }
        })
        .on('presence', { event: 'leave' }, async ({ leftPresences }) => {
          const leaver = leftPresences[0];
          if (leaver && leaver.id !== user.id) {
            await this.createSystemMessage(`${leaver.nickname} left the chat`);
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout);
            try {
              await this.channel!.track(user);
              await this.createSystemMessage(`${user.nickname} joined the chat`);
              resolve();
            } catch (error) {
              reject(error);
            }
          }
        });
    });
  }

  private async createSystemMessage(content: string) {
    if (!this.currentUser) return;

    await supabase
      .from('messages')
      .insert([{
        content,
        user_id: this.currentUser.id,
        type: 'system'
      }]);
  }

  async cleanup(): Promise<void> {
    if (this.channel && this.currentUser) {
      try {
        await this.createSystemMessage(`${this.currentUser.nickname} left the chat`);
        await this.channel.untrack();
        await this.channel.unsubscribe();
      } catch (error) {
        console.error('Cleanup error:', error);
      } finally {
        this.channel = null;
        this.currentUser = null;
      }
    }
  }
}
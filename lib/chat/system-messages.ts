import { supabase } from '../supabase';
import { ChatUser } from '../types';

export class SystemMessages {
  private static async createMessage(content: string, userId: string) {
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          content,
          user_id: userId,
          type: 'system',
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating system message:', error);
    }
  }

  static async createJoinMessage(user: ChatUser) {
    return this.createMessage(
      `${user.nickname} joined the chat`,
      user.id
    );
  }

  static async createLeaveMessage(user: ChatUser) {
    return this.createMessage(
      `${user.nickname} left the chat`,
      user.id
    );
  }
}
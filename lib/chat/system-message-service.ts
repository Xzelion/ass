import { supabase } from '../supabase';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

export class SystemMessageService {
  private async createMessage(content: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          content,
          type: 'system',
          user_id: SYSTEM_USER_ID,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error creating system message:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to create system message:', error);
    }
  }

  async createJoinMessage(nickname: string): Promise<void> {
    await this.createMessage(`${nickname} joined the chat`);
  }

  async createLeaveMessage(nickname: string): Promise<void> {
    await this.createMessage(`${nickname} left the chat`);
  }
}
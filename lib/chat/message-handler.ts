import { supabase } from '../supabase';
import { Message } from '../types';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 5000];

export class MessageHandler {
  static async send(content: string, userId: string, retryCount = 0): Promise<Message> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{ 
          content, 
          user_id: userId, 
          type: 'text',
          created_at: new Date().toISOString()
        }])
        .select(`
          *,
          chat_users (
            nickname,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => 
          setTimeout(resolve, RETRY_DELAYS[retryCount])
        );
        return this.send(content, userId, retryCount + 1);
      }
      throw error;
    }
  }

  static async fetchMessages(limit = 50, beforeTimestamp?: string): Promise<Message[]> {
    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          chat_users (
            nickname,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (beforeTimestamp) {
        query = query.lt('created_at', beforeTimestamp);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data.reverse();
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  static async retry(messageId: string, content: string, userId: string): Promise<Message> {
    return this.send(content, userId);
  }
}
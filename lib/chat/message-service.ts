import { supabase } from '../supabase';
import { Message } from '../types';

export class MessageService {
  static async fetchMessages(limit = 50): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        chat_users (
          nickname,
          avatar_url
        )
      `)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async sendMessage(content: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .insert([{ 
        content, 
        user_id: userId,
        type: 'text'
      }]);

    if (error) throw error;
  }

  static subscribeToMessages(callback: (message: Message) => void) {
    const channel = supabase.channel('db-messages');

    channel
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages' 
        },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              chat_users (
                nickname,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();
            
          if (data) {
            callback(data);
          }
        }
      )
      .subscribe();

    return channel;
  }
}
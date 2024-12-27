import { Message, PendingMessage } from '../types';
import { MessageHandler } from './message-handler';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 5000];

export class MessageQueue {
  private static queue: PendingMessage[] = [];

  static add(message: Omit<PendingMessage, 'retries'>): void {
    this.queue.push({ ...message, retries: 0 });
  }

  static remove(messageId: string): void {
    this.queue = this.queue.filter(msg => msg.id !== messageId);
  }

  static async retry(messageId: string, userId: string): Promise<Message | null> {
    const message = this.queue.find(msg => msg.id === messageId);
    if (!message || message.retries >= MAX_RETRIES) return null;

    try {
      const result = await MessageHandler.retry(messageId, message.content, userId);
      this.remove(messageId);
      return result;
    } catch (error) {
      message.retries++;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[message.retries - 1]));
      return null;
    }
  }

  static getQueue(): PendingMessage[] {
    return [...this.queue];
  }

  static clear(): void {
    this.queue = [];
  }
}
import { supabase } from '../supabase';
import { ConnectionStatus } from '../types';

export class ConnectionManager {
  private static instance: ConnectionManager | null = null;
  private listeners: Set<(status: ConnectionStatus) => void> = new Set();
  private status: ConnectionStatus = 'connecting';
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private readonly RECONNECT_DELAY = 3000;

  private constructor() {
    this.initialize();
  }

  static getInstance(): ConnectionManager {
    if (!this.instance) {
      this.instance = new ConnectionManager();
    }
    return this.instance;
  }

  private initialize() {
    // Monitor Supabase connection
    supabase.channel('system')
      .on('system', { event: '*' }, () => {
        this.updateStatus('connecting');
      })
      .subscribe((status) => {
        this.updateStatus(status === 'SUBSCRIBED' ? 'connected' : 'disconnected');
      });

    // Monitor browser online/offline status
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  private updateStatus(newStatus: ConnectionStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.notifyListeners();
    }
  }

  private handleOnline() {
    this.updateStatus('connecting');
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.reconnectTimeout = setTimeout(() => {
      supabase.channel('system').subscribe();
    }, this.RECONNECT_DELAY);
  }

  private handleOffline() {
    this.updateStatus('disconnected');
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.status));
  }

  subscribe(callback: (status: ConnectionStatus) => void) {
    this.listeners.add(callback);
    callback(this.status); // Immediately notify of current status
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }
}
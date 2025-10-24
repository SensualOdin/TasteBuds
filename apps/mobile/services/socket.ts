import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOCKET_URL } from '@/constants/config';
import type { Restaurant } from '@/types';

export interface SocketEvents {
  // Server → Client events
  members_update: (data: {
    total: number;
    ready: number;
    members: Array<{ id: string; name: string; isReady: boolean }>;
  }) => void;
  ready_to_start: (data: { memberCount: number }) => void;
  session_started: (data: { sessionId: string }) => void;
  match_found: (data: { restaurant: Restaurant; swipedBy: Array<{ id: string; display_name: string }> }) => void;
  session_complete: (data: { matches: any[] }) => void;
  user_swiped: (data: { userId: string; restaurantId: string; direction: string }) => void;
  member_left: (data: { userId: string }) => void;
  member_disconnected: (data: { userId: string }) => void;
  error: (data: { message: string }) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private connected = false;

  async connect(): Promise<Socket> {
    if (this.socket && this.connected) {
      return this.socket;
    }

    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No auth token available');
    }

    return new Promise((resolve, reject) => {
      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connected');
        this.connected = true;
        resolve(this.socket!);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
        this.connected = false;
      });

      // Set connection timeout
      setTimeout(() => {
        if (!this.connected) {
          reject(new Error('Socket connection timeout'));
        }
      }, 10000);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Emit events
  joinSession(groupId: string) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('join_session', { groupId });
  }

  leaveSession() {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('leave_session');
  }

  sendSwipe(restaurantId: string, direction: 'left' | 'right', sessionId: string) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('swipe', { restaurantId, direction, sessionId });
  }

  // Listen to events
  on<E extends keyof SocketEvents>(event: E, handler: SocketEvents[E]) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on(event as string, handler as any);
  }

  off<E extends keyof SocketEvents>(event: E, handler?: SocketEvents[E]) {
    if (!this.socket) return;
    this.socket.off(event as string, handler as any);
  }

  once<E extends keyof SocketEvents>(event: E, handler: SocketEvents[E]) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.once(event as string, handler as any);
  }
}

export const socketService = new SocketService();

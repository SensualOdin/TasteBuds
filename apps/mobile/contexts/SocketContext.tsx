import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { socketService, SocketEvents } from '@/services/socket';
import { useAuth } from './AuthContext';
import type { Restaurant } from '@/types';

interface SocketContextType {
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  joinSession: (groupId: string) => void;
  leaveSession: () => void;
  sendSwipe: (restaurantId: string, direction: 'left' | 'right', sessionId: string) => void;
  on: <E extends keyof SocketEvents>(event: E, handler: SocketEvents[E]) => void;
  off: <E extends keyof SocketEvents>(event: E, handler?: SocketEvents[E]) => void;
  once: <E extends keyof SocketEvents>(event: E, handler: SocketEvents[E]) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !isConnected) {
      connect();
    } else if (!isAuthenticated && isConnected) {
      disconnect();
    }

    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, [isAuthenticated]);

  const connect = async () => {
    try {
      await socketService.connect();
      setIsConnected(true);
    } catch (error) {
      console.error('Socket connection failed:', error);
      setIsConnected(false);
    }
  };

  const disconnect = () => {
    socketService.disconnect();
    setIsConnected(false);
  };

  const joinSession = (groupId: string) => {
    socketService.joinSession(groupId);
  };

  const leaveSession = () => {
    socketService.leaveSession();
  };

  const sendSwipe = (restaurantId: string, direction: 'left' | 'right', sessionId: string) => {
    socketService.sendSwipe(restaurantId, direction, sessionId);
  };

  const on = <E extends keyof SocketEvents>(event: E, handler: SocketEvents[E]) => {
    socketService.on(event, handler);
  };

  const off = <E extends keyof SocketEvents>(event: E, handler?: SocketEvents[E]) => {
    socketService.off(event, handler);
  };

  const once = <E extends keyof SocketEvents>(event: E, handler: SocketEvents[E]) => {
    socketService.once(event, handler);
  };

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        connect,
        disconnect,
        joinSession,
        leaveSession,
        sendSwipe,
        on,
        off,
        once,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

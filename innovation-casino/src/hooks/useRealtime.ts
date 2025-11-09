/**
 * useRealtime Hook
 * Manages Socket.io connection and real-time event subscriptions
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSocket, joinSession, leaveSession } from '@/lib/socket';
import { Socket } from 'socket.io-client';

interface RealtimeCallbacks {
  onNewVote?: (data: { totalChips: number; participantId?: string; timestamp: number }) => void;
  onSessionUpdated?: (data: { status?: string; action?: string; timestamp: number }) => void;
  onParticipantJoined?: (data: { participantCount: number; timestamp: number }) => void;
  onTimerTick?: (data: { secondsRemaining: number; timestamp: number }) => void;
}

export function useRealtime(sessionId: string | null, callbacks?: RealtimeCallbacks) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      queueMicrotask(() => {
        setConnected(false);
        setSocket(null);
      });
      return;
    }

    try {
      const socketInstance = getSocket();
      queueMicrotask(() => {
        setSocket(socketInstance);
      });

      // Connection event handlers
      const handleConnect = () => {
        console.log('[useRealtime] Connected to Socket.io');
        setConnected(true);
        setError(null);
        joinSession(sessionId);
      };

      const handleDisconnect = (reason: string) => {
        console.log('[useRealtime] Disconnected from Socket.io:', reason);
        setConnected(false);
      };

      const handleError = (err: Error) => {
        console.error('[useRealtime] Socket error:', err);
        setError(err.message);
      };

      // Attach connection listeners
      socketInstance.on('connect', handleConnect);
      socketInstance.on('disconnect', handleDisconnect);
      socketInstance.on('connect_error', handleError);

      // If already connected, join immediately
      if (socketInstance.connected) {
        handleConnect();
      }

      // Cleanup on unmount or sessionId change
      return () => {
        if (socketInstance) {
          leaveSession(sessionId);
          socketInstance.off('connect', handleConnect);
          socketInstance.off('disconnect', handleDisconnect);
          socketInstance.off('connect_error', handleError);
        }
      };
    } catch (err) {
      console.error('[useRealtime] Failed to initialize socket:', err);
      queueMicrotask(() => {
        setError(err instanceof Error ? err.message : 'Socket initialization failed');
      });
    }
  }, [sessionId]);

  // Subscribe to real-time events
  useEffect(() => {
    if (!socket || !sessionId) return;

    const unsubscribers: (() => void)[] = [];

    // New vote event
    if (callbacks?.onNewVote) {
      const handleNewVote = (data: { totalChips: number; participantId?: string; timestamp: number }) => {
        callbacks.onNewVote?.(data);
      };
      socket.on('new_vote', handleNewVote);
      unsubscribers.push(() => socket.off('new_vote', handleNewVote));
    }

    // Session updated event
    if (callbacks?.onSessionUpdated) {
      const handleSessionUpdated = (data: { status?: string; action?: string; timestamp: number }) => {
        callbacks.onSessionUpdated?.(data);
      };
      socket.on('session_updated', handleSessionUpdated);
      unsubscribers.push(() => socket.off('session_updated', handleSessionUpdated));
    }

    // Participant joined event
    if (callbacks?.onParticipantJoined) {
      const handleParticipantJoined = (data: { participantCount: number; timestamp: number }) => {
        callbacks.onParticipantJoined?.(data);
      };
      socket.on('participant_joined', handleParticipantJoined);
      unsubscribers.push(() => socket.off('participant_joined', handleParticipantJoined));
    }

    // Timer tick event
    if (callbacks?.onTimerTick) {
      const handleTimerTick = (data: { secondsRemaining: number; timestamp: number }) => {
        callbacks.onTimerTick?.(data);
      };
      socket.on('timer_tick', handleTimerTick);
      unsubscribers.push(() => socket.off('timer_tick', handleTimerTick));
    }

    // Cleanup all event listeners
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [socket, sessionId, callbacks]);

  /**
   * Manually emit an event
   */
  const emit = useCallback((event: string, data: unknown) => {
    if (socket && connected) {
      socket.emit(event, data);
    } else {
      console.warn('[useRealtime] Cannot emit - socket not connected');
    }
  }, [socket, connected]);

  return {
    socket,
    connected,
    error,
    emit,
  };
}

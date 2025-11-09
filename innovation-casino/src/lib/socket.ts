/**
 * Socket.io Client
 * Real-time communication setup for Innovation Casino
 */

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Get or create Socket.io instance
 */
export function getSocket(): Socket {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';
    socket = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Add connection event listeners for debugging
    socket.on('connect', () => {
      console.log('[Socket.io] Connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.io] Disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket.io] Connection error:', error);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('[Socket.io] Reconnected after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_error', (error) => {
      console.error('[Socket.io] Reconnection error:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('[Socket.io] Reconnection failed');
    });
  }

  return socket;
}

/**
 * Disconnect and clean up socket
 */
export function disconnectSocket(): void {
  if (socket) {
    console.log('[Socket.io] Disconnecting...');
    socket.disconnect();
    socket = null;
  }
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
  return socket?.connected || false;
}

/**
 * Join a session room
 */
export function joinSession(sessionId: string): void {
  const socketInstance = getSocket();
  console.log('[Socket.io] Joining session:', sessionId);
  socketInstance.emit('join_session', sessionId);
}

/**
 * Leave a session room
 */
export function leaveSession(sessionId: string): void {
  const socketInstance = getSocket();
  console.log('[Socket.io] Leaving session:', sessionId);
  socketInstance.emit('leave_session', sessionId);
}

/**
 * Emit vote submission event
 */
export function emitVoteSubmitted(data: {
  sessionId: string;
  participantId?: string;
  totalChips: number;
}): void {
  const socketInstance = getSocket();
  console.log('[Socket.io] Emitting vote submission:', data);
  socketInstance.emit('submit_vote', data);
}

/**
 * Emit session update event
 */
export function emitSessionUpdated(data: {
  sessionId: string;
  status?: string;
  action?: string;
}): void {
  const socketInstance = getSocket();
  console.log('[Socket.io] Emitting session update:', data);
  socketInstance.emit('session_updated', data);
}

/**
 * Emit participant joined event
 */
export function emitParticipantJoined(data: {
  sessionId: string;
  participantCount: number;
}): void {
  const socketInstance = getSocket();
  console.log('[Socket.io] Emitting participant joined:', data);
  socketInstance.emit('participant_joined', data);
}

/**
 * Emit timer tick event
 */
export function emitTimerTick(data: {
  sessionId: string;
  secondsRemaining: number;
}): void {
  const socketInstance = getSocket();
  socketInstance.emit('timer_tick', data);
}

/**
 * Subscribe to new vote events
 */
export function onNewVote(callback: (data: {
  totalChips: number;
  participantId?: string;
  timestamp: number;
}) => void): () => void {
  const socketInstance = getSocket();
  socketInstance.on('new_vote', callback);

  // Return unsubscribe function
  return () => {
    socketInstance.off('new_vote', callback);
  };
}

/**
 * Subscribe to session update events
 */
export function onSessionUpdated(callback: (data: {
  status?: string;
  action?: string;
  timestamp: number;
}) => void): () => void {
  const socketInstance = getSocket();
  socketInstance.on('session_updated', callback);

  // Return unsubscribe function
  return () => {
    socketInstance.off('session_updated', callback);
  };
}

/**
 * Subscribe to participant joined events
 */
export function onParticipantJoined(callback: (data: {
  participantCount: number;
  timestamp: number;
}) => void): () => void {
  const socketInstance = getSocket();
  socketInstance.on('participant_joined', callback);

  // Return unsubscribe function
  return () => {
    socketInstance.off('participant_joined', callback);
  };
}

/**
 * Subscribe to timer tick events
 */
export function onTimerTick(callback: (data: {
  scenarioId?: string;
  secondsRemaining: number;
  timestamp: number;
}) => void): () => void {
  const socketInstance = getSocket();
  socketInstance.on('timer_tick', callback);

  // Return unsubscribe function
  return () => {
    socketInstance.off('timer_tick', callback);
  };
}

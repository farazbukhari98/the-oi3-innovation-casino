/**
 * SessionContext
 * Global session state management with real-time updates
 */

'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Session, SessionStatus } from '@/types/session';
import { useSession } from '@/hooks/useSession';
import { useRealtime } from '@/hooks/useRealtime';
import { updateSessionStatus } from '@/lib/database';
import { emitSessionUpdated } from '@/lib/socket';

interface SessionContextType {
  sessionId: string | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  connected: boolean;
  setSessionId: (id: string | null) => void;
  updateStatus: (status: SessionStatus) => Promise<void>;
  refreshSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
  initialSessionId?: string | null;
}

export function SessionProvider({ children, initialSessionId = null }: SessionProviderProps) {
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const { session, loading, error } = useSession(sessionId);

  // Real-time updates
  const { connected } = useRealtime(sessionId, {
    onSessionUpdated: (data) => {
      console.log('[SessionContext] Session updated:', data);
      // Session data will automatically update via useSession hook
    },
  });

  /**
   * Update session status
   */
  const updateStatus = async (status: SessionStatus) => {
    if (!sessionId || !session) {
      throw new Error('No active session');
    }

    try {
      await updateSessionStatus(sessionId, status);

      // Emit real-time event
      emitSessionUpdated({
        sessionId,
        status,
      });
    } catch (err) {
      console.error('[SessionContext] Failed to update status:', err);
      throw err;
    }
  };

  /**
   * Force refresh session data (triggers re-fetch)
   */
  const refreshSession = () => {
    // Simply toggling sessionId will trigger useSession to re-fetch
    if (sessionId) {
      const currentId = sessionId;
      setSessionId(null);
      setTimeout(() => setSessionId(currentId), 10);
    }
  };

  const value: SessionContextType = {
    sessionId,
    session,
    loading,
    error,
    connected,
    setSessionId,
    updateStatus,
    refreshSession,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

/**
 * Hook to use session context
 */
export function useSessionContext() {
  const context = useContext(SessionContext);

  if (context === undefined) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }

  return context;
}

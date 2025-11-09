/**
 * ParticipantContext
 * Manages participant registration, voting state, and real-time updates
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Participant } from '@/types/participant';
import { database } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';
import { registerParticipant, getParticipant } from '@/lib/database';
import { generateDeviceId } from '@/lib/utils';
import { emitParticipantJoined } from '@/lib/socket';

interface ParticipantContextType {
  participant: Participant | null;
  loading: boolean;
  error: string | null;
  register: (sessionId: string, name: string, department: string) => Promise<void>;
  clearParticipant: () => void;
  refreshParticipant: () => void;
}

const ParticipantContext = createContext<ParticipantContextType | undefined>(undefined);

interface ParticipantProviderProps {
  children: ReactNode;
}

export function ParticipantProvider({ children }: ParticipantProviderProps) {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);

  // Load participant ID from localStorage on mount
  useEffect(() => {
    let raf: number | null = null;

    if (typeof window !== 'undefined') {
      const storedParticipantId = window.localStorage.getItem('innovation-casino-participant-id');
      if (storedParticipantId) {
        raf = window.requestAnimationFrame(() => setParticipantId(storedParticipantId));
      }
    }

    return () => {
      if (raf !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(raf);
      }
    };
  }, []);

  // Real-time participant data updates
  useEffect(() => {
    let raf: number | null = null;

    if (!participantId) {
      if (typeof window !== 'undefined') {
        raf = window.requestAnimationFrame(() => setParticipant(null));
      }
      return () => {
        if (raf !== null && typeof window !== 'undefined') {
          window.cancelAnimationFrame(raf);
        }
      };
    }

    const participantRef = ref(database, `participants/${participantId}`);

    const unsubscribe = onValue(
      participantRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const participantData = snapshot.val() as Participant;
          setParticipant(participantData);
          setError(null);
        } else {
          setParticipant(null);
          setError('Participant not found');
        }
      },
      (error) => {
        console.error('[ParticipantContext] Error:', error);
        setError(error.message);
      }
    );

    return () => {
      off(participantRef, 'value', unsubscribe);
      if (raf !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(raf);
      }
    };
  }, [participantId]);

  /**
   * Register participant for a session
   */
  const register = useCallback(async (sessionId: string, name: string, department: string) => {
    setLoading(true);
    setError(null);

    try {
      const deviceId = generateDeviceId();
      const newParticipantId = await registerParticipant(sessionId, name, department, deviceId);

      // Store participant ID in localStorage
      localStorage.setItem('innovation-casino-participant-id', newParticipantId);
      setParticipantId(newParticipantId);

      // Fetch the newly created participant
      const participantData = await getParticipant(newParticipantId);
      if (participantData) {
        setParticipant(participantData);

        // Emit real-time event
        emitParticipantJoined({
          sessionId,
          participantCount: 1, // This will be updated by the facilitator view
        });
      }

      setLoading(false);
    } catch (err) {
      console.error('[ParticipantContext] Registration failed:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
      setLoading(false);
      throw err;
    }
  }, []);

  /**
   * Clear participant data (logout)
   */
  const clearParticipant = useCallback(() => {
    localStorage.removeItem('innovation-casino-participant-id');
    setParticipantId(null);
    setParticipant(null);
    setError(null);
  }, []);

  /**
   * Refresh participant data
   */
  const refreshParticipant = useCallback(() => {
    if (participantId) {
      const currentId = participantId;
      setParticipantId(null);
      setTimeout(() => setParticipantId(currentId), 10);
    }
  }, [participantId]);

  const value: ParticipantContextType = {
    participant,
    loading,
    error,
    register,
    clearParticipant,
    refreshParticipant,
  };

  return (
    <ParticipantContext.Provider value={value}>
      {children}
    </ParticipantContext.Provider>
  );
}

/**
 * Hook to use participant context
 */
export function useParticipantContext() {
  const context = useContext(ParticipantContext);

  if (context === undefined) {
    throw new Error('useParticipantContext must be used within a ParticipantProvider');
  }

  return context;
}

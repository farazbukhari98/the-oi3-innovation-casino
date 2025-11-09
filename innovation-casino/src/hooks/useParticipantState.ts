'use client';

import { useEffect, useState } from 'react';
import { Participant } from '@/types/participant';

interface ParticipantStateData {
  participantId: string;
  sessionId: string;
  layer1Completed: boolean;
  layer2Completed: boolean;
  layer1Selection?: string;
  participantName: string;
  lastUpdated: number;
}

const STORAGE_KEY = 'casino_participant_state';
const STATE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export function useParticipantState(sessionId: string | null) {
  const [savedState, setSavedState] = useState<ParticipantStateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const parsed: ParticipantStateData = JSON.parse(storedData);

        // Check if state matches current session and isn't expired
        if (
          sessionId &&
          parsed.sessionId === sessionId &&
          Date.now() - parsed.lastUpdated < STATE_EXPIRY_MS
        ) {
          setSavedState(parsed);
        } else {
          // Clear expired or mismatched state
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to load participant state:', error);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Save participant state
  const saveState = (
    participant: Partial<Participant> & { participantId: string; sessionId: string; name: string }
  ) => {
    if (typeof window === 'undefined') return;

    const stateData: ParticipantStateData = {
      participantId: participant.participantId,
      sessionId: participant.sessionId,
      layer1Completed: participant.layer1Completed || false,
      layer2Completed: participant.layer2Completed || false,
      layer1Selection: participant.layer1Selection,
      participantName: participant.name,
      lastUpdated: Date.now(),
    };

    const noChanges =
      savedState &&
      savedState.participantId === stateData.participantId &&
      savedState.sessionId === stateData.sessionId &&
      savedState.layer1Completed === stateData.layer1Completed &&
      savedState.layer2Completed === stateData.layer2Completed &&
      savedState.layer1Selection === stateData.layer1Selection &&
      savedState.participantName === stateData.participantName;

    if (noChanges) {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateData));
      setSavedState(stateData);
    } catch (error) {
      console.error('Failed to save participant state:', error);
    }
  };

  // Clear saved state
  const clearState = () => {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(STORAGE_KEY);
    setSavedState(null);
  };

  // Check if participant can reconnect
  const canReconnect = (currentSessionId: string | null): boolean => {
    return !!(
      savedState &&
      currentSessionId &&
      savedState.sessionId === currentSessionId &&
      savedState.participantId
    );
  };

  return {
    savedState,
    isLoading,
    saveState,
    clearState,
    canReconnect,
  };
}

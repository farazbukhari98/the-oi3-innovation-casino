/**
 * useSession Hook
 * Real-time session data management using Firebase Realtime Database
 */

'use client';

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';
import { Session, ScenarioState, SolutionScenario } from '@/types/session';
import {
  DEFAULT_CHIPS_PER_TYPE,
  DEFAULT_LAYER_DURATIONS,
  PAIN_POINT_DEFINITIONS,
} from '@/lib/constants';
import { resolveParticipantBaseUrl } from '@/lib/utils';

type LegacySession = Session & {
  currentScenario?: ScenarioState;
  scenarioOrder?: string[];
  scenarios?: Record<string, ScenarioState>;
  solutionsByPainPoint?: Record<string, SolutionScenario[]>;
};

function ensureScenarios(session: LegacySession): { scenarios: Record<string, ScenarioState>; order: string[] } {
  if (session.scenarios && Object.keys(session.scenarios).length > 0) {
    const order = session.scenarioOrder && session.scenarioOrder.length > 0
      ? session.scenarioOrder
      : Object.keys(session.scenarios);
    return { scenarios: session.scenarios, order };
  }

  if (session.currentScenario) {
    const { id = 'scenario-1', title, description } = session.currentScenario;
    const fallback: ScenarioState = { id, title, description };
    return { scenarios: { [id]: fallback }, order: [id] };
  }

  const fallbackScenario: ScenarioState = {
    id: 'scenario-1',
    title: 'Innovation Scenario',
    description: 'Describe your innovation bet.',
  };

  return {
    scenarios: { [fallbackScenario.id]: fallbackScenario },
    order: [fallbackScenario.id],
  };
}

function ensureSolutions(rawSession: LegacySession): Record<string, SolutionScenario[]> {
  if (rawSession.solutionsByPainPoint && Object.keys(rawSession.solutionsByPainPoint).length > 0) {
    return rawSession.solutionsByPainPoint;
  }

  return PAIN_POINT_DEFINITIONS.reduce<Record<string, SolutionScenario[]>>((acc, definition) => {
    acc[definition.id] = definition.solutions.map((solution) => ({ ...solution }));
    return acc;
  }, {});
}

function normalizeSessionData(rawSession: LegacySession): Session {
  const { scenarios, order } = ensureScenarios(rawSession);
  const solutionsByPainPoint = ensureSolutions(rawSession);
  const chipsPerType = rawSession.settings?.chipsPerType ?? DEFAULT_CHIPS_PER_TYPE;
  const layer1Duration = rawSession.settings?.layerDurations?.layer1 ?? DEFAULT_LAYER_DURATIONS.layer1;
  const layer2Duration = rawSession.settings?.layerDurations?.layer2 ?? DEFAULT_LAYER_DURATIONS.layer2;
  const layer1Allocations =
    rawSession.metadata?.layer1Allocations ?? rawSession.metadata?.totalAllocations ?? 0;
  const layer2Allocations = rawSession.metadata?.layer2Allocations ?? 0;
  const totalAllocations =
    rawSession.metadata?.totalAllocations ?? layer1Allocations + layer2Allocations;
  const participantBaseUrl = resolveParticipantBaseUrl({
    baseUrl: rawSession.settings?.participantBaseUrl,
  });

  return {
    ...rawSession,
    scenarioOrder: order,
    scenarios,
    solutionsByPainPoint,
    settings: {
      votingDuration: rawSession.settings?.votingDuration ?? layer1Duration,
      requireDepartment: rawSession.settings?.requireDepartment ?? true,
      allowRevotes: rawSession.settings?.allowRevotes ?? false,
      chipsPerType,
      participantBaseUrl,
      layerDurations: {
        layer1: layer1Duration,
        layer2: layer2Duration,
      },
    },
    metadata: {
      totalParticipants: rawSession.metadata?.totalParticipants ?? 0,
      layer1Allocations,
      layer2Allocations,
      totalAllocations,
    },
  };
}

export function useSession(sessionId: string | null) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      console.log('[useSession] No sessionId provided');
      queueMicrotask(() => {
        setLoading(false);
        setSession(null);
        setError(null);
      });
      return;
    }

    console.log('[useSession] Starting to load session:', sessionId);

    let isSubscribed = true;

    queueMicrotask(() => {
      if (isSubscribed) {
        setLoading(true);
        setError(null);
      }
    });

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.error('[useSession] Timeout: Firebase took too long to respond');
      setError('Connection timeout. Please check your internet connection and try again.');
      setLoading(false);
    }, 10000); // 10 second timeout

    const sessionRef = ref(database, `sessions/${sessionId}`);
    console.log('[useSession] Firebase reference created for path:', `sessions/${sessionId}`);

    const unsubscribe = onValue(
      sessionRef,
      (snapshot) => {
        clearTimeout(timeoutId);

        if (!isSubscribed) return;

        console.log('[useSession] Firebase snapshot received:', {
          exists: snapshot.exists(),
          sessionId,
          timestamp: new Date().toISOString()
        });

        if (snapshot.exists()) {
          const sessionData = snapshot.val() as Session;
          const normalizedSession = normalizeSessionData(sessionData);
          console.log('[useSession] Session data loaded successfully:', {
            sessionId: normalizedSession.id,
            status: normalizedSession.status,
            scenarios: normalizedSession.scenarioOrder.length,
          });
          setSession(normalizedSession);
          setError(null);
        } else {
          console.warn('[useSession] Session does not exist in Firebase:', sessionId);
          setSession(null);
          setError('Session not found');
        }
        setLoading(false);
      },
      (error: Error & { code?: string }) => {
        clearTimeout(timeoutId);

        if (!isSubscribed) return;

        console.error('[useSession] Firebase error:', {
          code: error.code,
          message: error.message,
          sessionId,
          timestamp: new Date().toISOString()
        });

        let errorMessage = 'Failed to load session';

        // Provide more specific error messages
        if (error.code === 'PERMISSION_DENIED') {
          errorMessage = 'Permission denied. Please check Firebase database rules.';
        } else if (error.code === 'NETWORK_ERROR') {
          errorMessage = 'Network error. Please check your internet connection.';
        } else if (error.message) {
          errorMessage = error.message;
        }

        setError(errorMessage);
        setLoading(false);
      }
    );

    return () => {
      console.log('[useSession] Cleaning up session listener:', sessionId);
      isSubscribed = false;
      clearTimeout(timeoutId);
      off(sessionRef, 'value', unsubscribe);
    };
  }, [sessionId]);

  return { session, loading, error };
}

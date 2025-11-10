'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

import { CasinoEnvironment } from '@/components/casino/CasinoEnvironment';
import { VotingInterfaceV2 } from '@/components/voting/VotingInterfaceV2';
import { LayerTransition } from '@/components/voting/LayerTransition';
import { useRealtime } from '@/hooks/useRealtime';
import { useSession } from '@/hooks/useSession';
import { Participant } from '@/types/participant';
import { useParticipantState } from '@/hooks/useParticipantState';

const LAYER1_OPEN_STATUSES = new Set(['betting_layer1', 'betting']);
const WAITING_FOR_LAYER2_STATUSES = new Set(['results_layer1', 'routing']);
const LAYER2_OPEN_STATUSES = new Set(['betting_layer2']);
const FINAL_STATUSES = new Set(['results_layer2', 'insights', 'results', 'closed']);

const deferStateUpdate = (callback: () => void) => {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(callback);
  } else {
    Promise.resolve().then(callback);
  }
};

type MessageCardProps = {
  icon: string;
  title: string;
  description: ReactNode;
};

function MessageCard({ icon, title, description }: MessageCardProps) {
  return (
    <div className="casino-card max-w-md text-center space-y-4">
      <div className="text-6xl">{icon}</div>
      <h1 className="text-3xl font-heading text-white">{title}</h1>
      <div className="text-gray-300 text-sm space-y-2">{description}</div>
    </div>
  );
}

function VotePageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const participantId = searchParams.get('participant');

  const { session, loading } = useSession(sessionId);
  useRealtime(sessionId);

  const [participant, setParticipant] = useState<Participant | null>(null);
  const [participantLoading, setParticipantLoading] = useState(true);
  const [participantError, setParticipantError] = useState<string | null>(null);
  const { savedState, saveState } = useParticipantState(sessionId);

  useEffect(() => {
    if (!participantId) {
      return;
    }

    let cancelled = false;
    deferStateUpdate(() => {
      if (cancelled) return;
      setParticipantLoading(true);
      setParticipantError(null);
    });

    fetch(`/api/participant/${participantId}`)
      .then(async (response) => {
        const payload = await response.json();
        if (cancelled) return;

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load participant');
        }

        setParticipant(payload.participant as Participant);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setParticipant(null);
          setParticipantError(
            error instanceof Error ? error.message : 'Failed to load participant'
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setParticipantLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [participantId]);

  useEffect(() => {
    if (!participant || !sessionId) return;

    saveState({
      ...participant,
      participantId: participant.id,
      sessionId,
      name: participant.name,
    });
  }, [participant, saveState, sessionId]);

  const participantDisplayName =
    participant?.name ?? savedState?.participantName ?? 'Participant';
  const resolvedLayer1Selection =
    participant?.layer1Selection ?? savedState?.layer1Selection;
  const hasLayer1Completed =
    participant?.layer1Completed ?? savedState?.layer1Completed ?? false;
  const hasLayer2Completed =
    participant?.layer2Completed ?? savedState?.layer2Completed ?? false;
  const participantForLayer2 =
    participant && resolvedLayer1Selection && !participant.layer1Selection
      ? { ...participant, layer1Selection: resolvedLayer1Selection }
      : participant;

  const loadingView = (
    <CasinoEnvironment>
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="casino-card max-w-md w-full text-center space-y-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            className="text-5xl"
          >
            🎰
          </motion.div>
          <h2 className="text-2xl font-heading text-white">Shuffling the deck...</h2>
          <p className="text-sm text-gray-400">
            We&apos;re loading the tables and your chip stack.
          </p>
        </motion.div>
      </div>
    </CasinoEnvironment>
  );

  if (!participantId) {
    return (
      <CasinoEnvironment>
        <div className="min-h-screen flex items-center justify-center px-4">
          <MessageCard
            icon="🔗"
            title="Missing participant link"
            description="Please re-scan the QR code or use the link provided by the facilitator."
          />
        </div>
      </CasinoEnvironment>
    );
  }

  if (loading || participantLoading) {
    return loadingView;
  }

  if (!session || participantError) {
    return (
      <CasinoEnvironment>
        <div className="min-h-screen flex items-center justify-center px-4">
          <MessageCard
            icon="🚫"
            title="Unable to load session"
            description={
              <>
                <p>
                  {participantError ??
                    'Double-check your link or scan the QR code on the main display again.'}
                </p>
              </>
            }
          />
        </div>
      </CasinoEnvironment>
    );
  }

  if (!participant) {
    return (
      <CasinoEnvironment>
        <div className="min-h-screen flex items-center justify-center px-4">
          <MessageCard
            icon="🤔"
            title="Participant not found"
            description="We couldn't find your registration for this session. Please re-scan the QR code."
          />
        </div>
      </CasinoEnvironment>
    );
  }

  const status = session.status;
  const isLayer1Open = LAYER1_OPEN_STATUSES.has(status);
  const isWaitingForLayer2 = WAITING_FOR_LAYER2_STATUSES.has(status);
  const isLayer2Open = LAYER2_OPEN_STATUSES.has(status);
  const isFinal = FINAL_STATUSES.has(status);

  if (status === 'waiting') {
    return (
      <CasinoEnvironment>
        <div className="min-h-screen flex items-center justify-center px-4">
          <MessageCard
            icon="🃏"
            title="Hold tight!"
            description={
              <>
                <p>The facilitator is about to open the betting floor.</p>
                <p className="text-xs text-gray-500">
                  You&apos;ll feel your phone buzz when it&apos;s time to play.
                </p>
              </>
            }
          />
        </div>
      </CasinoEnvironment>
    );
  }

  if (isLayer1Open) {
    if (!hasLayer1Completed) {
      return (
        <CasinoEnvironment>
          <VotingInterfaceV2
            session={session}
            participant={participant}
            currentLayer="layer1"
            onParticipantUpdate={setParticipant}
          />
        </CasinoEnvironment>
      );
    }

    return (
      <CasinoEnvironment>
        <LayerTransition
          participantName={participantDisplayName}
          layer1Selection={resolvedLayer1Selection}
          waitingForLayer2
          stage="afterLayer1"
        />
      </CasinoEnvironment>
    );
  }

  if (isWaitingForLayer2) {
    if (!hasLayer1Completed) {
      return (
        <CasinoEnvironment>
          <div className="min-h-screen flex items-center justify-center px-4">
            <MessageCard
              icon="⏳"
              title="Member Access closed"
              description={
                <>
                  <p>The facilitator already locked the first round.</p>
                  <p>Please see the team for assistance if you need to rejoin.</p>
                </>
              }
            />
          </div>
        </CasinoEnvironment>
      );
    }

    return (
      <CasinoEnvironment>
        <LayerTransition
          participantName={participantDisplayName}
          layer1Selection={resolvedLayer1Selection}
          waitingForLayer2
          stage="afterLayer1"
        />
      </CasinoEnvironment>
    );
  }

  if (isLayer2Open) {
    if (!hasLayer1Completed || !resolvedLayer1Selection || !participantForLayer2) {
      return (
        <CasinoEnvironment>
          <div className="min-h-screen flex items-center justify-center px-4">
            <MessageCard
              icon="🧭"
              title="Routing to next round"
              description={<p>Stay tuned—your solution cards are loading.</p>}
            />
          </div>
        </CasinoEnvironment>
      );
    }

    if (!hasLayer2Completed) {
      return (
        <CasinoEnvironment>
          <VotingInterfaceV2
            session={session}
            participant={participantForLayer2}
            currentLayer="layer2"
            onParticipantUpdate={setParticipant}
          />
        </CasinoEnvironment>
      );
    }

    return (
      <CasinoEnvironment>
      <LayerTransition
        participantName={participantDisplayName}
        layer1Selection={resolvedLayer1Selection}
        waitingForLayer2={false}
        stage="afterLayer2"
      />
      </CasinoEnvironment>
    );
  }

  if (isFinal) {
    return (
      <CasinoEnvironment>
        <div className="min-h-screen flex items-center justify-center px-4">
          <MessageCard
            icon="🎉"
            title="Thanks for playing!"
            description={
              <>
                <p>The casino floor is closed for now.</p>
                <p>Watch the main display to see how the room invested.</p>
              </>
            }
          />
        </div>
      </CasinoEnvironment>
    );
  }

  return (
    <CasinoEnvironment>
      <div className="min-h-screen flex items-center justify-center px-4">
        <MessageCard
          icon="🎲"
          title="Please stand by"
          description={<p>The facilitator is transitioning between rounds.</p>}
        />
      </div>
    </CasinoEnvironment>
  );
}

export default function VotePage() {
  return (
    <Suspense
      fallback={
        <CasinoEnvironment>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin text-6xl mb-4">🎰</div>
              <p className="text-xl text-gray-300">Loading voting interface...</p>
            </div>
          </div>
        </CasinoEnvironment>
      }
    >
      <VotePageContent />
    </Suspense>
  );
}

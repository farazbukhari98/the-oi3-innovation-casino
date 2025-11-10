'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { useRealtime } from '@/hooks/useRealtime';
import { PreSessionView } from '@/components/display/PreSessionView';
import { LiveVotingView } from '@/components/display/LiveVotingView';
import { ResultsView } from '@/components/display/ResultsView';
import { ThankYouView } from '@/components/display/ThankYouView';
import { RoutingView } from '@/components/display/RoutingView';
import { LiveVotingLayer1View } from '@/components/display/LiveVotingLayer1View';
import { LiveVotingLayer2View } from '@/components/display/LiveVotingLayer2View';
import { ResultsLayer1View } from '@/components/display/ResultsLayer1View';
import { ResultsLayer2View } from '@/components/display/ResultsLayer2View';
import { InsightsView } from '@/components/display/InsightsView';

function DisplayScreenContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const { session, loading } = useSession(sessionId);
  useRealtime(sessionId);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-casino-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-9xl mb-8">🎰</div>
          <p className="text-5xl text-gray-300 projector-text">Loading Session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-screen w-screen bg-casino-dark-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-7xl font-heading text-red-500 mb-8 projector-text">
            Session Not Found
          </h1>
          <p className="text-4xl text-gray-400">
            Please check the session ID
          </p>
        </div>
      </div>
    );
  }

  // Render based on session status - support both legacy and new statuses
  return (
    <div className="h-screen w-screen bg-casino-dark-bg overflow-hidden">
      {/* Pre-session */}
      {session.status === 'waiting' && <PreSessionView session={session} />}

      {/* Member Access Level */}
      {session.status === 'betting_layer1' && <LiveVotingLayer1View session={session} />}
      {session.status === 'results_layer1' && <ResultsLayer1View session={session} />}

      {/* Routing transition */}
      {session.status === 'routing' && <RoutingView session={session} />}

      {/* High Roller Level */}
      {session.status === 'betting_layer2' && <LiveVotingLayer2View session={session} />}
      {session.status === 'results_layer2' && <ResultsLayer2View session={session} />}

      {/* Insights */}
      {session.status === 'insights' && <InsightsView session={session} />}

      {/* Legacy statuses for backward compatibility */}
      {session.status === 'betting' && <LiveVotingView session={session} />}
      {session.status === 'results' && <ResultsView session={session} />}

      {/* End */}
      {session.status === 'closed' && <ThankYouView session={session} />}
    </div>
  );
}

export default function DisplayScreen() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen bg-casino-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-9xl mb-8">🎰</div>
          <p className="text-5xl text-gray-300 projector-text">Loading...</p>
        </div>
      </div>
    }>
      <DisplayScreenContent />
    </Suspense>
  );
}

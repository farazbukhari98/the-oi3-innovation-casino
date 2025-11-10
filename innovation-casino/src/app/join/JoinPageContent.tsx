'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { motion } from 'framer-motion';
import { CasinoEnvironment } from '@/components/casino/CasinoEnvironment';
import { SESSION_DISPLAY_NAME } from '@/lib/constants';

export default function JoinPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const { session, loading, error } = useSession(sessionId);

  if (loading) {
    return (
      <CasinoEnvironment>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin text-6xl mb-4">🎰</div>
            <p className="text-xl text-gray-300">Loading session...</p>
          </div>
        </div>
      </CasinoEnvironment>
    );
  }

  const handleRetry = () => {
    console.log('[JoinPageContent] User triggered retry');
    window.location.reload();
  };

  if (error || !session) {
    return (
      <CasinoEnvironment>
        <div className="min-h-screen flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="casino-card max-w-md text-center space-y-6"
          >
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-3xl font-heading text-red-500">
              {error ? 'Connection Error' : 'Session Not Found'}
            </h1>
            <div className="space-y-3">
              <p className="text-gray-300">
                {error || "The session you're trying to join doesn't exist or has ended."}
              </p>
              {sessionId && (
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left">
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Session ID</p>
                  <p className="text-sm font-mono text-casino-gold break-all mt-1">{sessionId}</p>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <motion.button
                onClick={handleRetry}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-casino w-full"
              >
                🔄 Retry Connection
              </motion.button>
              <p className="text-xs text-gray-400">
                If the problem persists, ask the facilitator for a new QR code.
              </p>
            </div>
          </motion.div>
        </div>
      </CasinoEnvironment>
    );
  }

  const handleJoin = () => {
    if (!sessionId) {
      alert('Session ID missing. Please scan the QR code again.');
      return;
    }
    router.push(`/register?session=${sessionId}`);
  };

  return (
    <CasinoEnvironment>
      <div className="min-h-screen flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl w-full space-y-8"
        >
          <div className="text-center space-y-3">
            <p className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 border border-white/10 text-xs uppercase tracking-[0.35em] text-gray-300">
              🔔 Welcome to the Table
            </p>
            <h1 className="text-4xl md:text-5xl font-heading text-gold-gradient">
              {SESSION_DISPLAY_NAME}
            </h1>
          </div>

          <div className="casino-card space-y-6">
            <div className="flex flex-col gap-3 text-center">
              <div className="flex justify-center gap-3 text-3xl">
                <span>🎲</span>
                <span>💡</span>
                <span>💰</span>
              </div>
              <h2 className="text-2xl font-heading text-white">
                {SESSION_DISPLAY_NAME}
              </h2>
              <p className="text-gray-300 text-sm">
                Welcome to the COST Leadership Forum Member Access lounge—your facilitator will open the tables shortly.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-left">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Session ID</p>
                <p className="text-lg font-mono text-casino-gold break-all">{sessionId}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-left">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Players Joined</p>
                <p className="text-lg font-semibold text-white">
                  {session.metadata.totalParticipants} and climbing
                </p>
              </div>
            </div>

            <motion.button
              onClick={handleJoin}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-casino w-full text-lg py-4"
            >
              Place Your Buy-In
            </motion.button>

            <div className="text-xs text-gray-400 text-center space-y-1">
              <p>Have the main display in view—chips will fly fast.</p>
              <p>Need help? Ask the facilitator for a fresh QR code.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </CasinoEnvironment>
  );
}

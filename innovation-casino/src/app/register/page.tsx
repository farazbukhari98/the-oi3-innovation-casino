'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { RegistrationForm } from '@/components/forms/RegistrationForm';
import { motion } from 'framer-motion';
import { CasinoEnvironment } from '@/components/casino/CasinoEnvironment';
import { Session } from '@/types/session';
import { getErrorMessage } from '@/lib/utils';

function RegisterPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!sessionId) {
      queueMicrotask(() => {
        if (cancelled) return;
        setLoading(false);
        setError('Missing session ID');
        setSessionData(null);
      });

      return () => {
        cancelled = true;
      };
    }

    queueMicrotask(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
    });

    fetch(`/api/session/${sessionId}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!cancelled) {
          if (response.ok && payload.session) {
            setSessionData(payload.session as Session);
            setError(null);
          } else {
            setSessionData(null);
            setError(payload.error || 'Session not found');
          }
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setSessionData(null);
          setError(getErrorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (loading) {
    return (
      <CasinoEnvironment>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin text-6xl mb-4">🎰</div>
            <p className="text-xl text-gray-300">Loading...</p>
          </div>
        </div>
      </CasinoEnvironment>
    );
  }

  if (!sessionId || error || !sessionData) {
    return (
      <CasinoEnvironment>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="casino-card max-w-md text-center space-y-4">
            <div className="text-5xl">⚠️</div>
            <h1 className="text-3xl font-heading text-red-500">Unable to load session</h1>
            <p className="text-gray-300">
              {error
                ? error
                : 'We couldn’t find that table. Double-check your link or grab a fresh QR code.'}
            </p>
          </div>
        </div>
      </CasinoEnvironment>
    );
  }

  const primaryScenario =
    sessionData.scenarios[sessionData.scenarioOrder[0]] ?? {
      title: 'Innovation Scenario',
      description: '',
    };

  return (
    <CasinoEnvironment>
      <div className="min-h-screen flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-xl w-full space-y-8"
        >
          <div className="text-center space-y-2">
            <p className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 border border-white/10 text-xs uppercase tracking-[0.35em] text-gray-300">
              🎟️ Player Registration
            </p>
            <h1 className="text-4xl md:text-5xl font-heading text-gold-gradient">
              Claim your casino chip identity
            </h1>
            <p className="text-gray-400 text-sm max-w-lg mx-auto">
              We&apos;ll keep your responses anonymous—your name just helps the facilitator see who&apos;s joined.
            </p>
          </div>

          <div className="casino-card space-y-6">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-left flex items-center gap-3">
              <span className="text-3xl">🎲</span>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Session In Play</p>
                <p className="text-sm text-gray-300">
                  {primaryScenario.title || 'Innovation Scenario'}
                </p>
              </div>
            </div>
            <RegistrationForm sessionId={sessionId} />
          </div>
        </motion.div>
      </div>
    </CasinoEnvironment>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <CasinoEnvironment>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin text-6xl mb-4">🎰</div>
            <p className="text-xl text-gray-300">Loading...</p>
          </div>
        </div>
      </CasinoEnvironment>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}

'use client';

export const dynamic = 'force-dynamic';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { useRealtime } from '@/hooks/useRealtime';
import { SessionInfo } from '@/components/control/SessionInfo';
import { SessionControls } from '@/components/control/SessionControls';
import { QRCodeDisplay } from '@/components/control/QRCodeDisplay';
import { ParticipantList } from '@/components/control/ParticipantList';
import { ExportButton } from '@/components/control/ExportButton';
import { CasinoEnvironment } from '@/components/casino/CasinoEnvironment';
import { SessionStatus } from '@/types/session';
import { motion } from 'framer-motion';
import { getErrorMessage } from '@/lib/utils';
import {
  DEFAULT_LAYER_DURATIONS,
  DEFAULT_CHIPS_PER_TYPE,
  PAIN_POINT_DEFINITIONS,
} from '@/lib/constants';
import { ParticipantInsights } from '@/components/control/ParticipantInsights';
import { FacilitatorInsights } from '@/components/control/FacilitatorInsights';

const DEFAULT_CONFIG = {
  chipsPerType: DEFAULT_CHIPS_PER_TYPE,
  layer1Minutes: Math.round(DEFAULT_LAYER_DURATIONS.layer1 / 60),
  layer2Minutes: Math.round(DEFAULT_LAYER_DURATIONS.layer2 / 60),
  requireDepartment: true,
  allowRevotes: false,
};

function ControlPanelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get('session');

  const [sessionId, setSessionId] = useState<string | null>(sessionIdParam);
  const [creating, setCreating] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [creationError, setCreationError] = useState<string | null>(null);

  const { session, loading } = useSession(sessionId);
  const { socket } = useRealtime(sessionId);

  const handleConfigChange = (field: keyof typeof config, value: number | boolean) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateSession = async () => {
    setCreationError(null);
    setCreating(true);

    try {
      const response = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilitatorId: 'facilitator@company.com',
          settings: {
            chipsPerType: Math.max(1, config.chipsPerType),
            layerDurations: {
              layer1: Math.max(60, config.layer1Minutes * 60),
              layer2: Math.max(60, config.layer2Minutes * 60),
            },
            requireDepartment: config.requireDepartment,
            allowRevotes: config.allowRevotes,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create session');
      }

      setSessionId(data.sessionId);
      router.push(`/control?session=${data.sessionId}`);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      setCreationError(message);
      alert(message);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (status: SessionStatus) => {
    if (!sessionId || !session) return;

    try {
      const response = await fetch('/api/session/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update session');
      }

      if (socket) {
        socket.emit('session_updated', {
          sessionId,
          status,
        });
      }
    } catch (error: unknown) {
      alert(getErrorMessage(error));
    }
  };

  if (!sessionId) {
    return (
      <CasinoEnvironment>
        <div className="min-h-screen flex items-center justify-center px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl w-full space-y-10"
          >
            <div className="space-y-3 text-center">
              <p className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 border border-white/10 text-xs uppercase tracking-[0.35em] text-gray-300">
                🎛️ Facilitator Mode
              </p>
              <h1 className="text-4xl md:text-5xl font-heading text-gold-gradient">
                Spin up a new Innovation Casino
              </h1>
              <p className="text-gray-300 text-sm md:text-base">
                Configure chip inventory and timers, then drop players straight into the casino.
              </p>
            </div>

            <div className="casino-card space-y-6 text-left">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs uppercase tracking-[0.28em] text-gray-400 mb-2">
                    Chips per Type
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={config.chipsPerType}
                    onChange={(event) => handleConfigChange('chipsPerType', Number(event.target.value))}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-casino-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.28em] text-gray-400 mb-2">
                    Layer 1 Timer (minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={config.layer1Minutes}
                    onChange={(event) => handleConfigChange('layer1Minutes', Number(event.target.value))}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-casino-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.28em] text-gray-400 mb-2">
                    Layer 2 Timer (minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={config.layer2Minutes}
                    onChange={(event) => handleConfigChange('layer2Minutes', Number(event.target.value))}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-casino-gold focus:outline-none"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-xs uppercase tracking-[0.28em] text-gray-400 mb-2">
                    Preferences
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-200">
                    <input
                      type="checkbox"
                      checked={config.requireDepartment}
                      onChange={(event) => handleConfigChange('requireDepartment', event.target.checked)}
                    />
                    Require department on registration
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-200">
                    <input
                      type="checkbox"
                      checked={config.allowRevotes}
                      onChange={(event) => handleConfigChange('allowRevotes', event.target.checked)}
                    />
                    Allow participants to re-submit allocations
                  </label>
                </div>
              </div>

              {creationError && (
                <p className="text-sm text-red-400">{creationError}</p>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleCreateSession}
                  disabled={creating}
                  className="btn-casino text-lg py-4 w-full"
                >
                  {creating ? 'Creating...' : 'Deal This Session'}
                </button>
                <p className="text-xs text-gray-400 text-center">
                  Timers reset automatically for each layer. Pain point scenarios are pre-loaded below.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-heading text-white text-center">Pain Point Lineup</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {PAIN_POINT_DEFINITIONS.map((definition, index) => (
                  <div key={definition.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-2">
                    <div className="text-xs uppercase tracking-[0.28em] text-gray-400">
                      Scenario {index + 1}
                    </div>
                    <h3 className="text-lg font-heading text-white">{definition.title}</h3>
                    <p className="text-sm text-gray-300">{definition.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </CasinoEnvironment>
    );
  }

  if (loading) {
    return (
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
            <h2 className="text-2xl font-heading text-white">
              Retrieving your session...
            </h2>
            <p className="text-sm text-gray-400">
              Fetching chip counts, participants, and projector settings.
            </p>
          </motion.div>
        </div>
      </CasinoEnvironment>
    );
  }

  if (!session) {
    return (
      <CasinoEnvironment>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="casino-card max-w-md space-y-4 text-center">
            <div className="text-5xl">🔍</div>
            <h1 className="text-3xl font-heading text-red-500">Session not found</h1>
            <p className="text-gray-300">
              That table&apos;s gone cold. Start a fresh session to reopen the casino floor.
            </p>
            <button
              onClick={() => setSessionId(null)}
              className="btn-casino w-full text-lg py-3"
            >
              Create New Session
            </button>
          </div>
        </div>
      </CasinoEnvironment>
    );
  }

  const scenarioCards = session.scenarioOrder.map((scenarioId, index) => ({
    ...session.scenarios[scenarioId],
    id: scenarioId,
    index: index + 1,
  }));

  return (
    <CasinoEnvironment>
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="space-y-3">
              <p className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 border border-white/10 text-xs uppercase tracking-[0.35em] text-gray-300">
                🎛️ Control Hub
              </p>
              <h1 className="text-4xl md:text-5xl font-heading text-gold-gradient">
                Facilitator Console
              </h1>
              <p className="text-gray-300 max-w-3xl">
                Open the floor, watch the live chip stacks grow, then cue up the final results. Everything you do here updates the main display instantly.
              </p>
            </div>

            {scenarioCards.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {scenarioCards.map((scenario) => (
                  <div
                    key={scenario.id}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-gray-400">
                      <span>Scenario {scenario.index}</span>
                      <span>
                        {session.status === 'betting' || session.status === 'betting_layer1'
                          ? 'Live'
                          : 'Ready'}
                      </span>
                    </div>
                    <h2 className="text-lg font-heading text-white">
                      {scenario.title}
                    </h2>
                    <p className="text-sm text-gray-300">
                      {scenario.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <SessionInfo session={session} />
              <QRCodeDisplay sessionId={session.id} />
            </div>

            <div className="lg:col-span-1">
              <div className="casino-card">
                <SessionControls session={session} onUpdateStatus={handleUpdateStatus} />
              </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <ParticipantList sessionId={session.id} />
              <ParticipantInsights sessionId={session.id} />
              <FacilitatorInsights session={session} />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="casino-card space-y-4">
              <h3 className="text-lg font-heading text-white">Session Toolkit</h3>
              <p className="text-sm text-gray-400">
                Download every allocation and scenario breakdown once the session wraps.
              </p>
              <ExportButton sessionId={session.id} />
            </div>

            <div className="casino-card space-y-4">
              <h3 className="text-lg font-heading text-white">Main Display</h3>
              <p className="text-sm text-gray-400">
                Launch the projection-friendly display in a new window or on your presentation machine.
              </p>
              <a
                href={`/display?session=${session.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center btn-casino text-lg px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600"
              >
                📺 Open Main Display Screen
              </a>
              <p className="text-xs text-gray-500">
                Tip: keep this tab open so you can jump back for quick status changes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </CasinoEnvironment>
  );
}

export default function ControlPanel() {
  return (
    <Suspense fallback={
      <CasinoEnvironment>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin text-6xl mb-4">🎰</div>
            <p className="text-xl text-gray-300">Loading control panel...</p>
          </div>
        </div>
      </CasinoEnvironment>
    }>
      <ControlPanelContent />
    </Suspense>
  );
}

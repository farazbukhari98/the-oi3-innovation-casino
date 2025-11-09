'use client';

import { Session } from '@/types/session';

interface SessionInfoProps {
  session: Session;
}

const STATUS_MAP: Record<string, { label: string; className: string; icon: string }> = {
  waiting: { label: 'Waiting to Start', className: 'from-gray-500/70 to-slate-700/70', icon: '🕒' },
  betting: { label: 'Betting Live', className: 'from-emerald-500/70 to-emerald-700/70', icon: '🎲' },
  betting_layer1: { label: 'Layer 1 Voting', className: 'from-emerald-500/70 to-emerald-700/70', icon: '🎲' },
  results_layer1: { label: 'Layer 1 Results', className: 'from-cyan-500/70 to-blue-600/70', icon: '📊' },
  routing: { label: 'Routing Participants', className: 'from-purple-500/70 to-indigo-700/70', icon: '🧭' },
  betting_layer2: { label: 'Layer 2 Voting', className: 'from-pink-500/70 to-rose-700/70', icon: '🎰' },
  results_layer2: { label: 'Layer 2 Results', className: 'from-blue-500/70 to-indigo-600/70', icon: '📊' },
  insights: { label: 'Insights & Debrief', className: 'from-amber-500/70 to-orange-700/70', icon: '💡' },
  results: { label: 'Final Results', className: 'from-blue-500/70 to-indigo-600/70', icon: '📊' },
  closed: { label: 'Session Closed', className: 'from-red-500/70 to-rose-600/70', icon: '🔚' },
};

export function SessionInfo({ session }: SessionInfoProps) {
  const statusConfig = STATUS_MAP[session.status] || STATUS_MAP.waiting;
  const totalScenarios = session.scenarioOrder.length;
  const layer1Allocations = session.metadata.layer1Allocations ?? 0;
  const layer2Allocations = session.metadata.layer2Allocations ?? 0;
  const totalAllocations =
    session.metadata.totalAllocations ??
    layer1Allocations + layer2Allocations;
  const totalChips = totalAllocations * session.settings.chipsPerType * 3;

  return (
    <div className="casino-card space-y-6 overflow-hidden">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <h3 className="text-xl font-heading text-white">Session Overview</h3>
            <p className="text-sm text-gray-400">
              Track attendance, chip submissions, and where you are in the casino journey.
            </p>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${statusConfig.className} px-4 py-2 text-xs font-semibold uppercase tracking-wide`}>
            <span>{statusConfig.icon}</span>
            <span>{statusConfig.label}</span>
          </span>
        </div>

        <div className="grid gap-4 text-sm">
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Session ID</p>
            <p className="mt-2 font-mono text-lg text-casino-gold break-all">{session.id}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Created</p>
            <p className="mt-2 text-sm text-gray-200">{new Date(session.createdAt).toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Scenario Count</p>
            <p className="mt-2 text-sm text-gray-200">
              {totalScenarios} active scenario{totalScenarios === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Participants</p>
          <p className="mt-2 text-2xl font-bold text-casino-gold">
            {session.metadata.totalParticipants}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Allocations Submitted</p>
          <p className="mt-2 text-2xl font-bold text-green-400">
            {totalAllocations}
          </p>
          <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">
            L1: {layer1Allocations} · L2: {layer2Allocations}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Total Chips in Play</p>
          <p className="mt-2 text-2xl font-bold text-blue-400">
            {totalChips}
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-2">Scenario Lineup</p>
        <div className="space-y-2">
          {session.scenarioOrder.map((scenarioId, index) => {
            const scenario = session.scenarios[scenarioId];
            return (
              <div
                key={scenarioId}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-gray-400">
                  <span>Scenario {index + 1}</span>
                  <span>{scenario?.title ? 'Ready' : 'Pending'}</span>
                </div>
                <p className="text-sm font-semibold text-white">{scenario?.title ?? 'Untitled Scenario'}</p>
                <p className="text-xs text-gray-400 line-clamp-2">
                  {scenario?.description ?? 'Waiting for description'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

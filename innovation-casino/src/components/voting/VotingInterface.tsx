'use client';

import { useEffect, useRef, useState } from 'react';
import { useVoting } from '@/hooks/useVoting';
import { Session } from '@/types/session';
import { ChipType } from '@/types/vote';
import { motion, AnimatePresence } from 'framer-motion';
import { SuccessAnimation } from '@/components/ui';
import { getErrorMessage } from '@/lib/utils';
import { CHIP_COLORS } from '@/lib/constants';

const CHIP_TYPES: ChipType[] = ['time', 'talent', 'trust'];

const CHIP_META: Record<ChipType, { label: string; color: string; icon: string }> = {
  time: { label: 'Time', color: 'bg-chip-red', icon: '⏰' },
  talent: { label: 'Talent', color: 'bg-chip-blue', icon: '💡' },
  trust: { label: 'Trust', color: 'bg-chip-green', icon: '🤝' },
};

interface VotingInterfaceProps {
  session: Session;
  participantId: string;
  participantName: string;
}

export function VotingInterface({
  session,
  participantId,
  participantName,
}: VotingInterfaceProps) {
  const chipsPerType = session.settings.chipsPerType ?? 10;
  const scenarioIds = session.scenarioOrder;
  const scenarioCards = scenarioIds
    .map((scenarioId, index) => {
      const scenario = session.scenarios[scenarioId];
      return {
        id: scenarioId,
        index: index + 1,
        title: scenario?.title ?? '',
        description: scenario?.description ?? '',
      };
    })
    .filter((scenario) => Boolean(scenario.title));

  const { allocations, remaining, totalAllocated, adjustAllocation, reset, isComplete } = useVoting(
    scenarioIds,
    chipsPerType
  );

  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalRequired = chipsPerType * 3;
  const totalRemaining = remaining.time + remaining.talent + remaining.trust;

  const handleAdjust = (scenarioId: string, chip: ChipType, direction: 1 | -1) => {
    adjustAllocation(scenarioId, chip, direction);
  };

  const handleSubmit = async () => {
    if (!isComplete) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/vote/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          participantId,
          allocations,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit allocations');
      }

      reset();
      setShowConfirm(false);
      setShowSuccess(true);

      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      successTimeoutRef.current = setTimeout(() => setShowSuccess(false), 2000);
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, 'Failed to submit allocations'));
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
        successTimeoutRef.current = null;
      }
    };
  }, []);

  if (scenarioCards.length === 0) {
    return (
      <div className="casino-card text-center text-white p-6">
        <p className="text-sm text-gray-300">
          Scenario details are loading. Please refresh or check back in a moment.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-gray-400">
              Player Console
            </p>
            <h1 className="text-3xl md:text-4xl font-heading text-gold-gradient">
              Welcome, {participantName}! 🎰
            </h1>
            <p className="text-sm text-gray-400 max-w-md">
              You have {chipsPerType} Time, {chipsPerType} Talent, and {chipsPerType} Trust chips. Spread them across the scenarios below.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-right">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Chips Placed</p>
            <p className="text-2xl font-semibold text-white">
              {totalAllocated} / {totalRequired}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CHIP_TYPES.map((chip) => (
            <div key={chip} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span className="inline-flex items-center gap-2 font-semibold">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${CHIP_COLORS[chip] || 'bg-white/40'}`} />
                  {CHIP_META[chip].label}
                </span>
                <span className="text-xs uppercase tracking-[0.3em] text-gray-400">
                  {chipsPerType - remaining[chip]} / {chipsPerType}
                </span>
              </div>
              <p className="text-2xl font-bold text-white mt-2">
                {remaining[chip]}
                <span className="text-sm text-gray-400 ml-2">left</span>
              </p>
            </div>
          ))}
        </div>
      </motion.div>


      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {scenarioCards.map((scenario) => {
          const allocation = allocations[scenario.id] || { time: 0, talent: 0, trust: 0 };
          const scenarioTotal = allocation.time + allocation.talent + allocation.trust;

          return (
            <div key={scenario.id} className="casino-card space-y-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Scenario {scenario.index}</p>
                  <h3 className="text-xl font-heading text-white">{scenario.title}</h3>
                  <p className="text-sm text-gray-300">{scenario.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Chips Assigned</p>
                  <p className="text-3xl font-semibold text-white">{scenarioTotal}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {CHIP_TYPES.map((chip) => (
                  <div
                    key={`${scenario.id}-${chip}`}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                        <span className={`w-2.5 h-2.5 rounded-full ${CHIP_COLORS[chip] || 'bg-white/40'}`} />
                        {CHIP_META[chip].label}
                      </span>
                      <span className="text-sm text-gray-300">{allocation[chip]}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleAdjust(scenario.id, chip, -1)}
                        disabled={allocation[chip] <= 0}
                        className="w-10 h-10 rounded-full border border-white/10 text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        –
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdjust(scenario.id, chip, 1)}
                        disabled={remaining[chip] <= 0}
                        className="w-10 h-10 rounded-full border border-white/10 text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </motion.div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Progress</p>
            <p className="text-sm text-gray-300">
              {totalRemaining > 0
                ? `Allocate ${totalRemaining} more chip${totalRemaining === 1 ? '' : 's'} to lock in your bets.`
                : 'All chips allocated—ready to lock in!'}
            </p>
          </div>
          <div className="w-full md:w-1/3 h-2 bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-blue-500 transition-all"
              style={{ width: `${(totalAllocated / totalRequired) * 100}%` }}
            />
          </div>
        </div>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!isComplete || submitting}
          className={`w-full btn-casino text-lg py-4 ${(!isComplete || submitting) ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {isComplete ? 'Lock In Your Bets 🎰' : 'Allocate Every Chip'}
        </button>
      </div>

      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="casino-card max-w-2xl w-full space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-heading text-white">
                  Confirm Allocations
                </h2>
                <p className="text-sm text-gray-400">
                  Review your chip spread before we lock it in.
                </p>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {scenarioCards.map((scenario) => {
                  const allocation = allocations[scenario.id];
                  return (
                    <div key={scenario.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="flex items-center justify-between text-sm text-gray-300">
                        <span className="font-semibold text-white">{scenario.title}</span>
                        <span>{allocation.time + allocation.talent + allocation.trust} chips</span>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-400">
                        {CHIP_TYPES.map((chip) => (
                          <div key={chip} className="rounded-lg border border-white/10 px-2 py-1 flex flex-col">
                            <span className="uppercase tracking-[0.2em]">{CHIP_META[chip].label}</span>
                            <span className="text-white text-sm font-semibold">{allocation[chip]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-3 rounded-lg font-semibold bg-white/10 hover:bg-white/20 transition"
                  disabled={submitting}
                >
                  Adjust Allocations
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 btn-casino"
                >
                  {submitting ? 'Submitting...' : 'Lock Them In 🎰'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 text-center text-red-400"
        >
          {errorMessage}
        </motion.div>
      )}

      <SuccessAnimation
        show={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          if (successTimeoutRef.current) {
            clearTimeout(successTimeoutRef.current);
            successTimeoutRef.current = null;
          }
        }}
      />
    </div>
  );
}

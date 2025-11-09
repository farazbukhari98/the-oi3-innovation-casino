'use client';

import { Session } from '@/types/session';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Vote, ChipType } from '@/types/vote';
import { CHIP_COLORS } from '@/lib/constants';

interface LiveVotingViewProps {
  session: Session;
}

const CHIP_TYPES: ChipType[] = ['time', 'talent', 'trust'];

export function LiveVotingView({ session }: LiveVotingViewProps) {
  const [allocations, setAllocations] = useState<Record<string, { time: number; talent: number; trust: number }>>(
    () =>
      session.scenarioOrder.reduce((acc, scenarioId) => {
        acc[scenarioId] = { time: 0, talent: 0, trust: 0 };
        return acc;
      }, {} as Record<string, { time: number; talent: number; trust: number }>)
  );
  const [timeLeft, setTimeLeft] = useState(session.settings.votingDuration);

  const scenarioData = useMemo(() => {
    return session.scenarioOrder.map((scenarioId) => {
      const scenario = session.scenarios[scenarioId];
      const totals = allocations[scenarioId] || { time: 0, talent: 0, trust: 0 };
      const totalChips = totals.time + totals.talent + totals.trust;
      return {
        id: scenarioId,
        title: scenario?.title ?? 'Scenario',
        description: scenario?.description ?? '',
        totals,
        totalChips,
      };
    });
  }, [allocations, session.scenarioOrder, session.scenarios]);

  const maxChips = useMemo(
    () => Math.max(...scenarioData.map((scenario) => scenario.totalChips), 1),
    [scenarioData]
  );

  const totalChipsInPlay = useMemo(
    () => scenarioData.reduce((sum, scenario) => sum + scenario.totalChips, 0),
    [scenarioData]
  );

  useEffect(() => {
    const votesRef = ref(database, 'votes');
    const unsubscribe = onValue(votesRef, (snapshot) => {
      if (!snapshot.exists()) {
        setAllocations(
          session.scenarioOrder.reduce((acc, scenarioId) => {
            acc[scenarioId] = { time: 0, talent: 0, trust: 0 };
            return acc;
          }, {} as Record<string, { time: number; talent: number; trust: number }>)
        );
        return;
      }

      const voteRecords = snapshot.val() as Record<string, Vote>;
      const votes = Object.values(voteRecords).filter((vote) => vote.sessionId === session.id);

      const nextTotals = session.scenarioOrder.reduce((acc, scenarioId) => {
        acc[scenarioId] = { time: 0, talent: 0, trust: 0 };
        return acc;
      }, {} as Record<string, { time: number; talent: number; trust: number }>);

      votes.forEach((vote) => {
        Object.entries(vote.allocations).forEach(([scenarioId, allocation]) => {
          if (!nextTotals[scenarioId]) return;
          nextTotals[scenarioId].time += allocation.time;
          nextTotals[scenarioId].talent += allocation.talent;
          nextTotals[scenarioId].trust += allocation.trust;
        });
      });

      setAllocations(nextTotals);
    });

    return () => unsubscribe();
  }, [session.id, session.scenarioOrder]);

  // Reset timer when scenario or phase changes
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setTimeLeft(session.settings.votingDuration);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [session.settings.votingDuration, session.status]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full relative overflow-hidden flex flex-col p-16">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 left-1/3 w-[36rem] h-[36rem] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-[28rem] h-[28rem] rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-10 w-[32rem] h-[32rem] rounded-full bg-yellow-500/10 blur-3xl" />
      </div>

      <div className="text-center mb-12">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-8xl font-heading text-gold-gradient mb-6 projector-text"
        >
          LIVE INVESTMENT ROUND
        </motion.h1>
        <p className="text-3xl md:text-5xl text-gray-300 projector-text">
          Chips flying across every scenario in real time
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
        <div className="text-gray-300 text-3xl md:text-5xl">
          <span className="text-casino-gold font-bold">{totalChipsInPlay}</span> chips in play
        </div>
        <div className={`
          text-4xl md:text-6xl font-mono font-bold projector-text text-center
          ${timeLeft <= 30 ? 'text-red-500 animate-pulse' :
            timeLeft <= 60 ? 'text-yellow-500' : 'text-green-500'}
        `}>
          ⏱️ {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {scenarioData.map((scenario) => {
          const stackTotal = scenario.totalChips || 1;
          return (
            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col rounded-3xl border border-white/10 bg-white/5 px-6 py-6"
            >
              <div className="text-center space-y-2 mb-6">
                <h3 className="text-2xl font-heading text-white projector-text">{scenario.title}</h3>
                <p className="text-sm text-gray-400 projector-text line-clamp-3">{scenario.description}</p>
                <p className="text-5xl font-bold text-casino-gold projector-text">
                  {scenario.totalChips}
                </p>
                <p className="text-sm uppercase tracking-[0.3em] text-gray-400">chips</p>
              </div>

              <div className="flex-1 flex flex-col justify-end">
                <div className="relative h-64 bg-black/30 rounded-3xl overflow-hidden border border-white/10">
                  <div className="absolute inset-x-0 bottom-0 h-full bg-white/5" />
                  <div
                    className="absolute inset-x-0 bottom-0 flex flex-col"
                    style={{ height: `${(scenario.totalChips / maxChips) * 100}%` }}
                  >
                    {CHIP_TYPES.map((chip) => {
                      const chipValue = scenario.totals[chip];
                      const heightPercent = stackTotal > 0 ? (chipValue / stackTotal) * 100 : 0;
                      return (
                        <div
                          key={`${scenario.id}-${chip}`}
                          className={`${CHIP_COLORS[chip] || 'bg-white/20'} transition-all`}
                          style={{ height: `${heightPercent}%` }}
                        >
                          {heightPercent > 20 && (
                            <div className="h-full flex items-center justify-center text-xl font-bold text-white">
                              {chipValue}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2 text-center text-sm text-gray-300">
                {CHIP_TYPES.map((chip) => (
                  <div key={`${scenario.id}-stat-${chip}`} className="rounded-xl border border-white/10 bg-black/30 py-2">
                    <p className="uppercase tracking-[0.2em] text-xs text-gray-400">{chip}</p>
                    <p className="text-xl font-bold text-white">{scenario.totals[chip]}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

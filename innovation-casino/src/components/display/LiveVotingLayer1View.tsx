'use client';

import { Session } from '@/types/session';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Vote, ChipType, ChipAllocation } from '@/types/vote';
import { CHIP_COLORS, PAIN_POINT_DEFINITIONS } from '@/lib/constants';

interface LiveVotingLayer1ViewProps {
  session: Session;
}

const CHIP_TYPES: ChipType[] = ['time', 'talent', 'trust'];
type AllocationTotals = ChipAllocation;

function createInitialTotals(): Record<string, AllocationTotals> {
  return PAIN_POINT_DEFINITIONS.reduce((acc, pp) => {
    acc[pp.id] = { time: 0, talent: 0, trust: 0 };
    return acc;
  }, {} as Record<string, AllocationTotals>);
}

export function LiveVotingLayer1View({ session }: LiveVotingLayer1ViewProps) {
  const [allocations, setAllocations] = useState<Record<string, AllocationTotals>>(createInitialTotals);
  const [timeLeft, setTimeLeft] = useState(session.settings.layerDurations?.layer1 || 420);

  const painPointData = useMemo(() => {
    return PAIN_POINT_DEFINITIONS.map((pp) => {
      const totals = allocations[pp.id] || { time: 0, talent: 0, trust: 0 };
      const totalChips = totals.time + totals.talent + totals.trust;
      return {
        id: pp.id,
        title: pp.title,
        description: pp.description,
        totals,
        totalChips,
      };
    });
  }, [allocations]);

  const maxChips = useMemo(
    () => Math.max(...painPointData.map((pp) => pp.totalChips), 1),
    [painPointData]
  );

  const totalChipsInPlay = useMemo(
    () => painPointData.reduce((sum, pp) => sum + pp.totalChips, 0),
    [painPointData]
  );

  useEffect(() => {
    const votesRef = ref(database, 'votes');
    const unsubscribe = onValue(votesRef, (snapshot) => {
      const voteRecords = snapshot.val() as Record<string, Vote> | null;
      if (!voteRecords) {
        setAllocations(createInitialTotals());
        return;
      }

      const votes = Object.values(voteRecords).filter(
        (vote) => vote.sessionId === session.id && vote.layer === 'layer1'
      );

      const nextTotals = createInitialTotals();

      votes.forEach((vote) => {
        (Object.entries(vote.allocations) as Array<[string, AllocationTotals]>).forEach(([scenarioId, allocation]) => {
          if (!nextTotals[scenarioId]) return;
          nextTotals[scenarioId].time += allocation.time;
          nextTotals[scenarioId].talent += allocation.talent;
          nextTotals[scenarioId].trust += allocation.trust;
        });
      });

      setAllocations(nextTotals);
    });

    return () => unsubscribe();
  }, [session.id]);

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
    <div className="display-container flex flex-col p-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 left-1/3 w-[36rem] h-[36rem] rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-[28rem] h-[28rem] rounded-full bg-pink-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-10 w-[32rem] h-[32rem] rounded-full bg-yellow-500/10 blur-3xl" />
      </div>

      <div className="text-center mb-6">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-display-3xl font-heading text-gold-gradient mb-2 projector-text"
        >
          MEMBER ACCESS: FOCUS AREAS
        </motion.h1>
        <p className="text-display-xl text-gray-300 projector-text">
          Where should we focus our innovation efforts?
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="text-gray-300 text-display-lg">
          <span className="text-casino-gold font-bold">{totalChipsInPlay}</span> chips invested
        </div>
        <div className={`
          text-display-2xl font-mono font-bold projector-text text-center
          ${timeLeft <= 30 ? 'text-red-500 animate-pulse' :
            timeLeft <= 60 ? 'text-yellow-500' : 'text-green-500'}
        `}>
          ⏱️ {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4">
        {painPointData.map((pp, index) => {
          const stackTotal = pp.totalChips || 1;
          return (
            <motion.div
              key={pp.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="text-center space-y-1 mb-3">
                <h3 className="text-display-lg font-heading text-white projector-text">{pp.title}</h3>
                <p className="text-display-xs text-gray-400 projector-text line-clamp-2">{pp.description}</p>
                <p className="text-display-2xl font-bold text-casino-gold projector-text">
                  {pp.totalChips}
                </p>
                <p className="text-display-xs uppercase tracking-[0.3em] text-gray-400">chips</p>
              </div>

              <div className="flex-1 flex flex-col justify-end min-h-[20vh]">
                <div className="relative h-full bg-black/30 rounded-2xl overflow-hidden border border-white/10">
                  <div className="absolute inset-x-0 bottom-0 h-full bg-white/5" />
                  <div
                    className="absolute inset-x-0 bottom-0 flex flex-col"
                    style={{ height: `${(pp.totalChips / maxChips) * 100}%` }}
                  >
                    {CHIP_TYPES.map((chip) => {
                      const chipValue = pp.totals[chip];
                      const heightPercent = stackTotal > 0 ? (chipValue / stackTotal) * 100 : 0;
                      return (
                        <div
                          key={`${pp.id}-${chip}`}
                          className={`${CHIP_COLORS[chip] || 'bg-white/20'} transition-all`}
                          style={{ height: `${heightPercent}%` }}
                        >
                          {heightPercent > 20 && (
                            <div className="h-full flex items-center justify-center text-display-sm font-bold text-white">
                              {chipValue}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-1 text-center">
                {CHIP_TYPES.map((chip) => (
                  <div key={`${pp.id}-stat-${chip}`} className="rounded-lg border border-white/10 bg-black/30 py-1">
                    <p className="uppercase tracking-[0.2em] text-display-xs text-gray-400">{chip}</p>
                    <p className="text-display-sm font-bold text-white">{pp.totals[chip]}</p>
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

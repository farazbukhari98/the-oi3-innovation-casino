'use client';

import { Session } from '@/types/session';
import { SessionResults } from '@/types/results';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getErrorMessage } from '@/lib/utils';
import { ChipType } from '@/types/vote';

const CHIP_META_ORDER: { key: ChipType; label: string; color: string }[] = [
  { key: 'time', label: 'Time', color: 'bg-chip-red' },
  { key: 'talent', label: 'Talent', color: 'bg-chip-blue' },
  { key: 'trust', label: 'Trust', color: 'bg-chip-green' },
];

interface ResultsViewProps {
  session: Session;
}

export function ResultsView({ session }: ResultsViewProps) {
  const [results, setResults] = useState<SessionResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchResults = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/vote/results?sessionId=${session.id}`);
        if (!response.ok) {
          throw new Error('Failed to load results');
        }
        const data = (await response.json()) as { results?: SessionResults };
        if (isMounted) {
          setResults(data.results ?? null);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to fetch results:', getErrorMessage(error));
          setResults(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchResults();

    return () => {
      isMounted = false;
    };
  }, [session.id]);

  if (loading || !results) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-6xl animate-spin">🎰</div>
      </div>
    );
  }

  const layer1Results = results.layer1;
  const summary = results.summary;
  const layer2Highlights = Object.entries(results.layer2).map(([painPointId, layer2Result]) => {
    const matchingScenario = session.scenarios[painPointId];
    return {
      id: painPointId,
      title: matchingScenario?.title ?? 'Pain Point',
      allocations: layer2Result.totalAllocations,
      chips: layer2Result.totalChips,
    };
  });

  return (
    <div className="h-full relative overflow-hidden flex flex-col p-8 md:p-16">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-28 left-16 w-[30rem] h-[30rem] rounded-full bg-purple-500/12 blur-3xl" />
        <div className="absolute top-1/3 right-0 w-[34rem] h-[34rem] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-[-6rem] left-1/3 w-[32rem] h-[32rem] rounded-full bg-yellow-500/10 blur-3xl" />
      </div>

      <div className="text-center mb-12">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-8xl font-heading text-gold-gradient mb-6 projector-text"
        >
          FINAL INVESTMENT REVEAL
        </motion.h1>
        <p className="text-2xl md:text-5xl text-gray-300 projector-text">
          Where the room ultimately placed its Time, Talent, and Trust
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {layer1Results.scenarios.map((scenario, index) => {
          return (
            <motion.div
              key={scenario.scenarioId}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4"
            >
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Scenario {index + 1}</p>
                <h3 className="text-3xl font-heading text-white projector-text">{scenario.title}</h3>
                <p className="text-sm text-gray-300 projector-text">{scenario.description}</p>
              </div>
              <div className="text-center space-y-2">
                <p className="text-5xl font-bold text-casino-gold projector-text">{scenario.totals.totalChips}</p>
                <p className="uppercase tracking-[0.3em] text-gray-400">chips</p>
              </div>

              <div className="h-56 bg-black/30 rounded-2xl overflow-hidden border border-white/10 flex flex-col">
                {CHIP_META_ORDER.map((chip) => (
                  <div
                    key={`${scenario.scenarioId}-${chip.key}`}
                    className={`${chip.color} flex items-center justify-between px-4 py-2`}
                    style={{ flexGrow: scenario.totals[chip.key] || 0 }}
                  >
                    <span className="text-lg font-semibold text-white">{chip.label}</span>
                    <span className="text-2xl font-bold text-white">{scenario.totals[chip.key]}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                {CHIP_META_ORDER.map((chip) => (
                  <div key={`${scenario.scenarioId}-percent-${chip.key}`} className="rounded-xl border border-white/10 bg-black/30 py-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">{chip.label}</p>
                    <p className="text-xl font-bold text-white">
                      {scenario.percentages[chip.key] ?? 0}%
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="mt-10 text-center space-y-3"
      >
        <p className="text-2xl md:text-5xl text-gray-300">
          Member Access Allocations:{' '}
          <span className="text-casino-gold font-bold">{summary.layer1Allocations}</span>
        </p>
        <p className="text-xl md:text-4xl text-gray-300">
          Member Access Chips Invested:{' '}
          <span className="text-casino-gold font-bold">{layer1Results.totalChips}</span>
        </p>
        {layer2Highlights.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            {layer2Highlights.map((highlight) => (
              <div
                key={highlight.id}
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">High Roller Group</p>
                <p className="text-xl font-semibold text-white">{highlight.title}</p>
                <p className="text-gray-300 text-sm">
                  {highlight.allocations} allocations · {highlight.chips} chips
                </p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

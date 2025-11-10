'use client';

import { Session } from '@/types/session';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LayerResults } from '@/types/results';
import { PAIN_POINT_DEFINITIONS, CHIP_COLORS } from '@/lib/constants';
import { ChipType } from '@/types/vote';
import { getErrorMessage } from '@/lib/utils';
import { CacheManager, throttle } from '@/lib/performance';

const CHIP_TYPES: ChipType[] = ['time', 'talent', 'trust'];

interface PainPointLayerResults {
  painPointId: string;
  title: string;
  description: string;
  results: LayerResults | null;
}

export function ResultsLayer2View({ session }: { session: Session }) {
  const [layer2Results, setLayer2Results] = useState<Record<string, LayerResults>>({});
  const [loading, setLoading] = useState(true);

  // Cache results for 5 seconds to avoid redundant API calls
  const resultsCache = useMemo(() => new CacheManager<Record<string, LayerResults>>(5), []); // 5 second TTL

  // Throttled fetch function to prevent rapid repeated API calls
  // Important when multiple high roller tables finish voting simultaneously
  const fetchResults = useCallback(
    throttle(async () => {
      try {
        // Check cache first
        const cached = resultsCache.get('layer2');
        if (cached) {
          setLayer2Results(cached);
          setLoading(false);
          return;
        }

        setLoading(true);
        const response = await fetch(`/api/vote/results?sessionId=${session.id}&layer=layer2&refresh=true`);
        if (!response.ok) {
          throw new Error('Failed to load layer 2 results');
        }
        const data = (await response.json()) as { results: Record<string, LayerResults> | null };
        const results = data.results ?? {};

        // Cache the results
        resultsCache.set('layer2', results);
        setLayer2Results(results);
      } catch (error) {
        console.error('Failed to fetch layer 2 results:', getErrorMessage(error));
        setLayer2Results({});
      } finally {
        setLoading(false);
      }
    }, 2000), // Throttle to max once every 2 seconds
    [session.id, resultsCache]
  );

  useEffect(() => {
    fetchResults();

    // Set up polling interval for results updates
    // Poll less frequently to reduce server load with multiple tables
    const pollInterval = setInterval(fetchResults, 10000); // Poll every 10 seconds

    return () => {
      clearInterval(pollInterval);
    };
  }, [fetchResults, session.metadata.layer2Allocations]);

  const painPointResults = useMemo<PainPointLayerResults[]>(() => {
    return PAIN_POINT_DEFINITIONS.map((painPoint) => ({
      painPointId: painPoint.id,
      title: painPoint.title,
      description: painPoint.description,
      results: layer2Results[painPoint.id] ?? null,
    })).sort((a, b) => {
      const chipsA = a.results?.totalChips ?? 0;
      const chipsB = b.results?.totalChips ?? 0;
      return chipsB - chipsA;
    });
  }, [layer2Results]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-6xl animate-spin">🎰</div>
      </div>
    );
  }

  const primaryGroup = painPointResults[0];
  const secondaryGroups = painPointResults.slice(1);

  return (
    <div className="h-full flex flex-col gap-8 p-6 md:p-16 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[32rem] h-[32rem] bg-indigo-700/20 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[40rem] h-[40rem] bg-emerald-600/15 blur-3xl rounded-full" />
      </div>

      <div className="text-center space-y-2">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-8xl font-heading text-gold-gradient projector-text"
        >
          HIGH ROLLER RESULTS
        </motion.h1>
        <p className="text-2xl md:text-4xl text-gray-300 projector-text">
          Solution bets by casino table
        </p>
      </div>

      {!primaryGroup && (
        <p className="text-center text-gray-300 text-2xl">
          High Roller voting results will appear here once participants lock in their solutions.
        </p>
      )}

      {primaryGroup && (
        <div className="relative z-10 grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-2 rounded-3xl border border-casino-gold/40 bg-gradient-to-br from-casino-gold/15 to-yellow-600/10 p-6 space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-200">Largest table</p>
                <h2 className="text-3xl font-heading text-white projector-text">{primaryGroup.title}</h2>
                <p className="text-sm text-gray-100/70 projector-text">{primaryGroup.description}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-200">Total Chips</p>
                <p className="text-5xl font-bold text-white">{primaryGroup.results?.totalChips ?? 0}</p>
                <p className="text-xs text-white/70">{primaryGroup.results?.totalAllocations ?? 0} submissions</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {primaryGroup.results?.scenarios.map((solution) => {
                const stackTotal = solution.totals.totalChips || 1;
                return (
                  <div key={solution.scenarioId} className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Solution</p>
                      <h3 className="text-xl font-heading text-white line-clamp-1">{solution.title}</h3>
                      {solution.innovationLabel && (
                        <p className="text-[11px] uppercase tracking-[0.3em] text-casino-gold">
                          {solution.innovationLabel}
                        </p>
                      )}
                      <p className="text-sm text-white/60 line-clamp-2">{solution.description}</p>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <p className="text-3xl font-bold text-casino-gold">{solution.totals.totalChips}</p>
                      <span className="text-xs uppercase tracking-[0.3em] text-gray-400">chips</span>
                    </div>
                    <div className="h-24 bg-black/40 rounded-2xl overflow-hidden border border-white/10 flex">
                      {CHIP_TYPES.map((chip) => {
                        const chipValue = solution.totals[chip];
                        const percent = solution.totals.totalChips > 0 ? (chipValue / stackTotal) * 100 : 0;
                        return (
                          <div
                            key={`${solution.scenarioId}-${chip}`}
                            className={`${CHIP_COLORS[chip]} flex items-center justify-center text-sm font-bold text-white`}
                            style={{ width: `${percent}%` }}
                          >
                            {percent >= 20 ? chipValue : ''}
                          </div>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-300">
                      {CHIP_TYPES.map((chip) => (
                        <div key={`${solution.scenarioId}-stat-${chip}`} className="rounded-lg border border-white/10 bg-black/40 py-2">
                          <p className="uppercase tracking-[0.2em] text-gray-500">{chip}</p>
                          <p className="text-lg font-bold text-white">{solution.totals[chip]}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-4"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Other tables</p>
            <div className="space-y-3 max-h-[520px] overflow-auto pr-2">
              {secondaryGroups.map((group, index) => (
                <div key={group.painPointId} className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Table {index + 2}</span>
                    <span>{group.results?.totalAllocations ?? 0} bettors</span>
                  </div>
                  <p className="text-lg font-heading text-white line-clamp-1">{group.title}</p>
                  <p className="text-sm text-gray-400 line-clamp-2">{group.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-200">
                    <span>Total chips</span>
                    <span className="text-xl font-bold text-casino-gold">{group.results?.totalChips ?? 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

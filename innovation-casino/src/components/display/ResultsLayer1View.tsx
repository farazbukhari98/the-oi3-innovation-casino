'use client';

import { Session } from '@/types/session';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getErrorMessage } from '@/lib/utils';
import { PAIN_POINT_DEFINITIONS } from '@/lib/constants';
import { ChipType } from '@/types/vote';
import { LayerResults, ScenarioResults } from '@/types/results';
import { CacheManager, throttle } from '@/lib/performance';

const CHIP_META: { key: ChipType; label: string; color: string }[] = [
  { key: 'time', label: 'Time', color: 'bg-chip-red' },
  { key: 'talent', label: 'Talent', color: 'bg-chip-blue' },
  { key: 'trust', label: 'Trust', color: 'bg-chip-green' },
];

export function ResultsLayer1View({ session }: { session: Session }) {
  const [layerResults, setLayerResults] = useState<LayerResults | null>(null);
  const [loading, setLoading] = useState(true);

  // Cache results for 5 seconds to avoid redundant API calls
  const resultsCache = useMemo(() => new CacheManager<LayerResults>(5), []); // 5 second TTL

  const orderedPainPoints = useMemo(() => {
    if (!layerResults) return [];
    const scenarioMap = new Map(layerResults.scenarios.map((scenario) => [scenario.scenarioId, scenario]));
    return PAIN_POINT_DEFINITIONS.map((definition) => {
      const scenario = scenarioMap.get(definition.id);
      return {
        definition,
        scenario: scenario ?? ({
          scenarioId: definition.id,
          title: definition.title,
          description: definition.description,
          totals: { time: 0, talent: 0, trust: 0, totalChips: 0 },
          percentages: { time: 0, talent: 0, trust: 0 },
        } as ScenarioResults),
      };
    }).sort((a, b) => (b.scenario.totals.totalChips ?? 0) - (a.scenario.totals.totalChips ?? 0));
  }, [layerResults]);

  // Throttled fetch function to prevent rapid repeated API calls
  // This is important when 100+ participants complete voting around the same time
  const fetchResults = useCallback(
    throttle(async () => {
      try {
        // Check cache first
        const cached = resultsCache.get('layer1');
        if (cached) {
          setLayerResults(cached);
          setLoading(false);
          return;
        }

        setLoading(true);
        const response = await fetch(`/api/vote/results?sessionId=${session.id}&layer=layer1&refresh=true`);
        if (!response.ok) throw new Error('Failed to load results');

        const data = (await response.json()) as { results: LayerResults | null };
        const results = data.results ?? null;

        if (results) {
          // Cache the results
          resultsCache.set('layer1', results);
          setLayerResults(results);
        } else {
          setLayerResults(null);
        }
      } catch (error) {
        console.error('Failed to fetch results:', getErrorMessage(error));
        setLayerResults(null);
      } finally {
        setLoading(false);
      }
    }, 2000), // Throttle to max once every 2 seconds
    [session.id, resultsCache]
  );

  useEffect(() => {
    fetchResults();

    // Set up polling interval for results updates
    // Poll less frequently to reduce server load
    const pollInterval = setInterval(fetchResults, 10000); // Poll every 10 seconds

    return () => {
      clearInterval(pollInterval);
    };
  }, [fetchResults, session.metadata.layer1Allocations]);

  if (loading || !layerResults) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-6xl animate-spin">🎰</div>
      </div>
    );
  }

  return (
    <div className="display-container flex flex-col p-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-28 left-16 w-[30rem] h-[30rem] rounded-full bg-purple-500/12 blur-3xl" />
        <div className="absolute top-1/3 right-0 w-[34rem] h-[34rem] rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="text-center mb-6">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-display-3xl font-heading text-gold-gradient mb-2 projector-text"
        >
          MEMBER ACCESS PRIORITIES
        </motion.h1>
        <p className="text-display-xl text-gray-300 projector-text">
          Where the organization wants to focus innovation
        </p>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4">
        {orderedPainPoints.map(({ definition, scenario }, index) => (
          <motion.div
            key={definition.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15 }}
            className={`rounded-2xl border ${
              index === 0 ? 'border-casino-gold/50 bg-gradient-to-br from-casino-gold/10 to-yellow-600/5' : 'border-white/10 bg-white/5'
            } p-4 space-y-2`}
          >
            {index === 0 && (
              <div className="text-display-xs uppercase tracking-wider text-casino-gold font-bold">
                🏆 TOP PRIORITY
              </div>
            )}

            <div className="space-y-1">
              <h3 className="text-display-lg font-heading text-white projector-text">{definition.title}</h3>
              <p className="text-display-xs text-gray-300 projector-text">
                {definition.description}
              </p>
            </div>

            <div className="text-center space-y-1">
              <p className="text-display-2xl font-bold text-casino-gold projector-text">
                {scenario.totals.totalChips}
              </p>
              <p className="text-display-xs uppercase tracking-[0.3em] text-gray-400">total chips</p>
            </div>

            <div className="h-[15vh] bg-black/30 rounded-xl overflow-hidden border border-white/10 flex flex-col">
              {CHIP_META.map((chip) => (
                <div
                  key={`${definition.id}-${chip.key}`}
                  className={`${chip.color} flex items-center justify-between px-4 py-2`}
                  style={{ flexGrow: scenario.totals[chip.key] || 0 }}
                >
                  {scenario.totals[chip.key] > 0 && (
                    <>
                      <span className="text-display-xs font-semibold text-white">{chip.label}</span>
                      <span className="text-display-sm font-bold text-white">{scenario.totals[chip.key]}</span>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-1 text-center">
              {CHIP_META.map((chip) => (
                <div key={`${definition.id}-percent-${chip.key}`} className="rounded-lg border border-white/10 bg-black/30 py-1">
                  <p className="text-display-xs uppercase tracking-[0.3em] text-gray-400">{chip.label}</p>
                  <p className="text-display-sm font-bold text-white">
                    {scenario.percentages[chip.key]}%
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="mt-4 text-center space-y-2"
      >
        <p className="text-display-lg text-gray-300">
          Total Participants:{' '}
          <span className="text-casino-gold font-bold">{layerResults.totalAllocations}</span>
        </p>
        <p className="text-display-base text-gray-300">
          Total Chips Invested:{' '}
          <span className="text-casino-gold font-bold">{layerResults.totalChips}</span>
        </p>
      </motion.div>
    </div>
  );
}

'use client';

import { Session, InnovationBoldness } from '@/types/session';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  SessionResults,
  LayerResults,
  ScenarioResults,
  DepartmentInsights,
} from '@/types/results';
import { getErrorMessage } from '@/lib/utils';
import { PAIN_POINT_DEFINITIONS, BOLDNESS_META } from '@/lib/constants';

interface InsightHighlights {
  topPainPoint?: ScenarioResults;
  topGroupId?: string;
  topGroupResults?: LayerResults;
  topSolution?: ScenarioResults;
  departments?: DepartmentInsights;
  boldnessSpread?: {
    tier: InnovationBoldness;
    label: string;
    innovationLabel: string;
    chips: number;
    percentage: number;
  }[];
}

export function InsightsView({ session }: { session: Session }) {
  const [results, setResults] = useState<SessionResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchResults = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/vote/results?sessionId=${session.id}&refresh=true`);
        if (!response.ok) throw new Error('Failed to load session insights');
        const data = (await response.json()) as { results: SessionResults | null };
        if (!cancelled) {
          setResults(data.results ?? null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch insights:', getErrorMessage(error));
          setResults(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchResults();
    return () => {
      cancelled = true;
    };
  }, [session.id]);

  const highlights = useMemo<InsightHighlights>(() => {
    if (!results) return {};

    const topPainPoint = [...(results.layer1?.scenarios ?? [])].sort(
      (a, b) => b.totals.totalChips - a.totals.totalChips
    )[0];

    const groupEntries = Object.entries(results.layer2 ?? {});
    const topGroupEntry = groupEntries.sort(
      (a, b) => (b[1]?.totalChips ?? 0) - (a[1]?.totalChips ?? 0)
    )[0];

    let topSolution: ScenarioResults | undefined;
    if (topGroupEntry && topGroupEntry[1]) {
      topSolution = [...(topGroupEntry[1].scenarios ?? [])].sort(
        (a, b) => b.totals.totalChips - a.totals.totalChips
      )[0];
    }

    const boldnessAccumulator: Partial<Record<InnovationBoldness, number>> = {};
    groupEntries.forEach(([, group]) => {
      if (!group?.boldnessTotals) return;
      Object.entries(group.boldnessTotals).forEach(([tier, totals]) => {
        if (!totals) return;
        const typedTier = tier as InnovationBoldness;
        boldnessAccumulator[typedTier] =
          (boldnessAccumulator[typedTier] || 0) + (totals.totals.totalChips ?? 0);
      });
    });
    const totalBoldnessChips = Object.values(boldnessAccumulator).reduce((sum, value = 0) => sum + value, 0);
    const boldnessSpread =
      totalBoldnessChips > 0
        ? (Object.entries(boldnessAccumulator) as [InnovationBoldness, number][])
            .map(([tier, chips]) => ({
              tier,
              label: BOLDNESS_META[tier]?.shortLabel ?? tier,
              innovationLabel: BOLDNESS_META[tier]?.innovationLabel ?? '',
              chips,
              percentage: Math.round((chips / totalBoldnessChips) * 1000) / 10,
            }))
            .sort((a, b) => b.chips - a.chips)
        : undefined;

    return {
      topPainPoint,
      topGroupId: topGroupEntry?.[0],
      topGroupResults: topGroupEntry?.[1],
      topSolution,
      departments: results.departments,
      boldnessSpread,
    };
  }, [results]);

  if (loading || !results) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-6xl animate-spin">🎰</div>
      </div>
    );
  }

  const summary = results.summary;
  const topGroupDefinition = PAIN_POINT_DEFINITIONS.find(
    (definition) => definition.id === highlights.topGroupId
  );

  return (
    <div className="h-full flex items-center justify-center p-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-6xl space-y-8"
      >
        <div>
          <h1 className="text-6xl font-heading text-gold-gradient mb-4 projector-text">
            KEY INSIGHTS
          </h1>
          <p className="text-3xl text-gray-300 projector-text">
            Combined analysis of pain points and solution bets
          </p>
        </div>

        {highlights.boldnessSpread && (
          <div className="rounded-3xl border border-white/10 bg-black/40 p-8 text-left space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-1">Boldness Mix</p>
                <p className="text-2xl font-heading text-white">High Roller appetite by tier</p>
              </div>
              <p className="text-sm text-gray-400">Share of total High Roller chips</p>
            </div>
            <div className="space-y-4">
              {highlights.boldnessSpread.map((tier) => (
                <div key={tier.tier}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-white font-semibold">{tier.label}</span>
                    <span className="text-gray-300">{tier.percentage}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-casino-gold to-amber-500"
                      style={{ width: `${tier.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mt-1">
                    {tier.innovationLabel} · {tier.chips} chips
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-2">Participants</p>
            <p className="text-5xl font-bold text-casino-gold">{summary.totalParticipants}</p>
            <p className="text-sm text-gray-400">Players contributing insights</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-2">Member Access Chips</p>
            <p className="text-5xl font-bold text-casino-gold">{summary.totalLayer1Chips}</p>
            <p className="text-sm text-gray-400">Across all pain points</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-2">High Roller Chips</p>
            <p className="text-5xl font-bold text-casino-gold">{summary.totalLayer2Chips}</p>
            <p className="text-sm text-gray-400">Invested in solutions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div className="rounded-2xl border border-casino-gold/30 bg-gradient-to-br from-casino-gold/10 to-transparent p-8 text-left space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-casino-gold">Top Pain Point</p>
            <h3 className="text-3xl font-heading text-white">
              {highlights.topPainPoint?.title ?? 'Awaiting votes'}
            </h3>
            <p className="text-sm text-gray-300">
              {highlights.topPainPoint?.description ??
                'Final Member Access results will reveal the top priority.'}
            </p>
            <p className="text-4xl font-bold text-casino-gold">
              {highlights.topPainPoint?.totals.totalChips ?? 0} chips
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-left space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Top Solution Group</p>
            <h3 className="text-3xl font-heading text-white">
              {topGroupDefinition?.title ?? 'Routing in progress'}
            </h3>
            <p className="text-sm text-gray-300">
              {topGroupDefinition?.description ??
                'High Roller routing will determine the top focus group.'}
            </p>
            <div className="text-4xl font-bold text-casino-gold">
              {highlights.topGroupResults?.totalChips ?? 0} chips
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-left space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-2">
                Most Funded Solution
              </p>
              {highlights.topSolution ? (
                <>
                  <h3 className="text-3xl font-heading text-white mb-2">
                    {highlights.topSolution.title}
                  </h3>
                  <p className="text-gray-300 mb-4">{highlights.topSolution.description}</p>
                  <p className="text-5xl font-bold text-casino-gold">
                    {highlights.topSolution.totals.totalChips} chips
                  </p>
                </>
              ) : (
                <p className="text-gray-300">High Roller results will highlight the leading solutions.</p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-2">
                Department Snapshot
              </p>
              {highlights.departments ? (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(highlights.departments.layer1)
                    .sort(([, a], [, b]) => (b?.totalChips ?? 0) - (a?.totalChips ?? 0))
                    .slice(0, 4)
                    .map(([department, stats]) => (
                      <div key={department} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-400">{department}</p>
                        <p className="text-xl font-bold text-white">
                          {stats?.totalChips ?? 0} chips
                        </p>
                        {stats?.topScenarioId && (
                          <p className="text-xs text-gray-400">
                            Favored{' '}
                            {PAIN_POINT_DEFINITIONS.find((definition) => definition.id === stats.topScenarioId)?.title ||
                              'Scenario'}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  Department-level insights will appear once Member Access completes.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-left space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">House takeaways</p>
            <ul className="text-sm text-gray-200 space-y-1 list-disc list-inside">
              {highlights.topPainPoint && (
                <li>
                  <span className="text-white font-semibold">{highlights.topPainPoint.title}</span> drew the
                  largest share of Member Access chips, signaling the organization&apos;s priority.
                </li>
              )}
              {topGroupDefinition && (
                <li>
                  <span className="text-white font-semibold">{topGroupDefinition.title}</span> brought the largest table into
                  the High Roller Level, with {highlights.topGroupResults?.totalAllocations ?? 0} bettors evaluating solutions.
                </li>
              )}
              {highlights.topSolution && (
                <li>
                  <span className="text-white font-semibold">{highlights.topSolution.title}</span> emerged as the most funded
                  solution, winning {highlights.topSolution.totals.totalChips} chips of Time/Talent/Trust.
                </li>
              )}
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

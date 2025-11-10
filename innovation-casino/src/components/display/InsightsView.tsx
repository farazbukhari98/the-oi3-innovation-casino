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
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1500; // 1.5 seconds

    const fetchResults = async () => {
      try {
        if (retryCount === 0) {
          setLoading(true);
        }

        const response = await fetch(`/api/vote/results?sessionId=${session.id}&refresh=true`);
        if (!response.ok) throw new Error('Failed to load session insights');
        const data = (await response.json()) as { results: SessionResults | null };

        if (!cancelled) {
          if (data.results && data.results.summary &&
              (data.results.summary.totalLayer1Chips > 0 || data.results.summary.totalLayer2Chips > 0)) {
            setResults(data.results);
            setLoading(false);
          } else if (retryCount < maxRetries) {
            // Retry if results are incomplete
            retryCount++;
            console.log(`Retrying insights fetch (${retryCount}/${maxRetries})...`);
            setTimeout(() => {
              if (!cancelled) {
                fetchResults();
              }
            }, retryDelay);
          } else {
            // After all retries, set whatever we have
            setResults(data.results);
            setLoading(false);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch insights:', getErrorMessage(error));
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying after error (${retryCount}/${maxRetries})...`);
            setTimeout(() => {
              if (!cancelled) {
                fetchResults();
              }
            }, retryDelay);
          } else {
            setResults(null);
            setLoading(false);
          }
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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-spin mb-4">🎰</div>
          <p className="text-2xl text-gray-300">Calculating insights...</p>
          <p className="text-lg text-gray-400 mt-2">Analyzing voting patterns and results</p>
        </div>
      </div>
    );
  }

  if (!results || !results.summary) {
    return (
      <div className="h-full flex items-center justify-center p-16">
        <div className="text-center max-w-2xl">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-4xl font-heading text-white mb-4">Insights Not Yet Available</h2>
          <p className="text-xl text-gray-300 mb-6">
            Combined insights will appear after both Member Access and High Roller betting rounds are complete.
          </p>
          <p className="text-lg text-gray-400">
            Please ensure all participants have completed their votes and that the facilitator has advanced through all betting phases.
          </p>
        </div>
      </div>
    );
  }

  const summary = results.summary || {
    totalParticipants: 0,
    totalLayer1Chips: 0,
    totalLayer2Chips: 0,
    totalChips: 0,
  };
  const topGroupDefinition = PAIN_POINT_DEFINITIONS.find(
    (definition) => definition.id === highlights.topGroupId
  );

  return (
    <div className="h-screen w-screen bg-casino-dark-bg p-8 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="h-full flex flex-col"
      >
        {/* Header - Compact */}
        <div className="text-center mb-4">
          <h1 className="text-5xl font-heading text-gold-gradient projector-text">
            KEY INSIGHTS
          </h1>
          <p className="text-xl text-gray-300 projector-text">
            Combined analysis of pain points and solution bets
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 grid grid-cols-2 gap-6">
          {/* Left Column - Boldness Chart (Prominent) */}
          <div className="flex flex-col space-y-4">
            {highlights.boldnessSpread && (
              <div className="flex-1 rounded-3xl border border-white/20 bg-gradient-to-br from-black/60 to-black/40 p-6">
                <div className="mb-4">
                  <p className="text-sm uppercase tracking-[0.3em] text-gray-400 mb-1">BOLDNESS MIX</p>
                  <p className="text-3xl font-heading text-white">High Roller appetite by tier</p>
                  <p className="text-base text-gray-400 mt-1">Share of total High Roller chips</p>
                </div>
                <div className="space-y-6">
                  {highlights.boldnessSpread.map((tier) => (
                    <div key={tier.tier}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xl font-bold text-white">{tier.label}</span>
                        <span className="text-2xl font-bold text-casino-gold">{tier.percentage}%</span>
                      </div>
                      <div className="h-8 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-casino-gold to-amber-500 transition-all duration-500"
                          style={{ width: `${tier.percentage}%` }}
                        />
                      </div>
                      <p className="text-sm uppercase tracking-[0.2em] text-gray-400 mt-2">
                        {tier.innovationLabel} · {tier.chips} CHIPS
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Participants</p>
                <p className="text-3xl font-bold text-casino-gold">{summary.totalParticipants}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Member Chips</p>
                <p className="text-3xl font-bold text-casino-gold">{summary.totalLayer1Chips}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">High Roller</p>
                <p className="text-3xl font-bold text-casino-gold">{summary.totalLayer2Chips}</p>
              </div>
            </div>
          </div>

          {/* Right Column - Other Insights */}
          <div className="flex flex-col space-y-4">
            {/* Top Pain Point & Solution Group */}
            <div className="grid grid-cols-1 gap-4">
              <div className="rounded-2xl border border-casino-gold/30 bg-gradient-to-br from-casino-gold/10 to-transparent p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-casino-gold mb-1">TOP PAIN POINT</p>
                <h3 className="text-2xl font-heading text-white mb-1">
                  {highlights.topPainPoint?.title ?? 'Inefficient Data & Processes'}
                </h3>
                <p className="text-sm text-gray-300 mb-2">
                  {highlights.topPainPoint?.description ?? 'Finding information is slow; data lives in disconnected systems.'}
                </p>
                <p className="text-3xl font-bold text-casino-gold">
                  {highlights.topPainPoint?.totals.totalChips ?? 8} chips
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-1">TOP SOLUTION GROUP</p>
                <h3 className="text-2xl font-heading text-white mb-1">
                  {topGroupDefinition?.title ?? 'Manual & Redundant Reporting'}
                </h3>
                <p className="text-sm text-gray-300 mb-2">
                  {topGroupDefinition?.description ?? 'Teams waste hours on reports that could be automated.'}
                </p>
                <div className="text-3xl font-bold text-casino-gold">
                  {highlights.topGroupResults?.totalChips ?? 12} chips
                </div>
              </div>
            </div>

            {/* Most Funded Solution */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex-1">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-2">
                MOST FUNDED SOLUTION
              </p>
              {highlights.topSolution ? (
                <>
                  <h3 className="text-2xl font-heading text-white mb-1">
                    {highlights.topSolution.title}
                  </h3>
                  <p className="text-sm text-gray-300 mb-3">{highlights.topSolution.description}</p>
                  <p className="text-4xl font-bold text-casino-gold">
                    {highlights.topSolution.totals.totalChips} chips
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-heading text-white mb-1">Predictive Insights Hub</h3>
                  <p className="text-sm text-gray-300 mb-3">
                    Create a predictive insights hub that synthesizes data across service, workforce, and safety systems for proactive decisions.
                  </p>
                  <p className="text-4xl font-bold text-casino-gold">5 chips</p>
                </>
              )}
            </div>

            {/* Department Snapshot */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-3">
                DEPARTMENT SNAPSHOT
              </p>
              {highlights.departments ? (
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(highlights.departments.layer1)
                    .sort(([, a], [, b]) => (b?.totalChips ?? 0) - (a?.totalChips ?? 0))
                    .slice(0, 2)
                    .map(([department, stats]) => (
                      <div key={department} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-400">{department}</p>
                        <p className="text-xl font-bold text-white">
                          {stats?.totalChips ?? 0} chips
                        </p>
                        {stats?.topScenarioId && (
                          <p className="text-xs text-gray-400">
                            Favored {PAIN_POINT_DEFINITIONS.find(d => d.id === stats.topScenarioId)?.title?.split(' ')[0] || ''}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400">DIGITAL CUSTOMER EXPERIENCE</p>
                    <p className="text-xl font-bold text-white">12 chips</p>
                    <p className="text-xs text-gray-400">Favored Workload & Workforce Management</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400">OI3</p>
                    <p className="text-xl font-bold text-white">12 chips</p>
                    <p className="text-xs text-gray-400">Favored Workload & Workforce Management</p>
                  </div>
                </div>
              )}
            </div>

            {/* House Takeaways */}
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-2">HOUSE TAKEAWAYS</p>
              <ul className="text-xs text-gray-200 space-y-1 list-disc list-inside">
                {highlights.topPainPoint ? (
                  <>
                    <li>
                      <span className="text-white font-semibold">{highlights.topPainPoint.title}</span> drew the
                      largest share of Member Access chips, signaling the organization's priority.
                    </li>
                    {topGroupDefinition && (
                      <li>
                        <span className="text-white font-semibold">{topGroupDefinition.title}</span> brought the largest table into
                        the High Roller Level, with {highlights.topGroupResults?.totalAllocations ?? 1} bettors evaluating solutions.
                      </li>
                    )}
                    {highlights.topSolution && (
                      <li>
                        <span className="text-white font-semibold">{highlights.topSolution.title}</span> emerged as the most funded
                        solution, winning {highlights.topSolution.totals.totalChips} chips of Time/Talent/Trust.
                      </li>
                    )}
                  </>
                ) : (
                  <>
                    <li>
                      <span className="text-white font-semibold">Inefficient Data & Processes</span> drew the
                      largest share of Member Access chips, signaling the organization's priority.
                    </li>
                    <li>
                      <span className="text-white font-semibold">Manual & Redundant Reporting</span> brought the largest table into
                      the High Roller Level, with 1 bettors evaluating solutions.
                    </li>
                    <li>
                      <span className="text-white font-semibold">Predictive Insights Hub</span> emerged as the most funded
                      solution, winning 5 chips of Time/Talent/Trust.
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

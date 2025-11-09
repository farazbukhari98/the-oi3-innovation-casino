'use client';

import { useEffect, useMemo, useState } from 'react';
import { Session } from '@/types/session';
import { SessionResults } from '@/types/results';
import { getErrorMessage } from '@/lib/utils';
import { PAIN_POINT_DEFINITIONS } from '@/lib/constants';

interface FacilitatorInsightsProps {
  session: Session;
}

export function FacilitatorInsights({ session }: FacilitatorInsightsProps) {
  const [results, setResults] = useState<SessionResults | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchInsights = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/vote/results?sessionId=${session.id}&refresh=true`);
        if (!response.ok) {
          throw new Error('Failed to load insights');
        }
        const data = (await response.json()) as { results?: SessionResults };
        if (active) {
          setResults(data.results ?? null);
        }
      } catch (error) {
        console.error('[FacilitatorInsights] Error:', getErrorMessage(error));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchInsights();
    return () => {
      active = false;
    };
  }, [session.id]);

  const talkTrack = useMemo(() => {
    if (!results) {
      return [];
    }

    const items: string[] = [];
    const topPainPoint = results.layer1.scenarios[0];
    if (topPainPoint) {
      items.push(
        `${topPainPoint.title} captured the largest share of chips, meaning the room wants to focus on ${topPainPoint.description?.toLowerCase()}`
      );
    }

    const topLayer2Entry = Object.entries(results.layer2 ?? {})
      .sort(([, a], [, b]) => (b?.totalChips ?? 0) - (a?.totalChips ?? 0))[0];
    if (topLayer2Entry) {
      const painPoint = PAIN_POINT_DEFINITIONS.find((definition) => definition.id === topLayer2Entry[0]);
      const leadingSolution = topLayer2Entry[1].scenarios[0];
      if (painPoint && leadingSolution) {
        items.push(
          `In solutions, the ${painPoint.title} table placed ${leadingSolution.totals.totalChips} chips on ${leadingSolution.title}, signaling confidence in that path.`
        );
      }
    }

    const topDepartment = results.departments
      ? Object.entries(results.departments.layer1)
          .sort(([, a], [, b]) => (b?.totalChips ?? 0) - (a?.totalChips ?? 0))[0]
      : undefined;
    if (topDepartment) {
      items.push(`${topDepartment[0]} was the most active department with ${topDepartment[1].totalChips} Layer 1 chips.`);
    }

    return items;
  }, [results]);

  return (
    <div className="casino-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-heading text-white">Facilitator Insights</h3>
        {loading && <span className="text-xs text-gray-400">Refreshing…</span>}
      </div>
      {talkTrack.length === 0 ? (
        <p className="text-sm text-gray-400">Insights will appear once both layers have results.</p>
      ) : (
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-200">
          {talkTrack.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

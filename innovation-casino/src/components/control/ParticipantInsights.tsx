'use client';

import { useEffect, useMemo, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Participant } from '@/types/participant';
import { PAIN_POINT_DEFINITIONS } from '@/lib/constants';

interface ParticipantInsightsProps {
  sessionId: string;
}

interface InsightStats {
  total: number;
  layer1Completed: number;
  layer2Completed: number;
  topPainPoint?: {
    title: string;
    count: number;
  };
}

export function ParticipantInsights({ sessionId }: ParticipantInsightsProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    if (!sessionId) return;

    const participantsRef = ref(database, 'participants');
    const unsubscribe = onValue(participantsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setParticipants([]);
        return;
      }

      const records = snapshot.val() as Record<string, Participant>;
      const sessionParticipants = Object.values(records).filter(
        (participant) => participant.sessionId === sessionId
      );
      setParticipants(sessionParticipants);
    });

    return () => unsubscribe();
  }, [sessionId]);

  const stats = useMemo<InsightStats>(() => {
    if (participants.length === 0) {
      return {
        total: 0,
        layer1Completed: 0,
        layer2Completed: 0,
      };
    }

    const layer1Completed = participants.filter((participant) => participant.layer1Completed).length;
    const layer2Completed = participants.filter((participant) => participant.layer2Completed).length;

    const routingCounts = participants.reduce<Record<string, number>>((acc, participant) => {
      if (participant.layer1Selection) {
        acc[participant.layer1Selection] = (acc[participant.layer1Selection] || 0) + 1;
      }
      return acc;
    }, {});

    const topEntry = Object.entries(routingCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      total: participants.length,
      layer1Completed,
      layer2Completed,
      topPainPoint: topEntry
        ? {
            title: PAIN_POINT_DEFINITIONS.find((definition) => definition.id === topEntry[0])?.title ||
              'Top priority',
            count: topEntry[1],
          }
        : undefined,
    };
  }, [participants]);

  const progressLayer1 = stats.total > 0 ? Math.round((stats.layer1Completed / stats.total) * 100) : 0;
  const progressLayer2 = stats.total > 0 ? Math.round((stats.layer2Completed / stats.total) * 100) : 0;

  return (
    <div className="casino-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-heading text-white">Participant Insights</h3>
        <span className="text-sm text-gray-400">{stats.total} total</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Member Access Complete</p>
          <p className="text-2xl font-bold text-casino-gold">{progressLayer1}%</p>
          <p className="text-xs text-gray-500">{stats.layer1Completed} participants</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">High Roller Complete</p>
          <p className="text-2xl font-bold text-casino-gold">{progressLayer2}%</p>
          <p className="text-xs text-gray-500">{stats.layer2Completed} participants</p>
        </div>
      </div>

      {stats.topPainPoint ? (
        <div className="rounded-2xl border border-casino-gold/40 bg-gradient-to-r from-casino-gold/10 to-yellow-600/10 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.3em] text-casino-gold mb-1">Leading Priority</p>
          <p className="text-lg font-semibold text-white">{stats.topPainPoint.title}</p>
          <p className="text-sm text-gray-200">{stats.topPainPoint.count} participants routed</p>
        </div>
      ) : (
        <p className="text-sm text-gray-400">
          Routing data will appear after participants lock in Member Access priorities.
        </p>
      )}
    </div>
  );
}

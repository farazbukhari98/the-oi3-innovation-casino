'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ScenarioAllocations, ChipAllocation, ChipType } from '@/types/vote';

type AllocationMap = ScenarioAllocations;

function createInitialAllocations(scenarioIds: string[]): AllocationMap {
  return scenarioIds.reduce<AllocationMap>((acc, id) => {
    acc[id] = { time: 0, talent: 0, trust: 0 };
    return acc;
  }, {});
}

function sumAllocations(allocations: AllocationMap) {
  return Object.values(allocations).reduce(
    (acc, allocation) => ({
      time: acc.time + allocation.time,
      talent: acc.talent + allocation.talent,
      trust: acc.trust + allocation.trust,
    }),
    { time: 0, talent: 0, trust: 0 }
  );
}

export function useVoting(scenarioIds: string[], chipsPerType: number) {
  const scenarioKey = useMemo(() => scenarioIds.join('|'), [scenarioIds]);
  const [allocations, setAllocations] = useState<AllocationMap>(() =>
    createInitialAllocations(scenarioIds)
  );
  const latestScenarioIdsRef = useRef(scenarioIds);

  useEffect(() => {
    latestScenarioIdsRef.current = scenarioIds;
  }, [scenarioIds]);

  useEffect(() => {
    const ids = latestScenarioIdsRef.current;
    const frame = requestAnimationFrame(() => {
      setAllocations(createInitialAllocations(ids));
    });
    return () => cancelAnimationFrame(frame);
  }, [scenarioKey]);

  const totals = useMemo(() => sumAllocations(allocations), [allocations]);

  const remaining = useMemo(() => ({
    time: Math.max(0, chipsPerType - totals.time),
    talent: Math.max(0, chipsPerType - totals.talent),
    trust: Math.max(0, chipsPerType - totals.trust),
  }), [chipsPerType, totals]);

  const totalAllocated = totals.time + totals.talent + totals.trust;

  const adjustAllocation = useCallback((scenarioId: string, chip: ChipType, delta: 1 | -1) => {
    setAllocations((prev) => {
      const scenario = prev[scenarioId] || { time: 0, talent: 0, trust: 0 };
      if (delta === 1 && remaining[chip] <= 0) {
        return prev;
      }
      if (delta === -1 && scenario[chip] <= 0) {
        return prev;
      }

      const updatedScenario: ChipAllocation = {
        ...scenario,
        [chip]: scenario[chip] + delta,
      };

      return {
        ...prev,
        [scenarioId]: updatedScenario,
      };
    });
  }, [remaining]);

  const reset = useCallback(() => {
    setAllocations(createInitialAllocations(scenarioIds));
  }, [scenarioIds]);

  const isComplete = remaining.time === 0 && remaining.talent === 0 && remaining.trust === 0;

  return {
    allocations,
    remaining,
    totalAllocated,
    adjustAllocation,
    reset,
    isComplete,
  };
}

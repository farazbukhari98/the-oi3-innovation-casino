'use client';

import { Session, SolutionScenario } from '@/types/session';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { database } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { Vote, ChipType, ChipAllocation } from '@/types/vote';
import { CHIP_COLORS } from '@/lib/constants';
import { Participant } from '@/types/participant';
import { debounce, CacheManager } from '@/lib/performance';

interface LiveVotingLayer2ViewProps {
  session: Session;
}

const CHIP_TYPES: ChipType[] = ['time', 'talent', 'trust'];
type SolutionTotals = ChipAllocation;
type GroupAllocations = Record<string, SolutionTotals>;
type Layer2Allocations = Record<string, GroupAllocations>;

interface PainPointCatalogEntry {
  id: string;
  title: string;
  description: string;
  solutions: SolutionScenario[];
}

function createInitialGroupAllocations(painPoints: PainPointCatalogEntry[]): Layer2Allocations {
  return painPoints.reduce((groupAcc, painPoint) => {
    groupAcc[painPoint.id] = painPoint.solutions.reduce((solutionAcc, solution) => {
      solutionAcc[solution.id] = { time: 0, talent: 0, trust: 0 };
      return solutionAcc;
    }, {} as GroupAllocations);
    return groupAcc;
  }, {} as Layer2Allocations);
}

export function LiveVotingLayer2View({ session }: LiveVotingLayer2ViewProps) {
  // Cache manager for vote data (2 second TTL to reduce Firebase reads)
  const voteCache = useMemo(() => new CacheManager<Vote[]>(2), []);
  const painPointCatalog = useMemo<PainPointCatalogEntry[]>(() => {
    return session.scenarioOrder.map((id) => {
      const scenario = session.scenarios[id];
      return {
        id,
        title: scenario?.title ?? 'Focus Area',
        description: scenario?.description ?? '',
        solutions: session.solutionsByPainPoint[id] ?? [],
      };
    });
  }, [session.scenarioOrder, session.scenarios, session.solutionsByPainPoint]);

  const [allocationsByGroup, setAllocationsByGroup] = useState<Layer2Allocations>(() =>
    createInitialGroupAllocations(painPointCatalog)
  );
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(session.settings.layerDurations?.layer2 || 420);

  useEffect(() => {
    setAllocationsByGroup(createInitialGroupAllocations(painPointCatalog));
  }, [painPointCatalog]);

  // Find which pain points have participants
  const activePainPoints = useMemo(() => {
    return painPointCatalog.filter(pp => {
      const allocations = allocationsByGroup[pp.id];
      if (!allocations) return false;
      // Check if there are any chips allocated to this pain point
      return Object.values(allocations).some(solution =>
        (solution.time + solution.talent + solution.trust) > 0
      );
    });
  }, [painPointCatalog, allocationsByGroup]);

  // Find which pain point has the most participants (primary focus)
  const primaryPainPoint = useMemo(() => {
    const counts = Object.entries(participantCounts);
    if (counts.length === 0) return painPointCatalog[0];

    const sorted = counts.sort((a, b) => b[1] - a[1]);
    return painPointCatalog.find(pp => pp.id === sorted[0][0]) || painPointCatalog[0];
  }, [participantCounts, painPointCatalog]);

  // Process vote updates with debouncing to prevent excessive re-renders
  // This batches multiple rapid vote submissions into single update
  const processVoteUpdate = useCallback(
    debounce((voteRecords: Record<string, Vote> | null) => {
      if (!voteRecords) {
        setAllocationsByGroup(createInitialGroupAllocations(painPointCatalog));
        return;
      }

      const groupedAllocations = createInitialGroupAllocations(painPointCatalog);

      // Filter and process only relevant votes for this session
      const relevantVotes = Object.values(voteRecords).filter(
        (vote) => vote.sessionId === session.id && vote.layer === 'layer2' && vote.painPointId
      );

      relevantVotes.forEach((vote) => {
        const groupTotals = groupedAllocations[vote.painPointId!];
        if (!groupTotals) return;

        (Object.entries(vote.allocations) as Array<[string, ChipAllocation]>).forEach(
          ([solutionId, allocation]) => {
            const totals = groupTotals[solutionId];
            if (!totals) return;
            totals.time += allocation.time;
            totals.talent += allocation.talent;
            totals.trust += allocation.trust;
          }
        );
      });

      setAllocationsByGroup(groupedAllocations);
    }, 1000), // 1 second debounce - batches rapid updates together
    [session.id, painPointCatalog]
  );

  useEffect(() => {
    if (!session.id) {
      return;
    }

    // Use query to filter participants by session at database level
    // This reduces data transfer for large numbers of participants
    const participantsQuery = query(
      ref(database, 'participants'),
      orderByChild('sessionId'),
      equalTo(session.id)
    );

    const votesRef = ref(database, 'votes');

    // Process participant updates with debouncing
    const processParticipantUpdate = debounce((participantRecords: Record<string, Participant> | null) => {
      if (!participantRecords) {
        setParticipantCounts({});
        return;
      }

      const counts: Record<string, number> = {};
      Object.values(participantRecords).forEach((participant) => {
        if (participant.layer1Selection) {
          counts[participant.layer1Selection] = (counts[participant.layer1Selection] || 0) + 1;
        }
      });
      setParticipantCounts(counts);
    }, 500); // 500ms debounce for participant updates

    const unsubscribeParticipants = onValue(participantsQuery, (snapshot) => {
      const participantRecords = snapshot.val() as Record<string, Participant> | null;
      processParticipantUpdate(participantRecords);
    });

    const unsubscribeVotes = onValue(votesRef, (snapshot) => {
      const voteRecords = snapshot.val() as Record<string, Vote> | null;

      // Check cache first to avoid unnecessary processing
      const cacheKey = `votes-${session.id}`;
      const cachedVotes = voteCache.get(cacheKey);

      if (cachedVotes && JSON.stringify(cachedVotes) === JSON.stringify(voteRecords)) {
        return; // Skip if data hasn't changed
      }

      // Update cache
      if (voteRecords) {
        voteCache.set(cacheKey, Object.values(voteRecords));
      }

      processVoteUpdate(voteRecords);
    });

    return () => {
      unsubscribeParticipants();
      unsubscribeVotes();
      voteCache.clear();
    };
  }, [session.id, processVoteUpdate]);

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

  const primaryAllocations = allocationsByGroup[primaryPainPoint.id] || {};
  const primarySolutions = primaryPainPoint.solutions.map(s => ({
    ...s,
    totals: primaryAllocations[s.id] || { time: 0, talent: 0, trust: 0 },
    totalChips: (primaryAllocations[s.id]?.time || 0) + (primaryAllocations[s.id]?.talent || 0) + (primaryAllocations[s.id]?.trust || 0)
  }));

  const maxChips = Math.max(...primarySolutions.map(s => s.totalChips), 1);

  return (
    <div className="display-container flex flex-col p-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 right-1/3 w-[36rem] h-[36rem] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-1/3 -left-20 w-[28rem] h-[28rem] rounded-full bg-green-500/10 blur-3xl" />
      </div>

      <div className="text-center mb-4">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-display-2xl font-heading text-gold-gradient mb-2 projector-text"
        >
          HIGH ROLLER: SOLUTIONS
        </motion.h1>
        <p className="text-display-lg text-gray-300 projector-text mb-1">
          Voting on solutions for: <span className="text-casino-gold font-bold">{primaryPainPoint.title}</span>
        </p>
        <p className="text-display-sm text-gray-400">
          {participantCounts[primaryPainPoint.id] || 0} participants in this group
        </p>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="text-gray-300 text-display-lg">
          <span className="text-casino-gold font-bold">
            {primarySolutions.reduce((sum, s) => sum + s.totalChips, 0)}
          </span> chips invested
        </div>
        <div className={`
          text-display-xl font-mono font-bold projector-text
          ${timeLeft <= 30 ? 'text-red-500 animate-pulse' :
            timeLeft <= 60 ? 'text-yellow-500' : 'text-green-500'}
        `}>
          ⏱️ {formatTime(timeLeft)}
        </div>
      </div>

      {/* Main group solutions */}
      <div className="flex-1 grid grid-cols-2 gap-3 mb-4">
        {primarySolutions.map((solution, index) => (
          <motion.div
            key={solution.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-3"
          >
            <div className="space-y-1 mb-2">
              <h3 className="text-display-base font-bold text-white">{solution.title}</h3>
              {solution.innovationLabel && (
                <p className="text-[10px] uppercase tracking-[0.3em] text-casino-gold">
                  {solution.innovationLabel}
                </p>
              )}
              <p className="text-display-xs text-gray-400 line-clamp-2">{solution.description}</p>
            </div>

            <div className="text-center mb-2">
              <p className="text-display-xl font-bold text-casino-gold">{solution.totalChips}</p>
              <p className="text-display-xs uppercase tracking-wider text-gray-400">chips</p>
            </div>

            <div className="h-[15vh] bg-black/30 rounded-xl overflow-hidden relative mb-2">
              <div
                className="absolute inset-x-0 bottom-0 flex flex-col"
                style={{ height: `${(solution.totalChips / maxChips) * 100}%` }}
              >
                {CHIP_TYPES.map(chip => {
                  const value = solution.totals[chip];
                  const percent = solution.totalChips > 0 ? (value / solution.totalChips) * 100 : 0;
                  return (
                    <div
                      key={chip}
                      className={`${CHIP_COLORS[chip]} transition-all flex items-center justify-center text-white font-bold`}
                      style={{ height: `${percent}%` }}
                    >
                      {percent > 15 && <span className="text-display-xs">{value}</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1">
              {CHIP_TYPES.map(chip => (
                <div key={chip} className="rounded bg-black/30 py-1 text-center">
                  <p className="uppercase text-display-xs text-gray-500">{chip}</p>
                  <p className="font-bold text-display-xs text-white">{solution.totals[chip]}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Other groups summary ticker */}
      <div className="border-t border-white/10 pt-2">
        <p className="text-display-xs uppercase tracking-wider text-gray-400 mb-1">Other Groups</p>
        <div className="flex gap-3 overflow-x-auto">
          {painPointCatalog.filter(pp => pp.id !== primaryPainPoint.id).map(pp => {
            const groupTotal = Object.values(allocationsByGroup[pp.id] || {})
              .reduce((sum, alloc) => sum + alloc.time + alloc.talent + alloc.trust, 0);
            return (
              <div key={pp.id} className="flex-shrink-0 rounded-lg bg-white/5 px-3 py-2">
                <p className="text-display-xs text-gray-400">{pp.title}</p>
                <p className="text-display-sm font-bold text-white">{groupTotal} chips</p>
                <p className="text-display-xs text-gray-500">{participantCounts[pp.id] || 0} participants</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

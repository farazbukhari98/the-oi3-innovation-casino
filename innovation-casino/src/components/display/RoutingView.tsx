'use client';

import { Session } from '@/types/session';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { PAIN_POINT_DEFINITIONS } from '@/lib/constants';
import { Participant } from '@/types/participant';

interface RoutingViewProps {
  session: Session;
}

interface RoutingStats {
  [painPointId: string]: number;
}

export function RoutingView({ session }: RoutingViewProps) {
  const [routingStats, setRoutingStats] = useState<RoutingStats>({});
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [animationPhase, setAnimationPhase] = useState<'counting' | 'revealing'>('counting');

  useEffect(() => {
    if (!session.id) return;

    // Listen to participant routing data
    const participantsRef = ref(database, 'participants');
    const unsubscribe = onValue(participantsRef, (snapshot) => {
      const participantRecords = snapshot.val() as Record<string, Participant> | null;
      if (!participantRecords) {
        setRoutingStats({});
        setTotalParticipants(0);
        return;
      }

      const sessionParticipants = Object.values(participantRecords).filter(
        (participant) => participant.sessionId === session.id
      );

      // Count participants by their layer1Selection
      const stats: RoutingStats = {};
      let total = 0;

      sessionParticipants.forEach((participant) => {
        if (participant.layer1Selection) {
          stats[participant.layer1Selection] = (stats[participant.layer1Selection] || 0) + 1;
          total++;
        }
      });

      setRoutingStats(stats);
      setTotalParticipants(total);
    });

    // Animation sequence
    const timer = setTimeout(() => setAnimationPhase('revealing'), 2000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [session.id]);

  const painPoints = PAIN_POINT_DEFINITIONS.map(pp => ({
    ...pp,
    count: routingStats[pp.id] || 0,
    percentage: totalParticipants > 0 ? Math.round((routingStats[pp.id] || 0) / totalParticipants * 100) : 0
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="display-container flex flex-col items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-display-3xl font-heading text-gold-gradient mb-2 projector-text">
          ROUTING PARTICIPANTS
        </h1>
        <p className="text-display-xl text-gray-300 projector-text">
          Assigning players to their priority focus areas
        </p>
      </motion.div>

      {/* Routing visualization */}
      <div className="relative z-10 w-full max-w-6xl">
        {animationPhase === 'counting' ? (
          // Counting animation
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className="text-display-5xl font-bold text-casino-gold mb-2">
              <motion.span
                key={totalParticipants}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                {totalParticipants}
              </motion.span>
            </div>
            <p className="text-display-xl text-white">Participants Analyzed</p>
            <div className="mt-8 flex justify-center gap-3">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-4 h-4 rounded-full bg-casino-gold"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          // Revealing groups
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-2 gap-4"
          >
            {painPoints.map((pp, index) => (
              <motion.div
                key={pp.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className={`
                  rounded-2xl border-2 p-4
                  ${index === 0
                    ? 'border-casino-gold bg-gradient-to-br from-casino-gold/20 to-yellow-600/10'
                    : 'border-white/20 bg-white/5'}
                `}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-display-xs uppercase tracking-wider text-gray-400 mb-1">
                      {index === 0 ? 'TOP PRIORITY' : `PRIORITY ${index + 1}`}
                    </p>
                    <h3 className="text-display-lg font-bold text-white projector-text">
                      {pp.title}
                    </h3>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.2 + 0.3, type: 'spring' }}
                    className="text-right"
                  >
                    <div className="text-display-2xl font-bold text-casino-gold">
                      {pp.count}
                    </div>
                    <div className="text-display-sm text-white/60">
                      {pp.percentage}%
                    </div>
                  </motion.div>
                </div>

                {/* Visual bar */}
                <div className="h-4 bg-black/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pp.percentage}%` }}
                    transition={{ delay: index * 0.2 + 0.5, duration: 0.8, ease: 'easeOut' }}
                    className={`h-full ${
                      index === 0
                        ? 'bg-gradient-to-r from-casino-gold to-yellow-500'
                        : 'bg-gradient-to-r from-white/40 to-white/20'
                    }`}
                  />
                </div>

                {/* Participant icons */}
                <div className="mt-4 flex -space-x-2">
                  {[...Array(Math.min(10, pp.count))].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.2 + 0.6 + i * 0.05 }}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 border-2 border-white/20 flex items-center justify-center text-xs text-white font-bold"
                    >
                      {i === 9 && pp.count > 10 ? `+${pp.count - 9}` : ''}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Bottom message */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 3 }}
        className="mt-12 text-center"
      >
        <p className="text-2xl text-gray-300 projector-text">
          {animationPhase === 'revealing' ? 'High Roller level will focus on solutions for each group' : 'Analyzing priorities...'}
        </p>
      </motion.div>
    </div>
  );
}

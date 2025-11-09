'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { ChipType } from '@/types/vote';

interface SubmissionSequenceProps {
  show: boolean;
  totalChips: number;
  onComplete: () => void;
}

const CHIP_COLORS = {
  time: 'from-red-500 to-red-700',
  talent: 'from-blue-500 to-blue-700',
  trust: 'from-green-500 to-green-700',
};

const CONFETTI_COLORS = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'];
const CONFETTI_COUNT = 20;

interface ConfettiSpec {
  x: number;
  y: number;
  color: string;
  delay: number;
  id: number;
}

const deferConfettiUpdate = (callback: () => void) => {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(callback);
  } else {
    Promise.resolve().then(callback);
  }
};

export function SubmissionSequence({ show, totalChips, onComplete }: SubmissionSequenceProps) {
  const [phase, setPhase] = useState<'collecting' | 'success' | 'complete'>('collecting');
  const chipTypes: ChipType[] = ['time', 'talent', 'trust'];
  const [confettiSpecs, setConfettiSpecs] = useState<ConfettiSpec[]>([]);
  const wasShowingRef = useRef(show);

  useEffect(() => {
    if (!show) {
      if (wasShowingRef.current) {
        wasShowingRef.current = false;
        deferConfettiUpdate(() => {
          setPhase('collecting');
          setConfettiSpecs([]);
        });
      }
      return;
    }

    wasShowingRef.current = true;

    deferConfettiUpdate(() => {
      setConfettiSpecs(
        Array.from({ length: CONFETTI_COUNT }).map((_, index) => ({
          x: (Math.random() - 0.5) * 600,
          y: -Math.random() * 400 - 100,
          color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
          delay: index * 0.05,
          id: index,
        }))
      );
    });

    // Start the sequence
    const timer1 = setTimeout(() => setPhase('success'), 2000);
    const timer2 = setTimeout(() => {
      setPhase('complete');
      onComplete();
    }, 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
        >
          {/* Collecting Phase - Chips flying to center */}
          {phase === 'collecting' && (
            <div className="relative w-full h-full">
              {/* Center pot glow */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1.5 }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-yellow-500/40 via-yellow-500/20 to-transparent rounded-full blur-3xl"
              />

              {/* Animated chips */}
              {[...Array(totalChips)].map((_, i) => {
                const chipType = chipTypes[i % 3];
                const angle = (i / totalChips) * Math.PI * 2;
                const radius = 300;
                const startX = Math.cos(angle) * radius;
                const startY = Math.sin(angle) * radius;

                return (
                  <motion.div
                    key={i}
                    className={`absolute w-16 h-16 rounded-full bg-gradient-to-br ${CHIP_COLORS[chipType]} border-2 border-white/30 shadow-2xl`}
                    initial={{
                      top: '50%',
                      left: '50%',
                      x: startX,
                      y: startY,
                      scale: 0,
                      rotate: 0,
                    }}
                    animate={{
                      x: 0,
                      y: 0,
                      scale: [0, 1.2, 0.8, 0],
                      rotate: 720,
                    }}
                    transition={{
                      delay: i * 0.03,
                      duration: 1.5,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                  >
                    <div className="absolute inset-2 rounded-full bg-white/20" />
                  </motion.div>
                );
              })}

              {/* Center text */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
              >
                <h2 className="text-4xl font-bold text-white mb-2">Locking In Your Bets</h2>
                <p className="text-xl text-white/70">Collecting all {totalChips} chips...</p>
              </motion.div>
            </div>
          )}

          {/* Success Phase */}
          {phase === 'success' && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 100 }}
              className="text-center"
            >
              {/* Success checkmark */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center"
              >
                <svg
                  className="w-20 h-20 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.div>

              <h2 className="text-5xl font-bold text-white mb-4">All In!</h2>
              <p className="text-2xl text-white/70">Your investment has been locked</p>

              {/* Confetti effect */}
              {confettiSpecs.map((confetti) => (
                <motion.div
                  key={`confetti-${confetti.id}`}
                  className={`absolute w-3 h-3 rounded-full ${confetti.color}`}
                  initial={{
                    top: '50%',
                    left: '50%',
                    x: 0,
                    y: 0,
                  }}
                  animate={{
                    x: confetti.x,
                    y: confetti.y,
                    opacity: [1, 1, 0],
                    scale: [0, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    delay: confetti.delay,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

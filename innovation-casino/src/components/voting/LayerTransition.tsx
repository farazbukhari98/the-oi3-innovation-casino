'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { PAIN_POINT_DEFINITIONS } from '@/lib/constants';

type TransitionStage = 'afterLayer1' | 'afterLayer2';

interface LayerTransitionProps {
  layer1Selection?: string;
  participantName: string;
  waitingForLayer2?: boolean;
  stage?: TransitionStage;
}

export function LayerTransition({
  layer1Selection,
  participantName,
  waitingForLayer2 = false,
  stage = 'afterLayer1',
}: LayerTransitionProps) {
  const [showPainPoint, setShowPainPoint] = useState(false);

  const selectedPainPoint = layer1Selection
    ? PAIN_POINT_DEFINITIONS.find(pp => pp.id === layer1Selection)
    : null;

  useEffect(() => {
    const timer = setTimeout(() => setShowPainPoint(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-gradient-to-br from-black via-purple-950/20 to-black">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full space-y-8 text-center relative z-10"
      >
        {/* Success badge */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 100 }}
          className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-2xl"
        >
          <svg
            className="w-14 h-14 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </motion.div>

        {/* Main message */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            {stage === 'afterLayer1' ? 'Great job' : 'All bets locked in'}, {participantName}!
          </h1>
          <p className="text-xl text-white/70">
            {stage === 'afterLayer1'
              ? 'Your Member Access priorities are locked in'
              : 'Your High Roller bets are locked in'}
          </p>
        </div>

        {/* Pain point selection reveal */}
        {stage === 'afterLayer1' && showPainPoint && selectedPainPoint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border-2 border-casino-gold/30 bg-gradient-to-br from-casino-gold/10 to-transparent p-8 backdrop-blur-sm"
          >
            <p className="text-sm uppercase tracking-wider text-casino-gold mb-4">
              Your Member Access Focus
            </p>
            <h2 className="text-2xl font-bold text-white mb-3">
              {selectedPainPoint.title}
            </h2>
            <p className="text-white/60 text-sm">
              {selectedPainPoint.description}
            </p>
          </motion.div>
        )}

        {/* Status indicator */}
        {stage === 'afterLayer1' && waitingForLayer2 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            <div className="flex justify-center">
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 rounded-full bg-casino-gold"
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
            </div>
            <p className="text-white/50">
              Waiting for the High Roller Level to open...
            </p>
            <p className="text-sm text-white/30">
              The facilitator will advance to solution betting shortly
            </p>
          </motion.div>
        ) : stage === 'afterLayer1' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold"
            >
              <span>High Roller Level Ready!</span>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </motion.div>
            <p className="text-white/50">
              Get ready to invest in bold solutions for your priority area
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            <p className="text-white/70 text-lg">
              Fantastic work! We&apos;ve captured your solution bets.
            </p>
            <p className="text-white/60">
              The facilitator is revealing the combined insights—watch the main display for the big reveal.
            </p>
          </motion.div>
        )}

        {/* Decorative chips */}
        <div className="flex justify-center gap-4 opacity-30">
          {['bg-red-600', 'bg-blue-600', 'bg-green-600'].map((color, i) => (
            <motion.div
              key={color}
              animate={{
                y: [0, -10, 0],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.3,
              }}
              className={`w-12 h-12 rounded-full ${color} border-2 border-white/20`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

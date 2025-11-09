'use client';

import { motion } from 'framer-motion';
import { SlotCounter } from '@/components/ui/SlotCounter';

interface ParticipantCounterProps {
  current: number;
  total: number;
}

export function ParticipantCounter({ current, total }: ParticipantCounterProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="w-full max-w-4xl">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center mb-6">
        <span className="text-5xl font-bold text-gray-300 projector-text">
          Participants Joined:
        </span>
        <div className="flex items-center gap-4">
          <SlotCounter value={current} />
          <span className="text-7xl font-bold text-gray-500 projector-text">/ {total}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-12 bg-gray-800 rounded-full overflow-hidden border-4 border-casino-gold">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-casino-gold to-yellow-400"
        />
      </div>

      {/* Motivational text */}
      {current < 10 && (
        <p className="text-4xl text-gray-400 mt-6 projector-text">
          We&apos;re just getting started! 🎲
        </p>
      )}
      {current >= 10 && current < 50 && (
        <p className="text-4xl text-yellow-500 mt-6 projector-text">
          Great turnout! Keep them coming! 🎰
        </p>
      )}
      {current >= 50 && current < 100 && (
        <p className="text-4xl text-green-500 mt-6 projector-text">
          Fantastic participation! 🎉
        </p>
      )}
      {current >= 100 && (
        <p className="text-4xl text-gold-gradient mt-6 projector-text font-bold">
          AMAZING! Full house energy! 🌟
        </p>
      )}
    </div>
  );
}

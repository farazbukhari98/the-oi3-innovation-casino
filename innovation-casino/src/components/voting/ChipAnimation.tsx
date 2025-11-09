'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChipType } from '@/types/vote';
import { useState } from 'react';

interface FlyingChip {
  id: string;
  type: ChipType;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isRemoving?: boolean;
}

interface ChipAnimationProps {
  chips: FlyingChip[];
  onAnimationComplete: (chipId: string) => void;
}

const CHIP_STYLES = {
  time: 'bg-gradient-to-br from-red-500 to-red-700 border-red-400',
  talent: 'bg-gradient-to-br from-blue-500 to-blue-700 border-blue-400',
  trust: 'bg-gradient-to-br from-green-500 to-green-700 border-green-400',
};

export function ChipAnimation({ chips, onAnimationComplete }: ChipAnimationProps) {
  return (
    <AnimatePresence>
      {chips.map((chip) => (
        <motion.div
          key={chip.id}
          className={`
            fixed w-14 h-14 rounded-full z-50
            ${CHIP_STYLES[chip.type]}
            border-2 shadow-2xl
            pointer-events-none
          `}
          initial={{
            x: chip.fromX,
            y: chip.fromY,
            scale: 0.8,
            rotate: 0,
          }}
          animate={{
            x: chip.toX,
            y: chip.toY,
            scale: 1,
            rotate: chip.isRemoving ? -360 : 360,
          }}
          exit={{
            scale: 0,
            opacity: 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 150,
            damping: 20,
            duration: 0.8,
          }}
          onAnimationComplete={() => onAnimationComplete(chip.id)}
        >
          {/* Inner circle for depth */}
          <div className="absolute inset-2 rounded-full bg-white/20" />
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white/40" />
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

// Hook to manage flying chips
export function useFlyingChips() {
  const [flyingChips, setFlyingChips] = useState<FlyingChip[]>([]);

  const addFlyingChip = (
    type: ChipType,
    fromElement: HTMLElement,
    toElement: HTMLElement,
    isRemoving = false
  ) => {
    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();

    const newChip: FlyingChip = {
      id: `chip-${Date.now()}-${Math.random()}`,
      type,
      fromX: fromRect.left + fromRect.width / 2 - 28, // Center the 56px chip
      fromY: fromRect.top + fromRect.height / 2 - 28,
      toX: toRect.left + toRect.width / 2 - 28,
      toY: toRect.top + toRect.height / 2 - 28,
      isRemoving,
    };

    setFlyingChips((prev) => [...prev, newChip]);
  };

  const removeFlyingChip = (chipId: string) => {
    setFlyingChips((prev) => prev.filter((c) => c.id !== chipId));
  };

  return {
    flyingChips,
    addFlyingChip,
    removeFlyingChip,
  };
}

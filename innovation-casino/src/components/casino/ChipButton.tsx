'use client';

import { ChipType } from '@/types/vote';
import { motion } from 'framer-motion';

interface ChipButtonProps {
  type: ChipType;
  active: boolean;
  onClick: () => void;
  placed?: boolean;
}

const CHIP_CONFIG = {
  time: { color: 'bg-chip-red', label: 'TIME', emoji: '⏰' },
  talent: { color: 'bg-chip-blue', label: 'TALENT', emoji: '💡' },
  trust: { color: 'bg-chip-green', label: 'TRUST', emoji: '🤝' },
};

export function ChipButton({ type, active, onClick, placed }: ChipButtonProps) {
  const config = CHIP_CONFIG[type];

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        chip-button ${config.color}
        ${active ? 'ring-4 ring-casino-gold shadow-[0_0_25px_rgba(250,204,21,0.45)]' : ''}
        ${placed ? 'opacity-60' : ''}
        relative
      `}
    >
      <div className="flex flex-col items-center">
        <span className="text-2xl">{config.emoji}</span>
        <span className="text-xs font-bold mt-1">{config.label}</span>
      </div>
      {placed && (
        <div className="absolute -top-1 -right-1 bg-green-500 rounded-full w-5 h-5 flex items-center justify-center">
          <span className="text-xs">✓</span>
        </div>
      )}
    </motion.button>
  );
}

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChipType } from '@/types/vote';

interface ChipRackProps {
  activeChip: ChipType | null;
  onChipSelect: (chip: ChipType) => void;
  remaining: {
    time: number;
    talent: number;
    trust: number;
  };
  totalPerType: number;
}

const CHIP_CONFIG = {
  time: {
    label: 'Time',
    icon: '⏰',
    color: 'from-red-600 to-red-700',
    shadow: 'shadow-red-500/30',
    glow: 'bg-red-500/20',
    ring: 'ring-red-500',
  },
  talent: {
    label: 'Talent',
    icon: '💡',
    color: 'from-blue-600 to-blue-700',
    shadow: 'shadow-blue-500/30',
    glow: 'bg-blue-500/20',
    ring: 'ring-blue-500',
  },
  trust: {
    label: 'Trust',
    icon: '🤝',
    color: 'from-green-600 to-green-700',
    shadow: 'shadow-green-500/30',
    glow: 'bg-green-500/20',
    ring: 'ring-green-500',
  },
};

function ChipStack({
  type,
  count,
  total,
  isActive,
  onSelect,
}: {
  type: ChipType;
  count: number;
  total: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  const config = CHIP_CONFIG[type];
  const isEmpty = count === 0;
  const stackHeight = Math.max(1, Math.min(5, count)); // Visual stack height

  return (
    <motion.button
      onClick={onSelect}
      disabled={isEmpty}
      whileHover={!isEmpty ? { scale: 1.05 } : {}}
      whileTap={!isEmpty ? { scale: 0.95 } : {}}
      className={`
        relative group transition-all duration-200
        ${isEmpty ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${isActive ? 'scale-105' : ''}
      `}
    >
      {/* Active glow effect */}
      <AnimatePresence>
        {isActive && !isEmpty && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.2 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`absolute inset-0 ${config.glow} rounded-full blur-xl`}
          />
        )}
      </AnimatePresence>

      {/* Chip stack visualization */}
      <div className="relative w-24 h-32 md:w-32 md:h-40">
        {/* Render stacked chips */}
        {[...Array(stackHeight)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: isEmpty ? 0.3 : 1,
              y: -i * 6,
            }}
            transition={{ delay: i * 0.05 }}
            className={`
              absolute bottom-0 left-1/2 -translate-x-1/2
              w-20 h-20 md:w-24 md:h-24
              rounded-full
              bg-gradient-to-br ${config.color}
              ${config.shadow} shadow-2xl
              border-4 border-white/20
              ${isActive && !isEmpty ? `ring-4 ${config.ring} ring-opacity-50` : ''}
            `}
            style={{
              zIndex: stackHeight - i,
            }}
          >
            {/* Chip design details */}
            <div className="absolute inset-2 rounded-full border-2 border-white/10" />
            <div className="absolute inset-4 rounded-full border border-dashed border-white/20" />

            {/* Show icon on top chip */}
            {i === stackHeight - 1 && (
              <div className="absolute inset-0 flex items-center justify-center text-2xl md:text-3xl">
                {config.icon}
              </div>
            )}
          </motion.div>
        ))}

        {/* Empty state */}
        {isEmpty && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
            <span className="text-white/40 text-4xl">∅</span>
          </div>
        )}
      </div>

      {/* Chip info */}
      <div className="mt-2 text-center">
        <div className="text-white font-bold text-lg">
          {config.label}
        </div>
        <div className="text-sm">
          <span className={`font-mono ${isEmpty ? 'text-red-400' : 'text-white'}`}>
            {count}
          </span>
          <span className="text-white/50">/{total}</span>
        </div>
      </div>

      {/* Selection indicator */}
      {isActive && !isEmpty && (
        <motion.div
          layoutId="activeChipIndicator"
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full"
        />
      )}
    </motion.button>
  );
}

export function ChipRack({
  activeChip,
  onChipSelect,
  remaining,
  totalPerType,
}: ChipRackProps) {
  const chipTypes: ChipType[] = ['time', 'talent', 'trust'];

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold text-lg">Your Chip Rack</h3>
          <p className="text-white/60 text-sm">
            {activeChip
              ? `Placing ${CHIP_CONFIG[activeChip].label} chips`
              : 'Select a chip type to place'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-casino-gold">
            {remaining.time + remaining.talent + remaining.trust}
          </div>
          <div className="text-xs text-white/60 uppercase tracking-wider">
            Chips Left
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-6 md:gap-12">
        {chipTypes.map((type) => (
          <ChipStack
            key={type}
            type={type}
            count={remaining[type]}
            total={totalPerType}
            isActive={activeChip === type}
            onSelect={() => onChipSelect(type)}
          />
        ))}
      </div>

      {/* Instructions */}
      <AnimatePresence mode="wait">
        {!activeChip && remaining.time + remaining.talent + remaining.trust > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 text-center"
          >
            <p className="text-white/40 text-sm animate-pulse">
              👆 Tap a chip stack to start placing
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
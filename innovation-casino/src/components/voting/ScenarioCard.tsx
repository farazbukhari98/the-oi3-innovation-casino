'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChipType, ChipAllocation } from '@/types/vote';
import { useState } from 'react';

interface ScenarioCardProps {
  title: string;
  description: string;
  allocation: ChipAllocation;
  activeChip: ChipType | null;
  onPlaceChip: () => void;
  onRemoveChip: (type: ChipType) => void;
  isHighlighted?: boolean;
  index: number;
  badgeLabel?: string;
  badgeDescription?: string;
  badgeAccent?: string;
}

const CHIP_COLORS = {
  time: 'bg-red-600',
  talent: 'bg-blue-600',
  trust: 'bg-green-600',
};

const CHIP_LABELS = {
  time: 'Time',
  talent: 'Talent',
  trust: 'Trust',
};

function ChipPile({ type, count }: { type: ChipType; count: number }) {
  if (count === 0) return null;

  const displayCount = Math.min(count, 5); // Max visual stack of 5

  return (
    <div className="relative h-16 w-12">
      {[...Array(displayCount)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0, y: 20 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: -i * 3,
          }}
          transition={{
            delay: i * 0.05,
            type: 'spring',
            stiffness: 200,
          }}
          className={`
            absolute bottom-0 left-0
            w-12 h-12 rounded-full
            ${CHIP_COLORS[type]}
            border-2 border-white/30
            shadow-lg
            flex items-center justify-center
          `}
          style={{ zIndex: displayCount - i }}
        >
          {i === displayCount - 1 && count > 5 && (
            <span className="text-white text-xs font-bold">+{count - 5}</span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

export function ScenarioCard({
  title,
  description,
  allocation,
  activeChip,
  onPlaceChip,
  onRemoveChip,
  isHighlighted = false,
  index,
  badgeLabel,
  badgeDescription,
  badgeAccent,
}: ScenarioCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const totalChips = allocation.time + allocation.talent + allocation.trust;
  const canPlaceChip = activeChip !== null;
  const hasChips = totalChips > 0;

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`
        relative
        rounded-2xl
        border-2
        ${isHighlighted ? 'border-casino-gold' : 'border-white/20'}
        ${canPlaceChip ? 'cursor-pointer' : ''}
        bg-gradient-to-br from-black/60 via-black/40 to-black/60
        backdrop-blur-sm
        overflow-hidden
        transition-all duration-200
      `}
    >
      {/* Glow effect when highlighted or hovered with active chip */}
      <AnimatePresence>
        {(isHighlighted || (isHovered && canPlaceChip)) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-radial from-casino-gold/10 via-transparent to-transparent pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Card content */}
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-xs uppercase tracking-wider text-casino-gold">
                Scenario {index + 1}
              </div>
              {badgeLabel && (
                <span
                  className={`
                    inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em]
                    ${badgeAccent ? `bg-gradient-to-r ${badgeAccent} text-black` : 'bg-white/10 text-white/80'}
                  `}
                >
                  {badgeLabel}
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-white/70 line-clamp-2">{description}</p>
            {badgeDescription && (
              <p className="text-xs text-white/50 mt-1">{badgeDescription}</p>
            )}
          </div>
          <div className="ml-4 text-right">
            <div className="text-3xl font-bold text-casino-gold">{totalChips}</div>
            <div className="text-xs text-white/50 uppercase tracking-wider">Chips</div>
          </div>
        </div>

        {/* Chip visualization area */}
        <div className="relative h-20 rounded-xl bg-black/30 border border-white/10 p-2">
          <div className="flex gap-3 items-end h-full">
            <ChipPile type="time" count={allocation.time} />
            <ChipPile type="talent" count={allocation.talent} />
            <ChipPile type="trust" count={allocation.trust} />
          </div>

          {/* Empty state */}
          {!hasChips && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white/30 text-sm">No chips placed</p>
            </div>
          )}
        </div>

        {/* Chip breakdown */}
        {hasChips && (
          <div className="grid grid-cols-3 gap-2 text-xs">
            {(['time', 'talent', 'trust'] as ChipType[]).map((type) => (
              <div
                key={type}
                className="flex items-center justify-between px-2 py-1 rounded bg-white/5"
              >
                <span className="text-white/60">{CHIP_LABELS[type]}</span>
                <span className="font-mono text-white font-semibold">
                  {allocation[type]}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {/* Place chip button */}
          <motion.button
            onClick={onPlaceChip}
            disabled={!canPlaceChip}
            whileHover={canPlaceChip ? { scale: 1.05 } : {}}
            whileTap={canPlaceChip ? { scale: 0.95 } : {}}
            className={`
              flex-1 py-3 px-4 rounded-lg font-semibold
              transition-all duration-200
              ${
                canPlaceChip
                  ? 'bg-gradient-to-r from-casino-gold to-yellow-600 text-black hover:shadow-lg hover:shadow-yellow-500/30'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }
            `}
          >
            {canPlaceChip ? (
              <span className="flex items-center justify-center gap-2">
                <span>Place {CHIP_LABELS[activeChip]}</span>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-lg"
                >
                  +
                </motion.span>
              </span>
            ) : (
              'Select a chip first'
            )}
          </motion.button>

          {/* Remove chip button (only show if chips are placed) */}
          {hasChips && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <select
                onChange={(e) => {
                  const chipType = e.target.value as ChipType;
                  if (chipType && allocation[chipType] > 0) {
                    onRemoveChip(chipType);
                  }
                  e.target.value = ''; // Reset selection
                }}
                className="h-full px-3 py-3 rounded-lg bg-red-600/20 border border-red-500/30 text-white text-sm cursor-pointer hover:bg-red-600/30 transition-colors"
              >
                <option value="">Remove...</option>
                {allocation.time > 0 && (
                  <option value="time">Time ({allocation.time})</option>
                )}
                {allocation.talent > 0 && (
                  <option value="talent">Talent ({allocation.talent})</option>
                )}
                {allocation.trust > 0 && (
                  <option value="trust">Trust ({allocation.trust})</option>
                )}
              </select>
            </motion.div>
          )}
        </div>
      </div>

      {/* Card index badge */}
      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-casino-gold/20 border border-casino-gold/40 flex items-center justify-center">
        <span className="text-casino-gold font-bold text-sm">{index + 1}</span>
      </div>
    </motion.div>
  );
}

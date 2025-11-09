'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PokerTableProps {
  cards: ReactNode[];
  centerContent?: ReactNode;
  chipRack: ReactNode;
  className?: string;
}

export function PokerTable({
  cards,
  centerContent,
  chipRack,
  className = ''
}: PokerTableProps) {
  // Ensure we have exactly 4 cards for the 2x2 layout
  const displayCards = cards.slice(0, 4);

  return (
    <div className={`relative min-h-screen flex flex-col ${className}`}>
      {/* Felt texture background */}
      <div className="absolute inset-0 bg-gradient-radial from-emerald-900/20 via-emerald-950/40 to-black pointer-events-none" />

      {/* Ambient casino lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Main table area */}
      <div className="flex-1 relative z-10 p-4 pb-[230px] md:pb-8 md:p-8 overflow-y-auto">
        {/* Desktop/Tablet: 2x2 Grid Layout */}
        <div className="hidden md:grid md:grid-cols-2 gap-8 max-w-7xl mx-auto h-full">
          {/* Top Left Card */}
          <motion.div
            initial={{ opacity: 0, x: -50, y: -50 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 100 }}
            className="flex items-start justify-start"
          >
            {displayCards[0]}
          </motion.div>

          {/* Top Right Card */}
          <motion.div
            initial={{ opacity: 0, x: 50, y: -50 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
            className="flex items-start justify-end"
          >
            {displayCards[1]}
          </motion.div>

          {/* Center Pot Area - Spans middle */}
          {centerContent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
            >
              <div className="relative">
                {/* Pot glow effect */}
                <div className="absolute inset-0 bg-gradient-radial from-yellow-500/30 via-yellow-500/10 to-transparent rounded-full blur-2xl scale-150" />
                <div className="relative">
                  {centerContent}
                </div>
              </div>
            </motion.div>
          )}

          {/* Bottom Left Card */}
          <motion.div
            initial={{ opacity: 0, x: -50, y: 50 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
            className="flex items-end justify-start"
          >
            {displayCards[2]}
          </motion.div>

          {/* Bottom Right Card */}
          <motion.div
            initial={{ opacity: 0, x: 50, y: 50 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
            className="flex items-end justify-end"
          >
            {displayCards[3]}
          </motion.div>
        </div>

        {/* Mobile: Stacked Layout */}
        <div className="md:hidden space-y-4 pb-56">
          {/* Center content at top for mobile */}
          {centerContent && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              {centerContent}
            </motion.div>
          )}

          {/* Stacked cards */}
          {displayCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 1) }}
            >
              {card}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Chip Rack - Fixed at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 100 }}
        className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black via-black/95 to-black/80 backdrop-blur-sm border-t border-white/10"
      >
        <div className="max-w-7xl mx-auto">
          {chipRack}
        </div>
      </motion.div>
    </div>
  );
}

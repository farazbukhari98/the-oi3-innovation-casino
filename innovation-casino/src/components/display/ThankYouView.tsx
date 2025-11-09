'use client';

import { Session } from '@/types/session';
import { motion } from 'framer-motion';

interface ThankYouViewProps {
  session: Session;
}

export function ThankYouView({ session }: ThankYouViewProps) {
  const layer1Allocations = session.metadata.layer1Allocations ?? 0;
  const layer2Allocations = session.metadata.layer2Allocations ?? 0;
  const totalAllocations =
    session.metadata.totalAllocations ?? layer1Allocations + layer2Allocations;
  const chipsPerType = session.settings.chipsPerType ?? 0;
  const chipsPerLayer = chipsPerType * 3;
  const totalChips = totalAllocations * chipsPerLayer;
  const layer1Chips = layer1Allocations * chipsPerLayer;
  const layer2Chips = layer2Allocations * chipsPerLayer;

  return (
    <div className="h-full relative overflow-hidden flex flex-col items-center justify-center p-8 md:p-16 text-center">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-28 left-1/3 w-[36rem] h-[36rem] rounded-full bg-amber-500/12 blur-3xl" />
        <div className="absolute top-1/2 right-[-8rem] w-[34rem] h-[34rem] rounded-full bg-purple-500/12 blur-3xl" />
        <div className="absolute -bottom-20 left-[-6rem] w-[30rem] h-[30rem] rounded-full bg-pink-500/12 blur-3xl" />
      </div>

      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="text-6xl md:text-9xl mb-8"
      >
        🎉
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-5xl md:text-9xl font-heading text-gold-gradient mb-8 projector-text"
      >
        THANK YOU!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-3xl md:text-6xl text-gray-300 mb-12 projector-text"
      >
        For participating in the Innovation Casino
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.9 }}
        className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-3xl p-8 md:p-12 border-4 border-gold max-w-5xl"
      >
        <h2 className="text-3xl md:text-6xl font-heading text-white mb-6 projector-text">
          Session Complete
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 text-left">
          <div>
            <p className="text-2xl md:text-4xl text-gray-400 mb-2">Total Participants</p>
            <p className="text-4xl md:text-6xl font-bold text-casino-gold projector-text">
              {session.metadata.totalParticipants}
            </p>
          </div>
          <div>
            <p className="text-2xl md:text-4xl text-gray-400 mb-2">Total Chips Invested</p>
            <p className="text-4xl md:text-6xl font-bold text-casino-gold projector-text">
              {totalChips}
            </p>
            <p className="text-lg text-gray-400 mt-2">
              L1: {layer1Chips} chips · L2: {layer2Chips} chips
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-12 space-y-4"
      >
        <p className="text-2xl md:text-5xl text-gray-400 projector-text">
          Your insights have revealed valuable truths about
        </p>
        <p className="text-3xl md:text-6xl text-casino-gold font-bold projector-text">
          your organization&apos;s innovation culture
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="mt-16 flex gap-6 md:gap-8 text-4xl md:text-7xl"
      >
        <span>🎰</span>
        <span>🎲</span>
        <span>💎</span>
        <span>🎯</span>
        <span>🚀</span>
      </motion.div>
    </div>
  );
}

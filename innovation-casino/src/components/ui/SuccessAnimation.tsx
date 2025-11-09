'use client';

import { AnimatePresence, motion } from 'framer-motion';

interface SuccessAnimationProps {
  show: boolean;
  message?: string;
  onClose?: () => void;
  durationMs?: number;
}

export function SuccessAnimation({
  show,
  message = 'Bet Placed!',
  onClose,
  durationMs = 2000,
}: SuccessAnimationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{
              scale: 1.05,
              rotate: 0,
            }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 18,
              duration: durationMs / 1000,
            }}
            className="casino-card max-w-md text-center space-y-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
              className="text-8xl"
            >
              🎰✨
            </motion.div>
            <p className="text-4xl font-heading text-gold-gradient">{message}</p>
            <p className="text-lg text-gray-300">
              Your chips are locked in. Watch the main display for the reveal!
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

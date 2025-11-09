'use client';

import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CONFIG = {
  sm: { emoji: 'text-4xl', text: 'text-base' },
  md: { emoji: 'text-6xl', text: 'text-xl' },
  lg: { emoji: 'text-8xl', text: 'text-2xl' },
};

export function LoadingSpinner({ message = 'Loading...', size = 'md' }: LoadingSpinnerProps) {
  const config = SIZE_CONFIG[size];

  return (
    <div className="flex flex-col items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
        className={`${config.emoji} mb-4`}
      >
        🎰
      </motion.div>
      <p className={`${config.text} text-gray-300`}>{message}</p>
    </div>
  );
}

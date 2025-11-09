'use client';

import { motion } from 'framer-motion';

interface ErrorCardProps {
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'error' | 'warning' | 'info';
}

const VARIANT_CONFIG = {
  error: {
    emoji: '❌',
    titleColor: 'text-red-500',
    borderColor: 'border-red-500',
  },
  warning: {
    emoji: '⚠️',
    titleColor: 'text-yellow-500',
    borderColor: 'border-yellow-500',
  },
  info: {
    emoji: 'ℹ️',
    titleColor: 'text-blue-500',
    borderColor: 'border-blue-500',
  },
};

export function ErrorCard({
  title = 'Error',
  message,
  action,
  variant = 'error',
}: ErrorCardProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`casino-card max-w-md border-l-4 ${config.borderColor}`}
    >
      <div className="text-center">
        <div className="text-5xl mb-4">{config.emoji}</div>
        <h2 className={`text-2xl font-heading ${config.titleColor} mb-3`}>
          {title}
        </h2>
        <p className="text-gray-300 mb-6">{message}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="btn-casino px-6 py-3"
          >
            {action.label}
          </button>
        )}
      </div>
    </motion.div>
  );
}

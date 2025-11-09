'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface VotingTimerProps {
  endTime: number; // Unix timestamp in milliseconds
  onExpire?: () => void;
  showProgress?: boolean;
}

export function VotingTimer({ endTime, onExpire, showProgress = true }: VotingTimerProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  useEffect(() => {
    const updateInitialState = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      queueMicrotask(() => setTimeLeft(remaining));
      queueMicrotask(() => {
        setTotalDuration(remaining);
      });
    };

    updateInitialState();

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      setTimeLeft(remaining);

      if (remaining === 0) {
        if (onExpire) {
          onExpire();
        }
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, onExpire]);

  const seconds = Math.floor(timeLeft / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const progress = totalDuration > 0 ? (timeLeft / totalDuration) * 100 : 0;

  // Determine urgency level for color coding
  const getUrgencyClass = () => {
    if (seconds > 60) return 'text-green-500';
    if (seconds > 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProgressColor = () => {
    if (seconds > 60) return 'bg-green-500';
    if (seconds > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="casino-card text-center"
      >
        {/* Timer display */}
        <div className="mb-2">
          <span className="text-sm text-gray-400 uppercase tracking-wide">
            Time Remaining
          </span>
        </div>
        <motion.div
          key={seconds}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className={`text-5xl font-bold font-mono ${getUrgencyClass()}`}
        >
          {minutes}:{remainingSeconds.toString().padStart(2, '0')}
        </motion.div>

        {/* Progress bar */}
        {showProgress && (
          <div className="mt-4">
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <motion.div
                className={`h-full ${getProgressColor()}`}
                initial={{ width: '100%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        {/* Warning messages */}
        {seconds <= 30 && seconds > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 text-sm text-red-400 font-semibold"
          >
            Hurry! Time is running out!
          </motion.p>
        )}
        {seconds === 0 && (
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-3 text-sm text-red-500 font-bold"
          >
          Time&apos;s up!
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}

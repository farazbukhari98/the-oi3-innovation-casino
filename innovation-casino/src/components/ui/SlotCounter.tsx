'use client';

import { motion } from 'framer-motion';

interface SlotCounterProps {
  value: number;
}

const DIGITS = Array.from({ length: 10 }, (_, index) => index);

export function SlotCounter({ value }: SlotCounterProps) {
  const digits = String(Math.max(0, value)).split('');

  return (
    <div
      className="flex h-20 overflow-hidden text-7xl font-bold projector-text text-casino-gold"
      style={{ lineHeight: '5rem' }}
    >
      {digits.map((digit, index) => (
        <div key={`${digit}-${index}`} className="relative">
          <motion.div
            animate={{ y: `-${Number(digit) * 10}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex flex-col"
          >
            {DIGITS.map((n) => (
              <span key={n} className="flex h-20 items-center justify-center">
                {n}
              </span>
            ))}
          </motion.div>
        </div>
      ))}
    </div>
  );
}

export default SlotCounter;

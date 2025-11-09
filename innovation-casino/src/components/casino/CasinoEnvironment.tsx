'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CasinoEnvironmentProps {
  children: ReactNode;
}

const FLOATING_ICONS = [
  { icon: '🎰', className: 'top-16 left-10 text-8xl', delay: 0 },
  { icon: '🎲', className: 'top-32 right-20 text-6xl', delay: 1 },
  { icon: '🎯', className: 'bottom-24 left-[20%] text-7xl', delay: 2 },
  { icon: '💎', className: 'bottom-36 right-[22%] text-6xl', delay: 3 },
  { icon: '🃏', className: 'top-1/2 left-10 text-7xl', delay: 1.5 },
];

export function CasinoEnvironment({ children }: CasinoEnvironmentProps) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.15),rgba(9,7,20,0.6)_45%,rgba(7,6,18,0.9))]" />
      <div className="absolute inset-0">
        <div className="absolute inset-x-[-40%] -top-64 h-[32rem] bg-gradient-to-b from-yellow-500/30 via-transparent to-transparent blur-3xl opacity-60" />
        <div className="absolute -right-40 -top-32 w-[32rem] h-[32rem] rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute -left-32 bottom-[-12rem] w-[38rem] h-[38rem] rounded-full bg-pink-500/20 blur-3xl" />
        <div className="absolute inset-x-0 top-1/3 h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent opacity-50" />
      </div>

      <div className="absolute inset-0 opacity-40">
        {FLOATING_ICONS.map(({ icon, className, delay }) => (
          <motion.span
            key={icon + className}
            className={`absolute ${className} select-none`}
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 6, repeat: Infinity, delay, ease: 'easeInOut' }}
          >
            {icon}
          </motion.span>
        ))}
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_60%)] opacity-30" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

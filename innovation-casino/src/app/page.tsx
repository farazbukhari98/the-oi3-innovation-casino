'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CasinoEnvironment } from '@/components/casino/CasinoEnvironment';

const FEATURE_CARDS = [
  {
    title: 'Real-Time Betting Energy',
    description: 'Watch chips stack live as your team places bold innovation bets.',
    icon: '💥',
  },
  {
    title: 'Facilitator Superpowers',
    description: 'Launch phases, freeze the tables, and reveal results with one tap.',
    icon: '🎛️',
  },
  {
    title: 'Immersive Display',
    description: 'Project a dazzling casino floor experience for every participant.',
    icon: '🖥️',
  },
];

export default function HomePage() {
  return (
    <CasinoEnvironment>
      <div className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="max-w-5xl w-full space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center space-y-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-black/40 border border-white/10 uppercase tracking-[0.35em] text-xs text-gray-300"
            >
              <span>🎲</span> Step into the Innovation Casino
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-heading text-gold-gradient leading-tight">
              Bet on bold ideas. Reveal your real innovation odds.
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
              Turn your session into a high-stakes casino night where every chip, table,
              and reveal uncovers how daring your organization really is.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="grid gap-5 sm:grid-cols-2"
          >
            <Link
              href="/control"
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent backdrop-blur-xl"
            >
              <div className="absolute inset-0 opacity-40 group-hover:opacity-70 transition-opacity bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.35),transparent_55%)]" />
              <div className="flex h-full flex-col gap-3 px-8 py-10 relative z-10">
                <span className="text-4xl">🎮</span>
                <h2 className="text-3xl font-heading text-white">Facilitator Control Hub</h2>
                <p className="text-gray-300">
                  Spin up sessions, move through phases, and orchestrate the entire casino floor.
                </p>
                <span className="btn-casino inline-flex w-fit px-6 py-3 text-sm">
                  Enter the Pit Boss View
                </span>
              </div>
            </Link>

            <Link
              href="/display"
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/20 via-indigo-500/10 to-transparent backdrop-blur-xl"
            >
              <div className="absolute inset-0 opacity-40 group-hover:opacity-70 transition-opacity bg-[radial-gradient(circle_at_top,rgba(43,201,255,0.35),transparent_55%)]" />
              <div className="flex h-full flex-col gap-3 px-8 py-10 relative z-10">
                <span className="text-4xl">📺</span>
                <h2 className="text-3xl font-heading text-white">Main Display Screen</h2>
                <p className="text-gray-300">
                  Project the neon tables, chip stacks, and reveals to energize your crowd.
                </p>
                <span className="btn-casino inline-flex w-fit px-6 py-3 text-sm">
                  Light Up the Casino Floor
                </span>
              </div>
            </Link>
          </motion.div>

          <div className="casino-neon-divider" />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            viewport={{ once: true }}
            className="grid gap-6 md:grid-cols-3"
          >
            {FEATURE_CARDS.map(({ title, description, icon }, index) => (
              <div
                key={title}
                className="casino-card animate-casino-float"
                style={{ animationDelay: `${index * 0.5}s` }}
              >
                <div className="text-4xl mb-4">{icon}</div>
                <h3 className="text-xl font-heading text-white mb-2">
                  {title}
                </h3>
                <p className="text-gray-300 text-sm">
                  {description}
                </p>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-center space-y-3"
          >
            <p className="text-gray-400">
              Participants join from their phones. Scan the QR displayed on the big screen to enter.
            </p>
            <p className="text-sm text-gray-500">
              Ready to deal the next hand of innovation bets? Start a new session from the control hub.
            </p>
          </motion.div>
        </div>
      </div>
    </CasinoEnvironment>
  );
}

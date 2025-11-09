'use client';

import { Session } from '@/types/session';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { ParticipantCounter } from './ParticipantCounter';
import { useMemo } from 'react';
import { getSessionQRUrl } from '@/lib/utils';

interface PreSessionViewProps {
  session: Session;
}

export function PreSessionView({ session }: PreSessionViewProps) {
  const configuredBase =
    session.settings.participantBaseUrl?.trim() ||
    process.env.NEXT_PUBLIC_PARTICIPANT_BASE_URL?.trim();
  const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : undefined;
  const joinUrl = useMemo(
    () =>
      getSessionQRUrl(session.id, {
        baseUrl: session.settings.participantBaseUrl,
        fallbackOrigin: runtimeOrigin,
      }),
    [session.id, session.settings.participantBaseUrl, runtimeOrigin]
  );
  const shareReady = Boolean(configuredBase) || Boolean(runtimeOrigin);
  const scenarioCards = session.scenarioOrder.map((scenarioId, index) => ({
    ...session.scenarios[scenarioId],
    id: scenarioId,
    index: index + 1,
  }));

  return (
    <div className="display-container flex flex-col items-center justify-center p-4 text-center">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-[-20%] -top-40 h-72 bg-gradient-to-b from-yellow-500/20 via-transparent to-transparent blur-3xl" />
        <div className="absolute -left-32 top-1/4 w-64 h-64 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute -right-32 top-1/2 w-64 h-64 rounded-full bg-sky-500/20 blur-3xl" />
      </div>

      {/* Content wrapper to control overall scale */}
      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center">

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-display-3xl font-heading text-gold-gradient mb-2 projector-text"
        >
          WELCOME TO THE
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="text-display-4xl font-heading text-gold-gradient mb-4 projector-text"
        >
          🎰 INNOVATION CASINO 🎰
        </motion.h2>

      {/* QR Code */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        className="relative mb-8"
      >
        <div className="absolute inset-0 blur-3xl bg-yellow-400/30 opacity-40" />

        {/* Poker chip container */}
        <div className="relative w-[min(60vh,400px)] h-[min(60vh,400px)]">
          {/* Outer red ring with shadow for 3D effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#e53e3e] to-[#b91c1c] shadow-[0_45px_85px_-50px_rgba(0,0,0,0.8),inset_0_-12px_24px_rgba(0,0,0,0.3),inset_0_4px_12px_rgba(255,255,255,0.2)]" />

          {/* White segments */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute inset-0"
              style={{
                transform: `rotate(${i * 45}deg)`,
              }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[48px] h-[60px] bg-gradient-to-b from-white to-gray-100 rounded-b-xl shadow-[inset_0_-3px_6px_rgba(0,0,0,0.1)]" />
            </div>
          ))}

          {/* Dashed ring pattern */}
          <div className="absolute inset-[48px] rounded-full border-[4px] border-dashed border-white/40" />

          {/* Inner shadow ring */}
          <div className="absolute inset-[54px] rounded-full shadow-[inset_0_0_24px_rgba(0,0,0,0.4)]" />

          {/* Center cream area for QR code */}
          <div className="absolute inset-[60px] rounded-full bg-[#f5f0de] shadow-[inset_0_6px_18px_rgba(0,0,0,0.25),0_4px_12px_rgba(0,0,0,0.15)]">
            {/* Inner decorative border */}
            <div className="absolute inset-[12px] rounded-full border-[3px] border-black/10" />

            {/* QR Code */}
            <div className="absolute inset-[24px] flex items-center justify-center">
              {shareReady ? (
                <QRCodeSVG
                  value={joinUrl}
                  size={256}
                  level="H"
                  fgColor="#0a0a0a"
                  bgColor="transparent"
                  includeMargin={false}
                  style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-center text-display-sm text-gray-500 px-4 projector-text">
                  Preparing session link…
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Instructions */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="text-display-2xl text-gray-300 mb-6 projector-text"
      >
        Scan to Join the Session
      </motion.p>

      {scenarioCards.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="max-w-6xl mx-auto mb-6 grid grid-cols-2 gap-4"
        >
          {scenarioCards.map((scenario) => (
            <div key={scenario.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left space-y-1">
              <p className="text-display-xs uppercase tracking-[0.3em] text-gray-400">
                Scenario {scenario.index}
              </p>
              <h3 className="text-display-lg font-heading text-white projector-text">
                {scenario.title}
              </h3>
              <p className="text-display-sm text-gray-300 projector-text">
                {scenario.description}
              </p>
            </div>
          ))}
        </motion.div>
      )}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="text-display-lg text-casino-gold font-mono mb-8"
      >
        {shareReady ? joinUrl : 'Generating link...'}
      </motion.p>

      {/* Participant Counter */}
      <div className="mt-4">
        <ParticipantCounter
          current={session.metadata.totalParticipants}
          total={150}
        />
      </div>
    </div>
    </div>
  );
}

'use client';

import { Session, SessionStatus } from '@/types/session';
import { motion } from 'framer-motion';

interface SessionControlsProps {
  session: Session;
  onUpdateStatus: (status: SessionStatus) => Promise<void>;
}

// Define the 7-step flow
const STATUS_FLOW: { status: SessionStatus; label: string; icon: string; description: string }[] = [
  {
    status: 'waiting',
    label: 'Pre-Session Lounge',
    icon: '⏳',
    description: 'Participants joining',
  },
  {
    status: 'betting_layer1',
    label: 'Member Access Level',
    icon: '🎫',
    description: 'Prioritize focus areas',
  },
  {
    status: 'results_layer1',
    label: 'Member Access Insights',
    icon: '📊',
    description: 'Reveal org-wide priorities',
  },
  {
    status: 'routing',
    label: 'Routing High Rollers',
    icon: '🔀',
    description: 'Assign each player to their focus area',
  },
  {
    status: 'betting_layer2',
    label: 'High Roller Level',
    icon: '🎰',
    description: 'Bet on bold solutions',
  },
  {
    status: 'results_layer2',
    label: 'High Roller Insights',
    icon: '📈',
    description: 'Showcase solution appetite',
  },
  {
    status: 'insights',
    label: 'Combined Insights',
    icon: '💡',
    description: 'Combined analysis',
  },
];

const ACTIONS: Partial<
  Record<
    SessionStatus,
    {
      nextStatus: SessionStatus;
      label: string;
      description: string;
      icon: string;
    }
  >
> = {
  waiting: {
    nextStatus: 'betting_layer1',
    label: 'Open Member Access Level',
    description: 'Unlock phones so everyone can invest in core focus areas.',
    icon: '🎲',
  },
  betting_layer1: {
    nextStatus: 'results_layer1',
    label: 'Show Member Access Insights',
    description: 'Freeze submissions and reveal the organizational priorities.',
    icon: '📊',
  },
  results_layer1: {
    nextStatus: 'routing',
    label: 'Route High Rollers',
    description: 'Send everyone to their personal focus area and prep solutions.',
    icon: '🔀',
  },
  routing: {
    nextStatus: 'betting_layer2',
    label: 'Open High Roller Level',
    description: 'Start solution betting for every routed group.',
    icon: '🎰',
  },
  betting_layer2: {
    nextStatus: 'results_layer2',
    label: 'Show High Roller Insights',
    description: 'Reveal which solutions and boldness tiers earned the most chips.',
    icon: '📈',
  },
  results_layer2: {
    nextStatus: 'insights',
    label: 'Show Combined Insights',
    description: 'Display the boldness + priority story for the room.',
    icon: '💡',
  },
  insights: {
    nextStatus: 'closed',
    label: 'End Session',
    description: 'Fade to the thank-you screen and wrap facilitation.',
    icon: '🏁',
  },
  betting: {
    nextStatus: 'results',
    label: 'Show Legacy Results',
    description: 'Reveal the original final stacks.',
    icon: '📊',
  },
  results: {
    nextStatus: 'closed',
    label: 'End Legacy Session',
    description: 'Close the experience for older sessions.',
    icon: '🏁',
  },
};

export function SessionControls({
  session,
  onUpdateStatus,
}: SessionControlsProps) {
  // Find current step index
  const currentStepIndex = STATUS_FLOW.findIndex((s) => s.status === session.status);
  const primaryAction = ACTIONS[session.status];

  const handleAction = async (newStatus: SessionStatus) => {
    const statusLabel = STATUS_FLOW.find(s => s.status === newStatus)?.label || newStatus;
    if (confirm(`Advance to ${statusLabel}?`)) {
      await onUpdateStatus(newStatus);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-xl font-heading text-white">Session Flow Control</h3>
        <p className="text-sm text-gray-400">
          Navigate through the 7-step innovation casino experience
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-1">
        {STATUS_FLOW.map((step, index) => (
          <div key={step.status} className="flex items-center">
            <motion.div
              initial={false}
              animate={{
                scale: index === currentStepIndex ? 1.1 : 1,
                opacity: index <= currentStepIndex ? 1 : 0.3
              }}
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs
                ${index === currentStepIndex
                  ? 'bg-casino-gold text-black font-bold'
                  : index < currentStepIndex
                    ? 'bg-green-600 text-white'
                    : 'bg-white/10 text-white/50'}
              `}
            >
              {index < currentStepIndex ? '✓' : index + 1}
            </motion.div>
            {index < STATUS_FLOW.length - 1 && (
              <div className={`w-4 h-0.5 ${index < currentStepIndex ? 'bg-green-600' : 'bg-white/10'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Current status display */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{STATUS_FLOW[currentStepIndex]?.icon || '❓'}</span>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400">Current Phase</p>
              <p className="text-lg font-semibold text-white">
                {STATUS_FLOW[currentStepIndex]?.label || session.status}
              </p>
            </div>
          </div>
          {session.status.includes('betting') && (
            <span className="animate-pulse text-xs text-green-400 font-semibold">● LIVE</span>
          )}
        </div>
        <p className="text-sm text-gray-300">
          {STATUS_FLOW[currentStepIndex]?.description || 'Unknown phase'}
        </p>
      </div>

      {/* Next action button */}
      {primaryAction ? (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleAction(primaryAction.nextStatus)}
          className="w-full rounded-xl border border-casino-gold/50 bg-gradient-to-r from-casino-gold/20 to-yellow-600/10 px-6 py-4 text-left hover:from-casino-gold/30 hover:to-yellow-600/20 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{primaryAction.icon}</span>
                <span className="uppercase tracking-wide text-sm font-semibold text-white">
                  {primaryAction.label}
                </span>
              </div>
              <p className="text-sm text-gray-300">{primaryAction.description}</p>
            </div>
            <svg className="w-6 h-6 text-casino-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </motion.button>
      ) : session.status !== 'closed' ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-center text-sm text-gray-400">
          All steps completed. You can now wrap up or export results.
        </div>
      ) : (
        <div className="text-center text-sm text-gray-400">
          Session has ended. Export results from the toolkit below.
        </div>
      )}

      {session.status === 'closed' && (
        <div className="text-center text-sm text-gray-400">
          Session has ended. Export results from the toolkit below.
        </div>
      )}
    </div>
  );
}

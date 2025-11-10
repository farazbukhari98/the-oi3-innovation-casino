'use client';

import { useRef, useState, useCallback } from 'react';
import { useVoting } from '@/hooks/useVoting';
import { useSound } from '@/hooks/useSound';
import { useParticipantState } from '@/hooks/useParticipantState';
import { Session, ScenarioState, SolutionScenario } from '@/types/session';
import { Participant } from '@/types/participant';
import { ChipType, VotingLayer } from '@/types/vote';
import { getErrorMessage } from '@/lib/utils';
import { DEFAULT_CHIPS_PER_TYPE, BOLDNESS_META } from '@/lib/constants';

// Components
import { PokerTable } from './PokerTable';
import { ChipRack } from './ChipRack';
import { ScenarioCard } from './ScenarioCard';
import { ChipAnimation, useFlyingChips } from './ChipAnimation';
import { SubmissionSequence } from './SubmissionSequence';

interface VotingInterfaceV2Props {
  session: Session;
  participant: Participant;
  currentLayer: VotingLayer;
  onParticipantUpdate?: (participant: Participant) => void;
}

export function VotingInterfaceV2({
  session,
  participant,
  currentLayer,
  onParticipantUpdate,
}: VotingInterfaceV2Props) {
  const chipsPerType = session.settings.chipsPerType ?? DEFAULT_CHIPS_PER_TYPE;

  // Determine which scenarios to show based on layer
  const memberAccessScenarios: ScenarioState[] = session.scenarioOrder
    .map((id) => session.scenarios[id])
    .filter((scenario): scenario is ScenarioState => Boolean(scenario));

  const highRollerScenarios: SolutionScenario[] =
    participant.layer1Selection
      ? session.solutionsByPainPoint[participant.layer1Selection] ?? []
      : [];

  const scenariosToShow = currentLayer === 'layer1'
    ? memberAccessScenarios
    : highRollerScenarios;

  const scenarioIds = scenariosToShow.map(s => s.id);

  // Core hooks
  const { allocations, remaining, totalAllocated, adjustAllocation, reset, isComplete } = useVoting(
    scenarioIds,
    chipsPerType
  );
  const { playSound, toggleMute, isMuted } = useSound();
  const { saveState } = useParticipantState(session.id);
  const { flyingChips, addFlyingChip, removeFlyingChip } = useFlyingChips();

  // State
  const [activeChip, setActiveChip] = useState<ChipType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmission, setShowSubmission] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const chipRackRef = useRef<HTMLDivElement | null>(null);

  const totalRequired = chipsPerType * 3;

  // Handle chip placement
  const handlePlaceChip = useCallback((scenarioId: string) => {
    if (!activeChip || remaining[activeChip] <= 0) return;

    adjustAllocation(scenarioId, activeChip, 1);
    playSound('chipPlace');

    // Animate chip flying from rack to card
    const fromEl = chipRackRef.current;
    const toEl = cardRefs.current[scenarioId];
    if (fromEl && toEl) {
      addFlyingChip(activeChip, fromEl, toEl, false);
    }

    // Auto-deselect if no more chips of this type
    if (remaining[activeChip] === 1) {
      setActiveChip(null);
    }
  }, [activeChip, remaining, adjustAllocation, playSound, addFlyingChip]);

  // Handle chip removal
  const handleRemoveChip = useCallback((scenarioId: string, chipType: ChipType) => {
    const allocation = allocations[scenarioId];
    if (!allocation || allocation[chipType] <= 0) return;

    adjustAllocation(scenarioId, chipType, -1);
    playSound('chipRemove');

    // Animate chip flying back to rack
    const fromEl = cardRefs.current[scenarioId];
    const toEl = chipRackRef.current;
    if (fromEl && toEl) {
      addFlyingChip(chipType, fromEl, toEl, true);
    }
  }, [allocations, adjustAllocation, playSound, addFlyingChip]);

  // Handle submission
  const handleSubmit = async () => {
    if (!isComplete) return;

    setSubmitting(true);
    setErrorMessage(null);
    setShowSubmission(true);
    playSound('chipsLock');

    try {
      const response = await fetch('/api/vote/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          participantId: participant.id,
          allocations,
          layer: currentLayer,
          painPointId: currentLayer === 'layer2' ? participant.layer1Selection : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit allocations');
      }

      let updatedParticipant: Participant;
      if (currentLayer === 'layer1') {
        const selection = data.layer1Selection ?? participant.layer1Selection;
        updatedParticipant = {
          ...participant,
          layer1Completed: true,
          layer1Selection: selection,
        };
      } else {
          updatedParticipant = {
            ...participant,
            layer2Completed: true,
          };
      }

      saveState({
        ...updatedParticipant,
        participantId: participant.id,
        sessionId: session.id,
        name: participant.name,
      });
      onParticipantUpdate?.(updatedParticipant);

      playSound('success');
      reset();
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, 'Failed to submit allocations'));
      playSound('error');
      setShowSubmission(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Create scenario cards
  const isHighRoller = currentLayer === 'layer2';

  const cards = scenariosToShow.map((scenario, index) => {
    const boldnessTier = isHighRoller && 'boldness' in scenario ? scenario.boldness : undefined;
    const tierMeta = boldnessTier ? BOLDNESS_META[boldnessTier] : undefined;
    return (
    <div
      key={scenario.id}
      ref={(el) => { cardRefs.current[scenario.id] = el; }}
    >
      <ScenarioCard
        title={scenario.title}
        description={scenario.description}
        allocation={allocations[scenario.id] || { time: 0, talent: 0, trust: 0 }}
        activeChip={activeChip}
        onPlaceChip={() => handlePlaceChip(scenario.id)}
        onRemoveChip={(type) => handleRemoveChip(scenario.id, type)}
        index={index}
        badgeLabel={isHighRoller ? tierMeta?.shortLabel : undefined}
        badgeDescription={isHighRoller ? (scenario as SolutionScenario).innovationLabel : undefined}
        badgeAccent={tierMeta?.accent}
      />
    </div>
  );
  });

  // Center content (pot area)
  const centerContent = (
    <div className="text-center space-y-2 p-6">
      <div className="text-6xl font-bold text-casino-gold">
        {totalAllocated}
      </div>
      <div className="text-sm text-white/60 uppercase tracking-wider">
        Chips in Play
      </div>
      <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-casino-gold to-yellow-500 transition-all duration-300"
          style={{ width: `${(totalAllocated / totalRequired) * 100}%` }}
        />
      </div>
    </div>
  );

  // Chip rack component
  const chipRack = (
    <div ref={chipRackRef}>
      <ChipRack
        activeChip={activeChip}
        onChipSelect={setActiveChip}
        remaining={remaining}
        totalPerType={chipsPerType}
      />
      <div className="flex items-center justify-between px-6 pb-4">
        <button
          onClick={toggleMute}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isComplete || submitting}
          className={`px-8 py-3 rounded-lg font-bold text-lg transition-all ${
            isComplete && !submitting
              ? 'bg-gradient-to-r from-casino-gold to-yellow-600 text-black hover:shadow-lg hover:shadow-yellow-500/30'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          }`}
        >
          {isComplete ? 'Lock In Your Bets 🎰' : `Place ${totalRequired - totalAllocated} More Chips`}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <PokerTable
        cards={cards}
        centerContent={centerContent}
        chipRack={chipRack}
      />

      {/* Flying chip animations */}
      <ChipAnimation
        chips={flyingChips}
        onAnimationComplete={removeFlyingChip}
      />

      {/* Submission sequence */}
      <SubmissionSequence
        show={showSubmission}
        totalChips={totalAllocated}
        onComplete={() => {
          setShowSubmission(false);
          // Redirect or show next state will be handled by parent
        }}
      />

      {/* Error message */}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg bg-red-600/90 text-white shadow-2xl">
          <p className="font-semibold">Error</p>
          <p className="text-sm mt-1">{errorMessage}</p>
          <button
            onClick={() => setErrorMessage(null)}
            className="mt-2 text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  );
}

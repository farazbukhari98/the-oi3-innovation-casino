import { database } from './firebase';
import { ref, set, get, update, push, query, orderByChild, equalTo } from 'firebase/database';
import {
  Session,
  SessionStatus,
  Scenario,
  ScenarioState,
  SolutionScenario,
} from '@/types/session';
import { Participant } from '@/types/participant';
import { Vote, ScenarioAllocations, ChipAllocation, VotingLayer } from '@/types/vote';
import { SessionResults, ScenarioResults, LayerResults, DepartmentLayerStats } from '@/types/results';
import {
  PAIN_POINT_DEFINITIONS,
  DEFAULT_SCENARIOS,
  DEFAULT_CHIPS_PER_TYPE,
  DEFAULT_LAYER_DURATIONS,
} from './constants';
import { calculatePercentage, determineTopScenario, sumChipAllocation } from './utils';
import { buildResultsSummary } from './gameLogic';

const SESSIONS_ROOT = 'sessions';
const PARTICIPANTS_ROOT = 'participants';
const VOTES_ROOT = 'votes';
const RESULTS_ROOT = 'results';
const PLAYER_AVATARS = ['♦️', '♥️', '♣️', '♠️', '🎲', '💎'];

const DEFAULT_SOLUTIONS_BY_PAIN_POINT: Record<string, SolutionScenario[]> = PAIN_POINT_DEFINITIONS.reduce(
  (acc, definition) => {
    acc[definition.id] = definition.solutions.map((solution) => ({ ...solution }));
    return acc;
  },
  {} as Record<string, SolutionScenario[]>
);

function cloneSolutionsRecord(): Record<string, SolutionScenario[]> {
  return Object.entries(DEFAULT_SOLUTIONS_BY_PAIN_POINT).reduce((acc, [painPointId, solutions]) => {
    acc[painPointId] = solutions.map((solution) => ({ ...solution }));
    return acc;
  }, {} as Record<string, SolutionScenario[]>);
}

function buildScenarioState(id: string, title: string, description: string): ScenarioState {
  return {
    id,
    title,
    description,
    createdAt: Date.now(),
  };
}

function ensureScenarioRecord(
  session: Partial<Session> & {
    scenarios?: Record<string, ScenarioState>;
    scenarioOrder?: string[];
  }
) {
  if (session.scenarios && Object.keys(session.scenarios).length > 0) {
    const order = session.scenarioOrder && session.scenarioOrder.length > 0
      ? session.scenarioOrder
      : Object.keys(session.scenarios);
    return { scenarios: session.scenarios, scenarioOrder: order };
  }

  const defaultDeck = DEFAULT_SCENARIOS.map((scenario) =>
    buildScenarioState(scenario.id, scenario.title, scenario.description)
  );
  const record = defaultDeck.reduce<Record<string, ScenarioState>>((acc, scenario) => {
    acc[scenario.id] = scenario;
    return acc;
  }, {});

  return {
    scenarios: record,
    scenarioOrder: defaultDeck.map((scenario) => scenario.id),
  };
}

function ensureSolutionsByPainPoint(
  solutions?: Record<string, SolutionScenario[]>
): Record<string, SolutionScenario[]> {
  if (solutions && Object.keys(solutions).length > 0) {
    return solutions;
  }
  return cloneSolutionsRecord();
}

export type SessionSettingsOverride = Partial<Omit<Session['settings'], 'layerDurations'>> & {
  layerDurations?: Partial<Session['settings']['layerDurations']>;
};

function sanitizeBaseUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

function deriveParticipantBaseUrl(base?: string): string {
  return (
    sanitizeBaseUrl(base) ??
    sanitizeBaseUrl(process.env.NEXT_PUBLIC_PARTICIPANT_BASE_URL) ??
    sanitizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL) ??
    ''
  );
}

function ensureSessionSettings(settings?: SessionSettingsOverride): Session['settings'] {
  return {
    votingDuration: settings?.votingDuration ?? DEFAULT_LAYER_DURATIONS.layer1,
    requireDepartment: settings?.requireDepartment ?? true,
    allowRevotes: settings?.allowRevotes ?? false,
    chipsPerType: settings?.chipsPerType ?? DEFAULT_CHIPS_PER_TYPE,
    participantBaseUrl: deriveParticipantBaseUrl(settings?.participantBaseUrl),
    layerDurations: {
      layer1: settings?.layerDurations?.layer1 ?? DEFAULT_LAYER_DURATIONS.layer1,
      layer2: settings?.layerDurations?.layer2 ?? DEFAULT_LAYER_DURATIONS.layer2,
    },
  };
}

function ensureSessionMetadata(metadata?: Partial<Session['metadata']>): Session['metadata'] {
  const legacyLayer1 = metadata?.layer1Allocations ?? metadata?.totalAllocations ?? 0;
  const layer2 = metadata?.layer2Allocations ?? 0;
  const totalAllocations =
    metadata?.totalAllocations ??
    legacyLayer1 + layer2;

  return {
    totalParticipants: metadata?.totalParticipants ?? 0,
    layer1Allocations: legacyLayer1,
    layer2Allocations: layer2,
    totalAllocations,
  };
}

// ==================== SESSION FUNCTIONS ====================

export async function createSession(
  facilitatorId: string,
  settingsOverride?: SessionSettingsOverride
): Promise<string> {
  const sessionsRef = ref(database, SESSIONS_ROOT);
  const newSessionRef = push(sessionsRef);
  const sessionId = newSessionRef.key!;

  const scenarioStates = DEFAULT_SCENARIOS.map((scenario) =>
    buildScenarioState(scenario.id, scenario.title, scenario.description)
  );
  const scenarioOrder = scenarioStates.map((scenario) => scenario.id);
  const scenariosRecord = scenarioStates.reduce<Record<string, ScenarioState>>((acc, scenario) => {
    acc[scenario.id] = scenario;
    return acc;
  }, {});

  const newSession: Session = {
    id: sessionId,
    facilitatorId,
    createdAt: Date.now(),
    status: 'waiting',
    scenarioOrder,
    scenarios: scenariosRecord,
    solutionsByPainPoint: cloneSolutionsRecord(),
    settings: ensureSessionSettings(settingsOverride),
    metadata: ensureSessionMetadata(),
  };

  await set(newSessionRef, newSession);
  return sessionId;
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const sessionRef = ref(database, `${SESSIONS_ROOT}/${sessionId}`);
  const snapshot = await get(sessionRef);

  if (!snapshot.exists()) {
    return null;
  }

  const rawSession = snapshot.val() as Session & {
    scenarios?: Record<string, ScenarioState>;
    scenarioOrder?: string[];
  };

  const { scenarios, scenarioOrder } = ensureScenarioRecord(rawSession);

  return {
    id: rawSession.id,
    facilitatorId: rawSession.facilitatorId,
    createdAt: rawSession.createdAt,
    status: rawSession.status as SessionStatus,
    scenarioOrder,
    scenarios,
    solutionsByPainPoint: ensureSolutionsByPainPoint(rawSession.solutionsByPainPoint),
    settings: ensureSessionSettings(rawSession.settings),
    metadata: ensureSessionMetadata(rawSession.metadata),
  };
}

export async function updateSessionStatus(
  sessionId: string,
  status: SessionStatus,
): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  await update(ref(database), {
    [`${SESSIONS_ROOT}/${sessionId}/status`]: status,
  });
}

export async function updateSessionScenario(
  sessionId: string,
  scenario: Scenario
): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  if (!session.scenarios[scenario.id]) {
    throw new Error('Scenario not found');
  }

  const updates: Record<string, unknown> = {
    [`${SESSIONS_ROOT}/${sessionId}/scenarios/${scenario.id}/title`]: scenario.title,
    [`${SESSIONS_ROOT}/${sessionId}/scenarios/${scenario.id}/description`]: scenario.description,
  };

  await update(ref(database), updates);
}

// ==================== PARTICIPANT FUNCTIONS ====================

export async function registerParticipant(
  sessionId: string,
  name: string,
  department: string,
  deviceId: string
): Promise<string> {
  const participantsRef = ref(database, PARTICIPANTS_ROOT);
  const existingQuery = query(
    participantsRef,
    orderByChild('deviceId'),
    equalTo(deviceId)
  );
  const snapshot = await get(existingQuery);

  if (snapshot.exists()) {
    const participants = snapshot.val() as Record<string, Participant>;
    const existing = Object.values(participants).find(
      (participant) => participant.sessionId === sessionId
    );
    if (existing) {
      return existing.id;
    }
  }

  const newParticipantRef = push(participantsRef);
  const participantId = newParticipantRef.key!;

  const newParticipant: Participant = {
    id: participantId,
    sessionId,
    name,
    department,
    deviceId,
    registeredAt: Date.now(),
    playerAvatar: PLAYER_AVATARS[Math.floor(Math.random() * PLAYER_AVATARS.length)],
    layer1Completed: false,
    layer2Completed: false,
  };

  await set(newParticipantRef, newParticipant);

  const participantCountRef = ref(database, `${SESSIONS_ROOT}/${sessionId}/metadata/totalParticipants`);
  const countSnapshot = await get(participantCountRef);
  const currentCount = countSnapshot.val() || 0;
  await set(participantCountRef, currentCount + 1);

  return participantId;
}

export async function getParticipant(participantId: string): Promise<Participant | null> {
  const participantRef = ref(database, `${PARTICIPANTS_ROOT}/${participantId}`);
  const snapshot = await get(participantRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val() as Participant;
}

export async function getSessionParticipants(sessionId: string): Promise<Participant[]> {
  const participantsRef = ref(database, PARTICIPANTS_ROOT);
  const sessionQuery = query(
    participantsRef,
    orderByChild('sessionId'),
    equalTo(sessionId)
  );
  const snapshot = await get(sessionQuery);

  if (!snapshot.exists()) {
    return [];
  }

  return Object.values(snapshot.val() as Record<string, Participant>);
}

// ==================== VOTE FUNCTIONS ====================

export interface SubmitAllocationInput {
  sessionId: string;
  participantId: string;
  allocations: ScenarioAllocations;
  layer: VotingLayer;
  painPointId?: string;
}

export interface SubmitVoteResult {
  voteId: string;
  layer1Selection?: string;
}

export async function submitVote(input: SubmitAllocationInput): Promise<SubmitVoteResult> {
  const { sessionId, participantId, allocations, layer, painPointId } = input;
  const session = await getSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  const participant = await getParticipant(participantId);
  if (!participant) {
    throw new Error('Participant not found');
  }

  const chipsPerType = session.settings.chipsPerType;
  const requiredTotal = chipsPerType * 3;

  const scenarioIds = layer === 'layer1'
    ? session.scenarioOrder
    : session.solutionsByPainPoint[painPointId ?? '']?.map((solution) => solution.id) ?? [];

  if (scenarioIds.length === 0) {
    throw new Error('No scenarios configured for this layer');
  }

  const totals = Object.entries(allocations).map(([scenarioId, allocation]) => {
    if (!scenarioIds.includes(scenarioId)) {
      throw new Error('Invalid scenario in allocation payload');
    }
    return sumChipAllocation(allocation);
  });

  const totalPlaced = totals.reduce((sum, value) => sum + value, 0);
  if (totalPlaced !== requiredTotal) {
    throw new Error(`Allocations must use all ${requiredTotal} chips`);
  }

  const alreadySubmitted = await hasParticipantSubmittedAllocation(participantId, layer);
  if (alreadySubmitted) {
    throw new Error('Allocation already submitted');
  }

  const votesRef = ref(database, VOTES_ROOT);
  const newVoteRef = push(votesRef);
  const voteId = newVoteRef.key!;
  const submittedAt = Date.now();

  const vote: Vote = {
    id: voteId,
    participantId,
    sessionId,
    layer,
    allocations,
    totalChips: totalPlaced,
    submittedAt,
    ...(painPointId ? { painPointId } : {}),
  };

  await set(newVoteRef, vote);

  const participantUpdates: Record<string, unknown> = {};
  const result: SubmitVoteResult = { voteId };
  if (layer === 'layer1') {
    const winner = determineTopScenario(allocations);
    if (!winner) {
      throw new Error('Unable to determine top pain point');
    }
    result.layer1Selection = winner;
    participantUpdates[`${PARTICIPANTS_ROOT}/${participantId}/layer1Completed`] = true;
    participantUpdates[`${PARTICIPANTS_ROOT}/${participantId}/layer1Selection`] = winner;
    participantUpdates[`${PARTICIPANTS_ROOT}/${participantId}/layer1SubmittedAt`] = submittedAt;
  } else {
    if (!painPointId) {
      throw new Error('Pain point ID is required for layer 2');
    }
    if (participant.layer1Selection && participant.layer1Selection !== painPointId) {
      throw new Error('Participant is not routed to this pain point');
    }
    participantUpdates[`${PARTICIPANTS_ROOT}/${participantId}/layer2Completed`] = true;
    participantUpdates[`${PARTICIPANTS_ROOT}/${participantId}/layer2SubmittedAt`] = submittedAt;
  }

  const metadataPath = `${SESSIONS_ROOT}/${sessionId}/metadata/${layer === 'layer1' ? 'layer1Allocations' : 'layer2Allocations'}`;
  const metadataSnapshot = await get(ref(database, metadataPath));
  const currentAllocations = metadataSnapshot.val() || 0;
  participantUpdates[metadataPath] = currentAllocations + 1;

  const totalAllocationsPath = `${SESSIONS_ROOT}/${sessionId}/metadata/totalAllocations`;
  const totalAllocationsSnapshot = await get(ref(database, totalAllocationsPath));
  const currentTotalAllocations = totalAllocationsSnapshot.val() || 0;
  participantUpdates[totalAllocationsPath] = currentTotalAllocations + 1;

  await update(ref(database), participantUpdates);

  return result;
}

export async function getSessionAllocations(sessionId: string): Promise<Vote[]> {
  const votesRef = ref(database, VOTES_ROOT);
  const sessionQuery = query(
    votesRef,
    orderByChild('sessionId'),
    equalTo(sessionId)
  );
  const snapshot = await get(sessionQuery);

  if (!snapshot.exists()) {
    return [];
  }

  return Object.values(snapshot.val()) as Vote[];
}

export async function hasParticipantSubmittedAllocation(
  participantId: string,
  layer: VotingLayer
): Promise<boolean> {
  const participant = await getParticipant(participantId);
  if (!participant) {
    return false;
  }

  return layer === 'layer1'
    ? Boolean(participant.layer1Completed)
    : Boolean(participant.layer2Completed);
}

// ==================== RESULTS FUNCTIONS ====================

function aggregateLayerResults(
  scenarios: Scenario[],
  votes: Vote[]
): LayerResults {
  const totals: Record<string, ChipAllocation & { totalChips: number }> = {};
  scenarios.forEach((scenario) => {
    totals[scenario.id] = { time: 0, talent: 0, trust: 0, totalChips: 0 };
  });

  votes.forEach((vote) => {
    Object.entries(vote.allocations).forEach(([scenarioId, allocation]) => {
      if (!totals[scenarioId]) {
        totals[scenarioId] = { time: 0, talent: 0, trust: 0, totalChips: 0 };
      }
      totals[scenarioId].time += allocation.time;
      totals[scenarioId].talent += allocation.talent;
      totals[scenarioId].trust += allocation.trust;
      totals[scenarioId].totalChips += sumChipAllocation(allocation);
    });
  });

  const scenariosWithTotals: ScenarioResults[] = scenarios.map((scenario) => {
    const scenarioTotals = totals[scenario.id] || { time: 0, talent: 0, trust: 0, totalChips: 0 };
    const totalForScenario = scenarioTotals.totalChips || 0;
    return {
      scenarioId: scenario.id,
      title: scenario.title,
      description: scenario.description,
      totals: scenarioTotals,
      percentages: {
        time: calculatePercentage(scenarioTotals.time, totalForScenario),
        talent: calculatePercentage(scenarioTotals.talent, totalForScenario),
        trust: calculatePercentage(scenarioTotals.trust, totalForScenario),
      },
    };
  });

  return {
    totalAllocations: votes.length,
    totalChips: votes.reduce((sum, vote) => sum + vote.totalChips, 0),
    scenarios: scenariosWithTotals,
  };
}

function aggregateDepartmentStats(
  votes: Vote[],
  participants: Record<string, Participant>,
  scenarioOrder: Scenario[],
  solutionsByPainPoint: Record<string, SolutionScenario[]>
) {
  const departmentLayer1: Record<string, DepartmentLayerStats> = {};
  const departmentLayer2: Record<string, DepartmentLayerStats> = {};

  const scenarioMap = scenarioOrder.reduce<Record<string, Scenario>>((acc, scenario) => {
    acc[scenario.id] = scenario;
    return acc;
  }, {});

  const solutionMap = Object.values(solutionsByPainPoint)
    .flat()
    .reduce<Record<string, SolutionScenario>>((acc, solution) => {
      acc[solution.id] = solution;
      return acc;
    }, {});

  votes.forEach((vote) => {
    const participant = participants[vote.participantId];
    if (!participant || !participant.department) return;

    const targetRecord = vote.layer === 'layer1' ? departmentLayer1 : departmentLayer2;

    if (!targetRecord[participant.department]) {
      targetRecord[participant.department] = {
        totalChips: 0,
        totalParticipants: 0,
        topScenarioId: undefined,
      };
    }

    const departmentStats = targetRecord[participant.department];
    departmentStats.totalParticipants += 1;

    Object.entries(vote.allocations).forEach(([scenarioId, allocation]) => {
      const delta = sumChipAllocation(allocation);
      departmentStats.totalChips += delta;

      if (
        vote.layer === 'layer1'
          ? scenarioMap[scenarioId]
          : solutionMap[scenarioId]
      ) {
        if (!departmentStats.topScenarioId || delta > 0) {
          departmentStats.topScenarioId = scenarioId;
        }
      }
    });
  });

  return {
    layer1: departmentLayer1,
    layer2: departmentLayer2,
  };
}

export async function calculateSessionResults(sessionId: string): Promise<SessionResults> {
  const session = await getSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  const votes = await getSessionAllocations(sessionId);
  const layer1Votes = votes.filter((vote) => vote.layer === 'layer1');
  const layer2Votes = votes.filter((vote) => vote.layer === 'layer2');

  const layer1Results = aggregateLayerResults(
    session.scenarioOrder.map((id) => session.scenarios[id]).filter(Boolean),
    layer1Votes
  );

  const layer2Results: Record<string, LayerResults> = {};
  Object.entries(session.solutionsByPainPoint).forEach(([painPointId, solutions]) => {
    const relevantVotes = layer2Votes.filter((vote) => vote.painPointId === painPointId);
    layer2Results[painPointId] = aggregateLayerResults(solutions, relevantVotes);
  });

  const participants = await getSessionParticipants(sessionId);
  const participantMap = participants.reduce<Record<string, Participant>>((acc, participant) => {
    acc[participant.id] = participant;
    return acc;
  }, {});

  const summary = buildResultsSummary(session.metadata, layer1Results, layer2Results);
  const departments = aggregateDepartmentStats(
    votes,
    participantMap,
    session.scenarioOrder.map((id) => session.scenarios[id]).filter(Boolean),
    session.solutionsByPainPoint
  );

  const results: SessionResults = {
    summary,
    layer1: layer1Results,
    layer2: layer2Results,
    departments,
  };

  const resultsRef = ref(database, `${RESULTS_ROOT}/${sessionId}`);
  await set(resultsRef, results);

  return results;
}

export async function getSessionResults(sessionId: string): Promise<SessionResults | null> {
  const resultsRef = ref(database, `${RESULTS_ROOT}/${sessionId}`);
  const snapshot = await get(resultsRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val() as SessionResults;
}

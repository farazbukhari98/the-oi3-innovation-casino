export type SessionStatus =
  | 'waiting'
  | 'betting_layer1'
  | 'results_layer1'
  | 'routing'
  | 'betting_layer2'
  | 'results_layer2'
  | 'insights'
  | 'closed'
  // Legacy values kept temporarily for backwards compatibility
  | 'betting'
  | 'results';

export interface Scenario {
  id: string;
  title: string;
  description: string;
}

export type InnovationBoldness = 'safe_bet' | 'wild_card' | 'moonshot' | 'jackpot';

export interface SolutionScenario extends Scenario {
  painPointId: string;
  placeholder?: boolean;
  boldness: InnovationBoldness;
  innovationLabel: string;
}

export interface SessionSettings {
  votingDuration: number; // seconds (legacy)
  requireDepartment: boolean;
  allowRevotes: boolean;
  chipsPerType: number;
  participantBaseUrl?: string;
  layerDurations: {
    layer1: number;
    layer2: number;
  };
}

export interface SessionMetadata {
  totalParticipants: number;
  layer1Allocations: number;
  layer2Allocations: number;
  totalAllocations: number;
}

export interface ScenarioState extends Scenario {
  createdAt?: number;
}

export interface Session {
  id: string;
  facilitatorId: string;
  createdAt: number;
  status: SessionStatus;
  scenarioOrder: string[];
  scenarios: Record<string, ScenarioState>;
  solutionsByPainPoint: Record<string, SolutionScenario[]>;
  settings: SessionSettings;
  metadata: SessionMetadata;
}

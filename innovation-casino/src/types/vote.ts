export type ChipType = 'time' | 'talent' | 'trust';

export interface ChipAllocation {
  time: number;
  talent: number;
  trust: number;
}

export type ScenarioAllocations = Record<string, ChipAllocation>;

export type VotingLayer = 'layer1' | 'layer2';

export interface Vote {
  id: string;
  sessionId: string;
  participantId: string;
  layer: VotingLayer;
  painPointId?: string;
  allocations: ScenarioAllocations;
  totalChips: number;
  submittedAt: number;
}

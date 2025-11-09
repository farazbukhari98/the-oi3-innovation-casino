import { ChipAllocation } from './vote';

export interface ScenarioResults {
  scenarioId: string;
  title: string;
  description: string;
  totals: ChipAllocation & {
    totalChips: number;
  };
  percentages: {
    time: number;
    talent: number;
    trust: number;
  };
}

export interface LayerResults {
  totalAllocations: number;
  totalChips: number;
  scenarios: ScenarioResults[];
}

export interface ResultsSummary {
  totalParticipants: number;
  layer1Allocations: number;
  layer2Allocations: number;
  totalLayer1Chips: number;
  totalLayer2Chips: number;
}

export interface DepartmentLayerStats {
  totalChips: number;
  totalParticipants: number;
  topScenarioId?: string;
}

export interface DepartmentInsights {
  layer1: Record<string, DepartmentLayerStats>;
  layer2: Record<string, DepartmentLayerStats>;
}

export interface SessionResults {
  summary: ResultsSummary;
  layer1: LayerResults;
  layer2: Record<string, LayerResults>;
  departments?: DepartmentInsights;
}

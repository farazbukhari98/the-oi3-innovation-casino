import { ChipAllocation } from './vote';
import { InnovationBoldness } from './session';

export interface ScenarioResults {
  scenarioId: string;
  title: string;
  description: string;
  boldness?: InnovationBoldness;
  innovationLabel?: string;
  totals: ChipAllocation & {
    totalChips: number;
  };
  percentages: {
    time: number;
    talent: number;
    trust: number;
  };
}

export interface BoldnessTotals {
  tier: InnovationBoldness;
  label: string;
  innovationLabel: string;
  totals: ChipAllocation & { totalChips: number };
  allocationCount: number;
  percentageOfLayer: number;
}

export interface LayerResults {
  totalAllocations: number;
  totalChips: number;
  scenarios: ScenarioResults[];
  boldnessTotals?: Partial<Record<InnovationBoldness, BoldnessTotals>>;
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
  boldnessTotals?: Partial<Record<InnovationBoldness, number>>;
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

import { SessionMetadata } from '../types/session';
import { LayerResults, ResultsSummary } from '../types/results';

function sumLayer2Chips(layer2: Record<string, LayerResults>): number {
  return Object.values(layer2).reduce((total, result) => total + (result?.totalChips ?? 0), 0);
}

export function buildResultsSummary(
  metadata: SessionMetadata,
  layer1: LayerResults,
  layer2: Record<string, LayerResults>
): ResultsSummary {
  return {
    totalParticipants: metadata.totalParticipants,
    layer1Allocations: metadata.layer1Allocations,
    layer2Allocations: metadata.layer2Allocations,
    totalLayer1Chips: layer1?.totalChips ?? 0,
    totalLayer2Chips: sumLayer2Chips(layer2),
  };
}

export { sumLayer2Chips };

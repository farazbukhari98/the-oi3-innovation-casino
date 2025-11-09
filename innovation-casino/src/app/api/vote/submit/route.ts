import { NextRequest, NextResponse } from 'next/server';
import { submitVote, hasParticipantSubmittedAllocation } from '@/lib/database';
import { getErrorMessage } from '@/lib/utils';
import { ScenarioAllocations, ChipAllocation, VotingLayer } from '@/types/vote';

interface SubmitVoteRequestBody {
  sessionId?: string;
  participantId?: string;
  allocations?: ScenarioAllocations;
  layer?: VotingLayer;
  painPointId?: string;
}

function isChipAllocation(value: unknown): value is ChipAllocation {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ChipAllocation>;
  return ['time', 'talent', 'trust'].every((key) => {
    const val = candidate[key as keyof ChipAllocation];
    return typeof val === 'number' && Number.isInteger(val) && val >= 0;
  });
}

function normalizeAllocations(raw: ScenarioAllocations | undefined): ScenarioAllocations {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Allocations payload is required');
  }

  const normalized: ScenarioAllocations = {};
  Object.entries(raw).forEach(([scenarioId, allocation]) => {
    if (!isChipAllocation(allocation)) {
      throw new Error(`Invalid allocation for scenario ${scenarioId}`);
    }
    normalized[scenarioId] = allocation;
  });

  if (Object.keys(normalized).length === 0) {
    throw new Error('Provide at least one scenario allocation');
  }

  return normalized;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SubmitVoteRequestBody;
    const { sessionId, participantId, allocations, layer, painPointId } = body;

    if (typeof sessionId !== 'string' || typeof participantId !== 'string') {
      return NextResponse.json(
        { error: 'Session ID and participant ID are required' },
        { status: 400 }
      );
    }

    if (layer !== 'layer1' && layer !== 'layer2') {
      return NextResponse.json(
        { error: 'Layer must be either "layer1" or "layer2"' },
        { status: 400 }
      );
    }

    let normalizedAllocations: ScenarioAllocations;
    try {
      normalizedAllocations = normalizeAllocations(allocations);
    } catch (allocationError) {
      return NextResponse.json(
        { error: getErrorMessage(allocationError) },
        { status: 400 }
      );
    }

    const alreadySubmitted = await hasParticipantSubmittedAllocation(participantId, layer);
    if (alreadySubmitted) {
      return NextResponse.json(
        { error: 'Allocations already submitted for this layer' },
        { status: 400 }
      );
    }

    const submissionResult = await submitVote({
      sessionId,
      participantId,
      allocations: normalizedAllocations,
      layer,
      painPointId,
    });

    return NextResponse.json({
      success: true,
      ...submissionResult,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

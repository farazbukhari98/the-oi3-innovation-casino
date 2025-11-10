import { NextRequest, NextResponse } from 'next/server';
import { calculateSessionResults, getSessionResults } from '@/lib/database';
import { getErrorMessage } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const layer = searchParams.get('layer');
    const refresh = searchParams.get('refresh');
    const painPointId = searchParams.get('painPointId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    let results = await getSessionResults(sessionId);

    if (!results || refresh === 'true') {
      try {
        results = await calculateSessionResults(sessionId);
      } catch (calcError) {
        console.error('Failed to calculate results:', getErrorMessage(calcError));
        // Return empty results structure instead of throwing
        results = {
          summary: {
            totalParticipants: 0,
            layer1Allocations: 0,
            layer2Allocations: 0,
            totalLayer1Chips: 0,
            totalLayer2Chips: 0,
          },
          layer1: {
            totalAllocations: 0,
            totalChips: 0,
            scenarios: [],
          },
          layer2: {},
          departments: {
            layer1: {},
            layer2: {},
          }
        };
      }
    }

    if (!layer) {
      return NextResponse.json({ results });
    }

    if (layer === 'layer1') {
      return NextResponse.json({ results: results.layer1 });
    }

    if (layer === 'layer2') {
      if (painPointId) {
        return NextResponse.json({ results: results.layer2[painPointId] ?? null });
      }
      return NextResponse.json({ results: results.layer2 });
    }

    return NextResponse.json(
      { error: 'Invalid layer specified' },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error('Results API error:', getErrorMessage(error));
    return NextResponse.json(
      {
        error: getErrorMessage(error),
        results: null
      },
      { status: 500 }
    );
  }
}

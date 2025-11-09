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
      results = await calculateSessionResults(sessionId);
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
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

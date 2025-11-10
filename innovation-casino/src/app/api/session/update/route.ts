import { NextRequest, NextResponse } from 'next/server';
import { updateSessionStatus, calculateSessionResults } from '@/lib/database';
import { SessionStatus } from '@/types/session';
import { getErrorMessage } from '@/lib/utils';

interface UpdateSessionRequestBody {
  sessionId?: string;
  status?: SessionStatus;
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as UpdateSessionRequestBody;
    const { sessionId, status } = body;

    if (typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Calculate results when transitioning to results or insights views
    if (status === 'results_layer1' || status === 'results_layer2' || status === 'insights' || status === 'results') {
      try {
        await calculateSessionResults(sessionId);
      } catch (error) {
        console.error('Failed to calculate results:', getErrorMessage(error));
        // Continue with status update even if results calculation fails
      }
    }

    await updateSessionStatus(sessionId, status);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

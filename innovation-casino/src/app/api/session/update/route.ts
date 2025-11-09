import { NextRequest, NextResponse } from 'next/server';
import { updateSessionStatus } from '@/lib/database';
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

    await updateSessionStatus(sessionId, status);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

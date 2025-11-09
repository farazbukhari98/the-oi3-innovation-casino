import { NextRequest, NextResponse } from 'next/server';
import { registerParticipant } from '@/lib/database';
import { getErrorMessage } from '@/lib/utils';

interface RegisterParticipantRequestBody {
  sessionId?: string;
  name?: string;
  department?: string;
  deviceId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegisterParticipantRequestBody;
    const { sessionId, name, department, deviceId } = body;

    if (
      typeof sessionId !== 'string' ||
      typeof name !== 'string' ||
      typeof department !== 'string' ||
      typeof deviceId !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const participantId = await registerParticipant(
      sessionId,
      name,
      department,
      deviceId
    );

    return NextResponse.json({
      success: true,
      participantId,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

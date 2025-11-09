import { NextRequest, NextResponse } from 'next/server';
import { createSession, getSession } from '@/lib/database';
import type { SessionSettingsOverride } from '@/lib/database';
import { getErrorMessage, getSessionQRUrl } from '@/lib/utils';

interface CreateSessionRequestBody {
  facilitatorId?: string;
  settings?: {
    chipsPerType?: number;
    layerDurations?: {
      layer1?: number;
      layer2?: number;
    };
    requireDepartment?: boolean;
    allowRevotes?: boolean;
    participantBaseUrl?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateSessionRequestBody;
    const { facilitatorId, settings } = body;

    if (typeof facilitatorId !== 'string' || facilitatorId.trim().length === 0) {
      return NextResponse.json(
        { error: 'Facilitator ID is required' },
        { status: 400 }
      );
    }

    const sanitizedSettings: SessionSettingsOverride = {};

    if (settings) {
      if (typeof settings.chipsPerType === 'number' && settings.chipsPerType > 0) {
        sanitizedSettings.chipsPerType = Math.floor(settings.chipsPerType);
      }

      if (settings.layerDurations) {
        const durations: NonNullable<SessionSettingsOverride['layerDurations']> = {};
        if (typeof settings.layerDurations.layer1 === 'number' && settings.layerDurations.layer1 > 0) {
          durations.layer1 = Math.floor(settings.layerDurations.layer1);
        }
        if (typeof settings.layerDurations.layer2 === 'number' && settings.layerDurations.layer2 > 0) {
          durations.layer2 = Math.floor(settings.layerDurations.layer2);
        }
        if (Object.keys(durations).length > 0) {
          sanitizedSettings.layerDurations = durations;
        }
      }

      if (typeof settings.requireDepartment === 'boolean') {
        sanitizedSettings.requireDepartment = settings.requireDepartment;
      }

      if (typeof settings.allowRevotes === 'boolean') {
        sanitizedSettings.allowRevotes = settings.allowRevotes;
      }

      if (typeof settings.participantBaseUrl === 'string') {
        const trimmed = settings.participantBaseUrl.trim();
        if (trimmed.length > 0) {
          sanitizedSettings.participantBaseUrl = trimmed;
        }
      }
    }

    const sessionId = await createSession(facilitatorId, sanitizedSettings);
    const session = await getSession(sessionId);
    const qrCodeUrl = getSessionQRUrl(sessionId, {
      baseUrl: session?.settings.participantBaseUrl,
    });

    return NextResponse.json({
      success: true,
      sessionId,
      qrCodeUrl,
      session,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

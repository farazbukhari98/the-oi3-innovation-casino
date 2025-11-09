import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/utils';

export async function GET() {
  try {
    return NextResponse.json(
      { error: 'Comparison results have been retired in the new Innovation Casino flow.' },
      { status: 410 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { database } from '@/lib/firebase';
import { ref, set, get } from 'firebase/database';

export async function GET() {
  try {
    const testRef = ref(database, 'test');
    await set(testRef, { timestamp: Date.now() });
    const snapshot = await get(testRef);

    return NextResponse.json({
      success: true,
      data: snapshot.val()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

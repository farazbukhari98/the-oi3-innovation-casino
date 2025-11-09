import { Suspense } from 'react';
import JoinPageContent from './JoinPageContent';
import { CasinoEnvironment } from '@/components/casino/CasinoEnvironment';

export const dynamic = 'force-dynamic';

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <CasinoEnvironment>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin text-6xl mb-4">🎰</div>
              <p className="text-xl text-gray-300">Loading...</p>
            </div>
          </div>
        </CasinoEnvironment>
      }
    >
      <JoinPageContent />
    </Suspense>
  );
}

'use client';

import { ReactNode, useEffect } from 'react';
import { SessionProvider } from '@/context/SessionContext';
import { ParticipantProvider } from '@/context/ParticipantContext';
import { ErrorBoundary } from '@/components/ui';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    document.body.classList.add('antialiased');
    return () => {
      document.body.classList.remove('antialiased');
    };
  }, []);

  return (
    <ErrorBoundary>
      <SessionProvider>
        <ParticipantProvider>
          {children}
        </ParticipantProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}

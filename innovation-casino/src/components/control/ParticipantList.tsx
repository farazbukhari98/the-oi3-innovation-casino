'use client';

import { useEffect, useState } from 'react';
import { Participant } from '@/types/participant';
import { database } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';

interface ParticipantListProps {
  sessionId: string;
}

export function ParticipantList({ sessionId }: ParticipantListProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    // Subscribe to real-time updates
    const participantsRef = ref(database, 'participants');
    const sessionParticipantsQuery = query(participantsRef, orderByChild('sessionId'), equalTo(sessionId));

    const unsubscribe = onValue(sessionParticipantsQuery, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const participantList = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...(value as Omit<Participant, 'id'>),
        }));
        setParticipants(participantList);
      } else {
        setParticipants([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sessionId]);

  const getSubmissionStatus = (participant: Participant) => {
    if (participant.layer2Completed) {
      return { label: 'High Roller', className: 'bg-blue-500/20 text-blue-200 border-blue-500/40', icon: '✅' };
    }
    if (participant.layer1Completed) {
      return { label: 'Member Access', className: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40', icon: '✅' };
    }
    return { label: 'Waiting', className: 'bg-white/10 text-gray-300 border-white/15', icon: '⏳' };
  };

  return (
    <div className="casino-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-heading text-white">
          Participants ({participants.length})
        </h3>
        <span className="text-xs uppercase tracking-[0.3em] text-gray-400">
          Live updates
        </span>
      </div>

      <div className="max-h-96 overflow-y-auto pr-2">
        {loading ? (
          <p className="text-gray-400">Loading participants...</p>
        ) : participants.length === 0 ? (
          <p className="text-gray-400">No participants yet</p>
        ) : (
          <div className="space-y-2">
            {participants.map((participant) => {
              const status = getSubmissionStatus(participant);
              return (
                <div
                  key={participant.id}
                  className="flex justify-between items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl md:text-2xl">
                      {participant.playerAvatar || '👤'}
                    </span>
                    <div>
                      <p className="font-semibold text-white">{participant.name}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                        {participant.department}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}
                  >
                    <span>{status.icon}</span>
                    <span>{status.label}</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

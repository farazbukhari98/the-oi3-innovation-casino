'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DepartmentSelect } from './DepartmentSelect';
import { Department } from '@/types/participant';
import { v4 as uuidv4 } from 'uuid';
import { getErrorMessage } from '@/lib/utils';

interface RegistrationFormProps {
  sessionId: string;
}

export function RegistrationForm({ sessionId }: RegistrationFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [department, setDepartment] = useState<Department | ''>('');
  const [errors, setErrors] = useState<{ name?: string; department?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const newErrors: { name?: string; department?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!department) {
      newErrors.department = 'Please select a department';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);

    try {
      // Get or create device ID
      let deviceId = localStorage.getItem('deviceId');
      if (!deviceId) {
        deviceId = uuidv4();
        localStorage.setItem('deviceId', deviceId);
      }

      const response = await fetch('/api/participant/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          name: name.trim(),
          department,
          deviceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store participant ID
      localStorage.setItem('participantId', data.participantId);

      // Redirect to voting page
      router.push(`/vote?session=${sessionId}&participant=${data.participantId}`);
    } catch (error: unknown) {
      alert(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.28em] text-gray-400">
          Your Name *
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-70">🪪</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Type your name"
            className={`
              w-full rounded-lg border
              bg-white/5 text-white placeholder-gray-500
              pl-12 pr-4 py-4
              ${errors.name ? 'border-red-500/80 focus:border-red-500' : 'border-white/15 focus:border-casino-gold'}
              focus:outline-none focus:ring-0
              shadow-[0_18px_35px_-28px_rgba(15,118,110,0.9)]
              transition
            `}
          />
        </div>
        {errors.name && (
          <p className="text-red-400 text-xs mt-1">{errors.name}</p>
        )}
      </div>

      <DepartmentSelect
        value={department}
        onChange={setDepartment}
        error={errors.department}
      />

      <div className="space-y-3">
        <button
          type="submit"
          disabled={submitting}
          className={`
            w-full btn-casino text-lg py-4
            ${submitting ? 'opacity-60 cursor-not-allowed' : ''}
          `}
        >
          {submitting ? 'Getting your chips...' : 'Get My Chips'}
        </button>
        <p className="text-xs text-center text-gray-500">
          We&apos;ll hand you three chips to place once the facilitator opens the floor.
        </p>
      </div>
    </form>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { DEPARTMENTS } from '@/lib/constants';
import { Department } from '@/types/participant';

interface DepartmentSelectProps {
  value: string;
  onChange: (value: Department) => void;
  error?: string;
}

const CUSTOM_OPTION_LABEL = 'Department Not Listed';
const CUSTOM_OPTION_VALUE = '__custom_department__';

export function DepartmentSelect({ value, onChange, error }: DepartmentSelectProps) {
  const [customSelected, setCustomSelected] = useState(() => {
    if (!value) {
      return false;
    }
    return !DEPARTMENTS.includes(value);
  });

  const isKnownDepartment = Boolean(value) && DEPARTMENTS.includes(value);
  const showCustomInput = customSelected || (!isKnownDepartment && Boolean(value));

  const selectedOption = useMemo(() => {
    if (showCustomInput) {
      return CUSTOM_OPTION_VALUE;
    }
    if (isKnownDepartment) {
      return value;
    }
    return '';
  }, [showCustomInput, isKnownDepartment, value]);

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextValue = event.target.value;
    const selectingCustom = nextValue === CUSTOM_OPTION_VALUE;
    setCustomSelected(selectingCustom);
    if (selectingCustom) {
      if (isKnownDepartment) {
        onChange('' as Department);
      }
      return;
    }
    onChange(nextValue as Department);
  };

  return (
    <div className="w-full">
      <label className="block text-xs uppercase tracking-[0.28em] text-gray-400 mb-2">
        Department *
      </label>
      <div className="relative">
        <select
          value={selectedOption}
          onChange={handleSelectChange}
          className={`
            w-full appearance-none rounded-lg border bg-white/5 text-white
            px-4 pr-12 py-4 text-base
            ${error ? 'border-red-500/80 focus:border-red-500' : 'border-white/15 focus:border-casino-gold'}
            focus:outline-none focus:ring-0
            backdrop-blur-sm
          `}
        >
          <option value="">Select your department</option>
          {DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
          <option value={CUSTOM_OPTION_VALUE}>{CUSTOM_OPTION_LABEL}</option>
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400 text-lg">
          ▾
        </span>
      </div>
      {showCustomInput && (
        <div className="mt-4">
          <label className="block text-xs uppercase tracking-[0.28em] text-gray-400 mb-2">
            Enter your department name
          </label>
          <input
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value as Department)}
            placeholder="Type your department"
            className={`
              w-full rounded-lg border bg-white/5 text-white placeholder-gray-500
              px-4 py-3 text-base shadow-[0_18px_35px_-28px_rgba(15,118,110,0.9)]
              ${error ? 'border-red-500/80 focus:border-red-500' : 'border-white/15 focus:border-casino-gold'}
              focus:outline-none focus:ring-0
            `}
          />
        </div>
      )}
      {error && (
        <p className="text-red-400 text-xs mt-1">{error}</p>
      )}
    </div>
  );
}

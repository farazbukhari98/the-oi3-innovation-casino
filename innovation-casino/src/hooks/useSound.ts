'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

export type SoundType = 'chipPlace' | 'chipRemove' | 'chipsLock' | 'success' | 'error';

interface SoundConfig {
  url: string;
  volume: number;
  playbackRate?: number;
}

const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  chipPlace: {
    url: '/sounds/chip-place.mp3',
    volume: 0.5,
  },
  chipRemove: {
    url: '/sounds/chip-remove.mp3',
    volume: 0.4,
  },
  chipsLock: {
    url: '/sounds/chips-lock.mp3',
    volume: 0.6,
  },
  success: {
    url: '/sounds/success.mp3',
    volume: 0.5,
  },
  error: {
    url: '/sounds/error.mp3',
    volume: 0.4,
  },
};

const SOUND_TYPES: SoundType[] = ['chipPlace', 'chipRemove', 'chipsLock', 'success', 'error'];

type ExtendedWindow = typeof window & {
  webkitAudioContext?: typeof AudioContext;
};

function buildSoundMap<T>(factory: () => T): Record<SoundType, T> {
  return SOUND_TYPES.reduce((acc, key) => {
    acc[key] = factory();
    return acc;
  }, {} as Record<SoundType, T>);
}

// Simple fallback sounds using Web Audio API oscillator
function createFallbackSound(type: SoundType): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const extendedWindow = window as ExtendedWindow;
  const AudioCtor = window.AudioContext || extendedWindow.webkitAudioContext;
  if (!AudioCtor) {
    return () => {};
  }

  const audioContext = new AudioCtor();

  return () => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
      case 'chipPlace':
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
        break;
      case 'chipRemove':
        oscillator.frequency.value = 400;
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
        break;
      case 'chipsLock':
        oscillator.frequency.value = 600;
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        for (let i = 0; i < 3; i++) {
          const time = audioContext.currentTime + i * 0.1;
          oscillator.frequency.setValueAtTime(600 + i * 200, time);
        }
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
        break;
      case 'success':
        oscillator.frequency.value = 1000;
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(1500, audioContext.currentTime + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
      case 'error':
        oscillator.frequency.value = 200;
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
        break;
    }
  };
}

export function useSound() {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('casinoSoundMuted') === 'true';
  });
  const [isEnabled, setIsEnabled] = useState(true);
  const audioRefs = useRef<Record<SoundType, HTMLAudioElement | null>>(buildSoundMap(() => null));
  const fallbackSounds = useRef<Record<SoundType, () => void>>(buildSoundMap(() => () => {}));
  const lastPlayTime = useRef<Record<SoundType, number>>(buildSoundMap(() => 0));

  // Initialize audio elements and fallbacks
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if sounds are available (development mode might not have them)
    const checkSoundAvailability = async () => {
      try {
        const response = await fetch('/sounds/chip-place.mp3', { method: 'HEAD' });
        setIsEnabled(response.ok);
      } catch {
        setIsEnabled(false);
      }
    };

    checkSoundAvailability();

    // Initialize fallback sounds
    Object.keys(SOUND_CONFIGS).forEach((key) => {
      const soundType = key as SoundType;
      fallbackSounds.current[soundType] = createFallbackSound(soundType);
    });

    // Try to load real sound files
    Object.entries(SOUND_CONFIGS).forEach(([key, config]) => {
      const soundType = key as SoundType;
      const audio = new Audio(config.url);
      audio.volume = config.volume;
      audio.preload = 'auto';

      // If audio fails to load, we'll use fallback
      audio.addEventListener('error', () => {
        console.log(`Failed to load ${config.url}, using fallback sound`);
        audioRefs.current[soundType] = null;
      });

      audioRefs.current[soundType] = audio;
    });

    const audioElements = audioRefs.current;
    return () => {
      // Cleanup audio elements
      Object.values(audioElements).forEach((audio) => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
    };
  }, []);

  const playSound = useCallback(
    (type: SoundType) => {
      if (isMuted) return;

      // Throttle sounds - don't play the same sound more than once per 50ms
      const now = Date.now();
      const lastPlay = lastPlayTime.current[type] || 0;
      if (now - lastPlay < 50) return;
      lastPlayTime.current[type] = now;

      const audioTemplate = isEnabled ? audioRefs.current[type] : null;

      if (audioTemplate && audioTemplate.readyState >= 2) {
        const playable = audioTemplate.cloneNode(true) as HTMLAudioElement;
        playable.currentTime = 0;
        playable.volume = audioTemplate.volume;
        playable.play().catch((e) => {
          console.log('Audio play failed:', e);
          // Try fallback
          fallbackSounds.current[type]?.();
        });
      } else {
        // Use fallback sound
        fallbackSounds.current[type]?.();
      }
    },
    [isMuted, isEnabled]
  );

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (typeof window !== 'undefined') {
      localStorage.setItem('casinoSoundMuted', String(newMuted));
    }
  }, [isMuted]);

  return {
    playSound,
    isMuted,
    toggleMute,
    isEnabled,
  };
}

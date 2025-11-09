/**
 * Utility Functions
 * Helper functions for the Innovation Casino application
 */

/**
 * Generate a unique device ID for participant tracking
 * Uses browser fingerprinting and localStorage
 */
export function generateDeviceId(): string {
  // Check if device ID already exists in localStorage
  const existingId = localStorage.getItem('innovation-casino-device-id');
  if (existingId) {
    return existingId;
  }

  // Generate new device ID
  const userAgent = navigator.userAgent;
  const screenResolution = `${window.screen.width}x${window.screen.height}`;
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);

  const deviceId = btoa(`${userAgent}-${screenResolution}-${timestamp}-${random}`)
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 32);

  // Store for future use
  localStorage.setItem('innovation-casino-device-id', deviceId);

  return deviceId;
}

/**
 * Format time in seconds to MM:SS format
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate percentage with one decimal place
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100 * 10) / 10;
}

/**
 * Get color for betting table
 */
export function getTableColor(table: string): string {
  const colors: { [key: string]: string } = {
    'safe-bet': '#10B981', // Green
    'jackpot': '#3B82F6',  // Blue
    'wild-card': '#F59E0B', // Orange
    'moonshot': '#EF4444',  // Red
  };
  return colors[table] || '#6B7280'; // Default gray
}

/**
 * Get chip color
 */
export function getChipColor(chip: string): string {
  const colors: { [key: string]: string } = {
    'time': '#8B5CF6',   // Purple
    'talent': '#EC4899', // Pink
    'trust': '#14B8A6',  // Teal
  };
  return colors[chip] || '#6B7280'; // Default gray
}

/**
 * Get table name with proper formatting
 */
export function getTableName(table: string): string {
  const names: { [key: string]: string } = {
    'safe-bet': 'Safe Bet',
    'jackpot': 'Jackpot',
    'wild-card': 'Wild Card',
    'moonshot': 'Moonshot',
  };
  return names[table] || table;
}

/**
 * Get chip name with proper formatting
 */
export function getChipName(chip: string): string {
  const names: { [key: string]: string } = {
    'time': 'Time',
    'talent': 'Talent',
    'trust': 'Trust',
  };
  return names[chip] || chip;
}

/**
 * Validate session ID format
 */
export function isValidSessionId(sessionId: string): boolean {
  return /^[a-zA-Z0-9_-]{10,30}$/.test(sessionId);
}

/**
 * Get session status display text
 */
export function getStatusText(status: string): string {
  const statusTexts: { [key: string]: string } = {
    'waiting': 'Waiting to Start',
    'betting': 'Betting Live',
    'betting_layer1': 'Layer 1 Voting',
    'results_layer1': 'Layer 1 Results',
    'routing': 'Routing Participants',
    'betting_layer2': 'Layer 2 Voting',
    'results_layer2': 'Layer 2 Results',
    'insights': 'Insights & Debrief',
    'results': 'Final Results',
    'closed': 'Session Closed',
  };
  return statusTexts[status] || status;
}

/**
 * Calculate boldness index from comparison data
 * Positive values indicate shift toward risk
 */
export function calculateBoldnessIndex(
  phase1Percentages: { [key: string]: number },
  phase2Percentages: { [key: string]: number }
): number {
  let totalShift = 0;

  // Add positive weight for risky tables
  const riskyTables = ['wild-card', 'moonshot'];
  riskyTables.forEach(table => {
    const shift = phase2Percentages[table] - phase1Percentages[table];
    totalShift += shift;
  });

  // Subtract for safe table
  const safeBetShift = phase2Percentages['safe-bet'] - phase1Percentages['safe-bet'];
  totalShift -= safeBetShift;

  return Math.round(totalShift * 10) / 10;
}

/**
 * Format timestamp to readable date/time
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Check if running in browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

type ParticipantBaseUrlOptions = {
  baseUrl?: string;
  fallbackOrigin?: string;
};

const LOCAL_FALLBACK_URL = 'http://localhost:3000';

function sanitizeBaseUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

export function resolveParticipantBaseUrl(options?: ParticipantBaseUrlOptions): string {
  const runtimeOrigin =
    options?.fallbackOrigin ??
    (isBrowser() ? window.location.origin : undefined);

  const order = [
    options?.baseUrl,
    process.env.NEXT_PUBLIC_PARTICIPANT_BASE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    runtimeOrigin,
  ];

  for (const candidate of order) {
    const sanitized = sanitizeBaseUrl(candidate);
    if (sanitized) {
      return sanitized;
    }
  }

  return LOCAL_FALLBACK_URL;
}

/**
 * Generate QR code URL for session
 */
export function getSessionQRUrl(sessionId: string, options?: ParticipantBaseUrlOptions): string {
  const base = resolveParticipantBaseUrl(options);
  // Ensure sessionId is properly URL encoded
  const encodedSessionId = encodeURIComponent(sessionId);
  const url = `${base}/join?session=${encodedSessionId}`;

  // Log for debugging
  if (isBrowser()) {
    console.log('[getSessionQRUrl] Generated URL:', url);
    console.log('[getSessionQRUrl] Base URL:', base);
    console.log('[getSessionQRUrl] Session ID (raw):', sessionId);
    console.log('[getSessionQRUrl] Session ID (encoded):', encodedSessionId);
  }

  return url;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!isBrowser()) return false;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Parse session ID from URL
 */
export function parseSessionIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('session');
  } catch {
    return null;
  }
}

/**
 * Class name utility for conditional classes
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
/**
 * Derive a human-readable error message from unknown error-like values
 */
export function getErrorMessage(error: unknown, fallback = 'An unexpected error occurred'): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }
  return fallback;
}

export function sumChipAllocation(allocation: { time: number; talent: number; trust: number }): number {
  return allocation.time + allocation.talent + allocation.trust;
}

export function determineTopScenario(
  allocations: Record<string, { time: number; talent: number; trust: number }>,
  rng: () => number = Math.random
): string | null {
  const entries = Object.entries(allocations);
  if (entries.length === 0) {
    return null;
  }

  let max = -Infinity;
  let leaders: string[] = [];

  entries.forEach(([scenarioId, allocation]) => {
    const total = sumChipAllocation(allocation);
    if (total > max) {
      max = total;
      leaders = [scenarioId];
    } else if (total === max) {
      leaders.push(scenarioId);
    }
  });

  if (leaders.length === 0) {
    return null;
  }

  if (leaders.length === 1) {
    return leaders[0];
  }

  const index = Math.floor(rng() * leaders.length);
  return leaders[index];
}

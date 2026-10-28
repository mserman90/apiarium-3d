import type { CameraViewPreset } from './types';

export interface CooldownTracker {
  smokerCooldownRemaining: number; // seconds
  threatCooldownRemaining: number;
  glassTapCooldownRemaining: number;
}

export const COOLDOWN_DURATIONS = {
  smoker: 8.0, // 8 seconds
  threat: 25.0, // 25 seconds
  glassTap: 4.0, // 4 seconds
} as const;

export type HotkeyAction =
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'PUFF_SMOKER' }
  | { type: 'TRIGGER_THREAT' }
  | { type: 'GLASS_TAP' }
  | { type: 'TOGGLE_ZEN_MODE' }
  | { type: 'SELECT_CAMERA'; preset: CameraViewPreset }
  | { type: 'SELECT_SPECIES_PRESET'; index: number }
  | { type: 'NONE' };

/**
 * Checks if target is an interactive form element where hotkeys should be suppressed
 */
export function isInputFocused(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.isContentEditable
  );
}

/**
 * Parses keyboard event into a discrete HotkeyAction, honoring:
 * - Alt+1..5 for species (0..4 index)
 * - 1..5 for camera views
 * - Cooldown enforcement for S, W, T
 */
export function parseHotkeyEvent(
  event: { key: string; code?: string; altKey?: boolean; ctrlKey?: boolean; metaKey?: boolean },
  cooldowns: CooldownTracker
): HotkeyAction {
  const key = event.key.toLowerCase();

  // Species selection: Alt+1 to Alt+5
  if (event.altKey && !event.ctrlKey && !event.metaKey) {
    if (key === '1') return { type: 'SELECT_SPECIES_PRESET', index: 0 };
    if (key === '2') return { type: 'SELECT_SPECIES_PRESET', index: 1 };
    if (key === '3') return { type: 'SELECT_SPECIES_PRESET', index: 2 };
    if (key === '4') return { type: 'SELECT_SPECIES_PRESET', index: 3 };
    if (key === '5') return { type: 'SELECT_SPECIES_PRESET', index: 4 };
  }

  // Camera views: 1 to 5 (WITHOUT Alt)
  if (!event.altKey && !event.ctrlKey && !event.metaKey) {
    if (key === '1') return { type: 'SELECT_CAMERA', preset: 1 };
    if (key === '2') return { type: 'SELECT_CAMERA', preset: 2 };
    if (key === '3') return { type: 'SELECT_CAMERA', preset: 3 };
    if (key === '4') return { type: 'SELECT_CAMERA', preset: 4 };
    if (key === '5') return { type: 'SELECT_CAMERA', preset: 5 };
  }

  // Space for pause
  if (key === ' ' || event.code === 'Space') {
    return { type: 'TOGGLE_PAUSE' };
  }

  // Zen mode toggle
  if (key === 'h') {
    return { type: 'TOGGLE_ZEN_MODE' };
  }

  // Smoker (S) - with 8s cooldown check
  if (key === 's') {
    if (cooldowns.smokerCooldownRemaining <= 0) {
      return { type: 'PUFF_SMOKER' };
    }
    return { type: 'NONE' }; // ignored during cooldown
  }

  // Threat (W) - with 25s cooldown check
  if (key === 'w') {
    if (cooldowns.threatCooldownRemaining <= 0) {
      return { type: 'TRIGGER_THREAT' };
    }
    return { type: 'NONE' }; // ignored during cooldown
  }

  // Glass Tap (T) - with 4s cooldown check
  if (key === 't') {
    if (cooldowns.glassTapCooldownRemaining <= 0) {
      return { type: 'GLASS_TAP' };
    }
    return { type: 'NONE' }; // ignored during cooldown
  }

  return { type: 'NONE' };
}

/**
 * Updates active cooldowns by delta seconds
 */
export function tickCooldowns(cooldowns: CooldownTracker, deltaSec: number): CooldownTracker {
  return {
    smokerCooldownRemaining: Math.max(0, cooldowns.smokerCooldownRemaining - deltaSec),
    threatCooldownRemaining: Math.max(0, cooldowns.threatCooldownRemaining - deltaSec),
    glassTapCooldownRemaining: Math.max(0, cooldowns.glassTapCooldownRemaining - deltaSec),
  };
}

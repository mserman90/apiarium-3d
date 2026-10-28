import type { ColonyState, Environment, Threat } from './types';

export interface StateMachineInput {
  currentState: ColonyState;
  environment: Environment;
  threat: Threat;
  smokedRemainingSec: number;
}

/**
 * Pure state machine transition function following the spec:
 * - smoked takes precedence (masks alarm pheromones)
 * - defending when active predator is present
 * - smoked_defending when both predator is present and hive is smoked
 * - fanning when temperature > 34 °C
 * - clustering when temperature < 14 °C
 * - foraging / idle when temperature is optimal (14 - 34 °C)
 */
export function determineNextColonyState(input: StateMachineInput): ColonyState {
  const { environment, threat, smokedRemainingSec } = input;
  const isSmoked = smokedRemainingSec > 0;
  const isThreatActive = threat.active && !threat.repelled;

  if (isSmoked && isThreatActive) {
    return 'smoked_defending';
  }

  if (isSmoked) {
    return 'smoked';
  }

  if (isThreatActive) {
    return 'defending';
  }

  if (environment.temperatureC > 34) {
    return 'fanning';
  }

  if (environment.temperatureC < 14) {
    return 'clustering';
  }

  // Normal temperature range (14 - 34 °C)
  // Low pressure (< 995 hPa) forces bees to stay in hive (storm)
  if (environment.pressureHpa >= 995) {
    return 'foraging';
  }

  return 'idle';
}

/**
 * Calculates audio parameters corresponding to a colony state
 */
export interface AudioPresetState {
  baseDroneFreq: number; // Hz (215Hz default)
  harmonicMultiplier: number;
  alarmScreamFreq: number; // Hz (320 - 450Hz)
  fannerWingFreq: number; // Hz (230 - 250Hz)
  subResonanceFreq: number; // Hz (107Hz)
  gain: number;
  filterCutoff: number;
}

export function getAudioParamsForState(
  state: ColonyState,
  temperatureC: number,
  alarmLevel: number
): AudioPresetState {
  switch (state) {
    case 'defending':
      return {
        baseDroneFreq: 280,
        harmonicMultiplier: 1.6,
        alarmScreamFreq: Math.min(450, 320 + alarmLevel * 130),
        fannerWingFreq: 240,
        subResonanceFreq: 115,
        gain: 0.85,
        filterCutoff: 1200,
      };
    case 'smoked':
    case 'smoked_defending':
      return {
        baseDroneFreq: 175,
        harmonicMultiplier: 1.0,
        alarmScreamFreq: 0,
        fannerWingFreq: 190,
        subResonanceFreq: 95,
        gain: 0.45,
        filterCutoff: 450,
      };
    case 'fanning': {
      // 230 - 250 Hz wings
      const fanningFreq = Math.min(250, 230 + (temperatureC - 34) * 2.5);
      return {
        baseDroneFreq: fanningFreq,
        harmonicMultiplier: 1.25,
        alarmScreamFreq: 0,
        fannerWingFreq: fanningFreq,
        subResonanceFreq: 107,
        gain: 0.75,
        filterCutoff: 850,
      };
    }
    case 'clustering':
      return {
        baseDroneFreq: 195,
        harmonicMultiplier: 0.9,
        alarmScreamFreq: 0,
        fannerWingFreq: 0,
        subResonanceFreq: 100,
        gain: 0.35,
        filterCutoff: 380,
      };
    case 'foraging':
    case 'idle':
    default:
      return {
        baseDroneFreq: 215,
        harmonicMultiplier: 1.1,
        alarmScreamFreq: 0,
        fannerWingFreq: 220,
        subResonanceFreq: 107,
        gain: 0.55,
        filterCutoff: 650,
      };
  }
}

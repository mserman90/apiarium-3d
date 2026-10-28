import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SPECIES_PRESETS,
  getSpeciesById,
  clampGeneticValues,
  calculateTongueAccessibility,
} from '../genetics';
import {
  determineNextColonyState,
  getAudioParamsForState,
} from '../stateMachine';
import {
  updateSimulationTick,
  INITIAL_COLONY,
  INITIAL_ENVIRONMENT,
  INITIAL_THREAT,
  INITIAL_FAILURE_STATES,
} from '../simulation';
import {
  parseHotkeyEvent,
  tickCooldowns,
  COOLDOWN_DURATIONS,
  CooldownTracker,
} from '../controls';

test('1. Genetics: 5 presets exist and have valid biological ranges', () => {
  assert.equal(SPECIES_PRESETS.length, 5);

  const ligustica = getSpeciesById('ligustica');
  assert.equal(ligustica.nameTr, 'İtalyan Arısı');
  assert.ok(ligustica.sizeMultiplier >= 0.75 && ligustica.sizeMultiplier <= 1.6);
  assert.ok(ligustica.tongueLengthMm >= 6.2 && ligustica.tongueLengthMm <= 7.2);

  const cerana = getSpeciesById('cerana');
  assert.equal(cerana.taxonomy, 'Apis cerana');
  assert.ok(cerana.sizeMultiplier < 1.0, 'Cerana is compact');

  const caucasia = getSpeciesById('caucasia');
  assert.ok(caucasia.tongueLengthMm >= 7.0, 'Caucasian bee has long proboscis');
});

test('2. Genetics: Genetic engineering clamping and tongue accessibility', () => {
  const clamped = clampGeneticValues({
    sizeMultiplier: 3.5, // out of range
    tongueLengthMm: 5.0, // out of range
    aggression: 1.5,
  });

  assert.equal(clamped.sizeMultiplier, 1.6);
  assert.equal(clamped.tongueLengthMm, 6.2);
  assert.equal(clamped.aggression, 1.0);

  // Tongue access calculation
  const shortTongue = calculateTongueAccessibility(6.2);
  const longTongue = calculateTongueAccessibility(7.2);
  assert.equal(shortTongue.shallowFlowerYield, 1.0);
  assert.equal(shortTongue.deepFlowerYield, 0.35);
  assert.equal(longTongue.deepFlowerYield, 1.0);
});

test('3. State Machine: State transitions according to environmental cues & threats', () => {
  const envOptimal = { ...INITIAL_ENVIRONMENT, temperatureC: 25, pressureHpa: 1013 };
  const threatInactive = { ...INITIAL_THREAT, active: false };

  // Idle / Foraging at optimal temp
  const stateNormal = determineNextColonyState({
    currentState: 'idle',
    environment: envOptimal,
    threat: threatInactive,
    smokedRemainingSec: 0,
  });
  assert.equal(stateNormal, 'foraging');

  // Heat > 34°C triggers fanning
  const stateHot = determineNextColonyState({
    currentState: 'idle',
    environment: { ...envOptimal, temperatureC: 36.5 },
    threat: threatInactive,
    smokedRemainingSec: 0,
  });
  assert.equal(stateHot, 'fanning');

  // Cold < 14°C triggers clustering
  const stateCold = determineNextColonyState({
    currentState: 'idle',
    environment: { ...envOptimal, temperatureC: 11.0 },
    threat: threatInactive,
    smokedRemainingSec: 0,
  });
  assert.equal(stateCold, 'clustering');

  // Active threat triggers defending
  const stateDefending = determineNextColonyState({
    currentState: 'idle',
    environment: envOptimal,
    threat: { ...threatInactive, active: true, repelled: false },
    smokedRemainingSec: 0,
  });
  assert.equal(stateDefending, 'defending');

  // Smoke takes precedence
  const stateSmoked = determineNextColonyState({
    currentState: 'idle',
    environment: envOptimal,
    threat: threatInactive,
    smokedRemainingSec: 6.0,
  });
  assert.equal(stateSmoked, 'smoked');

  // Both threat and smoked -> smoked_defending
  const stateBoth = determineNextColonyState({
    currentState: 'idle',
    environment: envOptimal,
    threat: { ...threatInactive, active: true, repelled: false },
    smokedRemainingSec: 6.0,
  });
  assert.equal(stateBoth, 'smoked_defending');
});

test('4. Audio Parameters: Synthesized audio frequencies for colony states', () => {
  const audioIdle = getAudioParamsForState('idle', 25, 0);
  assert.equal(audioIdle.baseDroneFreq, 215); // standard carrier
  assert.equal(audioIdle.subResonanceFreq, 107); // sub-resonance

  const audioFanning = getAudioParamsForState('fanning', 36, 0);
  assert.ok(audioFanning.fannerWingFreq >= 230 && audioFanning.fannerWingFreq <= 250);

  const audioDefending = getAudioParamsForState('defending', 25, 0.8);
  assert.ok(audioDefending.alarmScreamFreq >= 320 && audioDefending.alarmScreamFreq <= 450);

  const audioSmoked = getAudioParamsForState('smoked', 25, 0);
  assert.equal(audioSmoked.baseDroneFreq, 175);
  assert.equal(audioSmoked.alarmScreamFreq, 0);
});

test('5. Simulation: Resource economics, evaporation and failure states', () => {
  const species = SPECIES_PRESETS[0];

  // Tick with high temperature to test heat stress
  const hotEnv = { ...INITIAL_ENVIRONMENT, temperatureC: 38.0 };
  const res = updateSimulationTick({
    colony: { ...INITIAL_COLONY, nectarKg: 0.2 },
    environment: hotEnv,
    species,
    threat: INITIAL_THREAT,
    failures: INITIAL_FAILURE_STATES,
    deltaSec: 2.0,
  });

  assert.equal(res.failures.heatStressActive, true);
  assert.ok(res.failures.heatStressTimerSec > 0);
  // Honey increased due to evaporation of nectar by fanners
  assert.ok(res.colony.honeyKg > 1.99);

  // Test low humidity crystallization alert
  const dryEnv = { ...INITIAL_ENVIRONMENT, humidityPct: 22 };
  const dryRes = updateSimulationTick({
    colony: INITIAL_COLONY,
    environment: dryEnv,
    species,
    threat: INITIAL_THREAT,
    failures: INITIAL_FAILURE_STATES,
    deltaSec: 1.0,
  });
  assert.equal(dryRes.failures.crystallizationWarning, true);
});

test('6. Simulation: Threat defense dynamics for Apis cerana vs Vespa mandarinia', () => {
  const cerana = getSpeciesById('cerana');
  const threatMandarinia = {
    ...INITIAL_THREAT,
    species: 'V. mandarinia' as const,
    active: true,
    health: 100,
  };

  const tickCerana = updateSimulationTick({
    colony: INITIAL_COLONY,
    environment: INITIAL_ENVIRONMENT,
    species: cerana,
    threat: threatMandarinia,
    failures: INITIAL_FAILURE_STATES,
    deltaSec: 2.0,
  });

  // Cerana deals high damage due to thermal ball (28 dps)
  assert.ok(tickCerana.threat.health < 60, 'Thermal ball causes massive heat damage');
  assert.ok(tickCerana.colony.threatDefenseProgress > 0.4);
});

test('7. Controls: Hotkeys, Alt+1..5 conflict avoidance and cooldown handling', () => {
  const emptyCooldowns: CooldownTracker = {
    smokerCooldownRemaining: 0,
    threatCooldownRemaining: 0,
    glassTapCooldownRemaining: 0,
  };

  // '1' without Alt -> Camera preset 1
  const camAction = parseHotkeyEvent({ key: '1' }, emptyCooldowns);
  assert.deepEqual(camAction, { type: 'SELECT_CAMERA', preset: 1 });

  // Alt+'1' -> Species preset index 0
  const speciesAction = parseHotkeyEvent({ key: '1', altKey: true }, emptyCooldowns);
  assert.deepEqual(speciesAction, { type: 'SELECT_SPECIES_PRESET', index: 0 });

  // 's' when ready -> PUFF_SMOKER
  const smokeAction = parseHotkeyEvent({ key: 's' }, emptyCooldowns);
  assert.deepEqual(smokeAction, { type: 'PUFF_SMOKER' });

  // 's' on cooldown -> NONE (ignored, no queueing)
  const activeCooldowns: CooldownTracker = {
    smokerCooldownRemaining: 5.5,
    threatCooldownRemaining: 0,
    glassTapCooldownRemaining: 0,
  };
  const blockedSmoke = parseHotkeyEvent({ key: 's' }, activeCooldowns);
  assert.deepEqual(blockedSmoke, { type: 'NONE' });

  // Cooldown countdown tick
  const updatedCooldowns = tickCooldowns(activeCooldowns, 1.5);
  assert.equal(updatedCooldowns.smokerCooldownRemaining, 4.0);
});

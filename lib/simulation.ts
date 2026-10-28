import type {
  Colony,
  Environment,
  FailureStates,
  Species,
  Threat,
} from './types';
import { determineNextColonyState } from './stateMachine';
import { calculateTongueAccessibility } from './genetics';

export const INITIAL_COLONY: Colony = {
  queen: {
    name: 'Apis Regina I',
    ageDays: 140,
    fertility: 0.98,
    eggsPerMinute: 2.5,
  },
  workers: 10000,
  visualBees: 60,
  larvae: 200,
  drones: 50,
  honeyKg: 2.0,
  pollenKg: 0.3,
  nectarKg: 0.15,
  combCellsCount: 1200,
  state: 'idle',
  alarmLevel: 0,
  fanningIntensity: 0,
  clusterDensity: 0,
  threatDefenseProgress: 0,
  smokedRemainingSec: 0,
};

export const INITIAL_ENVIRONMENT: Environment = {
  temperatureC: 34.5, // optimal brood temp
  humidityPct: 55,
  pressureHpa: 1013,
  lightMode: 'daylight',
  customHueDeg: 45,
};

export const INITIAL_THREAT: Threat = {
  species: 'V. mandarinia',
  active: false,
  startedAt: 0,
  elapsedSec: 0,
  health: 100,
  repelled: false,
};

export const INITIAL_FAILURE_STATES: FailureStates = {
  heatStressActive: false,
  heatStressTimerSec: 0,
  crystallizationWarning: false,
  predatorFailureActive: false,
  winterThresholdActive: false,
};

export const WINTER_HONEY_THRESHOLD_KG = 0.8;

export interface SimulationTickInput {
  colony: Colony;
  environment: Environment;
  species: Species;
  threat: Threat;
  failures: FailureStates;
  deltaSec: number;
}

export interface SimulationTickOutput {
  colony: Colony;
  threat: Threat;
  failures: FailureStates;
  events: string[];
}

export function updateSimulationTick(input: SimulationTickInput): SimulationTickOutput {
  const { environment, species, deltaSec } = input;
  const events: string[] = [];

  // Clone objects
  const colony: Colony = { ...input.colony, queen: { ...input.colony.queen } };
  const threat: Threat = { ...input.threat };
  const failures: FailureStates = { ...input.failures };

  // 1. Smoked timer countdown
  if (colony.smokedRemainingSec > 0) {
    colony.smokedRemainingSec = Math.max(0, colony.smokedRemainingSec - deltaSec);
    if (colony.smokedRemainingSec === 0) {
      events.push('smoke_cleared');
    }
  }

  // 2. Determine state machine transition
  colony.state = determineNextColonyState({
    currentState: colony.state,
    environment,
    threat,
    smokedRemainingSec: colony.smokedRemainingSec,
  });

  // 3. Alarm and Fanning levels
  if (colony.state === 'defending') {
    colony.alarmLevel = Math.min(1.0, colony.alarmLevel + deltaSec * 0.4);
  } else if (colony.state === 'smoked' || colony.state === 'smoked_defending') {
    colony.alarmLevel = Math.max(0.0, colony.alarmLevel - deltaSec * 0.5);
  } else {
    colony.alarmLevel = Math.max(0.0, colony.alarmLevel - deltaSec * 0.1);
  }

  if (colony.state === 'fanning') {
    colony.fanningIntensity = Math.min(1.0, colony.fanningIntensity + deltaSec * 0.3);
  } else {
    colony.fanningIntensity = Math.max(0.0, colony.fanningIntensity - deltaSec * 0.2);
  }

  if (colony.state === 'clustering') {
    const targetCluster = Math.min(1.0, (14 - environment.temperatureC) / 6);
    colony.clusterDensity = Math.min(1.0, Math.max(0.2, targetCluster));
  } else {
    colony.clusterDensity = Math.max(0.0, colony.clusterDensity - deltaSec * 0.3);
  }

  // 4. Foraging & Nectar / Pollen Gathering
  const tongueAccess = calculateTongueAccessibility(species.tongueLengthMm);
  const effectiveForagingSpeed = species.foragingSpeed * (tongueAccess.shallowFlowerYield + tongueAccess.deepFlowerYield) / 2;

  if (colony.state === 'foraging') {
    // Collect nectar and pollen
    const nectarCollected = 0.0005 * effectiveForagingSpeed * deltaSec;
    const pollenCollected = 0.0002 * species.foragingSpeed * deltaSec;
    colony.nectarKg += nectarCollected;
    colony.pollenKg += pollenCollected;

    // Comb building when resources are plentiful
    if (colony.honeyKg > 1.2 && colony.nectarKg > 0.1) {
      colony.combCellsCount += Math.round(species.combBuildRate * 0.2 * deltaSec);
    }
  }

  // 5. Honey Economics: Nectar Evaporation into Honey
  // Fanning accelerates moisture evaporation into mature honey (< 18% water)
  const evaporationRate = (0.0002 + colony.fanningIntensity * 0.0006) * deltaSec;
  if (colony.nectarKg > 0) {
    const converted = Math.min(colony.nectarKg, evaporationRate);
    colony.nectarKg -= converted;
    colony.honeyKg += converted * 0.85; // concentrated honey
  }

  // Daily consumption rate: ~0.02 kg per 1,000 bees per 86400s
  let consumptionRatePerSec = (colony.workers / 1000) * (0.02 / 300) * deltaSec;
  if (environment.humidityPct < 30) {
    // Crystallization increases food waste & consumption
    consumptionRatePerSec *= 1.5;
  }
  colony.honeyKg = Math.max(0.05, colony.honeyKg - consumptionRatePerSec);

  // Larvae consume pollen and royal jelly
  const pollenConsumptionPerSec = (colony.larvae / 100) * 0.0001 * deltaSec;
  colony.pollenKg = Math.max(0.01, colony.pollenKg - pollenConsumptionPerSec);

  // 6. Threat Progression & Defense Resolution
  if (threat.active && !threat.repelled) {
    threat.elapsedSec += deltaSec;

    // Defense effectiveness varies with species
    // Apis cerana has synchronized heat-ball specifically against Vespa mandarinia
    let defenseDPS = 12.0; // base damage per second to threat
    if (species.id === 'cerana' && threat.species === 'V. mandarinia') {
      defenseDPS = 28.0; // deadly thermal ball (46°C cook)
    } else if (threat.species === 'V. velutina') {
      // biting + dropping tactic
      defenseDPS = 16.0 * (0.8 + species.aggression * 0.5);
    } else {
      defenseDPS = 18.0 * (0.7 + species.aggression * 0.6);
    }

    if (colony.state === 'smoked' || colony.state === 'smoked_defending') {
      defenseDPS *= 0.35;
    }

    threat.health = Math.max(0, threat.health - defenseDPS * deltaSec);
    colony.threatDefenseProgress = (100 - threat.health) / 100;

    if (threat.health <= 0) {
      threat.repelled = true;
      threat.active = false;
      events.push('threat_repelled');
    }

    // Failure: threat not repelled within 3 minutes (180s)
    if (threat.elapsedSec > 180 && !threat.repelled) {
      failures.predatorFailureActive = true;
      // Guard casualties
      const guardLoss = Math.round(50 * deltaSec);
      colony.workers = Math.max(2000, colony.workers - guardLoss);
      events.push('guard_casualties');
    }
  } else {
    colony.threatDefenseProgress = 0;
  }

  // 7. Failure Conditions Evaluation
  // Heat stress (> 36 °C)
  if (environment.temperatureC > 36) {
    failures.heatStressActive = true;
    failures.heatStressTimerSec += deltaSec;
    if (failures.heatStressTimerSec >= 300) {
      // Brood loss: larvae die
      const larvaeLost = Math.round(5 * deltaSec);
      colony.larvae = Math.max(0, colony.larvae - larvaeLost);
      events.push('brood_heat_stress_casualty');
    }
  } else {
    failures.heatStressActive = false;
    failures.heatStressTimerSec = Math.max(0, failures.heatStressTimerSec - deltaSec * 0.5);
  }

  // Humidity < 30%: crystallization warning
  failures.crystallizationWarning = environment.humidityPct < 30;

  // Honey reserves < winter threshold (0.8 kg)
  failures.winterThresholdActive = colony.honeyKg < WINTER_HONEY_THRESHOLD_KG;
  if (failures.winterThresholdActive && colony.state === 'clustering') {
    // Colony shrinking
    const workerDrop = Math.round(2 * deltaSec);
    colony.workers = Math.max(1500, colony.workers - workerDrop);
  }

  // Visual bees LOD calculation (30 to 60 based on colony health/workers)
  colony.visualBees = Math.min(60, Math.max(30, Math.round((colony.workers / 10000) * 60)));

  return {
    colony,
    threat,
    failures,
    events,
  };
}

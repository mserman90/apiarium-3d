// Core Type Definitions for Apiarium 3D

export type ColonyState =
  | 'idle'
  | 'foraging'
  | 'fanning'
  | 'clustering'
  | 'defending'
  | 'smoked'
  | 'smoked_defending';

export type PredatorSpecies = 'V. velutina' | 'V. mandarinia' | 'Vespula spp.';

export type LightSpectrumMode = 'daylight' | 'uv' | 'ir' | 'sunset' | 'custom';

export type BeeCaste =
  | 'queen'
  | 'forager'
  | 'builder'
  | 'nurse'
  | 'guard'
  | 'fanner'
  | 'drone';

export interface Queen {
  name: string;
  ageDays: number;
  fertility: number; // 0..1
  eggsPerMinute: number;
}

export interface Colony {
  queen: Queen;
  workers: number; // logical population (~10,000)
  visualBees: number; // LOD (30 - 60)
  larvae: number; // count
  drones: number;
  honeyKg: number;
  pollenKg: number;
  nectarKg: number;
  combCellsCount: number;
  state: ColonyState;
  alarmLevel: number; // 0..1
  fanningIntensity: number; // 0..1
  clusterDensity: number; // 0..1
  threatDefenseProgress: number; // 0..1 (progress of balling / dispatching)
  smokedRemainingSec: number;
}

export interface Species {
  id: string;
  nameTr: string;
  nameEn: string;
  taxonomy: string;
  descriptionTr: string;
  descriptionEn: string;
  sizeMultiplier: number; // 0.75 - 1.6
  tongueLengthMm: number; // 6.2 - 7.2
  chitinColor: string;
  stripeTint: string;
  hairDensity: number; // 0 - 1
  aggression: number; // 0 - 1
  foragingSpeed: number; // 0 - 1
  combBuildRate: number; // 0 - 1
  coldTolerance: number; // 0 - 1
}

export interface Environment {
  temperatureC: number; // 10 - 42 °C
  humidityPct: number; // 25 - 95 %
  pressureHpa: number; // 980 - 1030 hPa
  lightMode: LightSpectrumMode;
  customHueDeg: number; // 0 - 360 °
}

export interface Threat {
  species: PredatorSpecies;
  active: boolean;
  startedAt: number; // timestamp ms
  elapsedSec: number;
  health: number; // 0..100
  repelled: boolean;
}

export interface FailureStates {
  heatStressActive: boolean;
  heatStressTimerSec: number; // reaches 300s -> severe failure
  crystallizationWarning: boolean;
  predatorFailureActive: boolean;
  winterThresholdActive: boolean;
}

export type CameraViewPreset = 1 | 2 | 3 | 4 | 5;

export interface CameraPresetConfig {
  id: CameraViewPreset;
  titleTr: string;
  titleEn: string;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

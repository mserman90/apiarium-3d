import React, { useEffect, useRef, useState, useCallback } from 'react';
import type {
  CameraViewPreset,
  Colony,
  Environment,
  FailureStates,
  PredatorSpecies,
  Species,
  Threat,
} from '../lib/types';
import {
  INITIAL_COLONY,
  INITIAL_ENVIRONMENT,
  INITIAL_FAILURE_STATES,
  INITIAL_THREAT,
  updateSimulationTick,
} from '../lib/simulation';
import { SPECIES_PRESETS } from '../lib/genetics';
import {
  COOLDOWN_DURATIONS,
  type CooldownTracker,
  isInputFocused,
  parseHotkeyEvent,
  tickCooldowns,
} from '../lib/controls';
import { ApiariumEngine } from './scene/ApiariumEngine';
import { soundEngine } from './audio/BeeSoundEngine';
import { HeaderHUD } from './components/HeaderHUD';
import { Dock } from './components/Dock';
import { GeneticEngineerModal } from './components/GeneticEngineerModal';
import type { Language } from './i18n';

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<ApiariumEngine | null>(null);

  // Core Simulation State
  const [colony, setColony] = useState<Colony>(INITIAL_COLONY);
  const [environment, setEnvironment] = useState<Environment>(INITIAL_ENVIRONMENT);
  const [species, setSpecies] = useState<Species>(SPECIES_PRESETS[0]);
  const [threat, setThreat] = useState<Threat>(INITIAL_THREAT);
  const [failures, setFailures] = useState<FailureStates>(INITIAL_FAILURE_STATES);

  // App UI State
  const [lang, setLang] = useState<Language>('tr');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [zenMode, setZenMode] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(60);
  const [currentCamera, setCurrentCamera] = useState<CameraViewPreset>(1);
  const [isEngineerOpen, setIsEngineerOpen] = useState<boolean>(false);

  // Audio State
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);

  // Cooldowns
  const [cooldowns, setCooldowns] = useState<CooldownTracker>({
    smokerCooldownRemaining: 0,
    threatCooldownRemaining: 0,
    glassTapCooldownRemaining: 0,
  });

  // Keep references for tick loop without stale closures
  const colonyRef = useRef(colony);
  colonyRef.current = colony;
  const envRef = useRef(environment);
  envRef.current = environment;
  const speciesRef = useRef(species);
  speciesRef.current = species;
  const threatRef = useRef(threat);
  threatRef.current = threat;
  const failuresRef = useRef(failures);
  failuresRef.current = failures;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const cooldownsRef = useRef(cooldowns);
  cooldownsRef.current = cooldowns;

  // 2. Actions
  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const handlePuffSmoker = useCallback(() => {
    if (cooldownsRef.current.smokerCooldownRemaining > 0) return;

    soundEngine.playSmokerPuff();
    if (engineRef.current) {
      engineRef.current.triggerSmokePuff();
    }

    setColony((prev) => ({
      ...prev,
      smokedRemainingSec: 8.0,
      state: prev.state === 'defending' ? 'smoked_defending' : 'smoked',
    }));

    setCooldowns((prev) => ({
      ...prev,
      smokerCooldownRemaining: COOLDOWN_DURATIONS.smoker,
    }));
  }, []);

  const handleTapGlass = useCallback(() => {
    if (cooldownsRef.current.glassTapCooldownRemaining > 0) return;

    soundEngine.playGlassTap();
    if (engineRef.current) {
      engineRef.current.triggerGlassTap();
    }

    // Temporary alert excitation
    setColony((prev) => ({
      ...prev,
      alarmLevel: Math.min(1.0, prev.alarmLevel + 0.35),
    }));

    setCooldowns((prev) => ({
      ...prev,
      glassTapCooldownRemaining: COOLDOWN_DURATIONS.glassTap,
    }));
  }, []);

  const handleTriggerThreat = useCallback((predatorSpecies: PredatorSpecies) => {
    if (cooldownsRef.current.threatCooldownRemaining > 0 || threatRef.current.active) return;

    setThreat({
      species: predatorSpecies,
      active: true,
      startedAt: Date.now(),
      elapsedSec: 0,
      health: 100,
      repelled: false,
    });

    setCooldowns((prev) => ({
      ...prev,
      threatCooldownRemaining: COOLDOWN_DURATIONS.threat,
    }));
  }, []);

  const handleSelectCamera = useCallback((cam: CameraViewPreset) => {
    setCurrentCamera(cam);
    if (engineRef.current) {
      engineRef.current.setCameraPreset(cam);
    }
  }, []);

  const handleSelectSpecies = useCallback((s: Species) => {
    setSpecies(s);
    if (engineRef.current) {
      engineRef.current.updateSpecies(s);
    }
  }, []);

  const handleUpdateEnvironment = useCallback((env: Environment) => {
    setEnvironment(env);
    if (engineRef.current) {
      engineRef.current.updateEnvironment(env);
    }
  }, []);

  const handleUnlockAudio = useCallback(async () => {
    const success = await soundEngine.resumeAudio();
    setAudioUnlocked(success);
    setIsMuted(soundEngine.getIsMuted());
  }, []);

  const handleToggleSound = useCallback(() => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
    setAudioUnlocked(true);
  }, []);

  // 1. Initialize 3D Engine (StrictMode-safe single instance)
  useEffect(() => {
    if (!canvasRef.current || engineRef.current) return;

    const engine = new ApiariumEngine({
      canvas: canvasRef.current,
      onFpsUpdate: (newFps) => setFps(newFps),
      onTapGlass: () => handleTapGlass(),
    });

    engine.updateSpecies(speciesRef.current);
    engine.updateEnvironment(envRef.current);
    engine.updateColony(colonyRef.current, threatRef.current);
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [handleTapGlass]);

  // 3. Simulation & Cooldown Tick Loop
  useEffect(() => {
    const interval = setInterval(() => {
      const deltaSec = 0.2; // 5 ticks per sec for smooth resource dynamics

      // Tick cooldowns
      setCooldowns((prev) => tickCooldowns(prev, deltaSec));

      if (isPausedRef.current) return;

      const result = updateSimulationTick({
        colony: colonyRef.current,
        environment: envRef.current,
        species: speciesRef.current,
        threat: threatRef.current,
        failures: failuresRef.current,
        deltaSec,
      });

      setColony(result.colony);
      setThreat(result.threat);
      setFailures(result.failures);

      // Sync with 3D scene
      if (engineRef.current) {
        engineRef.current.updateColony(result.colony, result.threat);
      }

      // Sync with Web Audio synthesizer
      soundEngine.updateState(
        result.colony.state,
        envRef.current.temperatureC,
        result.colony.alarmLevel
      );
    }, 200);

    return () => clearInterval(interval);
  }, []);

  // 4. Hotkeys Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInputFocused(e.target)) return;

      const action = parseHotkeyEvent(e, cooldownsRef.current);
      if (action.type === 'NONE') return;

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
      }

      switch (action.type) {
        case 'TOGGLE_PAUSE':
          handleTogglePause();
          break;
        case 'PUFF_SMOKER':
          handlePuffSmoker();
          break;
        case 'TRIGGER_THREAT':
          handleTriggerThreat('V. mandarinia');
          break;
        case 'GLASS_TAP':
          handleTapGlass();
          break;
        case 'TOGGLE_ZEN_MODE':
          setZenMode((prev) => !prev);
          break;
        case 'SELECT_CAMERA':
          handleSelectCamera(action.preset);
          break;
        case 'SELECT_SPECIES_PRESET': {
          const spec = SPECIES_PRESETS[action.index];
          if (spec) handleSelectSpecies(spec);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleTogglePause,
    handlePuffSmoker,
    handleTriggerThreat,
    handleTapGlass,
    handleSelectCamera,
    handleSelectSpecies,
  ]);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden select-none bg-slate-950 font-sans"
      onClick={() => {
        if (!audioUnlocked) handleUnlockAudio();
      }}
    >
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing outline-none"
      />

      {/* Top Header HUD Overlay */}
      <HeaderHUD
        lang={lang}
        onToggleLang={() => setLang((l) => (l === 'tr' ? 'en' : 'tr'))}
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        isMuted={isMuted}
        onToggleSound={handleToggleSound}
        audioUnlocked={audioUnlocked}
        onUnlockAudio={handleUnlockAudio}
        fps={fps}
        zenMode={zenMode}
        currentCamera={currentCamera}
        colonyState={colony.state}
        activeSpecies={species}
        failures={failures}
      />

      {/* Floating Bottom Dock */}
      <Dock
        lang={lang}
        colony={colony}
        environment={environment}
        onUpdateEnvironment={handleUpdateEnvironment}
        species={species}
        onSelectSpecies={handleSelectSpecies}
        onOpenEngineer={() => setIsEngineerOpen(true)}
        threat={threat}
        onTriggerThreat={handleTriggerThreat}
        onPuffSmoker={handlePuffSmoker}
        onTapGlass={handleTapGlass}
        cooldowns={cooldowns}
        currentCamera={currentCamera}
        onSelectCamera={handleSelectCamera}
        zenMode={zenMode}
      />

      {/* Custom Species Genetic Engineer Modal */}
      <GeneticEngineerModal
        isOpen={isEngineerOpen}
        onClose={() => setIsEngineerOpen(false)}
        currentSpecies={species}
        onApply={(custom) => handleSelectSpecies(custom)}
        lang={lang}
      />
    </div>
  );
};

export default App;

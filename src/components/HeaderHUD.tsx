import React from 'react';
import {
  Volume2,
  VolumeX,
  Languages,
  Pause,
  Play,
  Eye,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Snowflake,
} from 'lucide-react';
import type {
  CameraViewPreset,
  ColonyState,
  FailureStates,
  Species,
} from '../../lib/types';
import { CAMERA_PRESETS } from '../../lib/cameraPresets';
import { I18N, type Language } from '../i18n';

interface HeaderHUDProps {
  lang: Language;
  onToggleLang: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
  isMuted: boolean;
  onToggleSound: () => void;
  audioUnlocked: boolean;
  onUnlockAudio: () => void;
  fps: number;
  zenMode: boolean;
  currentCamera: CameraViewPreset;
  colonyState: ColonyState;
  activeSpecies: Species;
  failures: FailureStates;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  lang,
  onToggleLang,
  isPaused,
  onTogglePause,
  isMuted,
  onToggleSound,
  audioUnlocked,
  onUnlockAudio,
  fps,
  zenMode,
  currentCamera,
  colonyState,
  activeSpecies,
  failures,
}) => {
  const t = I18N[lang];
  const camPreset = CAMERA_PRESETS[currentCamera];

  const getStateColor = (state: ColonyState) => {
    switch (state) {
      case 'defending':
        return 'bg-red-500/20 text-red-300 border-red-500/40 glow-red';
      case 'fanning':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'clustering':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'smoked':
      case 'smoked_defending':
        return 'bg-slate-500/20 text-slate-300 border-slate-400/40';
      case 'foraging':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'idle':
      default:
        return 'bg-amber-500/15 text-amber-200 border-amber-500/30';
    }
  };

  return (
    <header className="fixed top-3 inset-x-3 md:inset-x-6 z-40 pointer-events-none flex flex-col gap-2">
      {/* Main Top Bar */}
      <div className="flex items-center justify-between gap-3 glass-panel px-4 py-2.5 rounded-2xl pointer-events-auto shadow-2xl">
        {/* Brand & Subspecies */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xl shadow-lg shadow-amber-500/30">
            🍯
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-wide">
                {t.appTitle}
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                v1.1
              </span>
            </div>
            <p className="text-xs text-amber-200/70 hidden sm:block">
              {lang === 'tr' ? activeSpecies.nameTr : activeSpecies.nameEn} ({activeSpecies.taxonomy})
            </p>
          </div>
        </div>

        {/* Center: State & Camera Mode */}
        <div className="hidden lg:flex items-center gap-2.5">
          {/* Colony State */}
          <div
            className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-2 transition-all ${getStateColor(
              colonyState
            )}`}
          >
            <span className="w-2 h-2 rounded-full bg-current animate-ping" />
            {t.states[colonyState]}
          </div>

          {/* Current Camera */}
          <div className="px-3 py-1 rounded-full text-xs bg-slate-800/80 text-slate-300 border border-slate-700/60 flex items-center gap-1.5 font-medium">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            {lang === 'tr' ? camPreset.titleTr : camPreset.titleEn}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Pause / Resume */}
          <button
            onClick={onTogglePause}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
              isPaused
                ? 'bg-amber-500/30 text-amber-300 border-amber-500/50'
                : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-700/60'
            }`}
            title="Space"
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{isPaused ? t.resume : t.pause}</span>
          </button>

          {/* Sound Mute/Unmute */}
          <button
            onClick={onToggleSound}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
              !isMuted && audioUnlocked
                ? 'bg-amber-500/25 text-amber-300 border-amber-500/40'
                : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white'
            }`}
            title={isMuted ? t.soundOff : t.soundOn}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Audio ON'}</span>
          </button>

          {/* FPS Badge */}
          <div className="px-2.5 py-1 rounded-xl text-xs bg-slate-900/80 text-slate-400 border border-slate-800 font-mono hidden sm:flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{fps}</span>
            <span>{t.fps}</span>
          </div>

          {/* Zen Mode indicator */}
          {zenMode && (
            <div className="px-2.5 py-1 rounded-xl text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium hidden md:block">
              {t.zenModeActive}
            </div>
          )}

          {/* TR / EN Switch */}
          <button
            onClick={onToggleLang}
            className="p-1.5 rounded-xl bg-slate-800/60 text-slate-300 border border-slate-700/60 hover:bg-slate-700/60 hover:text-white transition-all flex items-center gap-1 text-xs font-bold"
            title="Switch Language"
          >
            <Languages className="w-4 h-4 text-amber-400" />
            <span className="uppercase">{lang}</span>
          </button>
        </div>
      </div>

      {/* Autoplay Audio Unlock Notice */}
      {!audioUnlocked && (
        <button
          onClick={onUnlockAudio}
          className="glass-panel px-4 py-2 rounded-xl border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-3 pointer-events-auto bg-amber-950/40 hover:bg-amber-900/50 transition-all glow-amber"
        >
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>{t.soundNotice}</span>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px]">
            {t.soundOff}
          </span>
        </button>
      )}

      {/* Failure State Warning Banners */}
      <div className="flex flex-col gap-1.5">
        {failures.heatStressActive && (
          <div className="glass-panel border-red-500/50 bg-red-950/70 text-red-200 px-4 py-2 rounded-xl text-xs flex items-center justify-between gap-3 pointer-events-auto glow-red">
            <div className="flex items-center gap-2 font-medium">
              <Flame className="w-4 h-4 text-red-400 animate-pulse" />
              <span>{t.failures.heatTitle}</span>
              <span className="text-red-300/80 hidden sm:inline">{t.failures.heatDesc}</span>
            </div>
            <span className="font-mono text-red-300 font-bold">
              {Math.max(0, 300 - Math.round(failures.heatStressTimerSec))}s
            </span>
          </div>
        )}

        {failures.crystallizationWarning && (
          <div className="glass-panel border-amber-500/50 bg-amber-950/60 text-amber-200 px-4 py-2 rounded-xl text-xs flex items-center gap-2 pointer-events-auto">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="font-semibold">{t.failures.crystTitle}</span>
            <span className="text-amber-200/80 hidden sm:inline">{t.failures.crystDesc}</span>
          </div>
        )}

        {failures.predatorFailureActive && (
          <div className="glass-panel border-rose-600/60 bg-rose-950/70 text-rose-200 px-4 py-2 rounded-xl text-xs flex items-center gap-2 pointer-events-auto glow-red">
            <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
            <span className="font-semibold">{t.failures.predatorTitle}</span>
            <span className="text-rose-200/80 hidden sm:inline">{t.failures.predatorDesc}</span>
          </div>
        )}

        {failures.winterThresholdActive && (
          <div className="glass-panel border-cyan-500/50 bg-cyan-950/60 text-cyan-200 px-4 py-2 rounded-xl text-xs flex items-center gap-2 pointer-events-auto">
            <Snowflake className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold">{t.failures.winterTitle}</span>
            <span className="text-cyan-200/80 hidden sm:inline">{t.failures.winterDesc}</span>
          </div>
        )}
      </div>
    </header>
  );
};

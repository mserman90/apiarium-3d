import React, { useState } from 'react';
import {
  Users,
  Dna,
  SunMedium,
  Shield,
  Camera,
  Wind,
  HandMetal,
  Info,
  SlidersHorizontal,
  Crosshair,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import type {
  CameraViewPreset,
  Colony,
  Environment,
  LightSpectrumMode,
  PredatorSpecies,
  Species,
  Threat,
} from '../../lib/types';
import { SPECIES_PRESETS } from '../../lib/genetics';
import type { CooldownTracker } from '../../lib/controls';
import { I18N, type Language } from '../i18n';

interface DockProps {
  lang: Language;
  colony: Colony;
  environment: Environment;
  onUpdateEnvironment: (env: Environment) => void;
  species: Species;
  onSelectSpecies: (s: Species) => void;
  onOpenEngineer: () => void;
  threat: Threat;
  onTriggerThreat: (predator: PredatorSpecies) => void;
  onPuffSmoker: () => void;
  onTapGlass: () => void;
  cooldowns: CooldownTracker;
  currentCamera: CameraViewPreset;
  onSelectCamera: (cam: CameraViewPreset) => void;
  zenMode: boolean;
}

export const Dock: React.FC<DockProps> = ({
  lang,
  colony,
  environment,
  onUpdateEnvironment,
  species,
  onSelectSpecies,
  onOpenEngineer,
  threat,
  onTriggerThreat,
  onPuffSmoker,
  onTapGlass,
  cooldowns,
  currentCamera,
  onSelectCamera,
  zenMode,
}) => {
  const t = I18N[lang];
  const [activeTab, setActiveTab] = useState<'colony' | 'species' | 'environment' | 'defense' | 'controls'>('colony');
  const [selectedPredator, setSelectedPredator] = useState<PredatorSpecies>('V. mandarinia');
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (zenMode) return null;

  return (
    <div className="fixed bottom-3 inset-x-3 md:inset-x-6 z-40 flex flex-col items-center pointer-events-none">
      <div className="w-full max-w-4xl glass-panel rounded-3xl border border-white/15 pointer-events-auto shadow-2xl overflow-hidden transition-all duration-300">
        {/* Tab Headers */}
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5 bg-black/25">
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            <button
              onClick={() => { setActiveTab('colony'); setIsCollapsed(false); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'colony' && !isCollapsed
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{t.tabs.colony}</span>
            </button>

            <button
              onClick={() => { setActiveTab('species'); setIsCollapsed(false); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'species' && !isCollapsed
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Dna className="w-3.5 h-3.5" />
              <span>{t.tabs.species}</span>
            </button>

            <button
              onClick={() => { setActiveTab('environment'); setIsCollapsed(false); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'environment' && !isCollapsed
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <SunMedium className="w-3.5 h-3.5" />
              <span>{t.tabs.environment}</span>
            </button>

            <button
              onClick={() => { setActiveTab('defense'); setIsCollapsed(false); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'defense' && !isCollapsed
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{t.tabs.defense}</span>
              {threat.active && (
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping ml-1" />
              )}
            </button>

            <button
              onClick={() => { setActiveTab('controls'); setIsCollapsed(false); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'controls' && !isCollapsed
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{t.tabs.controls}</span>
            </button>
          </div>

          {/* Minimize / Maximize Dock */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Collapse dock"
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Tab Body */}
        {!isCollapsed && (
          <div className="p-4 max-h-[36vh] overflow-y-auto">
            {/* 1. Colony & Castes Tab */}
            {activeTab === 'colony' && (
              <div className="space-y-4">
                {/* Resource Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[11px] text-slate-400">{t.resources.logicalPopulation}</p>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-sm font-bold text-white font-mono">
                        {colony.workers.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-amber-400">
                        ({colony.visualBees} {lang === 'tr' ? 'görsel' : 'LOD'})
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[11px] text-slate-400">{t.resources.honey}</p>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-sm font-bold text-amber-300 font-mono">
                        {colony.honeyKg.toFixed(2)} kg
                      </span>
                      <span className="text-[10px] text-slate-400">
                        (~0.02 kg/gün)
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[11px] text-slate-400">{t.resources.pollen}</p>
                    <p className="text-sm font-bold text-yellow-400 font-mono mt-0.5">
                      {colony.pollenKg.toFixed(3)} kg
                    </p>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[11px] text-slate-400">{t.resources.larvae} & {t.resources.drones}</p>
                    <p className="text-sm font-bold text-slate-200 font-mono mt-0.5">
                      {colony.larvae} <span className="text-xs text-slate-400 font-normal">larva</span> / {colony.drones} <span className="text-xs text-slate-400 font-normal">drone</span>
                    </p>
                  </div>
                </div>

                {/* Castes Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center justify-between font-bold text-amber-300">
                      <span>👑 {t.castes.queen}</span>
                      <span className="font-mono text-[11px]">1 adet (Regina I)</span>
                    </div>
                    <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                      {t.castes.queenDesc}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between font-bold text-slate-200">
                      <span>🌸 {t.castes.forager}</span>
                      <span className="text-emerald-400 font-mono text-[11px]">Waggle Dance</span>
                    </div>
                    <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                      {t.castes.foragerDesc}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between font-bold text-slate-200">
                      <span>🧱 {t.castes.builder}</span>
                      <span className="text-amber-400 font-mono text-[11px]">Festooning</span>
                    </div>
                    <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                      {t.castes.builderDesc}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between font-bold text-slate-200">
                      <span>🍼 {t.castes.nurse}</span>
                      <span className="text-blue-300 font-mono text-[11px]">Royal Jelly</span>
                    </div>
                    <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                      {t.castes.nurseDesc}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between font-bold text-slate-200">
                      <span>🛡️ {t.castes.guard}</span>
                      <span className="text-rose-400 font-mono text-[11px]">Nozzle Patrol</span>
                    </div>
                    <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                      {t.castes.guardDesc}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between font-bold text-slate-200">
                      <span>💨 {t.castes.fanner}</span>
                      <span className="text-cyan-400 font-mono text-[11px]">≈240 Hz Wingbeat</span>
                    </div>
                    <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                      {t.castes.fannerDesc}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Species & Genetics Tab */}
            {activeTab === 'species' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    Önceden tanımlı 5 alt tür veya CRISPR mühendisliği ile özel fenotip seçin.
                  </p>
                  <button
                    onClick={onOpenEngineer}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 flex items-center gap-1.5 transition-all"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Özel Genetik Mühendisi</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {SPECIES_PRESETS.map((s, idx) => {
                    const isSelected = species.id === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => onSelectSpecies(s)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500/60 shadow-lg shadow-amber-500/10'
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-white text-xs">
                              {lang === 'tr' ? s.nameTr : s.nameEn}
                            </h3>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-amber-300">
                              Alt+{idx + 1}
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-200/80 italic mt-0.5">
                            {s.taxonomy}
                          </p>
                          <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed line-clamp-2">
                            {lang === 'tr' ? s.descriptionTr : s.descriptionEn}
                          </p>
                        </div>

                        <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>Dil: {s.tongueLengthMm}mm</span>
                          <span>Soğuk: {(s.coldTolerance * 100).toFixed(0)}%</span>
                          <span>Hız: {(s.foragingSpeed * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Climate & Light Spectrum Tab */}
            {activeTab === 'environment' && (
              <div className="space-y-4">
                {/* Sliders */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Temperature */}
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-300">{t.environment.temp}</span>
                      <span className={`font-mono font-bold text-sm ${
                        environment.temperatureC > 36 ? 'text-red-400 animate-pulse' :
                        environment.temperatureC < 14 ? 'text-cyan-400' :
                        environment.temperatureC >= 34 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {environment.temperatureC.toFixed(1)} °C
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={42}
                      step={0.5}
                      value={environment.temperatureC}
                      onChange={(e) =>
                        onUpdateEnvironment({ ...environment, temperatureC: parseFloat(e.target.value) })
                      }
                      className="w-full accent-amber-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>&lt;14° Kış Salkımı</span>
                      <span>34-36° Fanners</span>
                      <span>&gt;36° Stres</span>
                    </div>
                  </div>

                  {/* Humidity */}
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-300">{t.environment.humidity}</span>
                      <span className={`font-mono font-bold text-sm ${
                        environment.humidityPct < 30 ? 'text-amber-400' : 'text-blue-400'
                      }`}>
                        {environment.humidityPct}% RH
                      </span>
                    </div>
                    <input
                      type="range"
                      min={25}
                      max={95}
                      step={1}
                      value={environment.humidityPct}
                      onChange={(e) =>
                        onUpdateEnvironment({ ...environment, humidityPct: parseInt(e.target.value) })
                      }
                      className="w-full accent-blue-500"
                    />
                    <p className="text-[10px] text-slate-400">
                      {environment.humidityPct < 30 ? '⚠️ Kristalizasyon riski yüksek' : 'Bal olgunlaşması için ideal'}
                    </p>
                  </div>

                  {/* Pressure */}
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-300">{t.environment.pressure}</span>
                      <span className="font-mono font-bold text-sm text-emerald-400">
                        {environment.pressureHpa} hPa
                      </span>
                    </div>
                    <input
                      type="range"
                      min={980}
                      max={1030}
                      step={1}
                      value={environment.pressureHpa}
                      onChange={(e) =>
                        onUpdateEnvironment({ ...environment, pressureHpa: parseInt(e.target.value) })
                      }
                      className="w-full accent-emerald-500"
                    />
                    <p className="text-[10px] text-slate-400">
                      {environment.pressureHpa < 995 ? '⛈️ Fırtına: Tarlacılar kovana sığınır' : '☀️ Açık hava tarlacılık uçuşu'}
                    </p>
                  </div>
                </div>

                {/* Light Modes */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-300">{t.environment.lightSpectrum}</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'daylight' as LightSpectrumMode, label: t.environment.spectrumDaylight, icon: '☀️' },
                      { id: 'uv' as LightSpectrumMode, label: t.environment.spectrumUV, icon: '🔮' },
                      { id: 'ir' as LightSpectrumMode, label: t.environment.spectrumIR, icon: '🔴' },
                      { id: 'sunset' as LightSpectrumMode, label: t.environment.spectrumSunset, icon: '🌅' },
                      { id: 'custom' as LightSpectrumMode, label: t.environment.spectrumCustom, icon: '🎨' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => onUpdateEnvironment({ ...environment, lightMode: mode.id })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                          environment.lightMode === mode.id
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                            : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <span>{mode.icon}</span>
                        <span>{mode.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Custom Spectrum Wheel Slider */}
                  {environment.lightMode === 'custom' && (
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300">{t.environment.customHue}</span>
                        <span className="font-mono text-amber-400">{environment.customHueDeg}°</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={360}
                        value={environment.customHueDeg}
                        onChange={(e) =>
                          onUpdateEnvironment({ ...environment, customHueDeg: parseInt(e.target.value) })
                        }
                        className="w-full"
                      />
                    </div>
                  )}

                  {/* Light Mode Information Card */}
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-300">
                        {environment.lightMode === 'uv' ? t.environment.uvCardTitle :
                         environment.lightMode === 'ir' ? t.environment.irCardTitle :
                         environment.lightMode === 'sunset' ? t.environment.sunsetCardTitle :
                         t.environment.daylightCardTitle}
                      </h4>
                      <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                        {environment.lightMode === 'uv' ? t.environment.uvCardDesc :
                         environment.lightMode === 'ir' ? t.environment.irCardDesc :
                         environment.lightMode === 'sunset' ? t.environment.sunsetCardDesc :
                         t.environment.daylightCardDesc}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Threat & Hive Defense Tab */}
            {activeTab === 'defense' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Wasp Threat Trigger */}
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                          <Crosshair className="w-3.5 h-3.5 text-red-400" />
                          <span>{t.threat.title}</span>
                        </h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-amber-300">
                          W
                        </span>
                      </div>

                      <div className="mt-2 space-y-1">
                        <label className="text-[11px] text-slate-400">{t.threat.selectPredator}</label>
                        <select
                          value={selectedPredator}
                          onChange={(e) => setSelectedPredator(e.target.value as PredatorSpecies)}
                          disabled={threat.active}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
                        >
                          <option value="V. mandarinia">Vespa mandarinia (Dev Eşek Arısı)</option>
                          <option value="V. velutina">Vespa velutina (Asya Eşek Arısı)</option>
                          <option value="Vespula spp.">Vespula spp. (Yaban Arısı)</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={() => onTriggerThreat(selectedPredator)}
                      disabled={threat.active || cooldowns.threatCooldownRemaining > 0}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        threat.active
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40 glow-red'
                          : cooldowns.threatCooldownRemaining > 0
                          ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30'
                      }`}
                    >
                      {threat.active ? (
                        <span>{t.threat.activeThreat}</span>
                      ) : cooldowns.threatCooldownRemaining > 0 ? (
                        <span>{t.threat.cooldown} {cooldowns.threatCooldownRemaining.toFixed(1)}s</span>
                      ) : (
                        <span>{t.threat.triggerAttack}</span>
                      )}
                    </button>
                  </div>

                  {/* Bee Smoker */}
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                          <Wind className="w-3.5 h-3.5 text-slate-300" />
                          <span>Duman Körüğü (Bee Smoker)</span>
                        </h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-amber-300">
                          S
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        {t.threat.smokerDesc}
                      </p>
                    </div>

                    <button
                      onClick={onPuffSmoker}
                      disabled={cooldowns.smokerCooldownRemaining > 0}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        colony.smokedRemainingSec > 0
                          ? 'bg-slate-500/30 text-slate-200 border border-slate-400/40'
                          : cooldowns.smokerCooldownRemaining > 0
                          ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                          : 'bg-slate-700 hover:bg-slate-600 text-white shadow-md'
                      }`}
                    >
                      {colony.smokedRemainingSec > 0 ? (
                        <span>Dumanlı ({colony.smokedRemainingSec.toFixed(1)}s)</span>
                      ) : cooldowns.smokerCooldownRemaining > 0 ? (
                        <span>{t.threat.cooldown} {cooldowns.smokerCooldownRemaining.toFixed(1)}s</span>
                      ) : (
                        <span>{t.threat.smokerPuff}</span>
                      )}
                    </button>
                  </div>

                  {/* Glass Tap */}
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                          <HandMetal className="w-3.5 h-3.5 text-blue-300" />
                          <span>Cama Vurma (Glass Tap)</span>
                        </h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-amber-300">
                          T
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        {t.threat.glassTapDesc}
                      </p>
                    </div>

                    <button
                      onClick={onTapGlass}
                      disabled={cooldowns.glassTapCooldownRemaining > 0}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        cooldowns.glassTapCooldownRemaining > 0
                          ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                      }`}
                    >
                      {cooldowns.glassTapCooldownRemaining > 0 ? (
                        <span>{t.threat.cooldown} {cooldowns.glassTapCooldownRemaining.toFixed(1)}s</span>
                      ) : (
                        <span>{t.threat.glassTap}</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Threat Status Progress Bar if active */}
                {threat.active && (
                  <div className="p-3 rounded-2xl bg-red-950/40 border border-red-500/30 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-red-200 font-bold">
                        {threat.species} Saldırısı
                      </span>
                      <span className="font-mono text-red-300">
                        Sağlık: {threat.health.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-red-950 overflow-hidden border border-red-500/20">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-300"
                        style={{ width: `${threat.health}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-amber-200/90 font-medium">
                      {species.id === 'cerana' && threat.species === 'V. mandarinia'
                        ? t.threat.thermalBallTactic
                        : t.threat.bitingTactic}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 5. Camera & Hotkeys Tab */}
            {activeTab === 'controls' && (
              <div className="space-y-4">
                {/* Camera Presets (1 to 5) */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-300">Kamera Odak Noktaları (1-5)</p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: 1 as CameraViewPreset, labelTr: '1: Tam Kovan', labelEn: '1: Full Hive' },
                      { id: 2 as CameraViewPreset, labelTr: '2: Kuluçka Peteği', labelEn: '2: Brood Nest' },
                      { id: 3 as CameraViewPreset, labelTr: '3: Ana Arı Sarayı', labelEn: "3: Queen's Court" },
                      { id: 4 as CameraViewPreset, labelTr: '4: Çiçek Bahçesi', labelEn: '4: Garden & Feeder' },
                      { id: 5 as CameraViewPreset, labelTr: '5: Uçuş Girişi', labelEn: '5: Hive Entrance' },
                    ].map((cam) => (
                      <button
                        key={cam.id}
                        onClick={() => onSelectCamera(cam.id)}
                        className={`p-2.5 rounded-2xl text-xs font-bold border transition-all text-center ${
                          currentCamera === cam.id
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                            : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        {lang === 'tr' ? cam.labelTr : cam.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hotkey Conflict & Reference Matrix */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-xs space-y-1.5">
                  <p className="font-bold text-amber-300">Kısayol & Çakışma Matrisi</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
                    <span className="font-mono text-amber-200">Space: Duraklat / Devam</span>
                    <span className="font-mono text-amber-200">H: Zen Modu (Gizle/Göster)</span>
                    <span className="font-mono text-amber-200">S: Duman Körüğü (8s cd)</span>
                    <span className="font-mono text-red-300">W: Avcı Saldırısı (25s cd)</span>
                    <span className="font-mono text-blue-300">T: Cama Vurma (4s cd)</span>
                    <span className="font-mono text-purple-300">1..5: Kamera Odakları</span>
                    <span className="font-mono text-emerald-300">Alt+1..5: Alt Tür Seçimi</span>
                  </div>
                  <p className="text-[10px] text-slate-400 pt-1 border-t border-white/5">
                    * Tuş çakışmaları engellenmiştir: 1-5 kamera için, Alt+1..5 tür içindir; form girişlerinde kısayollar askıya alınır.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

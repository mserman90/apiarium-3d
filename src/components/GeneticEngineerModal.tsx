import React, { useState } from 'react';
import { X, Dna, RotateCcw, Check } from 'lucide-react';
import type { Species } from '../../lib/types';
import { clampGeneticValues } from '../../lib/genetics';
import { I18N, type Language } from '../i18n';

interface GeneticEngineerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSpecies: Species;
  onApply: (customized: Species) => void;
  lang: Language;
}

export const GeneticEngineerModal: React.FC<GeneticEngineerModalProps> = ({
  isOpen,
  onClose,
  currentSpecies,
  onApply,
  lang,
}) => {
  const t = I18N[lang];
  const [formData, setFormData] = useState<Species>({ ...currentSpecies });

  if (!isOpen) return null;

  const handleChange = <K extends keyof Species>(key: K, value: Species[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    const clamped = clampGeneticValues({
      ...formData,
      id: 'custom',
      nameTr: formData.nameTr || 'Özel Hibrit Koloni',
      nameEn: formData.nameEn || 'Custom Engineered Colony',
      taxonomy: formData.taxonomy || 'Apis mellifera x engineered',
    });
    onApply(clamped);
    onClose();
  };

  const handleReset = () => {
    setFormData({ ...currentSpecies });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 border border-amber-500/30 flex flex-col gap-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Dna className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{t.engineer.title}</h2>
              <p className="text-xs text-amber-200/70">
                CRISPR-Cas / Selective Bee Breeding Studio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sliders and Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Size Multiplier */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-300 font-medium">{t.engineer.size}</span>
              <span className="font-mono text-amber-400 font-bold">
                {formData.sizeMultiplier.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min={0.75}
              max={1.6}
              step={0.05}
              value={formData.sizeMultiplier}
              onChange={(e) => handleChange('sizeMultiplier', parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Tongue Length */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-300 font-medium">{t.engineer.tongue}</span>
              <span className="font-mono text-amber-400 font-bold">
                {formData.tongueLengthMm.toFixed(2)} mm
              </span>
            </div>
            <input
              type="range"
              min={6.2}
              max={7.2}
              step={0.05}
              value={formData.tongueLengthMm}
              onChange={(e) => handleChange('tongueLengthMm', parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
            <p className="text-[10px] text-slate-400">
              Derin tüplü çiçeklerin (yonca, lavanta) nektar erişimini belirler.
            </p>
          </div>

          {/* Chitin Color */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-300 font-medium">{t.engineer.chitin}</span>
              <span className="font-mono text-amber-400">{formData.chitinColor}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.chitinColor}
                onChange={(e) => handleChange('chitinColor', e.target.value)}
                className="w-9 h-8 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <span className="text-slate-400 text-[11px]">Gövde kitin tabakası rengi</span>
            </div>
          </div>

          {/* Stripe Tint */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-300 font-medium">{t.engineer.stripe}</span>
              <span className="font-mono text-amber-400">{formData.stripeTint}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.stripeTint}
                onChange={(e) => handleChange('stripeTint', e.target.value)}
                className="w-9 h-8 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <span className="text-slate-400 text-[11px]">Karın halka bant çizgileri</span>
            </div>
          </div>

          {/* Hair Density */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-300 font-medium">{t.engineer.hair}</span>
              <span className="font-mono text-amber-400 font-bold">
                {(formData.hairDensity * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={formData.hairDensity}
              onChange={(e) => handleChange('hairDensity', parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Defensive Aggression */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-300 font-medium">{t.engineer.aggression}</span>
              <span className="font-mono text-amber-400 font-bold">
                {(formData.aggression * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={formData.aggression}
              onChange={(e) => handleChange('aggression', parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Foraging Speed */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-300 font-medium">{t.engineer.foraging}</span>
              <span className="font-mono text-amber-400 font-bold">
                {(formData.foragingSpeed * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={formData.foragingSpeed}
              onChange={(e) => handleChange('foragingSpeed', parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Comb Build Rate */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-300 font-medium">{t.engineer.comb}</span>
              <span className="font-mono text-amber-400 font-bold">
                {(formData.combBuildRate * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={formData.combBuildRate}
              onChange={(e) => handleChange('combBuildRate', parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Cold Tolerance */}
          <div className="space-y-1.5 md:col-span-2">
            <div className="flex justify-between">
              <span className="text-slate-300 font-medium">{t.engineer.cold}</span>
              <span className="font-mono text-amber-400 font-bold">
                {(formData.coldTolerance * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={formData.coldTolerance}
              onChange={(e) => handleChange('coldTolerance', parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t.engineer.reset}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              {t.engineer.close}
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {t.engineer.apply}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import type { Species } from './types';

export const SPECIES_PRESETS: Species[] = [
  {
    id: 'ligustica',
    nameTr: 'İtalyan Arısı',
    nameEn: 'Italian Honey Bee',
    taxonomy: 'Apis mellifera ligustica',
    descriptionTr: 'Altın sarısı çizgili, uysal mizaçlı, üstün nektar toplama kabiliyeti ve hızlı petek örme yeteneği.',
    descriptionEn: 'Golden-yellow banded, gentle temperament, prolific brood rearing and rapid comb construction.',
    sizeMultiplier: 1.0,
    tongueLengthMm: 6.5,
    chitinColor: '#d97706', // warm amber golden
    stripeTint: '#fbbf24', // bright gold
    hairDensity: 0.65,
    aggression: 0.2,
    foragingSpeed: 0.85,
    combBuildRate: 0.9,
    coldTolerance: 0.45,
  },
  {
    id: 'carnica',
    nameTr: 'Karniyol Arısı',
    nameEn: 'Carniolan Honey Bee',
    taxonomy: 'Apis mellifera carnica',
    descriptionTr: 'Koyu gri gövde, gümüşi gri tüy halkaları. Çok sakin, kışlama ve ani soğuklara direnci fevkalade yüksek.',
    descriptionEn: 'Dark grey chitin with silvery hair bands. Exceptionally gentle, superb wintering and rapid spring buildup.',
    sizeMultiplier: 1.05,
    tongueLengthMm: 6.6,
    chitinColor: '#374151', // slate dark grey
    stripeTint: '#9ca3af', // silvery grey
    hairDensity: 0.85,
    aggression: 0.15,
    foragingSpeed: 0.8,
    combBuildRate: 0.75,
    coldTolerance: 0.92,
  },
  {
    id: 'caucasia',
    nameTr: 'Kafkas Arısı',
    nameEn: 'Caucasian Honey Bee',
    taxonomy: 'Apis mellifera caucasia',
    descriptionTr: 'Kurşunisi gri, sıra dışı uzun dilli (7,0–7,2 mm) dağ arısı; derin tüplü çiçeklerin nektarına rahatlıkla ulaşır.',
    descriptionEn: 'Lead-grey mountain bee with exceptionally long proboscis (up to 7.2 mm), unlocking deep floral nectar tubes.',
    sizeMultiplier: 1.02,
    tongueLengthMm: 7.15,
    chitinColor: '#475569', // lead grey
    stripeTint: '#64748b', // mute lead bands
    hairDensity: 0.78,
    aggression: 0.25,
    foragingSpeed: 0.88,
    combBuildRate: 0.7,
    coldTolerance: 0.82,
  },
  {
    id: 'mellifera',
    nameTr: 'Avrupa Esmer Arısı',
    nameEn: 'European Dark Bee',
    taxonomy: 'Apis mellifera mellifera',
    descriptionTr: 'Simsiyah ve sert kitinli gövde, çetin dağ kışlarına dayanıklılık ve yüksek savunma/iğneleme refleksi.',
    descriptionEn: 'Stout jet-black chitin, dense dark coat, supreme endurance for harsh northern winters and spirited defense.',
    sizeMultiplier: 1.15,
    tongueLengthMm: 6.3,
    chitinColor: '#18181b', // jet dark black
    stripeTint: '#3f3f46', // charcoal stripes
    hairDensity: 0.9,
    aggression: 0.75,
    foragingSpeed: 0.7,
    combBuildRate: 0.65,
    coldTolerance: 0.98,
  },
  {
    id: 'cerana',
    nameTr: 'Doğu Asya Arısı',
    nameEn: 'Eastern Asian Honey Bee',
    taxonomy: 'Apis cerana',
    descriptionTr: 'Kompakt gövde; dev eşek arısı Vespa mandarinia saldırılarına karşı eşsiz senkronize termal savunma topu taktiği.',
    descriptionEn: 'Compact agile body; evolved miraculous synchronized thermal bee-ball defense specifically against Vespa mandarinia.',
    sizeMultiplier: 0.85,
    tongueLengthMm: 6.25,
    chitinColor: '#78350f', // deep chestnut brown
    stripeTint: '#f59e0b', // distinct yellow bands
    hairDensity: 0.55,
    aggression: 0.4,
    foragingSpeed: 0.78,
    combBuildRate: 0.8,
    coldTolerance: 0.65,
  },
];

export function getSpeciesById(id: string): Species {
  const match = SPECIES_PRESETS.find((s) => s.id === id);
  return match || SPECIES_PRESETS[0];
}

export function clampGeneticValues(custom: Partial<Species>): Species {
  return {
    id: custom.id || 'custom',
    nameTr: custom.nameTr || 'Özel Hibrit Koloni',
    nameEn: custom.nameEn || 'Custom Engineered Colony',
    taxonomy: custom.taxonomy || 'Apis mellifera x engineered',
    descriptionTr: custom.descriptionTr || 'Genetik mühendislik panelinde parametreleri özelleştirilmiş koloni.',
    descriptionEn: custom.descriptionEn || 'Genetically tailored colony customized in the engineering suite.',
    sizeMultiplier: Math.min(1.6, Math.max(0.75, custom.sizeMultiplier ?? 1.0)),
    tongueLengthMm: Math.min(7.2, Math.max(6.2, custom.tongueLengthMm ?? 6.6)),
    chitinColor: custom.chitinColor || '#b45309',
    stripeTint: custom.stripeTint || '#f59e0b',
    hairDensity: Math.min(1.0, Math.max(0.0, custom.hairDensity ?? 0.6)),
    aggression: Math.min(1.0, Math.max(0.0, custom.aggression ?? 0.3)),
    foragingSpeed: Math.min(1.0, Math.max(0.0, custom.foragingSpeed ?? 0.8)),
    combBuildRate: Math.min(1.0, Math.max(0.0, custom.combBuildRate ?? 0.75)),
    coldTolerance: Math.min(1.0, Math.max(0.0, custom.coldTolerance ?? 0.6)),
  };
}

/**
 * Calculates nectar accessibility efficiency for deep tube flowers based on tongue length.
 * Deep flowers (e.g. red clover/deep tube) require >= 6.8mm for full yield.
 */
export function calculateTongueAccessibility(tongueLengthMm: number): {
  shallowFlowerYield: number; // 0..1
  deepFlowerYield: number; // 0..1
} {
  const shallow = 1.0;
  // normalized between 6.2mm (0.35) and 7.2mm (1.0)
  const deep = Math.min(1.0, Math.max(0.35, (tongueLengthMm - 6.2) / (7.2 - 6.2) * 0.65 + 0.35));
  return {
    shallowFlowerYield: shallow,
    deepFlowerYield: deep,
  };
}

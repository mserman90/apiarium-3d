import type { CameraPresetConfig, CameraViewPreset } from './types';

export const CAMERA_PRESETS: Record<CameraViewPreset, CameraPresetConfig> = {
  1: {
    id: 1,
    titleTr: '1: Tam Kovan Genel Görünümü',
    titleEn: '1: Full Hive Overview',
    position: [0, 0.35, 4.3],
    target: [0, 0.3, 0],
    fov: 48,
  },
  2: {
    id: 2,
    titleTr: '2: Kuluçka Peteği Yakın Planı',
    titleEn: '2: Brood Nest Close-up',
    position: [0, 0.1, 1.5],
    target: [0, 0.1, 0],
    fov: 38,
  },
  3: {
    id: 3,
    titleTr: '3: Ana Arı Sarayı Odaklanma',
    titleEn: "3: Queen's Court Focus",
    position: [-0.05, 0.15, 0.95],
    target: [-0.05, 0.15, 0],
    fov: 32,
  },
  4: {
    id: 4,
    titleTr: '4: Üst Çiçek Bahçesi & Nektarlık',
    titleEn: '4: Upper Flower Garden & Feeder',
    position: [0, 1.45, 1.8],
    target: [0, 1.25, 0],
    fov: 45,
  },
  5: {
    id: 5,
    titleTr: '5: Uçuş Giriş Ağzı & Muhafızlar',
    titleEn: '5: Flight Entrance & Guards',
    position: [0, -0.65, 1.5],
    target: [0, -0.85, 0.2],
    fov: 40,
  },
};

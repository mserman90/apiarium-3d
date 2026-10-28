import type { ColonyState } from '../../lib/types';
import { getAudioParamsForState } from '../../lib/stateMachine';

export class BeeSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isUnlocked: boolean = false;

  // Master and sub gains
  private masterGain: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private lfoGain: GainNode | null = null;

  // Oscillators
  private oscCarrier1: OscillatorNode | null = null; // ~215 Hz
  private oscCarrier2: OscillatorNode | null = null; // ~322 Hz
  private oscCarrier3: OscillatorNode | null = null; // ~517 Hz
  private oscSubResonance: OscillatorNode | null = null; // ~107 Hz
  private oscAlarmScream: OscillatorNode | null = null; // ~320-450 Hz
  private alarmGain: GainNode | null = null;

  // Modulator LFO (0.6 Hz breathing)
  private lfoOsc: OscillatorNode | null = null;

  // Filters
  private bandpassFilter: BiquadFilterNode | null = null;

  constructor() {
    // Lazy audio context creation upon user interaction
  }

  public init(): boolean {
    if (this.ctx) return true;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.45, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Drone Sub Gain
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.5, this.ctx.currentTime);

      // LFO for breathing modulation (0.6 Hz)
      this.lfoOsc = this.ctx.createOscillator();
      this.lfoOsc.frequency.setValueAtTime(0.6, this.ctx.currentTime);
      this.lfoGain = this.ctx.createGain();
      this.lfoGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

      this.lfoOsc.connect(this.lfoGain.gain);
      this.lfoOsc.start();

      // Bandpass filter (300 - 900 Hz typical bee buzzing spectrum)
      this.bandpassFilter = this.ctx.createBiquadFilter();
      this.bandpassFilter.type = 'bandpass';
      this.bandpassFilter.frequency.setValueAtTime(650, this.ctx.currentTime);
      this.bandpassFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

      // Carrier 1: 215 Hz
      this.oscCarrier1 = this.ctx.createOscillator();
      this.oscCarrier1.type = 'sawtooth';
      this.oscCarrier1.frequency.setValueAtTime(215, this.ctx.currentTime);

      // Carrier 2: 322 Hz
      this.oscCarrier2 = this.ctx.createOscillator();
      this.oscCarrier2.type = 'triangle';
      this.oscCarrier2.frequency.setValueAtTime(322, this.ctx.currentTime);

      // Carrier 3: 517 Hz
      this.oscCarrier3 = this.ctx.createOscillator();
      this.oscCarrier3.type = 'sawtooth';
      this.oscCarrier3.frequency.setValueAtTime(517, this.ctx.currentTime);

      // Sub-body resonance: 107 Hz
      this.oscSubResonance = this.ctx.createOscillator();
      this.oscSubResonance.type = 'sine';
      this.oscSubResonance.frequency.setValueAtTime(107, this.ctx.currentTime);

      // Alarm Scream Oscillator
      this.oscAlarmScream = this.ctx.createOscillator();
      this.oscAlarmScream.type = 'sawtooth';
      this.oscAlarmScream.frequency.setValueAtTime(360, this.ctx.currentTime);

      this.alarmGain = this.ctx.createGain();
      this.alarmGain.gain.setValueAtTime(0, this.ctx.currentTime);

      // Routing:
      const carrierSubGain = this.ctx.createGain();
      carrierSubGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.oscCarrier1.connect(carrierSubGain);

      const carrier2Gain = this.ctx.createGain();
      carrier2Gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      this.oscCarrier2.connect(carrier2Gain);

      const carrier3Gain = this.ctx.createGain();
      carrier3Gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      this.oscCarrier3.connect(carrier3Gain);

      carrierSubGain.connect(this.bandpassFilter);
      carrier2Gain.connect(this.bandpassFilter);
      carrier3Gain.connect(this.bandpassFilter);

      this.bandpassFilter.connect(this.droneGain);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.22, this.ctx.currentTime);
      this.oscSubResonance.connect(subGain);
      subGain.connect(this.masterGain);

      this.oscAlarmScream.connect(this.alarmGain);
      this.alarmGain.connect(this.masterGain);

      this.droneGain.connect(this.masterGain);

      this.oscCarrier1.start();
      this.oscCarrier2.start();
      this.oscCarrier3.start();
      this.oscSubResonance.start();
      this.oscAlarmScream.start();

      this.isUnlocked = this.ctx.state === 'running';
      return true;
    } catch {
      return false;
    }
  }

  public async resumeAudio(): Promise<boolean> {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this.isUnlocked = this.ctx?.state === 'running';
    return this.isUnlocked;
  }

  public getIsUnlocked(): boolean {
    return this.isUnlocked;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.resumeAudio();
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.45, now + 0.1);
    }
    return this.isMuted;
  }

  public setMasterVolume(vol: number): void {
    if (!this.masterGain || !this.ctx) return;
    const clamped = Math.max(0, Math.min(1, vol));
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : clamped * 0.5, now + 0.05);
  }

  public updateState(state: ColonyState, temperatureC: number, alarmLevel: number): void {
    if (!this.ctx || !this.droneGain || !this.bandpassFilter) return;

    const params = getAudioParamsForState(state, temperatureC, alarmLevel);
    const now = this.ctx.currentTime;
    const rampTime = now + 0.4; // 400ms crossfade

    // Drone Frequencies
    if (this.oscCarrier1) {
      this.oscCarrier1.frequency.cancelScheduledValues(now);
      this.oscCarrier1.frequency.linearRampToValueAtTime(params.baseDroneFreq, rampTime);
    }
    if (this.oscCarrier2) {
      this.oscCarrier2.frequency.cancelScheduledValues(now);
      this.oscCarrier2.frequency.linearRampToValueAtTime(params.baseDroneFreq * 1.5, rampTime);
    }
    if (this.oscCarrier3) {
      this.oscCarrier3.frequency.cancelScheduledValues(now);
      this.oscCarrier3.frequency.linearRampToValueAtTime(params.baseDroneFreq * 2.4, rampTime);
    }
    if (this.oscSubResonance) {
      this.oscSubResonance.frequency.cancelScheduledValues(now);
      this.oscSubResonance.frequency.linearRampToValueAtTime(params.subResonanceFreq, rampTime);
    }

    // Filter
    this.bandpassFilter.frequency.cancelScheduledValues(now);
    this.bandpassFilter.frequency.linearRampToValueAtTime(params.filterCutoff, rampTime);

    // Drone Gain
    this.droneGain.gain.cancelScheduledValues(now);
    this.droneGain.gain.linearRampToValueAtTime(params.gain, rampTime);

    // Alarm Scream
    if (this.alarmGain && this.oscAlarmScream) {
      this.alarmGain.gain.cancelScheduledValues(now);
      if (params.alarmScreamFreq > 0) {
        this.oscAlarmScream.frequency.setValueAtTime(params.alarmScreamFreq, now);
        this.alarmGain.gain.linearRampToValueAtTime(0.3 * alarmLevel, rampTime);
      } else {
        this.alarmGain.gain.linearRampToValueAtTime(0, rampTime);
      }
    }
  }

  public playSmokerPuff(): void {
    if (!this.ctx || this.isMuted) return;
    this.resumeAudio();

    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 1.2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.7;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(1400, now);
      lowpass.frequency.exponentialRampToValueAtTime(250, now + 1.1);

      const puffGain = this.ctx.createGain();
      puffGain.gain.setValueAtTime(0, now);
      puffGain.gain.linearRampToValueAtTime(0.45, now + 0.12);
      puffGain.gain.exponentialRampToValueAtTime(0.001, now + 1.15);

      noiseSource.connect(lowpass);
      lowpass.connect(puffGain);
      puffGain.connect(this.masterGain || this.ctx.destination);

      noiseSource.start(now);
      noiseSource.stop(now + 1.2);
    } catch {
      // Audio context might be restricted
    }
  }

  public playGlassTap(): void {
    if (!this.ctx || this.isMuted) return;
    this.resumeAudio();

    try {
      const now = this.ctx.currentTime;

      const oscClink = this.ctx.createOscillator();
      oscClink.type = 'sine';
      oscClink.frequency.setValueAtTime(2850, now);
      oscClink.frequency.exponentialRampToValueAtTime(1800, now + 0.25);

      const clinkGain = this.ctx.createGain();
      clinkGain.gain.setValueAtTime(0.5, now);
      clinkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      oscClink.connect(clinkGain);
      clinkGain.connect(this.masterGain || this.ctx.destination);

      const oscThud = this.ctx.createOscillator();
      oscThud.type = 'triangle';
      oscThud.frequency.setValueAtTime(140, now);
      oscThud.frequency.exponentialRampToValueAtTime(65, now + 0.35);

      const thudGain = this.ctx.createGain();
      thudGain.gain.setValueAtTime(0.4, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      oscThud.connect(thudGain);
      thudGain.connect(this.masterGain || this.ctx.destination);

      oscClink.start(now);
      oscClink.stop(now + 0.3);

      oscThud.start(now);
      oscThud.stop(now + 0.36);
    } catch {
      // safe fallback
    }
  }

  public dispose(): void {
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {
        // ignore
      }
      this.ctx = null;
    }
  }
}

export const soundEngine = new BeeSoundEngine();

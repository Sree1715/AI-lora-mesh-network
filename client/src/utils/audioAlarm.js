/**
 * Web Audio API Industrial Alarm Synthesizer
 * High-pitch ambulance siren for SOS/emergency events
 */

class AudioAlarmEngine {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
    this.volume = 0.7;
    this.activeAlarmOscillators = [];
    this.activeAlarmInterval = null;
    this.currentSoundType = null;
  }

  initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (muted) this.stopAlarm();
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  /**
   * HIGH-PITCH AMBULANCE SIREN — wails between 650Hz and 1050Hz (like real ambulance)
   */
  startAmbulanceSiren() {
    if (this.isMuted || this.currentSoundType === 'AMBULANCE') return;
    this.initContext();
    if (!this.audioCtx) return;
    this.stopAlarm();
    this.currentSoundType = 'AMBULANCE';

    const ctx = this.audioCtx;
    let phase = 0;

    const playWail = () => {
      if (this.isMuted) return;
      try {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const distortion = ctx.createWaveShaper();
        
        // Create slight distortion for urgency
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) {
          const x = (i * 2) / 256 - 1;
          curve[i] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x));
        }
        distortion.curve = curve;

        osc.type = 'sawtooth';

        // Ambulance hi-lo wail: 650Hz -> 1050Hz -> 650Hz
        const now = ctx.currentTime;
        if (phase === 0) {
          osc.frequency.setValueAtTime(650, now);
          osc.frequency.linearRampToValueAtTime(1050, now + 0.55);
        } else {
          osc.frequency.setValueAtTime(1050, now);
          osc.frequency.linearRampToValueAtTime(650, now + 0.55);
        }
        phase = 1 - phase;

        gainNode.gain.setValueAtTime(this.volume * 0.4, now);
        gainNode.gain.setValueAtTime(this.volume * 0.4, now + 0.5);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.connect(distortion);
        distortion.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.62);
      } catch (e) {}
    };

    playWail();
    this.activeAlarmInterval = setInterval(playWail, 580);
  }

  /**
   * Critical Hazard Alarm (high pitch rapid beep)
   */
  startCriticalAlarm() {
    if (this.isMuted || this.currentSoundType === 'CRITICAL') return;
    this.initContext();
    if (!this.audioCtx) return;
    this.stopAlarm();
    this.currentSoundType = 'CRITICAL';

    let toggle = false;
    const playTone = () => {
      if (this.isMuted) return;
      try {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(toggle ? 820 : 1020, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(toggle ? 1020 : 820, this.audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(this.volume * 0.3, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.37);
        toggle = !toggle;
      } catch (e) {}
    };

    playTone();
    this.activeAlarmInterval = setInterval(playTone, 380);
  }

  /**
   * Evacuation Klaxon — full ambulance siren
   */
  startEvacuationKlaxon() {
    this.startAmbulanceSiren();
  }

  /**
   * Caution Warning Beep
   */
  playCautionBeep() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      [0, 0.18].forEach(delay => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now + delay);
        gain.gain.setValueAtTime(this.volume * 0.18, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.1);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.11);
      });
    } catch (e) {}
  }

  /**
   * Positive Confirmation Chime
   */
  playAckSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
      gain.gain.setValueAtTime(this.volume * 0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {}
  }

  stopAlarm() {
    if (this.activeAlarmInterval) {
      clearInterval(this.activeAlarmInterval);
      this.activeAlarmInterval = null;
    }
    this.currentSoundType = null;
  }
}

export const soundEngine = new AudioAlarmEngine();

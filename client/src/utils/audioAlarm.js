/**
 * Web Audio API Industrial Alarm Synthesizer
 * Procedurally generates realistic industrial sirens, warning beeps, and klaxons
 * without relying on external audio assets.
 */

class AudioAlarmEngine {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
    this.volume = 0.5; // 0 to 1
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
      this.audioCtx.resume();
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (muted) {
      this.stopAlarm();
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  /**
   * High-priority Critical Hazard Siren (Two-tone wailing siren)
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
        // Alternate between 780 Hz and 980 Hz
        osc.frequency.setValueAtTime(toggle ? 780 : 980, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(toggle ? 980 : 780, this.audioCtx.currentTime + 0.35);

        gain.gain.setValueAtTime(this.volume * 0.25, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.38);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.4);
        toggle = !toggle;
      } catch (e) {
        console.warn('Audio playback error', e);
      }
    };

    playTone();
    this.activeAlarmInterval = setInterval(playTone, 420);
  }

  /**
   * Emergency Evacuation Klaxon (Deep sweeping industrial horn)
   */
  startEvacuationKlaxon() {
    if (this.isMuted || this.currentSoundType === 'EVACUATION') return;
    this.initContext();
    if (!this.audioCtx) return;

    this.stopAlarm();
    this.currentSoundType = 'EVACUATION';

    const playHorn = () => {
      if (this.isMuted) return;
      try {
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'triangle';

        // Deep 440 Hz / 554 Hz dissonant major third horn
        osc1.frequency.setValueAtTime(440, this.audioCtx.currentTime);
        osc2.frequency.setValueAtTime(554.37, this.audioCtx.currentTime);

        gain.gain.setValueAtTime(this.volume * 0.3, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.9);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(this.audioCtx.currentTime + 0.95);
        osc2.stop(this.audioCtx.currentTime + 0.95);
      } catch (e) {
        console.warn('Audio playback error', e);
      }
    };

    playHorn();
    this.activeAlarmInterval = setInterval(playHorn, 1200);
  }

  /**
   * Caution Warning Beep (Intermittent dual chirp)
   */
  playCautionBeep() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      [0, 0.14].forEach(delay => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, now + delay);
        gain.gain.setValueAtTime(this.volume * 0.15, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.09);
      });
    } catch (e) {
      console.warn('Audio caution beep error', e);
    }
  }

  /**
   * Positive Confirmation / Acknowledged Chime
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
    } catch (e) {
      console.warn('Audio ack sound error', e);
    }
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


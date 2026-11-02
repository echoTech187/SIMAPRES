/**
 * SIMAPRES 110 - CAD AUDIO SYNTHESIZER
 * Menggunakan Web Audio API native browser:
 * - Tidak bergantung pada file MP3 eksternal yang hilang atau gagal dimuat
 * - Volume akurat 0% - 100% menggunakan GainNode
 * - 3 Pilihan Nada yang jelas berbeda:
 *   1. 'patwal'    : Sirine Patwal Kedinasan Polri (Osilator dual-tone naik turun 750Hz - 1050Hz)
 *   2. 'chime'     : Chime Darurat Sentra CAD (Melodic harmonic chime lembut 880Hz / 1320Hz)
 *   3. 'telephone': Dering Telepon Meja Siaga 110 (Dual-tone US/Polri PBX ring 440Hz + 480Hz berulang)
 */

class CadAudioPlayer {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private activeNodes: { stop: () => void }[] = [];
  private currentVolume: number = 0.85;

  private initContext() {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setVolume(volPct: number) {
    this.currentVolume = Math.max(0.01, Math.min(1, volPct / 100));
  }

  public stop() {
    this.isPlaying = false;
    this.activeNodes.forEach((node) => {
      try {
        node.stop();
      } catch (_) {}
    });
    this.activeNodes = [];
  }

  public play(tone: string, volumePct: number, onEnd?: () => void) {
    this.stop();
    this.setVolume(volumePct);
    const ctx = this.initContext();
    if (!ctx) return;

    this.isPlaying = true;

    if (tone === 'chime') {
      this.playChime(ctx, onEnd);
    } else if (tone === 'telephone') {
      this.playTelephone(ctx, onEnd);
    } else {
      this.playPatwalSiren(ctx, onEnd);
    }
  }

  /**
   * 1. NADA SIRINE PATWAL POLRI (Wail Siren 750Hz -> 1050Hz berdenyut cepat)
   */
  private playPatwalSiren(ctx: AudioContext, onEnd?: () => void) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(this.currentVolume * 0.45, ctx.currentTime);

    // Frekuensi naik turun khas sirine patroli
    const now = ctx.currentTime;
    const duration = 2.4; // 2.4 detik demo
    const cycle = 0.6; // 600ms per wail

    for (let t = 0; t < duration; t += cycle) {
      osc.frequency.setValueAtTime(700, now + t);
      osc.frequency.linearRampToValueAtTime(1150, now + t + cycle / 2);
      osc.frequency.linearRampToValueAtTime(700, now + t + cycle);
    }

    gain.gain.setValueAtTime(this.currentVolume * 0.45, now + duration - 0.2);
    gain.gain.linearRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);

    this.activeNodes.push(osc);

    osc.onended = () => {
      this.isPlaying = false;
      if (onEnd) onEnd();
    };
  }

  /**
   * 2. NADA CHIME LEMBUT SENTRA CAD (Harmonic bell 2 nada lembut A5 -> E6)
   */
  private playChime(ctx: AudioContext, onEnd?: () => void) {
    const now = ctx.currentTime;
    const notes = [
      { freq: 880, start: 0, dur: 0.8 },      // A5
      { freq: 1174.66, start: 0.25, dur: 0.9 }, // D6
      { freq: 1318.51, start: 0.5, dur: 1.1 },  // E6
    ];

    let lastOsc: OscillatorNode | null = null;

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.start);

      // Attack & decay lembut
      gain.gain.setValueAtTime(0.001, now + note.start);
      gain.gain.linearRampToValueAtTime(this.currentVolume * 0.5, now + note.start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.start + note.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.start);
      osc.stop(now + note.start + note.dur);

      this.activeNodes.push(osc);
      lastOsc = osc;
    });

    if (lastOsc) {
      (lastOsc as OscillatorNode).onended = () => {
        this.isPlaying = false;
        if (onEnd) onEnd();
      };
    }
  }

  /**
   * 3. NADA DERING TELEPON MEJA 110 (Dual Tone Multi-Frequency 440Hz + 480Hz khas PBX 110)
   */
  private playTelephone(ctx: AudioContext, onEnd?: () => void) {
    const now = ctx.currentTime;
    const ringDur = 1.0; // 1 detik dering
    const pauseDur = 0.5; // 0.5 detik jeda
    const bursts = [0, ringDur + pauseDur]; // 2 kali dering

    let finalOsc: OscillatorNode | null = null;

    bursts.forEach((offset) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, now + offset); // Standard ringback low
      osc2.frequency.setValueAtTime(480, now + offset); // Standard ringback high

      gain.gain.setValueAtTime(0.001, now + offset);
      gain.gain.linearRampToValueAtTime(this.currentVolume * 0.35, now + offset + 0.05);
      gain.gain.setValueAtTime(this.currentVolume * 0.35, now + offset + ringDur - 0.05);
      gain.gain.linearRampToValueAtTime(0.001, now + offset + ringDur);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now + offset);
      osc1.stop(now + offset + ringDur);

      osc2.start(now + offset);
      osc2.stop(now + offset + ringDur);

      this.activeNodes.push(osc1, osc2);
      finalOsc = osc2;
    });

    if (finalOsc) {
      (finalOsc as OscillatorNode).onended = () => {
        this.isPlaying = false;
        if (onEnd) onEnd();
      };
    }
  }
}

export const cadAudioPlayer = new CadAudioPlayer();


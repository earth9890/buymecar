/**
 * Tiny Web Audio synth for the showroom: a low V8-ish idle, a rev when the
 * camera flies, a tick on hover, a chime on confirm. No audio files, no
 * autoplay: everything starts from a user gesture and is off by default.
 */
class Showroom {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private engine: { oscs: OscillatorNode[]; gain: GainNode; base: number[] } | null = null;
  enabled = false;

  private ensure(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    try {
      localStorage.setItem("bmc_sound", on ? "1" : "0");
    } catch {
      /* ignore */
    }
    if (on) this.startEngine();
    else this.stopEngine();
  }

  restore(): boolean {
    try {
      return localStorage.getItem("bmc_sound") === "1";
    } catch {
      return false;
    }
  }

  private startEngine() {
    const ctx = this.ensure();
    if (this.engine || !this.master) return;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 240;
    lp.Q.value = 0.9;
    gain.connect(lp).connect(this.master);

    const base = [27, 54, 81];
    const oscs = base.map((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 2 ? "triangle" : "sawtooth";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = i === 0 ? 0.5 : i === 1 ? 0.3 : 0.12;
      o.connect(g).connect(gain);
      o.start();
      return o;
    });
    // slow rumble on the gain so the idle is not a flat drone
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 5.5;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.025;
    lfo.connect(lfoGain).connect(gain.gain);
    lfo.start();
    oscs.push(lfo);

    gain.gain.linearRampToValueAtTime(0.11, ctx.currentTime + 0.8);
    this.engine = { oscs, gain, base };
  }

  private stopEngine() {
    if (!this.engine || !this.ctx) return;
    const { oscs, gain } = this.engine;
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
    setTimeout(() => oscs.forEach((o) => o.stop()), 500);
    this.engine = null;
  }

  /** Blip the revs, used when the camera flies somewhere. */
  rev(intensity = 1) {
    if (!this.enabled || !this.engine || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.engine.oscs.slice(0, 3).forEach((o, i) => {
      const f = this.engine!.base[i];
      o.frequency.cancelScheduledValues(t);
      o.frequency.setValueAtTime(o.frequency.value, t);
      o.frequency.linearRampToValueAtTime(f * (1 + 0.9 * intensity), t + 0.3);
      o.frequency.exponentialRampToValueAtTime(f, t + 1.3);
    });
    this.engine.gain.gain.cancelScheduledValues(t);
    this.engine.gain.gain.setValueAtTime(0.11, t);
    this.engine.gain.gain.linearRampToValueAtTime(0.2, t + 0.3);
    this.engine.gain.gain.linearRampToValueAtTime(0.11, t + 1.3);
  }

  tick() {
    if (!this.enabled || !this.master) return;
    const ctx = this.ensure();
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = 1500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.035, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
    o.connect(g).connect(this.master);
    o.start();
    o.stop(ctx.currentTime + 0.06);
  }

  chime() {
    if (!this.enabled || !this.master) return;
    const ctx = this.ensure();
    [660, 990].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      const t0 = ctx.currentTime + i * 0.09;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.08, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
      o.connect(g).connect(this.master!);
      o.start(t0);
      o.stop(t0 + 0.55);
    });
  }
}

export const showroom = typeof window !== "undefined" ? new Showroom() : (null as unknown as Showroom);

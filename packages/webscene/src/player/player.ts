import type { Engine } from '../core/engine';
import { EventEmitter } from '../utils/event-emitter';
import { framesToSeconds, secondsToFrames } from '../utils/time';
import { AudioMixer } from '../audio/mixer';

interface PlayerEvents {
  play: { time: number };
  pause: { time: number };
  seek: { time: number; frame: number };
  tick: { time: number; frame: number };
}

export interface PlayerOptions {
  autoplay?: boolean;
  loop?: boolean;
  audioMixer?: AudioMixer;
}

export class Player {
  private readonly events = new EventEmitter<PlayerEvents>();
  private readonly audioMixer: AudioMixer;

  private playing = false;
  private loop = false;
  private rafId = 0;
  private currentTime = 0;
  private lastTs = 0;

  public constructor(
    private readonly engine: Engine,
    options: PlayerOptions = {},
  ) {
    this.audioMixer = options.audioMixer ?? new AudioMixer();
    this.loop = options.loop ?? false;

    if (options.autoplay) {
      this.play();
    }
  }

  public on = this.events.on.bind(this.events);

  public get time(): number {
    return this.currentTime;
  }

  public get frame(): number {
    return secondsToFrames(this.currentTime, this.engine.project.settings.fps);
  }

  public play(): void {
    if (this.playing) {
      return;
    }
    this.playing = true;
    this.lastTs = performance.now();
    this.events.emit('play', { time: this.currentTime });
    this.rafId = requestAnimationFrame(this.onFrame);
  }

  public pause(): void {
    if (!this.playing) {
      return;
    }
    this.playing = false;
    cancelAnimationFrame(this.rafId);
    this.audioMixer.stop();
    this.events.emit('pause', { time: this.currentTime });
  }

  public seek(seconds: number): void {
    const duration = this.engine.project.settings.duration;
    this.currentTime = Math.max(0, Math.min(duration, seconds));
    this.engine.renderAt(this.currentTime);
    this.audioMixer.sync(this.currentTime);
    this.events.emit('seek', { time: this.currentTime, frame: this.frame });
  }

  public seekFrame(frame: number): void {
    this.seek(framesToSeconds(frame, this.engine.project.settings.fps));
  }

  public setLoop(loop: boolean): void {
    this.loop = loop;
  }

  public destroy(): void {
    this.pause();
  }

  private readonly onFrame = (ts: number): void => {
    if (!this.playing) {
      return;
    }

    const delta = (ts - this.lastTs) / 1000;
    this.lastTs = ts;

    const duration = this.engine.project.settings.duration;
    this.currentTime += delta;

    if (this.currentTime > duration) {
      if (this.loop) {
        this.currentTime = 0;
      } else {
        this.currentTime = duration;
        this.pause();
      }
    }

    this.engine.renderAt(this.currentTime);
    this.audioMixer.sync(this.currentTime);
    this.events.emit('tick', { time: this.currentTime, frame: this.frame });

    if (this.playing) {
      this.rafId = requestAnimationFrame(this.onFrame);
    }
  };
}

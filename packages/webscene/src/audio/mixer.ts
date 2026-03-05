import type { AudioTimeline } from './types';

export class AudioMixer {
  private readonly elements = new Map<string, HTMLAudioElement>();
  private timeline: AudioTimeline = {
    masterGain: 1,
    clips: [],
  };

  public setTimeline(timeline: AudioTimeline): void {
    this.timeline = timeline;
  }

  public attachClip(clipId: string, element: HTMLAudioElement): void {
    this.elements.set(clipId, element);
  }

  public detachClip(clipId: string): void {
    this.elements.delete(clipId);
  }

  public sync(time: number): void {
    const clips = this.timeline.clips;

    for (let i = 0; i < clips.length; i += 1) {
      const clip = clips[i];
      const element = this.elements.get(clip.id);
      if (!element) {
        continue;
      }

      const localTime = time - clip.startTime;
      const active = localTime >= 0 && localTime <= clip.duration;
      if (!active) {
        if (!element.paused) {
          element.pause();
        }
        continue;
      }

      const desired = clip.offset + localTime;
      if (Math.abs(element.currentTime - desired) > 0.04) {
        element.currentTime = desired;
      }
      element.volume = Math.max(0, Math.min(1, clip.gain * this.timeline.masterGain));
      if (element.paused) {
        void element.play();
      }
    }
  }

  public stop(): void {
    for (const element of this.elements.values()) {
      element.pause();
    }
  }
}

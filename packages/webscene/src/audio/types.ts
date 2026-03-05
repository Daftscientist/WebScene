import type { ID } from '../utils/types';

export interface AudioClip {
  id: ID;
  assetId: ID;
  startTime: number;
  offset: number;
  duration: number;
  gain: number;
}

export interface AudioTimeline {
  masterGain: number;
  clips: AudioClip[];
}

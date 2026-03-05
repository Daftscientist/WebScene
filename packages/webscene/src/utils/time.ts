import { clamp } from './math';

export const secondsToFrames = (seconds: number, fps: number): number => Math.round(seconds * fps);

export const framesToSeconds = (frames: number, fps: number): number => frames / fps;

export const quantizeTime = (seconds: number, fps: number): number => framesToSeconds(secondsToFrames(seconds, fps), fps);

export const clampTime = (seconds: number, duration: number): number => clamp(seconds, 0, duration);

import type { ProjectSettingsJSON } from './schema';

export type AspectPreset = '16:9' | '9:16' | '1:1';

export const aspectPresets: Record<AspectPreset, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
};

export const withAspectPreset = (
  preset: AspectPreset,
  fps: number,
  duration: number,
): Pick<ProjectSettingsJSON, 'width' | 'height' | 'fps' | 'duration'> => ({
  width: aspectPresets[preset].width,
  height: aspectPresets[preset].height,
  fps,
  duration,
});

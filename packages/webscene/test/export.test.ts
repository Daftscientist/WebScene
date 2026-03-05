import { describe, expect, it } from 'vitest';
import { ZipArchiveBuilder } from '../src/export/zip-archive';
import { exportFrames } from '../src/export/frames';
import type { Engine } from '../src/core/engine';

const createEngineStub = () => {
  const calls: number[] = [];
  const project = {
    rootCompId: 'comp-root',
    comps: [
      {
        id: 'comp-root',
        width: 320,
        height: 180,
        fps: 24,
        duration: 1,
      },
    ],
  };

  const engine = {
    project,
    renderAt(time: number) {
      calls.push(time);
      return {
        frame: Math.round(time * 24),
        time,
        drawCalls: 1,
        layerCount: 0,
        effectCount: 0,
      };
    },
  } as unknown as Engine;

  return { engine, calls };
};

describe('exportFrames', () => {
  it('exports a frame sequence and manifest', async () => {
    const { engine, calls } = createEngineStub();
    const fakeCanvas = {
      convertToBlob: () => Promise.resolve(new Blob(['frame'], { type: 'image/png' })),
    } as unknown as OffscreenCanvas;

    const result = await exportFrames({
      engine,
      canvas: fakeCanvas,
      format: 'png',
      startFrame: 0,
      endFrame: 2,
    });

    expect(result.files).toHaveLength(3);
    expect(result.manifest.frames).toHaveLength(3);
    expect(result.manifest.frames[2].filename).toBe('frame_00002.png');
    expect(calls).toEqual([0, 1 / 24, 2 / 24]);
  });

  it('creates a zip archive via optional archive builder', async () => {
    const { engine } = createEngineStub();
    const fakeCanvas = {
      convertToBlob: () => Promise.resolve(new Blob(['f'], { type: 'image/png' })),
    } as unknown as OffscreenCanvas;

    const archiveBuilder = new ZipArchiveBuilder();
    const result = await exportFrames({
      engine,
      canvas: fakeCanvas,
      archiveBuilder,
      startFrame: 0,
      endFrame: 1,
    });

    expect(result.archive).toBeDefined();
    expect(result.archive?.size ?? 0).toBeGreaterThan(0);
  });
});

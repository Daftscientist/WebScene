import { describe, expect, it } from 'vitest';
import { Engine } from '../src/core/engine';
import { Project } from '../src/core/project';
import { createPatch } from '../src/core/state-patch';
import type { RenderBackend, RenderFrameInfo, RenderStats, RenderTarget } from '../src/render/backend';

class MockTarget implements RenderTarget {
  public width = 640;
  public height = 360;

  public clear(): void {}

  public getContext2D(): CanvasRenderingContext2D {
    return {} as CanvasRenderingContext2D;
  }
}

class MockBackend implements RenderBackend {
  public readonly name = 'mock';

  public render(frame: RenderFrameInfo): RenderStats {
    return {
      frame: frame.frame,
      time: frame.time,
      drawCalls: 2,
      layerCount: frame.comp.layers.length,
      effectCount: frame.comp.effects?.length ?? 0,
    };
  }

  public dispose(): void {}
}

describe('Engine', () => {
  it('renders deterministically for same time and state', () => {
    const project = Project.create({ width: 640, height: 360, fps: 30, duration: 4 }).toJSON();
    const engine = new Engine({
      project,
      backend: new MockBackend(),
      target: new MockTarget(),
    });

    const first = engine.renderAt(1.25);
    const second = engine.renderAt(1.25);

    expect(second).toEqual(first);
  });

  it('emits state changes when patches are applied', () => {
    const project = Project.create({ width: 640, height: 360, fps: 30, duration: 4 }).toJSON();
    const engine = new Engine({
      project,
      backend: new MockBackend(),
      target: new MockTarget(),
    });

    let revision = -1;
    const off = engine.on('stateChanged', (event) => {
      revision = event.revision;
    });

    engine.applyPatches([createPatch('set', '/settings/width', 800)]);
    off();

    expect(revision).toBe(1);
    expect(engine.project.settings.width).toBe(800);
  });
});

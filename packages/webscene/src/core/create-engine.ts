import { Engine, type EngineOptions } from './engine';
import { Canvas2DBackend } from '../render/canvas2d-backend';
import { CanvasRenderTarget } from '../render/target';
import type { ProjectJSON } from './schema';

export interface CreateEngineOptions {
  project: ProjectJSON;
  canvas: HTMLCanvasElement | OffscreenCanvas;
  options?: Omit<EngineOptions, 'project' | 'backend' | 'target'>;
}

export const createEngine = ({ project, canvas, options }: CreateEngineOptions): Engine => {
  return new Engine({
    project,
    backend: new Canvas2DBackend(),
    target: new CanvasRenderTarget(canvas),
    ...options,
  });
};

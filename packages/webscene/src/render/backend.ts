import type { AssetRegistry } from '../assets/registry';
import type { PluginHost } from '../plugins/host';
import type { CompJSON, ProjectJSON } from '../core/schema';
import type { Canvas2DContext } from './context';

export interface RenderTarget {
  width: number;
  height: number;
  getContext2D(): Canvas2DContext;
  clear(): void;
}

export interface RenderFrameInfo {
  project: ProjectJSON;
  comp: CompJSON;
  time: number;
  frame: number;
  assetRegistry: AssetRegistry;
  pluginHost: PluginHost;
}

export interface RenderStats {
  frame: number;
  time: number;
  drawCalls: number;
  layerCount: number;
  effectCount: number;
}

export interface RenderBackend {
  readonly name: string;
  render(frame: RenderFrameInfo, target: RenderTarget): RenderStats;
  dispose(): void;
}

import { AssetRegistry } from '../assets/registry';
import { PluginHost } from '../plugins/host';
import type { RenderBackend, RenderStats, RenderTarget } from '../render/backend';
import { clampTime, secondsToFrames } from '../utils/time';
import { EventEmitter } from '../utils/event-emitter';
import type { ProjectJSON, StatePatch } from './schema';
import { ProjectStore } from './store';

interface EngineEvents {
  stateChanged: { revision: number; patches: readonly StatePatch[] };
  beforeRender: { time: number; frame: number };
  afterRender: RenderStats;
}

export interface EngineOptions {
  backend: RenderBackend;
  target: RenderTarget;
  project: ProjectJSON;
  assets?: AssetRegistry;
  plugins?: PluginHost;
}

export class Engine {
  public readonly assets: AssetRegistry;
  public readonly plugins: PluginHost;

  private readonly backend: RenderBackend;
  private readonly target: RenderTarget;
  private readonly store: ProjectStore;
  private readonly events = new EventEmitter<EngineEvents>();

  public constructor(options: EngineOptions) {
    this.backend = options.backend;
    this.target = options.target;
    this.store = new ProjectStore(options.project);
    this.assets = options.assets ?? new AssetRegistry();
    this.plugins = options.plugins ?? new PluginHost();

    this.store.on('changed', (payload) => this.events.emit('stateChanged', payload));
  }

  public on = this.events.on.bind(this.events);

  public get project(): ProjectJSON {
    return this.store.snapshot;
  }

  public applyPatches(patches: readonly StatePatch[]): ProjectJSON {
    return this.store.applyPatches(patches);
  }

  public renderAt(time: number): RenderStats {
    const project = this.store.current;
    const comp = project.comps.find((candidate) => candidate.id === project.rootCompId);
    if (!comp) {
      throw new Error(`Root comp not found: ${project.rootCompId}`);
    }

    const clampedTime = clampTime(time, comp.duration);
    const frame = secondsToFrames(clampedTime, comp.fps);
    this.events.emit('beforeRender', { time: clampedTime, frame });

    const stats = this.backend.render(
      {
        project,
        comp,
        time: clampedTime,
        frame,
        assetRegistry: this.assets,
        pluginHost: this.plugins,
      },
      this.target,
    );

    this.events.emit('afterRender', stats);
    return stats;
  }

  public dispose(): void {
    this.backend.dispose();
    this.assets.clear();
  }
}

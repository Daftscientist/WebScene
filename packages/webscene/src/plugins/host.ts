import type { EnginePlugin, EffectPlugin, ImporterPlugin, LayerPlugin } from './types';

export class PluginHost {
  private readonly layerPlugins = new Map<string, LayerPlugin>();
  private readonly effectPlugins = new Map<string, EffectPlugin>();
  private readonly importerPlugins = new Map<string, ImporterPlugin>();
  private readonly plugins: EnginePlugin[] = [];

  public register(plugin: EnginePlugin): void {
    this.plugins.push(plugin);

    if (plugin.layers) {
      for (const layer of plugin.layers) {
        this.layerPlugins.set(layer.type, layer);
      }
    }

    if (plugin.effects) {
      for (const effect of plugin.effects) {
        this.effectPlugins.set(effect.type, effect);
      }
    }

    if (plugin.importers) {
      for (const importer of plugin.importers) {
        this.importerPlugins.set(importer.type, importer);
      }
    }
  }

  public getLayer(type: string): LayerPlugin | undefined {
    return this.layerPlugins.get(type);
  }

  public getEffect(type: string): EffectPlugin | undefined {
    return this.effectPlugins.get(type);
  }

  public getImporter(type: string): ImporterPlugin | undefined {
    return this.importerPlugins.get(type);
  }

  public list(): readonly EnginePlugin[] {
    return this.plugins;
  }
}

import type { LayerJSON } from './schema';

export class Layer {
  public constructor(public readonly json: LayerJSON) {}

  public setEnabled(enabled: boolean): void {
    this.json.enabled = enabled;
  }

  public setName(name: string): void {
    this.json.name = name;
  }

  public toJSON(): LayerJSON {
    return structuredClone(this.json);
  }
}

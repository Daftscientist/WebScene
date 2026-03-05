import type { CompJSON, LayerJSON, MarkerJSON } from './schema';

export class Comp {
  public constructor(public readonly json: CompJSON) {}

  public addLayer(layer: LayerJSON): void {
    this.json.layers.push(layer);
  }

  public removeLayer(layerId: string): void {
    const index = this.json.layers.findIndex((layer) => layer.id === layerId);
    if (index >= 0) {
      this.json.layers.splice(index, 1);
    }
  }

  public addMarker(marker: MarkerJSON): void {
    if (!this.json.markers) {
      this.json.markers = [];
    }
    this.json.markers.push(marker);
  }

  public toJSON(): CompJSON {
    return structuredClone(this.json);
  }
}

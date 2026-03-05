import { createIdGenerator } from './ids';
import type { CompJSON, MarkerJSON, ProjectJSON, ProjectSettingsJSON } from './schema';

export interface CreateProjectOptions {
  id?: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  rootCompName?: string;
}

const defaultSettings = (options: CreateProjectOptions): ProjectSettingsJSON => ({
  width: options.width,
  height: options.height,
  fps: options.fps,
  duration: options.duration,
  colorSpace: 'srgb',
});

const createRootComp = (id: string, options: CreateProjectOptions): CompJSON => ({
  id,
  name: options.rootCompName ?? 'Main Comp',
  width: options.width,
  height: options.height,
  fps: options.fps,
  duration: options.duration,
  backgroundColor: [0, 0, 0, 1],
  layers: [],
  tracks: [],
  markers: [],
});

export class Project {
  public readonly json: ProjectJSON;
  private readonly ids = createIdGenerator();

  public constructor(json: ProjectJSON) {
    this.json = json;
  }

  public static create(options: CreateProjectOptions): Project {
    const ids = createIdGenerator();
    const projectId = options.id ?? ids.next('project');
    const rootCompId = ids.next('comp');

    return new Project({
      version: '1.0',
      id: projectId,
      rootCompId,
      revision: 0,
      settings: defaultSettings(options),
      comps: [createRootComp(rootCompId, options)],
      assets: [],
      markers: [],
      idCounter: ids.snapshot(),
    });
  }

  public addComp(comp: CompJSON): void {
    this.json.comps.push(comp);
  }

  public addMarker(marker: MarkerJSON): void {
    this.json.markers.push(marker);
  }

  public nextId(prefix: string): string {
    const next = this.ids.next(prefix);
    this.json.idCounter = this.ids.snapshot();
    return next;
  }

  public toJSON(): ProjectJSON {
    return structuredClone(this.json);
  }
}

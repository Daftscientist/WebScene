import type { ProjectJSON, StatePatch } from './schema';
import { applyPatch } from './state-patch';
import { EventEmitter } from '../utils/event-emitter';

interface ProjectStoreEvents {
  changed: { revision: number; patches: readonly StatePatch[] };
}

export class ProjectStore {
  private project: ProjectJSON;
  private readonly events = new EventEmitter<ProjectStoreEvents>();

  public constructor(project: ProjectJSON) {
    this.project = structuredClone(project);
  }

  public on = this.events.on.bind(this.events);

  public get snapshot(): ProjectJSON {
    return structuredClone(this.project);
  }

  public get current(): ProjectJSON {
    return this.project;
  }

  public applyPatches(patches: readonly StatePatch[]): ProjectJSON {
    if (patches.length === 0) {
      return this.snapshot;
    }

    for (let i = 0; i < patches.length; i += 1) {
      applyPatch(this.project, patches[i]);
    }

    this.project.revision += 1;
    this.events.emit('changed', { revision: this.project.revision, patches });
    return this.snapshot;
  }

  public replace(nextProject: ProjectJSON): void {
    this.project = structuredClone(nextProject);
    this.events.emit('changed', { revision: this.project.revision, patches: [] });
  }
}

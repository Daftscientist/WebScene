import type { ProjectJSON } from './schema';

export const serializeProject = (project: ProjectJSON): string => JSON.stringify(project, null, 2);

export const deserializeProject = (input: string): ProjectJSON => {
  const parsed = JSON.parse(input) as ProjectJSON;
  if (parsed.version !== '1.0') {
    throw new Error(`Unsupported project version: ${String(parsed.version)}`);
  }
  return parsed;
};

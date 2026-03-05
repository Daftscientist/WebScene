import type { StatePatch } from './schema';

const splitPath = (path: string): string[] => path.split('/').filter((part) => part.length > 0);

const parseIndex = (key: string): number => {
  const parsed = Number.parseInt(key, 10);
  return Number.isInteger(parsed) ? parsed : -1;
};

const readAtPath = (root: unknown, path: string): unknown => {
  const keys = splitPath(path);
  let cursor = root;
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    if (cursor === null || cursor === undefined) {
      return undefined;
    }

    if (Array.isArray(cursor)) {
      const index = parseIndex(key);
      if (index < 0 || index >= cursor.length) {
        return undefined;
      }
      cursor = cursor[index];
    } else {
      cursor = (cursor as Record<string, unknown>)[key];
    }
  }

  return cursor;
};

const ensureParent = (root: unknown, path: string): { parent: unknown; key: string } => {
  const keys = splitPath(path);
  if (keys.length === 0) {
    throw new Error('Path cannot be empty');
  }

  let cursor = root;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];

    if (Array.isArray(cursor)) {
      const index = parseIndex(key);
      cursor = cursor[index];
      continue;
    }

    cursor = (cursor as Record<string, unknown>)[key];
  }

  return { parent: cursor, key: keys[keys.length - 1] };
};

export const createPatch = (
  op: StatePatch['op'],
  path: string,
  value?: unknown,
  previous?: unknown,
): StatePatch => ({
  op,
  path,
  value,
  previous,
  timestamp: Date.now(),
});

export const applyPatch = (root: unknown, patch: StatePatch): void => {
  const { parent, key } = ensureParent(root, patch.path);

  if (Array.isArray(parent)) {
    const index = parseIndex(key);
    if (index < 0) {
      throw new Error(`Invalid array index at path ${patch.path}`);
    }

    if (patch.op === 'insert') {
      parent.splice(index, 0, patch.value);
      return;
    }

    if (patch.op === 'remove') {
      parent.splice(index, 1);
      return;
    }

    parent[index] = patch.value;
    return;
  }

  const record = parent as Record<string, unknown>;

  if (patch.op === 'remove') {
    delete record[key];
    return;
  }

  record[key] = patch.value;
};

export const valueAtPath = (root: unknown, path: string): unknown => readAtPath(root, path);

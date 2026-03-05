import type { ID } from '../utils/types';

export interface IdGenerator {
  next(prefix?: string): ID;
  snapshot(): number;
}

export const createIdGenerator = (seed = 0): IdGenerator => {
  let counter = seed;

  return {
    next(prefix = 'ws'): ID {
      counter += 1;
      return `${prefix}_${counter.toString(36)}`;
    },
    snapshot(): number {
      return counter;
    },
  };
};

export const makeStableId = (scope: string, name: string): ID => {
  const normalizedScope = scope.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const normalizedName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `${normalizedScope}:${normalizedName}`;
};

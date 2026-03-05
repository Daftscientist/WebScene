import { describe, expect, it } from 'vitest';
import { applyPatch, createPatch, valueAtPath } from '../src/core/state-patch';

describe('state patch operations', () => {
  it('sets object values by path', () => {
    const state = { settings: { width: 1280 } };
    applyPatch(state, createPatch('set', '/settings/width', 1920));

    expect(state.settings.width).toBe(1920);
    expect(valueAtPath(state, '/settings/width')).toBe(1920);
  });

  it('supports insert and remove in arrays', () => {
    const state = { layers: ['a', 'c'] };

    applyPatch(state, createPatch('insert', '/layers/1', 'b'));
    expect(state.layers).toEqual(['a', 'b', 'c']);

    applyPatch(state, createPatch('remove', '/layers/0'));
    expect(state.layers).toEqual(['b', 'c']);
  });
});

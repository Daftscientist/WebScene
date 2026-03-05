import { describe, expect, it } from 'vitest';
import { WEBSCENE_VERSION } from '../src/index';

describe('webscene', () => {
  it('exposes a version constant', () => {
    expect(WEBSCENE_VERSION).toBe('0.1.0');
  });
});

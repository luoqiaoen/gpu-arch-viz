import { describe, it, expect } from 'vitest';
import { blockColor } from '../scene/blockColors';

describe('blockColor', () => {
  it('returns a bright color when active', () => {
    expect(blockColor('compute-cluster', true)).toBe('#2ea043');
  });
  it('returns a dim color when idle', () => {
    expect(blockColor('compute-cluster', false)).toBe('#16291b');
  });
  it('idle tensor block is a warning red-orange to flag wasted die area', () => {
    expect(blockColor('tensor', false)).toBe('#5c2a1f');
  });
});

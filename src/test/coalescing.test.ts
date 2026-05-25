import { describe, it, expect } from 'vitest';
import { transactionsFor, bandwidthEfficiency, type AccessPattern } from '../lib/coalescing';

describe('coalescing', () => {
  it('coalesced 32-thread access = 1 transaction', () => {
    expect(transactionsFor('coalesced', 32)).toBe(1);
  });

  it('strided access = one transaction per thread', () => {
    expect(transactionsFor('strided', 32)).toBe(32);
  });

  it('coalesced efficiency is 100%', () => {
    expect(bandwidthEfficiency('coalesced', 32)).toBe(100);
  });

  it('strided efficiency collapses (≈3%)', () => {
    expect(bandwidthEfficiency('strided', 32)).toBeLessThan(5);
  });

  it('random is worse than or equal to strided', () => {
    const r = bandwidthEfficiency('random', 32);
    const s = bandwidthEfficiency('strided', 32);
    expect(r).toBeLessThanOrEqual(s);
  });
});

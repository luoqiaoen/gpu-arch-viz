import { describe, it, expect } from 'vitest';
import { PRECISION_FORMATS, type PrecisionFormat } from '../data/precisionFormats';

describe('precisionFormats', () => {
  it('exports 7 formats', () => {
    expect(PRECISION_FORMATS).toHaveLength(7);
  });

  it('every format satisfies sign(1) + exponent + mantissa = totalBits', () => {
    for (const f of PRECISION_FORMATS) {
      expect(1 + f.exponentBits + f.mantissaBits).toBe(f.totalBits);
    }
  });

  it('FP64 has 52 mantissa bits and 11 exponent bits', () => {
    const fp64 = PRECISION_FORMATS.find((f) => f.name === 'FP64')!;
    expect(fp64.exponentBits).toBe(11);
    expect(fp64.mantissaBits).toBe(52);
  });

  it('BF16 and FP32 share the same exponent width (8)', () => {
    const bf16 = PRECISION_FORMATS.find((f) => f.name === 'BF16')!;
    const fp32 = PRECISION_FORMATS.find((f) => f.name === 'FP32')!;
    expect(bf16.exponentBits).toBe(fp32.exponentBits);
  });

  it('INT8 has 0 exponent bits', () => {
    const int8 = PRECISION_FORMATS.find((f) => f.name === 'INT8')!;
    expect(int8.exponentBits).toBe(0);
  });
});

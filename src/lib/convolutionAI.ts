export type ConvPrecision = 'fp32' | 'fp16' | 'int8';

const BPE: Record<ConvPrecision, number> = { fp32: 4, fp16: 2, int8: 1 };

export interface ConvParams {
  imageW: number;
  imageH: number;
  kSize: number; // kernel is kSize × kSize
  cIn: number;
  cOut: number;
}

/** Total multiply-accumulate ops × 2 (one FLOP per multiply, one per add). */
export function convFlops(p: ConvParams): number {
  return 2 * p.imageW * p.imageH * p.kSize ** 2 * p.cIn * p.cOut;
}

/** Optimal memory traffic: each tensor read/written exactly once (shared-memory tiling). */
export function convBytesTiled(p: ConvParams, prec: ConvPrecision): number {
  const bpe = BPE[prec];
  const px = p.imageW * p.imageH;
  return (px * p.cIn + p.kSize ** 2 * p.cIn * p.cOut + px * p.cOut) * bpe;
}

/**
 * Naive memory traffic: for every output element, re-read the K×K×C_in input
 * patch and the K×K×C_in weights directly from DRAM — no shared-memory reuse.
 * AI_naive → 1/bpe regardless of K or C (always memory-bound).
 */
export function convBytesNaive(p: ConvParams, prec: ConvPrecision): number {
  const bpe = BPE[prec];
  const px = p.imageW * p.imageH;
  return px * p.cOut * (2 * p.kSize ** 2 * p.cIn + 1) * bpe;
}

export function convAI(
  p: ConvParams,
  prec: ConvPrecision,
  reuse: 'tiled' | 'naive',
): number {
  const bytes = reuse === 'tiled' ? convBytesTiled(p, prec) : convBytesNaive(p, prec);
  return convFlops(p) / bytes;
}

export interface ConvOp {
  id: string;
  label: string;
  shortLabel: string;
  kSize: number;
  cIn: number;
  cOut: number;
  color: string;
}

// Pure grayscale image convolution presets (C_in=C_out=1).
export const CONV_OPS: ConvOp[] = [
  { id: 'k3',   label: '3×3 kernel',   shortLabel: '3×3',   kSize: 3,  cIn: 1, cOut: 1, color: '#79c0ff' },
  { id: 'k7',   label: '7×7 kernel',   shortLabel: '7×7',   kSize: 7,  cIn: 1, cOut: 1, color: '#ffa657' },
  { id: 'k11',  label: '11×11 kernel', shortLabel: '11×11', kSize: 11, cIn: 1, cOut: 1, color: '#ff7b72' },
  { id: 'k15',  label: '15×15 kernel', shortLabel: '15×15', kSize: 15, cIn: 1, cOut: 1, color: '#d2a8ff' },
];

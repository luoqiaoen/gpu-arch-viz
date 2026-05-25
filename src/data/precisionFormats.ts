export interface PrecisionFormat {
  name: string;
  totalBits: number;
  exponentBits: number;
  mantissaBits: number; // sign bit is the remaining 1 bit (sign + exp + mantissa = total)
  approxDecimalDigits: number;
  useCase: string;
}

export const PRECISION_FORMATS: PrecisionFormat[] = [
  {
    name: 'FP64',
    totalBits: 64,
    exponentBits: 11,
    mantissaBits: 52,
    approxDecimalDigits: 15,
    useCase: 'Scientific HPC, molecular dynamics, CFD',
  },
  {
    name: 'FP32',
    totalBits: 32,
    exponentBits: 8,
    mantissaBits: 23,
    approxDecimalDigits: 7,
    useCase: 'General GPU compute, graphics shaders',
  },
  {
    name: 'TF32',
    totalBits: 19,
    exponentBits: 8,
    mantissaBits: 10,
    approxDecimalDigits: 3,
    useCase: 'NVIDIA Ampere/Hopper/Blackwell matmul (not a memory format)',
  },
  {
    name: 'BF16',
    totalBits: 16,
    exponentBits: 8,
    mantissaBits: 7,
    approxDecimalDigits: 2,
    useCase: 'AI training — FP32 dynamic range with fewer mantissa bits',
  },
  {
    name: 'FP16',
    totalBits: 16,
    exponentBits: 5,
    mantissaBits: 10,
    approxDecimalDigits: 3,
    useCase: 'AI training & inference; narrower range than BF16',
  },
  {
    name: 'FP8 E4M3',
    totalBits: 8,
    exponentBits: 4,
    mantissaBits: 3,
    approxDecimalDigits: 1,
    useCase: 'Inference forward pass — H100+, MI300X (requires per-tensor scale)',
  },
  {
    name: 'INT8',
    totalBits: 8,
    exponentBits: 0,
    mantissaBits: 7,
    approxDecimalDigits: 2,
    useCase: 'Quantized inference; integer, not floating point',
  },
];

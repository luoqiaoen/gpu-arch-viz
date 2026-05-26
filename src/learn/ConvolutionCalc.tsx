import { useEffect, useState } from 'react';
import { GPU_MAP, type GpuSpec } from '../data/gpus';
import {
  CONV_OPS, convAI, convFlops, convBytesTiled, convBytesNaive,
  type ConvPrecision, type ConvOp,
} from '../lib/convolutionAI';
import { achievableThroughput } from '../lib/roofline';

export interface AiPoint {
  id: string;
  label: string;
  shortLabel: string;
  ai: number;
  color: string;
}

interface Props {
  cardIds: string[];
  imgIdx: number;
  prec: ConvPrecision;
  reuse: 'tiled' | 'naive';
  setImgIdx: (i: number) => void;
  setPrec: (p: ConvPrecision) => void;
  setReuse: (r: 'tiled' | 'naive') => void;
  onPointsChange: (pts: AiPoint[]) => void;
}

export const IMAGE_PRESETS = [
  { label: '2048×1024', w: 2048, h: 1024 },
  { label: '3072×1536', w: 3072, h: 1536 },
  { label: '4096×2160', w: 4096, h: 2160 },
];

function fmtFlops(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)} T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} G`;
  return `${(n / 1e6).toFixed(0)} M`;
}

function fmtBytes(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} GB`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} MB`;
  return `${(n / 1e3).toFixed(0)} KB`;
}

function calcMpxPerSec(ai: number, op: ConvOp, imgW: number, imgH: number, spec: GpuSpec): number {
  const ceilGFLOPS = spec.throughput.fp32 * 1000;
  const achievable = achievableThroughput(ai, ceilGFLOPS, spec.memory.bandwidthGBs);
  const flopsPerPx = convFlops({ imageW: imgW, imageH: imgH, kSize: op.kSize, cIn: op.cIn, cOut: op.cOut }) / (imgW * imgH);
  return (achievable * 1e9) / flopsPerPx / 1e6;
}

const BPE_LABEL: Record<ConvPrecision, string> = { fp32: '4 (FP32)', fp16: '2 (FP16)', int8: '1 (INT8)' };
const BPE: Record<ConvPrecision, number> = { fp32: 4, fp16: 2, int8: 1 };

export function ConvolutionCalc({ cardIds, imgIdx, prec, reuse, setImgIdx, setPrec, setReuse, onPointsChange }: Props) {
  const [showMath, setShowMath] = useState(false);
  const img = IMAGE_PRESETS[imgIdx];
  const specs = cardIds.map((id) => GPU_MAP[id]).filter((s): s is GpuSpec => !!s);

  const points: AiPoint[] = CONV_OPS.map((op) => {
    const p = { imageW: img.w, imageH: img.h, kSize: op.kSize, cIn: op.cIn, cOut: op.cOut };
    return { id: op.id, label: op.label, shortLabel: op.shortLabel, ai: convAI(p, prec, reuse), color: op.color };
  });

  useEffect(() => {
    const img = IMAGE_PRESETS[imgIdx];
    onPointsChange(CONV_OPS.map((op) => {
      const p = { imageW: img.w, imageH: img.h, kSize: op.kSize, cIn: op.cIn, cOut: op.cOut };
      return { id: op.id, label: op.label, shortLabel: op.shortLabel, ai: convAI(p, prec, reuse), color: op.color };
    }));
  // onPointsChange is stable setState — intentionally omitted
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgIdx, prec, reuse]);

  return (
    <div className="flex flex-col gap-3">
      <span className="font-mono text-xs text-muted uppercase tracking-widest">Convolution Calculator</span>

      {/* Controls */}
      <div className="flex gap-4 flex-wrap font-mono text-[10px] items-center">
        <label className="text-muted flex items-center gap-1.5">
          Image
          <select
            value={imgIdx}
            onChange={(e) => setImgIdx(Number(e.target.value))}
            className="bg-bg border border-edge text-primary px-1.5 py-0.5 rounded"
          >
            {IMAGE_PRESETS.map((p, i) => <option key={i} value={i}>{p.label}</option>)}
          </select>
        </label>
        <label className="text-muted flex items-center gap-1.5">
          Precision
          <select
            value={prec}
            onChange={(e) => setPrec(e.target.value as ConvPrecision)}
            className="bg-bg border border-edge text-primary px-1.5 py-0.5 rounded"
          >
            {(['fp32', 'fp16', 'int8'] as const).map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
          </select>
        </label>
        <div className="flex gap-1 items-center font-mono text-[10px] text-muted">
          Cache
          {(['tiled', 'naive'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setReuse(r)}
              className={`px-2 py-0.5 rounded border ${reuse === r ? 'bg-nvidia text-bg border-nvidia' : 'border-edge hover:border-nvidia'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Op legend with live AI values */}
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        {points.map((pt) => (
          <span key={pt.id} className="font-mono text-[10px] flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: pt.color }} />
            <span className="text-muted">{pt.label}</span>
            <span className="text-primary font-semibold">
              AI={pt.ai < 1 ? pt.ai.toFixed(2) : pt.ai.toFixed(1)}
            </span>
          </span>
        ))}
      </div>

      {/* Expandable math section */}
      <button
        onClick={() => setShowMath((v) => !v)}
        className="font-mono text-[10px] text-muted hover:text-primary text-left w-fit"
      >
        {showMath ? '▾ Hide math' : '▸ Show math'}
      </button>

      {showMath && (
        <div className="bg-[#0d1117] border border-edge rounded p-3 flex flex-col gap-3 font-mono text-[10px]">

          {/* Formulas */}
          <div className="flex flex-col gap-1 text-muted leading-relaxed">
            <div>
              <span className="text-primary">FLOPs</span>
              {' '}= 2 × H×W × K² × C<sub>in</sub> × C<sub>out</sub>
            </div>
            <div className="mt-1">
              <span className="text-primary">Bytes (tiled)</span>
              {' '}= (H×W×C<sub>in</sub> + K²×C<sub>in</sub>×C<sub>out</sub> + H×W×C<sub>out</sub>) × bpe
            </div>
            <div className="text-[9px] pl-4 text-[#484f58]">
              ↳ input tensor + weight tensor + output tensor, each read/written once; bpe = {BPE_LABEL[prec]}
            </div>
            <div className="mt-1">
              <span className="text-primary">Bytes (naive)</span>
              {' '}= H×W × C<sub>out</sub> × (2K²×C<sub>in</sub>) × bpe
            </div>
            <div className="text-[9px] pl-4 text-[#484f58]">
              ↳ re-read weights for every output pixel → AI ≈ 1/bpe = {(1 / BPE[prec]).toFixed(2)}
            </div>
            <div className="mt-1">
              <span className="text-primary">AI</span> = FLOPs / Bytes
            </div>
          </div>

          {/* Per-op worked numbers */}
          <div>
            <div className="text-[9px] text-[#484f58] mb-1">
              at {img.label} px, bpe={BPE[prec]}
            </div>
            <table className="border-collapse w-full">
              <thead>
                <tr>
                  <th className="text-left text-[#484f58] px-2 py-0.5 border border-[#21262d] font-normal">Op</th>
                  <th className="text-center text-[#484f58] px-2 py-0.5 border border-[#21262d] font-normal">K</th>
                  <th className="text-center text-[#484f58] px-2 py-0.5 border border-[#21262d] font-normal">C_in</th>
                  <th className="text-center text-[#484f58] px-2 py-0.5 border border-[#21262d] font-normal">C_out</th>
                  <th className="text-right text-[#484f58] px-2 py-0.5 border border-[#21262d] font-normal">FLOPs</th>
                  <th className="text-right text-[#484f58] px-2 py-0.5 border border-[#21262d] font-normal">
                    Bytes ({reuse})
                  </th>
                  <th className="text-right text-[#484f58] px-2 py-0.5 border border-[#21262d] font-normal">AI</th>
                </tr>
              </thead>
              <tbody>
                {CONV_OPS.map((op, i) => {
                  const params = { imageW: img.w, imageH: img.h, kSize: op.kSize, cIn: op.cIn, cOut: op.cOut };
                  const flops = convFlops(params);
                  const bytes = reuse === 'tiled' ? convBytesTiled(params, prec) : convBytesNaive(params, prec);
                  const ai = points[i].ai;
                  return (
                    <tr key={op.id}>
                      <td className="px-2 py-0.5 border border-[#21262d]" style={{ color: op.color }}>{op.shortLabel}</td>
                      <td className="text-center text-muted px-2 py-0.5 border border-[#21262d]">{op.kSize}</td>
                      <td className="text-center text-muted px-2 py-0.5 border border-[#21262d]">{op.cIn}</td>
                      <td className="text-center text-muted px-2 py-0.5 border border-[#21262d]">{op.cOut}</td>
                      <td className="text-right text-muted px-2 py-0.5 border border-[#21262d]">{fmtFlops(flops)}</td>
                      <td className="text-right text-muted px-2 py-0.5 border border-[#21262d]">{fmtBytes(bytes)}</td>
                      <td className="text-right text-primary px-2 py-0.5 border border-[#21262d] font-semibold">
                        {ai < 1 ? ai.toFixed(2) : ai.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Key insight */}
          <div className="text-muted leading-relaxed border-t border-[#21262d] pt-2">
            <span className="text-primary">Key insight (tiled):</span>
            {' '}for large images the H×W factor cancels:
            <div className="mt-1 pl-2 text-[#484f58]">
              AI ≈ 2×K²×C<sub>in</sub>×C<sub>out</sub> / (C<sub>in</sub>+C<sub>out</sub>) / bpe
              {' '}— image size doesn't matter, only kernel shape and channel count.
            </div>
            {reuse === 'naive' && (
              <div className="mt-1 pl-2 text-[#484f58]">
                <span className="text-warn">Naive:</span>
                {' '}K and C cancel too → AI ≈ 1/bpe = {(1 / BPE[prec]).toFixed(2)},
                a constant regardless of how large the kernel is.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Per-GPU throughput table */}
      {specs.length > 0 && (
        <div className="overflow-auto">
          <table className="font-mono text-[10px] border-collapse">
            <thead>
              <tr>
                <th className="text-left text-muted px-2 py-0.5 border border-edge">Operation</th>
                <th className="text-right text-muted px-2 py-0.5 border border-edge">AI</th>
                {specs.map((s) => (
                  <th
                    key={s.id}
                    className={`text-right px-2 py-0.5 border border-edge ${s.vendor === 'nvidia' ? 'text-nvidia' : 'text-amd'}`}
                  >
                    {s.name.replace('NVIDIA ', '').replace('Radeon PRO ', '')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {points.map((pt, i) => {
                const op = CONV_OPS[i];
                return (
                  <tr key={pt.id} className="hover:bg-[#161b22]">
                    <td className="px-2 py-0.5 border border-edge" style={{ color: pt.color }}>
                      {op.label}
                    </td>
                    <td className="text-right text-muted px-2 py-0.5 border border-edge">
                      {pt.ai < 1 ? pt.ai.toFixed(2) : pt.ai.toFixed(1)}
                    </td>
                    {specs.map((s) => (
                      <td key={s.id} className="text-right px-2 py-0.5 border border-edge text-primary">
                        {calcMpxPerSec(pt.ai, op, img.w, img.h, s).toFixed(0)} MP/s
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="font-mono text-[10px] text-muted leading-relaxed">
        <span className="text-primary">Tiled</span>: weights in shared memory, input streamed once — AI scales with K²×C.
        {' '}<span className="text-primary">Naive</span>: weights re-read per output pixel — AI collapses to ≈1/bpe regardless of kernel size.
        Throughput (MP/s) uses FP32 ceiling. Dots on the roofline above mark each operation.
      </p>
    </div>
  );
}

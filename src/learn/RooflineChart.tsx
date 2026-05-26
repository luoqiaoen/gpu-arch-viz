import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from 'recharts';
import { GPU_MAP, type GpuSpec } from '../data/gpus';
import { achievableThroughput, WORKLOAD_POINTS } from '../lib/roofline';
import { useAppStore } from '../store/useAppStore';
import { WORKLOADS } from '../data/workloads';
import type { AiPoint } from './ConvolutionCalc';

export type RooflinePrec = 'fp32' | 'fp16' | 'int8' | 'fp64';

const X_POINTS = [0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];

const CEIL_OPTIONS: { key: RooflinePrec; label: string }[] = [
  { key: 'fp32', label: 'FP32' },
  { key: 'fp16', label: 'FP16' },
  { key: 'int8', label: 'INT8' },
  { key: 'fp64', label: 'FP64' },
];

function getCeilingGFLOPS(s: GpuSpec, prec: RooflinePrec): number {
  if (prec === 'fp16') return s.throughput.fp16Dense * 1000;
  if (prec === 'int8') return s.throughput.int8Dense * 1000;
  if (prec === 'fp64') return s.throughput.fp64Vector * 1000;
  return s.throughput.fp32 * 1000;
}

interface Props {
  cardIds: string[];
  aiPoints?: AiPoint[];
  precision?: RooflinePrec;
  onPrecisionChange?: (p: RooflinePrec) => void;
}

export function RooflineChart({ cardIds, aiPoints = [], precision = 'fp32', onPrecisionChange }: Props) {
  const specs = cardIds.map((id) => GPU_MAP[id]).filter(Boolean);
  const { workload } = useAppStore();
  const activeWl = WORKLOADS[workload];

  const data = X_POINTS.map((ai) => {
    const row: Record<string, number> = { ai };
    for (const s of specs) {
      row[s.id] = achievableThroughput(ai, getCeilingGFLOPS(s, precision), s.memory.bandwidthGBs);
    }
    return row;
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-mono text-xs text-muted uppercase tracking-widest">Roofline</span>
        <div className="flex gap-1">
          {CEIL_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onPrecisionChange?.(key)}
              className={`font-mono text-[10px] px-2 py-0.5 rounded border ${
                precision === key ? 'bg-nvidia text-bg border-nvidia' : 'text-muted border-edge hover:border-nvidia'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {/* Inline legend — avoids the built-in legend overlapping on small widths */}
        <div className="flex gap-4 ml-2">
          {specs.map((s) => (
            <span key={s.id} className="font-mono text-[10px] flex items-center gap-1.5">
              <span className="inline-block w-5 h-px" style={{ background: s.vendor === 'nvidia' ? '#3fb950' : '#f85149', height: 2 }} />
              <span className="text-muted">{s.name}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 24, right: 20, bottom: 20, left: 10 }}>
            <XAxis
              dataKey="ai" scale="log" type="number" domain={[0.1, 1000]}
              tick={{ fill: '#8b949e', fontSize: 9, fontFamily: 'monospace' }}
              label={{ value: 'Arithmetic Intensity (FLOP/byte)', fill: '#8b949e', fontSize: 10, position: 'insideBottom', offset: -10 }}
            />
            <YAxis
              scale="log" domain={['auto', 'auto']} tick={{ fill: '#8b949e', fontSize: 9, fontFamily: 'monospace' }} width={56}
              label={{ value: 'GFLOPS', fill: '#8b949e', fontSize: 10, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip contentStyle={{ background: '#11151c', border: '1px solid #2a323d', fontFamily: 'monospace', fontSize: 10 }} labelStyle={{ color: '#e6edf3' }} />
            {specs.map((s) => (
              <Line
                key={s.id} type="monotone" dataKey={s.id} name={s.name}
                stroke={s.vendor === 'nvidia' ? '#3fb950' : '#f85149'} dot={false} strokeWidth={2} isAnimationActive={false}
              />
            ))}
            {/* Workload markers: stagger label offsets so adjacent points don't overlap */}
            {WORKLOAD_POINTS.map((wp, i) => (
              <ReferenceLine
                key={wp.label}
                x={wp.intensity}
                stroke="#6e7681"
                strokeDasharray="3 3"
                strokeOpacity={0.45}
                label={{ value: wp.label, fill: '#6e7681', fontSize: 8, fontFamily: 'monospace', position: 'top', offset: i % 2 === 0 ? 4 : 14 }}
              />
            ))}
            {/* Highlight the workload selected in the Explorer */}
            <ReferenceLine
              x={activeWl.arithmeticIntensity}
              stroke="#e3b341"
              strokeWidth={2}
              strokeDasharray="4 2"
              label={{
                value: `▶ ${activeWl.label}`,
                fill: '#e3b341',
                fontSize: 8,
                fontFamily: 'monospace',
                position: 'top',
                offset: 4,
              }}
            />
            {/* Convolution calculator dots: one per op × GPU, sitting on each roofline curve */}
            {aiPoints.flatMap((pt) =>
              specs.map((s) => {
                const y = achievableThroughput(pt.ai, getCeilingGFLOPS(s, precision), s.memory.bandwidthGBs);
                return (
                  <ReferenceDot
                    key={`${pt.id}-${s.id}`}
                    x={pt.ai}
                    y={y}
                    r={pt.hollow ? 4 : 5}
                    fill={pt.hollow ? '#0d1117' : pt.color}
                    stroke={pt.color}
                    strokeWidth={pt.hollow ? 2 : 1.5}
                  />
                );
              })
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="font-mono text-[10px] text-muted leading-relaxed">
        Below each card's ridge point, throughput is capped by memory bandwidth (the rising diagonal); above it, by compute (the flat ceiling).
        FP16/INT8 use tensor-core dense ceilings — often 8–16× higher than FP32.
        The precision here is synced with the Conv Calc below: changing precision there moves the dots AND the ceiling simultaneously.
      </p>
    </div>
  );
}

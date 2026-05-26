import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { CONV_OPS, type ConvPrecision } from '../lib/convolutionAI';

const BPE: Record<ConvPrecision, number> = { fp32: 4, fp16: 2, int8: 1 };

// AI for a T×T output tile with K×K kernel, C_in=C_out=1
function tiledAIForTile(T: number, kSize: number, bpe: number): number {
  const inputElems = (T + kSize - 1) ** 2;
  const outputElems = T * T;
  const weightElems = kSize * kSize;
  const flops = 2 * outputElems * weightElems;
  return flops / ((inputElems + outputElems + weightElems) * bpe);
}

// Fraction of loaded input pixels that are halo (don't contribute to output)
function haloFraction(T: number, kSize: number): number {
  const inputElems = (T + kSize - 1) ** 2;
  return 1 - (T * T) / inputElems;
}

const T_VALS = [1, 2, 4, 6, 8, 12, 16, 20, 24, 32, 48, 64];

interface Props {
  prec: ConvPrecision;
}

export function TilingDepth({ prec }: Props) {
  const bpe = BPE[prec];

  const aiData = T_VALS.map((T) => {
    const row: Record<string, number> = { T };
    for (const op of CONV_OPS) row[op.id] = tiledAIForTile(T, op.kSize, bpe);
    return row;
  });

  const haloData = T_VALS.map((T) => {
    const row: Record<string, number> = { T };
    for (const op of CONV_OPS) row[op.id] = haloFraction(T, op.kSize) * 100;
    return row;
  });

  return (
    <div className="flex flex-col gap-3">
      <span className="font-mono text-xs text-muted uppercase tracking-widest">Tiling Depth & Halo Overhead</span>

      <p className="font-mono text-[10px] text-muted leading-relaxed">
        A T×T output tile requires loading a (T+K−1)² input patch.
        The border pixels — the "halo" — are loaded but produce no output.
        Larger tiles amortize this cost, pushing AI toward the large-image limit K²/bpe (dashed lines).
      </p>

      {/* AI vs tile size */}
      <div className="text-[9px] font-mono text-[#484f58] ml-1">AI vs tile size T (C_in=C_out=1, {prec.toUpperCase()})</div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={aiData} margin={{ top: 8, right: 24, bottom: 20, left: 10 }}>
            <XAxis
              dataKey="T"
              tick={{ fill: '#8b949e', fontSize: 9, fontFamily: 'monospace' }}
              label={{ value: 'Tile size T (output pixels per side)', fill: '#8b949e', fontSize: 9, position: 'insideBottom', offset: -10 }}
            />
            <YAxis
              tick={{ fill: '#8b949e', fontSize: 9, fontFamily: 'monospace' }}
              width={40}
              label={{ value: 'AI (FLOP/byte)', fill: '#8b949e', fontSize: 9, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{ background: '#11151c', border: '1px solid #2a323d', fontFamily: 'monospace', fontSize: 9 }}
              labelFormatter={(v) => `T=${v}`}
              formatter={(v: number, name: string) => {
                const op = CONV_OPS.find((o) => o.id === name);
                return [v.toFixed(2), op?.shortLabel ?? name];
              }}
            />
            {CONV_OPS.map((op) => (
              <Line key={op.id} dataKey={op.id} stroke={op.color} dot={false} strokeWidth={2} isAnimationActive={false} />
            ))}
            {/* Asymptote: large-image tiled limit K²/bpe */}
            {CONV_OPS.map((op) => (
              <ReferenceLine
                key={`${op.id}-asym`}
                y={op.kSize ** 2 / bpe}
                stroke={op.color}
                strokeDasharray="4 3"
                strokeOpacity={0.35}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Halo waste % vs tile size */}
      <div className="text-[9px] font-mono text-[#484f58] ml-1 mt-1">Halo waste % = 1 − T² / (T+K−1)²</div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={haloData} margin={{ top: 8, right: 24, bottom: 20, left: 10 }}>
            <XAxis
              dataKey="T"
              tick={{ fill: '#8b949e', fontSize: 9, fontFamily: 'monospace' }}
              label={{ value: 'Tile size T', fill: '#8b949e', fontSize: 9, position: 'insideBottom', offset: -10 }}
            />
            <YAxis
              tick={{ fill: '#8b949e', fontSize: 9, fontFamily: 'monospace' }}
              width={40}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{ background: '#11151c', border: '1px solid #2a323d', fontFamily: 'monospace', fontSize: 9 }}
              labelFormatter={(v) => `T=${v}`}
              formatter={(v: number, name: string) => {
                const op = CONV_OPS.find((o) => o.id === name);
                return [`${v.toFixed(1)}%`, op?.shortLabel ?? name];
              }}
            />
            {CONV_OPS.map((op) => (
              <Line key={op.id} dataKey={op.id} stroke={op.color} dot={false} strokeWidth={2} isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Quick reference table: asymptote AI and tile at 90% of asymptote */}
      <div className="overflow-auto">
        <table className="font-mono text-[10px] border-collapse">
          <thead>
            <tr>
              <th className="text-left text-muted px-2 py-0.5 border border-edge font-normal">Kernel</th>
              <th className="text-right text-muted px-2 py-0.5 border border-edge font-normal">AI limit (K²/bpe)</th>
              <th className="text-right text-muted px-2 py-0.5 border border-edge font-normal">Halo at T=8</th>
              <th className="text-right text-muted px-2 py-0.5 border border-edge font-normal">Halo at T=16</th>
              <th className="text-right text-muted px-2 py-0.5 border border-edge font-normal">Halo at T=32</th>
            </tr>
          </thead>
          <tbody>
            {CONV_OPS.map((op) => (
              <tr key={op.id}>
                <td className="px-2 py-0.5 border border-edge" style={{ color: op.color }}>{op.shortLabel}</td>
                <td className="text-right text-primary px-2 py-0.5 border border-edge font-semibold">
                  {(op.kSize ** 2 / bpe).toFixed(2)}
                </td>
                {[8, 16, 32].map((T) => (
                  <td key={T} className="text-right text-muted px-2 py-0.5 border border-edge">
                    {(haloFraction(T, op.kSize) * 100).toFixed(0)}%
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="font-mono text-[10px] text-muted leading-relaxed">
        <span className="text-primary">Large K → higher halo cost at small T.</span>
        {' '}A 15×15 kernel with T=8 wastes 87% of loaded bytes on border pixels.
        T=32 drops waste below 55% even for the largest kernel, approaching the full-image tiled AI limit (dashed lines above).
        Shared memory size sets the practical upper bound on T.
      </p>
    </div>
  );
}

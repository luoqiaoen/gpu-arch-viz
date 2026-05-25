import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { GPU_MAP } from '../data/gpus';
import { hierarchyForCard, type MemRung } from '../data/memoryHierarchy';

function BandwidthBar({ rungs }: { rungs: MemRung[] }) {
  const data = rungs
    .filter((r) => r.bwNumGBps !== null)
    .map((r) => ({
      level: r.level.replace(' → Host', ''),
      bw: r.bwNumGBps as number,
      latency: r.latency,
      external: r.external ?? false,
    }))
    .reverse(); // fastest at top

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 90, bottom: 16, left: 8 }}>
          <XAxis
            type="number"
            scale="log"
            domain={[10, 100000]}
            allowDataOverflow
            tick={{ fill: '#8b949e', fontSize: 8, fontFamily: 'monospace' }}
            tickFormatter={(v: number) => v >= 1000 ? `${v / 1000}k` : `${v}`}
            label={{ value: 'GB/s (log)', fill: '#8b949e', fontSize: 9, position: 'insideBottomRight', offset: -4 }}
          />
          <YAxis
            type="category"
            dataKey="level"
            width={90}
            tick={{ fill: '#8b949e', fontSize: 8, fontFamily: 'monospace' }}
          />
          <Tooltip
            contentStyle={{ background: '#11151c', border: '1px solid #2a323d', fontFamily: 'monospace', fontSize: 9 }}
            formatter={(val: number) => [`${val.toLocaleString()} GB/s`, 'Bandwidth']}
          />
          <Bar dataKey="bw" isAnimationActive={false} radius={[0, 2, 2, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.external ? '#f85149' : '#3fb950'} fillOpacity={0.7} />
            ))}
            <LabelList
              dataKey="latency"
              position="right"
              style={{ fill: '#8b949e', fontSize: 8, fontFamily: 'monospace' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MemoryHierarchy({ cardId }: { cardId: string }) {
  const spec = GPU_MAP[cardId];
  if (!spec) return null;
  const rungs = hierarchyForCard(spec);

  return (
    <div className="flex flex-col gap-3">
      <span className="font-mono text-xs text-muted uppercase tracking-widest">Memory Hierarchy · {spec.name}</span>
      <BandwidthBar rungs={rungs} />
      <div className="flex flex-col gap-1">
        {rungs.map((r, i) => (
          <div
            key={r.level}
            className={`flex items-center gap-3 px-3 py-2 rounded border font-mono text-[11px] ${
              r.external ? 'border-amd/40 bg-amd/5' : 'border-edge bg-surface'
            }`}
            style={{ marginLeft: `${i * 14}px` }}
          >
            <span className="text-primary w-32">{r.level}</span>
            <span className="text-muted w-28">{r.capacity}</span>
            <span className={r.external ? 'text-amd w-32' : 'text-good w-32'}>{r.bandwidth}</span>
            <span className="text-muted">{r.latency}</span>
          </div>
        ))}
      </div>
      <p className="font-mono text-[10px] text-muted leading-relaxed">
        Each step down is bigger but slower. Once working data spills past L2, every access pays the external-memory tax —
        this is exactly where HBM3 ({spec.vendor === 'amd' ? 'AMD' : 'NVIDIA'} HPC parts) crushes GDDR6/7.
      </p>
    </div>
  );
}

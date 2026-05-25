import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { useAppStore, selectedSpecIds } from '../store/useAppStore';
import { GPU_MAP } from '../data/gpus';

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { name: string; type: string; cap: number; bw: number; vendor: string } }>;
}

function BwTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: '#11151c', border: '1px solid #2a323d', padding: '8px', fontFamily: 'monospace', fontSize: 10 }}>
      <div style={{ color: '#e6edf3' }}>{d.name}</div>
      <div style={{ color: '#8b949e' }}>{d.type} · {d.cap} GB</div>
      <div style={{ color: '#c9d1d9' }}>{d.bw} GB/s</div>
    </div>
  );
}

export function BandwidthChart() {
  const { selectedCards } = useAppStore();
  const specs = selectedSpecIds(selectedCards).map((id) => GPU_MAP[id]).filter(Boolean);

  if (specs.length === 0) return null;

  const data = specs.map((s) => ({
    name: s.name,
    bw: s.memory.bandwidthGBs,
    cap: s.memory.capacityGB,
    type: s.memory.type,
    vendor: s.vendor,
  }));

  return (
    <div className="h-full w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 20, bottom: 4, left: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: '#8b949e', fontSize: 10, fontFamily: 'monospace' }}
          />
          <YAxis
            tick={{ fill: '#8b949e', fontSize: 9, fontFamily: 'monospace' }}
            label={{ value: 'GB/s', angle: -90, position: 'insideLeft', fill: '#8b949e', fontSize: 10, fontFamily: 'monospace', dx: 8 }}
            width={52}
          />
          <Tooltip
            content={<BwTooltip />}
            cursor={{ fill: '#ffffff08' }}
          />
          <Bar dataKey="bw" name="Bandwidth (GB/s)" isAnimationActive={false} radius={[2, 2, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.vendor === 'nvidia' ? '#3fb950' : '#f85149'} />
            ))}
            <LabelList
              dataKey="type"
              position="top"
              style={{ fill: '#8b949e', fontSize: 9, fontFamily: 'monospace' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

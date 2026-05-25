import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useAppStore, selectedSpecIds } from '../store/useAppStore';
import { GPU_MAP } from '../data/gpus';
import { WORKLOADS } from '../data/workloads';
import { buildPrecisionData } from '../lib/precisionData';

const PRECISION_LABEL = { fp64: 'FP64', fp32: 'FP32', fp16: 'FP16', int8: 'INT8' } as const;

export function PrecisionChart() {
  const { selectedCards, workload, marketingMode } = useAppStore();
  const specs = selectedSpecIds(selectedCards).map((id) => GPU_MAP[id]).filter(Boolean);
  const data = buildPrecisionData(specs, marketingMode);
  const activePrecision = PRECISION_LABEL[WORKLOADS[workload].dominantPrecision];

  return (
    <div className="h-full w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <XAxis dataKey="precision" tick={{ fill: '#8b949e', fontSize: 10, fontFamily: 'monospace' }} />
          <YAxis scale="log" domain={[0.5, 'auto']} allowDataOverflow tick={{ fill: '#8b949e', fontSize: 9, fontFamily: 'monospace' }} width={44} />
          <Tooltip contentStyle={{ background: '#11151c', border: '1px solid #2a323d', fontFamily: 'monospace', fontSize: 10 }} labelStyle={{ color: '#e6edf3' }} cursor={{ fill: '#ffffff08' }} />
          <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: 10 }} />
          {specs.map((spec) => (
            <Bar key={spec.id} dataKey={spec.id} name={spec.name} isAnimationActive>
              {data.map((row) => (
                <Cell
                  key={`${spec.id}-${row.precision}`}
                  fill={spec.vendor === 'nvidia' ? '#3fb950' : '#f85149'}
                  opacity={row.precision === activePrecision ? 1 : 0.32}
                />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

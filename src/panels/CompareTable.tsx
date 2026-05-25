import { useAppStore, selectedSpecIds } from '../store/useAppStore';
import { GPU_MAP, type GpuSpec } from '../data/gpus';
import { WORKLOADS } from '../data/workloads';
import { bottleneck } from '../lib/roofline';

interface Row {
  label: string;
  value: (s: GpuSpec, marketing: boolean) => string;
  color?: (s: GpuSpec) => string;
}

const ROWS: Row[] = [
  {
    label: 'FP64',
    value: (s) => `${s.throughput.fp64Vector} TFLOPS${s.throughput.fp64Matrix ? ` / ${s.throughput.fp64Matrix} mtx` : ''}`,
    color: (s) => (s.throughput.fp64Ratio < 0.1 ? '#f85149' : '#7ee787'),
  },
  { label: 'FP32', value: (s) => `${s.throughput.fp32} TFLOPS` },
  { label: 'FP16', value: (s, m) => `${m && s.throughput.fp16Sparse != null ? s.throughput.fp16Sparse : s.throughput.fp16Dense} TFLOPS` },
  { label: 'INT8', value: (s, m) => `${m && s.throughput.int8Sparse != null ? s.throughput.int8Sparse : s.throughput.int8Dense} TOPS` },
  { label: 'Memory', value: (s) => `${s.memory.capacityGB} GB ${s.memory.type}` },
  { label: 'BW', value: (s) => `${s.memory.bandwidthGBs} GB/s` },
  { label: 'TDP', value: (s) => `${s.tdpW} W` },
];

export function CompareTable() {
  const { selectedCards, marketingMode, customPrices, setCustomPrice, workload } = useAppStore();
  const specs = selectedSpecIds(selectedCards).map((id) => GPU_MAP[id]).filter(Boolean);
  if (specs.length === 0) return null;

  const effectivePrice = (s: GpuSpec) => customPrices[s.id] ?? s.priceUSD;

  return (
    <div className="p-3 overflow-auto">
      <table className="font-mono text-[10px] border-collapse w-full">
        <thead>
          <tr>
            <th className="text-left text-muted px-2 py-1 border border-edge uppercase tracking-wider text-[9px]">Metric</th>
            {specs.map((s) => (
              <th key={s.id} className={`text-right px-2 py-1 border border-edge ${s.vendor === 'nvidia' ? 'text-nvidia' : 'text-amd'}`}>
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label} className="hover:bg-[#161b22]">
              <td className="text-muted px-2 py-1 border border-edge">{row.label}</td>
              {specs.map((s) => (
                <td key={s.id} className="text-right px-2 py-1 border border-edge" style={{ color: row.color ? row.color(s) : '#c9d1d9' }}>
                  {row.value(s, marketingMode)}
                </td>
              ))}
            </tr>
          ))}

          {/* Editable price row */}
          <tr className="hover:bg-[#161b22]">
            <td className="text-muted px-2 py-1 border border-edge">Price ($)</td>
            {specs.map((s) => (
              <td key={s.id} className="text-right px-1 py-0.5 border border-edge">
                <input
                  type="number"
                  aria-label={`price-${s.id}`}
                  value={effectivePrice(s)}
                  onChange={(e) => setCustomPrice(s.id, Number(e.target.value))}
                  className="w-full bg-transparent text-right text-primary font-mono text-[10px] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min={0}
                />
              </td>
            ))}
          </tr>

          {/* FP16 TFLOPS per $1k */}
          <tr className="hover:bg-[#161b22]">
            <td className="text-muted px-2 py-1 border border-edge">FP16/$k</td>
            {specs.map((s) => (
              <td key={s.id} className="text-right px-2 py-1 border border-edge text-primary">
                {(s.throughput.fp16Dense / (effectivePrice(s) / 1000)).toFixed(0)} T
              </td>
            ))}
          </tr>

          {/* FP16 TFLOPS per watt */}
          <tr className="hover:bg-[#161b22]">
            <td className="text-muted px-2 py-1 border border-edge">TFLOPS/W</td>
            {specs.map((s) => (
              <td key={s.id} className="text-right px-2 py-1 border border-edge text-primary">
                {(s.throughput.fp16Dense / s.tdpW).toFixed(2)}
              </td>
            ))}
          </tr>

          {/* Bottleneck verdict for current workload */}
          <tr className="hover:bg-[#161b22]">
            <td className="text-muted px-2 py-1 border border-edge">Bottleneck</td>
            {specs.map((s) => {
              const wl = WORKLOADS[workload];
              const bn = bottleneck(
                wl.arithmeticIntensity,
                s.throughput.fp32 * 1000,
                s.memory.bandwidthGBs,
              );
              return (
                <td key={s.id} className="text-right px-2 py-1 border border-edge">
                  <span className={bn === 'memory' ? 'text-warn' : 'text-good'}>
                    {bn === 'memory' ? 'Mem BW ↑' : 'Compute ↑'}
                  </span>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

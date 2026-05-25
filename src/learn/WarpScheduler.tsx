import { useState, useEffect } from 'react';
import { throughputAtOccupancy } from '../lib/occupancy';

type WarpState = 'ready' | 'exec' | 'mem' | 'dep';
const STATE_COLOR: Record<WarpState, string> = {
  ready: '#7ee787', exec: '#3b6e9e', mem: '#d29922', dep: '#6e7681',
};
const TOTAL_SLOTS = 16;

export function WarpScheduler() {
  const [occupancy, setOccupancy] = useState(75);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 600);
    return () => clearInterval(t);
  }, []);

  const resident = Math.round((occupancy / 100) * TOTAL_SLOTS);
  const states: WarpState[] = Array.from({ length: TOTAL_SLOTS }, (_, i) => {
    if (i >= resident) return 'dep'; // empty slot (low occupancy)
    const phase = (i + tick) % 4;
    return (['exec', 'mem', 'ready', 'mem'] as WarpState[])[phase];
  });

  const anyExec = states.some((s) => s === 'exec');
  const throughput = throughputAtOccupancy(occupancy);

  return (
    <div className="flex flex-col gap-3">
      <span className="font-mono text-xs text-muted uppercase tracking-widest">Warp Scheduler · Latency Hiding</span>
      <div className="flex flex-col gap-1">
        {states.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="font-mono text-[9px] text-muted w-12">warp {i}</span>
            <div className="flex-1 h-3 rounded transition-colors duration-300" style={{ background: i >= resident ? '#1a1f26' : STATE_COLOR[s] }} />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] text-muted">occupancy</span>
        <input type="range" min={0} max={100} value={occupancy} onChange={(e) => setOccupancy(Number(e.target.value))} className="flex-1 accent-nvidia" />
        <span className="font-mono text-[10px] text-primary w-10">{occupancy}%</span>
      </div>
      <div className="flex items-center gap-2 font-mono text-[10px]">
        <span className="text-muted">effective throughput</span>
        <div className="flex-1 h-2 bg-edge rounded overflow-hidden">
          <div className="h-full bg-nvidia transition-all duration-300" style={{ width: `${throughput}%` }} />
        </div>
        <span className="text-primary w-10">{throughput}%</span>
      </div>
      <p className="font-mono text-[10px] text-muted leading-relaxed">
        Orange = stalled on memory. With enough resident warps, the scheduler always has a {anyExec ? 'ready' : 'stalled'} warp to run,
        hiding latency. Drop occupancy and stalls become exposed bubbles — GPUs hide latency with parallelism, not prediction.
      </p>
    </div>
  );
}

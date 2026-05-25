import { useAppStore, selectedSpecIds } from '../store/useAppStore';
import { WORKLOADS, computeUtilization } from '../data/workloads';
import { GPU_MAP } from '../data/gpus';

function utilColor(util: number): string {
  return util >= 70 ? '#7ee787' : util >= 30 ? '#d29922' : '#f85149';
}

export function WorkloadSelector() {
  const { workload, setWorkload, selectedCards } = useAppStore();
  const specs = selectedSpecIds(selectedCards).map((id) => GPU_MAP[id]).filter(Boolean);

  return (
    <div className="flex flex-col gap-3 p-3">
      <span className="font-mono text-[9px] uppercase tracking-widest text-muted">Workload</span>
      {Object.values(WORKLOADS).map((wl) => (
        <div key={wl.id} className="flex flex-col gap-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="workload"
              aria-label={wl.label}
              checked={workload === wl.id}
              onChange={() => setWorkload(wl.id)}
              className="accent-nvidia"
            />
            <span className={`font-mono text-xs ${workload === wl.id ? 'text-primary' : 'text-muted'}`}>{wl.label}</span>
          </label>
          <div className="pl-6 flex flex-col gap-0.5">
            {specs.map((spec) => {
              const util = computeUtilization(spec, wl.id);
              const color = utilColor(util);
              return (
                <div key={spec.id} className="flex items-center gap-2">
                  <div className="w-14 h-1 bg-edge rounded overflow-hidden">
                    <div className="h-full transition-all duration-300" style={{ width: `${util}%`, background: color }} />
                  </div>
                  <span className="font-mono text-[9px]" style={{ color }}>{spec.name} {util}%</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

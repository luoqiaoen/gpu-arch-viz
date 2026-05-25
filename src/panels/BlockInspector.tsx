import { useAppStore, selectedSpecIds } from '../store/useAppStore';
import { GPU_MAP, type BlockKind } from '../data/gpus';
import { describeBlock } from '../lib/blockInfo';

// activeBlockId format: `${specId}-d{n}-${kind}-${uid}` or `${specId}-xcd{n}-${kind}-${uid}`
function parseBlockId(id: string, specIds: string[]): { specId: string; kind: BlockKind } | null {
  const kinds: BlockKind[] = ['compute-cluster', 'tensor', 'l2', 'memCtrl', 'hbm', 'gddr', 'interconnect'];
  const kind = kinds.find((k) => id.includes(`-${k}-`));
  if (!kind) return null;
  const specId = specIds.find((sid) => id.startsWith(sid));
  return specId ? { specId, kind } : null;
}

export function BlockInspector() {
  const { activeBlockId, workload, setActiveBlock, selectedCards } = useAppStore();
  if (!activeBlockId) return null;
  const parsed = parseBlockId(activeBlockId, selectedSpecIds(selectedCards));
  if (!parsed) return null;
  const spec = GPU_MAP[parsed.specId];
  const info = describeBlock(spec, parsed.kind, workload);

  return (
    <div className="border-t border-edge p-3 font-mono text-xs">
      <div className="flex items-center justify-between mb-2">
        <span className={spec.vendor === 'nvidia' ? 'text-nvidia' : 'text-amd'}>
          {spec.name} · {parsed.kind}
        </span>
        <button onClick={() => setActiveBlock(null)} className="text-muted hover:text-primary">✕</button>
      </div>
      <p className="text-muted leading-relaxed mb-2">{info.role}</p>
      <div className="flex gap-4 mb-2">
        <span className="text-muted">die area: <span className="text-primary">{info.dieAreaPct}%</span></span>
        <span className="text-muted">status: <span className={info.active ? 'text-good' : 'text-warn'}>{info.active ? 'active' : 'idle'}</span></span>
      </div>
      <p className={info.active ? 'text-good' : 'text-warn'}>{info.note}</p>
    </div>
  );
}

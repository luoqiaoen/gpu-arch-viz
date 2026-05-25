import { useAppStore, selectedSpecIds } from '../store/useAppStore';
import { GPU_MAP } from '../data/gpus';
import { DieDiagram2D } from './DieDiagram2D';

export function DieScene2D() {
  const { selectedCards, workload, activeBlockId, setActiveBlock } = useAppStore();
  const specs = selectedSpecIds(selectedCards).map((id) => GPU_MAP[id]).filter(Boolean);

  if (specs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted font-mono text-xs">
        Select a GPU above to visualize.
      </div>
    );
  }

  return (
    <div className="flex h-full gap-px overflow-auto items-start bg-edge">
      {specs.map((spec) => (
        <div key={spec.id} className="flex-1 min-w-0 bg-bg">
          <DieDiagram2D
            spec={spec}
            workload={workload}
            activeBlockId={activeBlockId}
            onSelect={setActiveBlock}
          />
        </div>
      ))}
    </div>
  );
}

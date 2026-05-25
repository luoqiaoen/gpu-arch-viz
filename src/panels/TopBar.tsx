import { useAppStore, type View } from '../store/useAppStore';
import { GPU_SPECS } from '../data/gpus';

const SLOTS = [0, 1, 2] as const;
const VIEWS: View[] = ['explorer', 'learn'];

export function TopBar() {
  const { view, setView, selectedCards, setCard, marketingMode, setMarketingMode } = useAppStore();

  return (
    <header className="flex items-center gap-3 px-4 py-2 bg-surface border-b border-edge shrink-0">
      <span className="font-mono text-xs text-muted tracking-widest uppercase">GPU·ARCH·VIZ</span>

      <div className="flex items-center gap-2 ml-4">
        {SLOTS.map((slot) => (
          <select
            key={slot}
            aria-label={`Card ${slot + 1}`}
            value={selectedCards[slot] ?? ''}
            onChange={(e) => setCard(slot, e.target.value || null)}
            className="font-mono text-xs bg-bg border border-edge text-primary px-2 py-1 rounded"
          >
            {slot > 0 && <option value="">— none —</option>}
            {GPU_SPECS.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        ))}
      </div>

      <label className="font-mono text-xs text-muted flex items-center gap-2 ml-2 cursor-pointer">
        <input type="checkbox" checked={marketingMode} onChange={(e) => setMarketingMode(e.target.checked)} className="accent-nvidia" />
        AI TFLOPs
      </label>

      <div className="ml-auto flex gap-1">
        {VIEWS.map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`font-mono text-xs px-3 py-1 rounded border capitalize transition-colors ${
              view === v ? 'bg-nvidia text-bg border-nvidia' : 'bg-transparent text-muted border-edge hover:border-nvidia'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </header>
  );
}

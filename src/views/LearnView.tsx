import { useAppStore, selectedSpecIds } from '../store/useAppStore';
import { GPU_SPECS } from '../data/gpus';
import { RooflineChart } from '../learn/RooflineChart';
import { PrecisionFormats } from '../learn/PrecisionFormats';
import { MemoryHierarchy } from '../learn/MemoryHierarchy';
import { WarpScheduler } from '../learn/WarpScheduler';
import { AccessPatterns } from '../learn/AccessPatterns';

export function LearnView() {
  const { learnCard, setLearnCard, selectedCards } = useAppStore();
  const rooflineCards = selectedSpecIds(selectedCards);
  const cards = rooflineCards.length > 0 ? rooflineCards : ['h100-sxm'];

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-6 flex flex-col gap-10">
        <header className="flex flex-col gap-2">
          <h1 className="font-mono text-lg text-primary">How to think about GPU performance</h1>
          <p className="font-mono text-xs text-muted leading-relaxed">
            Four mental models that explain why a spec sheet doesn't tell you how fast your code will run:
            compute vs bandwidth bound, cache levels, latency hiding via occupancy, and access coalescing.
          </p>
          <label className="font-mono text-xs text-muted flex items-center gap-2 mt-2">
            Focus card
            <select
              aria-label="learn card"
              value={learnCard}
              onChange={(e) => setLearnCard(e.target.value)}
              className="bg-bg border border-edge text-primary px-2 py-1 rounded"
            >
              {GPU_SPECS.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </label>
        </header>

        <section><RooflineChart cardIds={cards} /></section>
        <section><PrecisionFormats /></section>
        <section><MemoryHierarchy cardId={learnCard} /></section>
        <section><WarpScheduler /></section>
        <section><AccessPatterns /></section>
      </div>
    </div>
  );
}

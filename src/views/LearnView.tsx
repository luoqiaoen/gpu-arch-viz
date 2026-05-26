import { useState, useEffect } from 'react';
import { useAppStore, selectedSpecIds } from '../store/useAppStore';
import { GPU_SPECS } from '../data/gpus';
import { RooflineChart, type RooflinePrec } from '../learn/RooflineChart';
import { PrecisionFormats } from '../learn/PrecisionFormats';
import { MemoryHierarchy } from '../learn/MemoryHierarchy';
import { WarpScheduler } from '../learn/WarpScheduler';
import { AccessPatterns } from '../learn/AccessPatterns';
import { TilingDepth } from '../learn/TilingDepth';
import { ConvolutionCalc, type AiPoint } from '../learn/ConvolutionCalc';
import type { ConvPrecision } from '../lib/convolutionAI';

export function LearnView() {
  const { learnCard, setLearnCard, selectedCards } = useAppStore();
  const rooflineCards = selectedSpecIds(selectedCards);
  const cards = rooflineCards.length > 0 ? rooflineCards : ['h100-sxm'];

  // Convolution calculator state lifted here so RooflineChart can receive the points
  const [aiPoints, setAiPoints] = useState<AiPoint[]>([]);
  const [imgIdx, setImgIdx] = useState(0);
  const [prec, setPrec] = useState<ConvPrecision>('fp32');
  const [reuse, setReuse] = useState<'tiled' | 'naive'>('tiled');

  // Roofline ceiling precision — synced with conv calc precision to close the loop
  const [rooflinePrec, setRooflinePrec] = useState<RooflinePrec>('fp32');
  useEffect(() => { setRooflinePrec(prec); }, [prec]);

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-6 flex flex-col gap-10">
        <header className="flex flex-col gap-2">
          <h1 className="font-mono text-lg text-primary">How to think about GPU performance</h1>
          <p className="font-mono text-xs text-muted leading-relaxed">
            Four mental models that explain why a spec sheet doesn't tell you how fast your code will run:
            compute vs bandwidth bound, cache levels, latency hiding via occupancy, and access coalescing.
          </p>
        </header>

        <section><RooflineChart cardIds={cards} aiPoints={aiPoints} precision={rooflinePrec} onPrecisionChange={setRooflinePrec} /></section>
        <section>
          <ConvolutionCalc
            cardIds={cards}
            imgIdx={imgIdx} prec={prec} reuse={reuse}
            setImgIdx={setImgIdx} setPrec={setPrec} setReuse={setReuse}
            onPointsChange={setAiPoints}
          />
        </section>
        <section><TilingDepth prec={prec} /></section>
        <section><PrecisionFormats /></section>
        <section>
          <label className="font-mono text-xs text-muted flex items-center gap-2 mb-3">
            GPU
            <select
              aria-label="learn card"
              value={learnCard}
              onChange={(e) => setLearnCard(e.target.value)}
              className="bg-bg border border-edge text-primary px-2 py-1 rounded"
            >
              {GPU_SPECS.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </label>
          <MemoryHierarchy cardId={learnCard} />
        </section>
        <section><WarpScheduler /></section>
        <section><AccessPatterns /></section>
      </div>
    </div>
  );
}

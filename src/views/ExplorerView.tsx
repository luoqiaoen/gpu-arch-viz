import { useState } from 'react';
import { DieScene2D } from '../scene/DieScene2D';
import { WorkloadSelector } from '../panels/WorkloadSelector';
import { CompareTable } from '../panels/CompareTable';
import { BlockInspector } from '../panels/BlockInspector';
import { PrecisionChart } from '../panels/PrecisionChart';
import { BandwidthChart } from '../panels/BandwidthChart';

type DrawerTab = 'precision' | 'bandwidth';

export function ExplorerView() {
  const [tab, setTab] = useState<DrawerTab>('precision');

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex flex-1 min-h-0">
        <aside className="w-52 shrink-0 border-r border-edge overflow-auto">
          <WorkloadSelector />
        </aside>
        <main className="flex-1 min-w-0">
          <DieScene2D />
        </main>
        <aside className="w-72 shrink-0 border-l border-edge overflow-auto flex flex-col">
          <CompareTable />
          <BlockInspector />
        </aside>
      </div>
      <div className="h-56 shrink-0 border-t border-edge flex flex-col">
        <div className="flex border-b border-edge">
          {(['precision', 'bandwidth'] as DrawerTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`font-mono text-xs px-4 py-1.5 border-r border-edge ${
                tab === t ? 'text-primary bg-surface' : 'text-muted hover:text-primary'
              }`}
            >
              {t === 'precision' ? 'Precision' : 'Bandwidth'}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0">
          {tab === 'precision' ? <PrecisionChart /> : <BandwidthChart />}
        </div>
      </div>
    </div>
  );
}

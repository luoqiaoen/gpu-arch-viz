import { useState } from 'react';
import { transactionsFor, bandwidthEfficiency, type AccessPattern } from '../lib/coalescing';

const THREADS = 32;
const PATTERNS: AccessPattern[] = ['coalesced', 'strided', 'random'];

function laneTargets(pattern: AccessPattern): number[] {
  switch (pattern) {
    case 'coalesced': return Array.from({ length: THREADS }, (_, i) => i);
    case 'strided': return Array.from({ length: THREADS }, (_, i) => i * 8 % THREADS);
    case 'random': return Array.from({ length: THREADS }, () => Math.floor(Math.random() * THREADS));
  }
}

export function AccessPatterns() {
  const [pattern, setPattern] = useState<AccessPattern>('coalesced');
  const targets = laneTargets(pattern);
  const tx = transactionsFor(pattern, THREADS);
  const eff = bandwidthEfficiency(pattern, THREADS);

  return (
    <div className="flex flex-col gap-3">
      <span className="font-mono text-xs text-muted uppercase tracking-widest">Memory Access Patterns</span>
      <div className="flex gap-1">
        {PATTERNS.map((p) => (
          <button
            key={p}
            onClick={() => setPattern(p)}
            className={`font-mono text-[10px] px-2 py-0.5 rounded border capitalize ${
              pattern === p ? 'bg-nvidia text-bg border-nvidia' : 'text-muted border-edge hover:border-nvidia'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      <div>
        <span className="font-mono text-[9px] text-muted">32-thread warp → cache lines</span>
        <div className="grid grid-cols-16 gap-0.5 mt-1" style={{ gridTemplateColumns: 'repeat(16, 1fr)' }}>
          {targets.map((t, i) => (
            <div key={i} className="h-4 rounded-sm" style={{ background: `hsl(${(t * 360) / THREADS}, 60%, 55%)` }} title={`thread ${i} → line ${t}`} />
          ))}
        </div>
      </div>
      <div className="flex gap-6 font-mono text-[11px]">
        <span className="text-muted">transactions: <span className="text-primary">{tx}</span></span>
        <span className="text-muted">bandwidth efficiency: <span style={{ color: eff >= 70 ? '#7ee787' : '#f85149' }}>{eff}%</span></span>
      </div>
      <p className="font-mono text-[10px] text-muted leading-relaxed">
        A coalesced warp pulls one cache line and uses all of it. Strided/random access fetches a separate line per thread —
        you pay full bandwidth but use a fraction, so effective arithmetic intensity drops and throughput falls below the bandwidth ceiling.
      </p>
    </div>
  );
}

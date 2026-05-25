export type AccessPattern = 'coalesced' | 'strided' | 'random';

// One 128-byte cache line holds 32 contiguous 4-byte words → a full coalesced warp fits in 1 line.
export function transactionsFor(pattern: AccessPattern, threads: number): number {
  switch (pattern) {
    case 'coalesced': return 1;
    case 'strided': return threads;          // each thread lands in its own line
    case 'random': return threads;           // worst case, all distinct lines
  }
}

export function bandwidthEfficiency(pattern: AccessPattern, threads: number): number {
  const ideal = 1;
  const actual = transactionsFor(pattern, threads);
  // efficiency = useful bytes / fetched bytes; random fetches are also partially wasted
  const base = (ideal / actual) * 100;
  return pattern === 'random' ? Math.round(base * 0.6) : Math.round(base);
}

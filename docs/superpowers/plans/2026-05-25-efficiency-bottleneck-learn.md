# Efficiency, Bottleneck, Precision Formats & Memory Pyramid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four connected features — editable-price efficiency metrics, per-workload bottleneck verdicts, a floating-point format bit-layout visualizer, and a bandwidth-cliff bar chart in the memory hierarchy.

**Architecture:** Efficiency and bottleneck rows are added to the existing CompareTable; a new `bottleneck()` pure function extends `roofline.ts`. PrecisionFormats is a new Learn section backed by a pure data file. MemoryHierarchy gains numeric bandwidth fields and a Recharts horizontal bar chart.

**Tech Stack:** React 18, TypeScript, Zustand 5, Recharts, Tailwind CSS v3, Vitest + @testing-library/react.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/store/useAppStore.ts` | Add `customPrices` + `setCustomPrice` |
| Modify | `src/panels/CompareTable.tsx` | Price editor, efficiency rows (FP16/$k, TFLOPS/W), bottleneck row |
| Modify | `src/lib/roofline.ts` | Add `bottleneck()` pure function |
| Modify | `src/learn/RooflineChart.tsx` | Highlight active Explorer workload |
| Create | `src/data/precisionFormats.ts` | Bit-field data for 7 number formats |
| Create | `src/learn/PrecisionFormats.tsx` | Stacked bit-bar visualizer + table |
| Modify | `src/views/LearnView.tsx` | Add PrecisionFormats section |
| Modify | `src/data/memoryHierarchy.ts` | Add `bwNumGBps` + `latencyNs` fields |
| Modify | `src/learn/MemoryHierarchy.tsx` | Add bandwidth bar chart |
| Modify | `src/test/useAppStore.test.ts` | Tests for setCustomPrice |
| Modify | `src/test/CompareTable.test.tsx` | Tests for price editor + efficiency + bottleneck rows |
| Modify | `src/test/roofline.test.ts` | Tests for bottleneck() |
| Create | `src/test/precisionFormats.test.ts` | Tests for precision format data |
| Modify | `src/test/LearnView.test.tsx` | Test for PrecisionFormats section |
| Modify | `src/test/memoryHierarchy.test.ts` | Tests for new numeric fields |

---

## Task 1: Custom price store

**Files:**
- Modify: `src/store/useAppStore.ts`
- Modify: `src/test/useAppStore.test.ts`

- [ ] **Step 1: Write failing test**

Open `src/test/useAppStore.test.ts`. Add after the existing tests:

```typescript
it('setCustomPrice stores an override for a specific GPU', () => {
  useAppStore.setState({ customPrices: {} });
  useAppStore.getState().setCustomPrice('h100-sxm', 25000);
  expect(useAppStore.getState().customPrices['h100-sxm']).toBe(25000);
});

it('setCustomPrice does not affect other GPU prices', () => {
  useAppStore.setState({ customPrices: {} });
  useAppStore.getState().setCustomPrice('h100-sxm', 25000);
  expect(useAppStore.getState().customPrices['mi300x']).toBeUndefined();
});
```

Also add `customPrices: {}` to the existing `beforeEach` setState call so tests are isolated:

```typescript
beforeEach(() => {
  useAppStore.setState({
    view: 'explorer',
    selectedCards: [...INITIAL_CARDS],
    workload: 'fp64-sim',
    marketingMode: false,
    activeBlockId: null,
    learnCard: 'h100-sxm',
    customPrices: {},
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/test/useAppStore.test.ts --reporter=verbose
```

Expected: FAIL — `customPrices` does not exist on store.

- [ ] **Step 3: Add customPrices to store**

Replace the full content of `src/store/useAppStore.ts`:

```typescript
import { create } from 'zustand';
import type { WorkloadId } from '../data/workloads';

export type View = 'explorer' | 'learn';
export type CardSlots = [string | null, string | null, string | null];

export const INITIAL_CARDS: CardSlots = ['h100-sxm', 'mi300x', 'rtx-pro-6000'];

interface AppState {
  view: View;
  selectedCards: CardSlots;
  workload: WorkloadId;
  marketingMode: boolean;
  activeBlockId: string | null;
  learnCard: string;
  customPrices: Record<string, number>;
  setView: (view: View) => void;
  setCard: (slot: 0 | 1 | 2, cardId: string | null) => void;
  setWorkload: (workload: WorkloadId) => void;
  setMarketingMode: (on: boolean) => void;
  setActiveBlock: (id: string | null) => void;
  setLearnCard: (id: string) => void;
  setCustomPrice: (specId: string, price: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: 'explorer',
  selectedCards: [...INITIAL_CARDS],
  workload: 'fp64-sim',
  marketingMode: false,
  activeBlockId: null,
  learnCard: 'h100-sxm',
  customPrices: {},
  setView: (view) => set({ view }),
  setCard: (slot, cardId) =>
    set((state) => {
      const next = [...state.selectedCards] as CardSlots;
      next[slot] = cardId;
      return { selectedCards: next };
    }),
  setWorkload: (workload) => set({ workload }),
  setMarketingMode: (marketingMode) => set({ marketingMode }),
  setActiveBlock: (activeBlockId) => set({ activeBlockId }),
  setLearnCard: (learnCard) => set({ learnCard }),
  setCustomPrice: (specId, price) =>
    set((state) => ({ customPrices: { ...state.customPrices, [specId]: price } })),
}));

export function selectedSpecIds(cards: CardSlots): string[] {
  return cards.filter((c): c is string => c !== null);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/test/useAppStore.test.ts --reporter=verbose
```

Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
git add src/store/useAppStore.ts src/test/useAppStore.test.ts
git commit -m "feat: add customPrices to store for per-GPU price overrides"
```

---

## Task 2: Efficiency rows + price editor in CompareTable

**Files:**
- Modify: `src/panels/CompareTable.tsx`
- Modify: `src/test/CompareTable.test.tsx`

- [ ] **Step 1: Write failing tests**

Add to `src/test/CompareTable.test.tsx` after the existing tests:

```typescript
it('renders FP16/$k and TFLOPS/W efficiency rows', () => {
  render(<CompareTable />);
  expect(screen.getByText('FP16/$k')).toBeInTheDocument();
  expect(screen.getByText('TFLOPS/W')).toBeInTheDocument();
});

it('renders editable price inputs for each GPU', () => {
  render(<CompareTable />);
  const input = screen.getByRole('spinbutton', { name: /price-l20/i });
  expect(input).toBeInTheDocument();
  expect((input as HTMLInputElement).value).toBe('3500');
});

it('setCustomPrice updates efficiency values', () => {
  render(<CompareTable />);
  const input = screen.getByRole('spinbutton', { name: /price-l20/i });
  fireEvent.change(input, { target: { value: '7000' } });
  expect(useAppStore.getState().customPrices['l20']).toBe(7000);
});
```

Add `fireEvent` to the import at the top if not already imported:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
```

Also add `customPrices: {}` to the existing `beforeEach` in the CompareTable test:
```typescript
beforeEach(() => {
  useAppStore.setState({ selectedCards: ['l20', 'mi210', null], marketingMode: false, customPrices: {} });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/test/CompareTable.test.tsx --reporter=verbose
```

Expected: FAIL — FP16/$k row and price inputs don't exist yet.

- [ ] **Step 3: Rewrite CompareTable**

Replace the full content of `src/panels/CompareTable.tsx`:

```typescript
import { useAppStore, selectedSpecIds } from '../store/useAppStore';
import { GPU_MAP, type GpuSpec } from '../data/gpus';

interface Row {
  label: string;
  value: (s: GpuSpec, marketing: boolean) => string;
  color?: (s: GpuSpec) => string;
}

const ROWS: Row[] = [
  {
    label: 'FP64',
    value: (s) => `${s.throughput.fp64Vector} TFLOPS${s.throughput.fp64Matrix ? ` / ${s.throughput.fp64Matrix} mtx` : ''}`,
    color: (s) => (s.throughput.fp64Ratio < 0.1 ? '#f85149' : '#7ee787'),
  },
  { label: 'FP32', value: (s) => `${s.throughput.fp32} TFLOPS` },
  { label: 'FP16', value: (s, m) => `${m && s.throughput.fp16Sparse != null ? s.throughput.fp16Sparse : s.throughput.fp16Dense} TFLOPS` },
  { label: 'INT8', value: (s, m) => `${m && s.throughput.int8Sparse != null ? s.throughput.int8Sparse : s.throughput.int8Dense} TOPS` },
  { label: 'Memory', value: (s) => `${s.memory.capacityGB} GB ${s.memory.type}` },
  { label: 'BW', value: (s) => `${s.memory.bandwidthGBs} GB/s` },
  { label: 'TDP', value: (s) => `${s.tdpW} W` },
];

export function CompareTable() {
  const { selectedCards, marketingMode, customPrices, setCustomPrice } = useAppStore();
  const specs = selectedSpecIds(selectedCards).map((id) => GPU_MAP[id]).filter(Boolean);
  if (specs.length === 0) return null;

  const effectivePrice = (s: GpuSpec) => customPrices[s.id] ?? s.priceUSD;

  return (
    <div className="p-3 overflow-auto">
      <table className="font-mono text-[10px] border-collapse w-full">
        <thead>
          <tr>
            <th className="text-left text-muted px-2 py-1 border border-edge uppercase tracking-wider text-[9px]">Metric</th>
            {specs.map((s) => (
              <th key={s.id} className={`text-right px-2 py-1 border border-edge ${s.vendor === 'nvidia' ? 'text-nvidia' : 'text-amd'}`}>
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Static metric rows */}
          {ROWS.map((row) => (
            <tr key={row.label} className="hover:bg-[#161b22]">
              <td className="text-muted px-2 py-1 border border-edge">{row.label}</td>
              {specs.map((s) => (
                <td key={s.id} className="text-right px-2 py-1 border border-edge" style={{ color: row.color ? row.color(s) : '#c9d1d9' }}>
                  {row.value(s, marketingMode)}
                </td>
              ))}
            </tr>
          ))}

          {/* Editable price row — input allows per-GPU price override */}
          <tr className="hover:bg-[#161b22]">
            <td className="text-muted px-2 py-1 border border-edge">Price ($)</td>
            {specs.map((s) => (
              <td key={s.id} className="text-right px-1 py-0.5 border border-edge">
                <input
                  type="number"
                  aria-label={`price-${s.id}`}
                  value={effectivePrice(s)}
                  onChange={(e) => setCustomPrice(s.id, Number(e.target.value))}
                  className="w-full bg-transparent text-right text-primary font-mono text-[10px] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min={0}
                />
              </td>
            ))}
          </tr>

          {/* Efficiency: FP16 TFLOPS per $1k */}
          <tr className="hover:bg-[#161b22]">
            <td className="text-muted px-2 py-1 border border-edge">FP16/$k</td>
            {specs.map((s) => (
              <td key={s.id} className="text-right px-2 py-1 border border-edge text-primary">
                {(s.throughput.fp16Dense / (effectivePrice(s) / 1000)).toFixed(0)} T
              </td>
            ))}
          </tr>

          {/* Efficiency: FP16 TFLOPS per watt */}
          <tr className="hover:bg-[#161b22]">
            <td className="text-muted px-2 py-1 border border-edge">TFLOPS/W</td>
            {specs.map((s) => (
              <td key={s.id} className="text-right px-2 py-1 border border-edge text-primary">
                {(s.throughput.fp16Dense / s.tdpW).toFixed(2)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/test/CompareTable.test.tsx --reporter=verbose
```

Expected: PASS — all tests green. Note: the existing test `shows all metric rows` still passes because the Price label changed to `Price ($)` — wait, this WILL fail because the test checks for `'Price'` and the row now says `'Price ($)'`. Update that test:

```typescript
it('shows all metric rows', () => {
  render(<CompareTable />);
  for (const row of ['FP64', 'FP32', 'FP16', 'INT8', 'Memory', 'BW', 'TDP', 'Price ($)', 'FP16/$k', 'TFLOPS/W']) {
    expect(screen.getByText(row)).toBeInTheDocument();
  }
});
```

Re-run to confirm all pass.

- [ ] **Step 5: Commit**

```bash
git add src/panels/CompareTable.tsx src/test/CompareTable.test.tsx
git commit -m "feat: editable price inputs and FP16/price, TFLOPS/W efficiency rows in CompareTable"
```

---

## Task 3: bottleneck() function in roofline.ts

**Files:**
- Modify: `src/lib/roofline.ts`
- Modify: `src/test/roofline.test.ts`

- [ ] **Step 1: Write failing tests**

Add to `src/test/roofline.test.ts`:

```typescript
import { ridgePoint, achievableThroughput, bottleneck, WORKLOAD_POINTS } from '../lib/roofline';

// ...existing tests unchanged...

describe('bottleneck', () => {
  it('returns memory when arithmetic intensity is below the ridge point', () => {
    // H100 FP32: ridgePoint(67000, 3350) ≈ 20  — AI=2 is below
    expect(bottleneck(2, 67000, 3350)).toBe('memory');
  });

  it('returns compute when arithmetic intensity is at or above the ridge point', () => {
    // AI=300 is well above ridge point ~20
    expect(bottleneck(300, 67000, 3350)).toBe('compute');
  });

  it('returns compute exactly at the ridge point', () => {
    const ridge = ridgePoint(67000, 3350);
    expect(bottleneck(ridge, 67000, 3350)).toBe('compute');
  });

  it('RTX PRO 6000 FP32 ridge is much higher than H100 due to lower bandwidth', () => {
    // RTX: ridgePoint(125000, 1344) ≈ 93 — AI=50 would be memory-bound
    expect(bottleneck(50, 125000, 1344)).toBe('memory');
    // but AI=300 is compute-bound
    expect(bottleneck(300, 125000, 1344)).toBe('compute');
  });
});
```

Update the import line in the test file to include `bottleneck`:
```typescript
import { ridgePoint, achievableThroughput, bottleneck, WORKLOAD_POINTS } from '../lib/roofline';
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/test/roofline.test.ts --reporter=verbose
```

Expected: FAIL — `bottleneck` is not exported.

- [ ] **Step 3: Add bottleneck() to roofline.ts**

Replace the full content of `src/lib/roofline.ts`:

```typescript
// All throughput values in GFLOPS; bandwidth in GB/s; intensity in FLOP/byte.
export function ridgePoint(computeCeilingGFLOPS: number, bandwidthGBs: number): number {
  return computeCeilingGFLOPS / bandwidthGBs;
}

export function achievableThroughput(intensity: number, computeCeilingGFLOPS: number, bandwidthGBs: number): number {
  return Math.min(intensity * bandwidthGBs, computeCeilingGFLOPS);
}

export function bottleneck(
  arithmeticIntensity: number,
  computeCeilingGFLOPS: number,
  bandwidthGBs: number,
): 'compute' | 'memory' {
  return arithmeticIntensity >= ridgePoint(computeCeilingGFLOPS, bandwidthGBs) ? 'compute' : 'memory';
}

export interface WorkloadPoint {
  label: string;
  intensity: number; // FLOP/byte
}

export const WORKLOAD_POINTS: WorkloadPoint[] = [
  { label: '2D Stencil', intensity: 0.5 },
  { label: 'SpMV', intensity: 0.25 },
  { label: 'FFT', intensity: 5 },
  { label: 'Molecular Dynamics', intensity: 20 },
  { label: 'Dense GEMM', intensity: 200 },
];
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/test/roofline.test.ts --reporter=verbose
```

Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/roofline.ts src/test/roofline.test.ts
git commit -m "feat: add bottleneck() to roofline — returns compute or memory given arithmetic intensity"
```

---

## Task 4: Bottleneck row in CompareTable + workload highlight in RooflineChart

**Files:**
- Modify: `src/panels/CompareTable.tsx`
- Modify: `src/learn/RooflineChart.tsx`
- Modify: `src/test/CompareTable.test.tsx`

- [ ] **Step 1: Write failing test**

Add to `src/test/CompareTable.test.tsx`:

```typescript
it('renders a Bottleneck row showing memory or compute verdict', () => {
  // workload fp64-sim has arithmeticIntensity=2 — all cards are memory-bound at AI=2
  useAppStore.setState({ selectedCards: ['l20', 'mi210', null], workload: 'fp64-sim', customPrices: {} });
  render(<CompareTable />);
  expect(screen.getByText('Bottleneck')).toBeInTheDocument();
  // Both cards at AI=2 are memory-bound
  const cells = screen.getAllByText(/Mem BW/);
  expect(cells.length).toBeGreaterThanOrEqual(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/test/CompareTable.test.tsx --reporter=verbose
```

Expected: FAIL — Bottleneck row doesn't exist yet.

- [ ] **Step 3: Add Bottleneck row to CompareTable**

Add these imports at the top of `src/panels/CompareTable.tsx`:

```typescript
import { WORKLOADS } from '../data/workloads';
import { bottleneck } from '../lib/roofline';
```

Update the store destructure to include `workload`:

```typescript
const { selectedCards, marketingMode, customPrices, setCustomPrice, workload } = useAppStore();
```

Add the Bottleneck row inside `<tbody>` after the TFLOPS/W row:

```typescript
          {/* Bottleneck verdict for the current workload */}
          <tr className="hover:bg-[#161b22]">
            <td className="text-muted px-2 py-1 border border-edge">Bottleneck</td>
            {specs.map((s) => {
              const wl = WORKLOADS[workload];
              const bn = bottleneck(
                wl.arithmeticIntensity,
                s.throughput.fp32 * 1000,
                s.memory.bandwidthGBs,
              );
              return (
                <td key={s.id} className="text-right px-2 py-1 border border-edge">
                  <span className={bn === 'memory' ? 'text-warn' : 'text-good'}>
                    {bn === 'memory' ? 'Mem BW ↑' : 'Compute ↑'}
                  </span>
                </td>
              );
            })}
          </tr>
```

Also update `shows all metric rows` test to include `'Bottleneck'`:

```typescript
for (const row of ['FP64', 'FP32', 'FP16', 'INT8', 'Memory', 'BW', 'TDP', 'Price ($)', 'FP16/$k', 'TFLOPS/W', 'Bottleneck']) {
  expect(screen.getByText(row)).toBeInTheDocument();
}
```

- [ ] **Step 4: Add workload highlight to RooflineChart**

In `src/learn/RooflineChart.tsx`, add these imports at the top:

```typescript
import { useAppStore } from '../store/useAppStore';
import { WORKLOADS } from '../data/workloads';
```

Inside the `RooflineChart` function, add after the `specs` declaration:

```typescript
  const { workload } = useAppStore();
  const activeWl = WORKLOADS[workload];
```

Inside the `<LineChart>`, add a highlighted ReferenceLine for the active Explorer workload — add it after the existing `WORKLOAD_POINTS` map:

```typescript
            {/* Highlight the workload currently selected in the Explorer */}
            <ReferenceLine
              x={activeWl.arithmeticIntensity}
              stroke="#e3b341"
              strokeWidth={2}
              strokeDasharray="4 2"
              label={{
                value: `▶ ${activeWl.label}`,
                fill: '#e3b341',
                fontSize: 8,
                fontFamily: 'monospace',
                position: 'top',
                offset: 4,
              }}
            />
```

- [ ] **Step 5: Run all tests**

```bash
npx vitest run --reporter=verbose 2>&1 | tail -15
```

Expected: PASS — all tests green.

- [ ] **Step 6: Commit**

```bash
git add src/panels/CompareTable.tsx src/learn/RooflineChart.tsx src/test/CompareTable.test.tsx
git commit -m "feat: bottleneck verdict row in CompareTable; active workload highlight in RooflineChart"
```

---

## Task 5: Precision format data

**Files:**
- Create: `src/data/precisionFormats.ts`
- Create: `src/test/precisionFormats.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/test/precisionFormats.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { PRECISION_FORMATS, type PrecisionFormat } from '../data/precisionFormats';

describe('precisionFormats', () => {
  it('exports 7 formats', () => {
    expect(PRECISION_FORMATS).toHaveLength(7);
  });

  it('every format satisfies sign(1) + exponent + mantissa = totalBits', () => {
    for (const f of PRECISION_FORMATS) {
      expect(1 + f.exponentBits + f.mantissaBits).toBe(f.totalBits);
    }
  });

  it('FP64 has 52 mantissa bits and 11 exponent bits', () => {
    const fp64 = PRECISION_FORMATS.find((f) => f.name === 'FP64')!;
    expect(fp64.exponentBits).toBe(11);
    expect(fp64.mantissaBits).toBe(52);
  });

  it('BF16 and FP32 share the same exponent width (8)', () => {
    const bf16 = PRECISION_FORMATS.find((f) => f.name === 'BF16')!;
    const fp32 = PRECISION_FORMATS.find((f) => f.name === 'FP32')!;
    expect(bf16.exponentBits).toBe(fp32.exponentBits);
  });

  it('INT8 has 0 exponent bits', () => {
    const int8 = PRECISION_FORMATS.find((f) => f.name === 'INT8')!;
    expect(int8.exponentBits).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/test/precisionFormats.test.ts --reporter=verbose
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create precisionFormats.ts**

Create `src/data/precisionFormats.ts`:

```typescript
export interface PrecisionFormat {
  name: string;
  totalBits: number;
  exponentBits: number;
  mantissaBits: number; // sign bit is the remaining 1 bit (sign + exp + mantissa = total)
  approxDecimalDigits: number;
  useCase: string;
}

export const PRECISION_FORMATS: PrecisionFormat[] = [
  {
    name: 'FP64',
    totalBits: 64,
    exponentBits: 11,
    mantissaBits: 52,
    approxDecimalDigits: 15,
    useCase: 'Scientific HPC, molecular dynamics, CFD',
  },
  {
    name: 'FP32',
    totalBits: 32,
    exponentBits: 8,
    mantissaBits: 23,
    approxDecimalDigits: 7,
    useCase: 'General GPU compute, graphics shaders',
  },
  {
    name: 'TF32',
    totalBits: 19,
    exponentBits: 8,
    mantissaBits: 10,
    approxDecimalDigits: 3,
    useCase: 'NVIDIA Ampere/Hopper/Blackwell matmul (not a memory format)',
  },
  {
    name: 'BF16',
    totalBits: 16,
    exponentBits: 8,
    mantissaBits: 7,
    approxDecimalDigits: 2,
    useCase: 'AI training — FP32 dynamic range with fewer mantissa bits',
  },
  {
    name: 'FP16',
    totalBits: 16,
    exponentBits: 5,
    mantissaBits: 10,
    approxDecimalDigits: 3,
    useCase: 'AI training & inference; narrower range than BF16',
  },
  {
    name: 'FP8 E4M3',
    totalBits: 8,
    exponentBits: 4,
    mantissaBits: 3,
    approxDecimalDigits: 1,
    useCase: 'Inference forward pass — H100+, MI300X (requires per-tensor scale)',
  },
  {
    name: 'INT8',
    totalBits: 8,
    exponentBits: 0,
    mantissaBits: 7,
    approxDecimalDigits: 2,
    useCase: 'Quantized inference; integer, not floating point',
  },
];
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/test/precisionFormats.test.ts --reporter=verbose
```

Expected: PASS — all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/data/precisionFormats.ts src/test/precisionFormats.test.ts
git commit -m "feat: precision format data (FP64→INT8) with bit-field breakdown"
```

---

## Task 6: PrecisionFormats visualizer + LearnView integration

**Files:**
- Create: `src/learn/PrecisionFormats.tsx`
- Modify: `src/views/LearnView.tsx`
- Modify: `src/test/LearnView.test.tsx`

- [ ] **Step 1: Write failing test**

In `src/test/LearnView.test.tsx`, update the existing `renders all four learn sections` test to include the new section, and rename accordingly:

```typescript
it('renders all five learn sections', () => {
  render(<LearnView />);
  expect(screen.getByText(/Roofline/i)).toBeInTheDocument();
  expect(screen.getByText(/Floating-Point Formats/i)).toBeInTheDocument();
  expect(screen.getByText(/Memory Hierarchy/i)).toBeInTheDocument();
  expect(screen.getByText(/Warp Scheduler/i)).toBeInTheDocument();
  expect(screen.getByText(/Memory Access Patterns/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/test/LearnView.test.tsx --reporter=verbose
```

Expected: FAIL — "Floating-Point Formats" not found in DOM.

- [ ] **Step 3: Create PrecisionFormats.tsx**

Create `src/learn/PrecisionFormats.tsx`:

```typescript
import { PRECISION_FORMATS } from '../data/precisionFormats';

const MAX_BITS = 64;

export function PrecisionFormats() {
  return (
    <div className="flex flex-col gap-3">
      <span className="font-mono text-xs text-muted uppercase tracking-widest">Floating-Point Formats</span>

      {/* Stacked bit-field bars — width proportional to totalBits */}
      <div className="flex flex-col gap-2">
        {PRECISION_FORMATS.map((f) => {
          const signPct = (1 / f.totalBits) * 100;
          const expPct = (f.exponentBits / f.totalBits) * 100;
          const manPct = (f.mantissaBits / f.totalBits) * 100;
          const barWidthPct = (f.totalBits / MAX_BITS) * 100;

          return (
            <div key={f.name} className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-muted w-20 shrink-0">{f.name}</span>
              <div
                className="flex h-5 rounded overflow-hidden shrink-0"
                style={{ width: `${barWidthPct}%` }}
              >
                {/* Sign bit (1 bit) */}
                <div
                  style={{ width: `${signPct}%` }}
                  className="bg-[#e85d9a] shrink-0"
                />
                {/* Exponent bits */}
                {f.exponentBits > 0 && (
                  <div
                    style={{ width: `${expPct}%` }}
                    className="bg-[#58a6ff] flex items-center justify-center shrink-0 overflow-hidden"
                  >
                    {f.exponentBits >= 4 && (
                      <span className="font-mono text-[8px] text-white whitespace-nowrap px-0.5">
                        {f.exponentBits}e
                      </span>
                    )}
                  </div>
                )}
                {/* Mantissa bits */}
                <div
                  style={{ width: `${manPct}%` }}
                  className="bg-[#3fb950] flex items-center justify-center overflow-hidden"
                >
                  {f.mantissaBits >= 7 && (
                    <span className="font-mono text-[8px] text-white whitespace-nowrap px-0.5">
                      {f.mantissaBits}m
                    </span>
                  )}
                </div>
              </div>
              <span className="font-mono text-[10px] text-muted">{f.approxDecimalDigits} sig. digits</span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 font-mono text-[10px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#e85d9a]" /> sign (1 bit)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#58a6ff]" /> exponent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#3fb950]" /> mantissa
        </span>
      </div>

      {/* Detail table */}
      <div className="border border-edge rounded overflow-auto">
        <table className="font-mono text-[10px] border-collapse w-full">
          <thead>
            <tr>
              <th className="text-left text-muted px-2 py-1 border-b border-edge uppercase tracking-wider text-[9px]">Format</th>
              <th className="text-center text-muted px-2 py-1 border-b border-edge text-[9px]">Bits</th>
              <th className="text-center text-[#58a6ff] px-2 py-1 border-b border-edge text-[9px]">Exp</th>
              <th className="text-center text-[#3fb950] px-2 py-1 border-b border-edge text-[9px]">Mantissa</th>
              <th className="text-center text-muted px-2 py-1 border-b border-edge text-[9px]">~Decimals</th>
              <th className="text-left text-muted px-2 py-1 border-b border-edge text-[9px]">Use Case</th>
            </tr>
          </thead>
          <tbody>
            {PRECISION_FORMATS.map((f) => (
              <tr key={f.name} className="hover:bg-[#161b22]">
                <td className="text-primary px-2 py-1 border-b border-edge">{f.name}</td>
                <td className="text-muted text-center px-2 py-1 border-b border-edge">{f.totalBits}</td>
                <td className="text-[#58a6ff] text-center px-2 py-1 border-b border-edge">{f.exponentBits || '—'}</td>
                <td className="text-[#3fb950] text-center px-2 py-1 border-b border-edge">{f.mantissaBits}</td>
                <td className="text-muted text-center px-2 py-1 border-b border-edge">{f.approxDecimalDigits}</td>
                <td className="text-muted px-2 py-1 border-b border-edge">{f.useCase}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="font-mono text-[10px] text-muted leading-relaxed">
        BF16 and FP32 share the same 8-bit exponent — identical dynamic range — so BF16 is drop-in safe
        for training where FP16 overflows. FP8 halves the bits again; hardware relies on per-tensor
        scale factors to compensate for the minimal mantissa.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Add PrecisionFormats to LearnView**

Replace the content of `src/views/LearnView.tsx`:

```typescript
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
```

- [ ] **Step 5: Run tests**

```bash
npx vitest run src/test/LearnView.test.tsx src/test/precisionFormats.test.ts --reporter=verbose
```

Expected: PASS — all tests green.

- [ ] **Step 6: Commit**

```bash
git add src/learn/PrecisionFormats.tsx src/views/LearnView.tsx src/test/LearnView.test.tsx
git commit -m "feat: floating-point format bit-layout visualizer in Learn view"
```

---

## Task 7: Add numeric bandwidth + latency fields to MemoryHierarchy data

**Files:**
- Modify: `src/data/memoryHierarchy.ts`
- Modify: `src/test/memoryHierarchy.test.ts`

- [ ] **Step 1: Write failing test**

Add to `src/test/memoryHierarchy.test.ts`:

```typescript
it('every rung has bwNumGBps (number or null) and latencyNs (number)', () => {
  const rungs = hierarchyForCard(GPU_MAP['h100-sxm']);
  for (const r of rungs) {
    expect('bwNumGBps' in r).toBe(true);
    expect(typeof r.latencyNs).toBe('number');
  }
});

it('L2 and external rungs have non-null bwNumGBps', () => {
  const rungs = hierarchyForCard(GPU_MAP['h100-sxm']);
  const l2 = rungs.find((r) => r.level.includes('L2'))!;
  expect(l2.bwNumGBps).not.toBeNull();
  const hbm = rungs.find((r) => r.level.includes('HBM'))!;
  expect(hbm.bwNumGBps).not.toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/test/memoryHierarchy.test.ts --reporter=verbose
```

Expected: FAIL — `bwNumGBps` and `latencyNs` fields do not exist.

- [ ] **Step 3: Update memoryHierarchy.ts with new fields**

Replace the full content of `src/data/memoryHierarchy.ts`:

```typescript
import type { GpuSpec } from './gpus';

export interface MemRung {
  level: string;
  capacity: string;
  bandwidth: string;
  bwNumGBps: number | null; // per-chip bandwidth; null for reg/L1 (per-SM values, not comparable)
  latency: string;
  latencyNs: number;
  external?: boolean;
}

const HOPPER: MemRung[] = [
  { level: 'Registers',       capacity: '256 KB/SM',  bandwidth: '~80 TB/s/SM',  bwNumGBps: null,   latency: '<1 ns',   latencyNs: 0.5 },
  { level: 'Shared / L1',     capacity: '228 KB/SM',  bandwidth: '~30 TB/s/SM',  bwNumGBps: null,   latency: '~5 ns',   latencyNs: 5   },
  { level: 'L2 Cache',        capacity: '50 MB',      bandwidth: '~12 TB/s',     bwNumGBps: 12000,  latency: '~80 ns',  latencyNs: 80  },
  { level: 'HBM3',            capacity: '80 GB',      bandwidth: '3350 GB/s',    bwNumGBps: 3350,   latency: '~500 ns', latencyNs: 500,  external: true },
  { level: 'PCIe 5.0 → Host', capacity: 'Host RAM',   bandwidth: '128 GB/s',     bwNumGBps: 128,    latency: '~5 µs',   latencyNs: 5000, external: true },
];

const ADA: MemRung[] = [
  { level: 'Registers',       capacity: '256 KB/SM',  bandwidth: '~70 TB/s/SM',  bwNumGBps: null,  latency: '<1 ns',   latencyNs: 0.5 },
  { level: 'Shared / L1',     capacity: '128 KB/SM',  bandwidth: '~25 TB/s/SM',  bwNumGBps: null,  latency: '~5 ns',   latencyNs: 5   },
  { level: 'L2 Cache',        capacity: '96 MB',      bandwidth: '~5 TB/s',      bwNumGBps: 5000,  latency: '~85 ns',  latencyNs: 85  },
  { level: 'GDDR6',           capacity: '48 GB',      bandwidth: '864 GB/s',     bwNumGBps: 864,   latency: '~700 ns', latencyNs: 700,  external: true },
  { level: 'PCIe 4.0 → Host', capacity: 'Host RAM',   bandwidth: '64 GB/s',      bwNumGBps: 64,    latency: '~6 µs',   latencyNs: 6000, external: true },
];

const BLACKWELL: MemRung[] = [
  { level: 'Registers',       capacity: '256 KB/SM',  bandwidth: '~90 TB/s/SM',  bwNumGBps: null,  latency: '<1 ns',   latencyNs: 0.5 },
  { level: 'Shared / L1',     capacity: '256 KB/SM',  bandwidth: '~40 TB/s/SM',  bwNumGBps: null,  latency: '~4 ns',   latencyNs: 4   },
  { level: 'L2 Cache',        capacity: '~128 MB',    bandwidth: '~7 TB/s',      bwNumGBps: 7000,  latency: '~75 ns',  latencyNs: 75  },
  { level: 'GDDR7',           capacity: '32–96 GB',   bandwidth: '800–1344 GB/s',bwNumGBps: 1344,  latency: '~600 ns', latencyNs: 600,  external: true },
  { level: 'PCIe 5.0 → Host', capacity: 'Host RAM',   bandwidth: '128 GB/s',     bwNumGBps: 128,   latency: '~5 µs',   latencyNs: 5000, external: true },
];

const CDNA2: MemRung[] = [
  { level: 'Registers',       capacity: '256 KB/CU',  bandwidth: '~60 TB/s/CU',  bwNumGBps: null,  latency: '<1 ns',   latencyNs: 0.5 },
  { level: 'LDS (Shared)',     capacity: '64 KB/CU',   bandwidth: '~15 TB/s/CU',  bwNumGBps: null,  latency: '~5 ns',   latencyNs: 5   },
  { level: 'L1 Cache',        capacity: '16 KB/CU',   bandwidth: '~10 TB/s/CU',  bwNumGBps: null,  latency: '~25 ns',  latencyNs: 25  },
  { level: 'L2 + Infinity',   capacity: '8 MB',       bandwidth: '~3 TB/s',      bwNumGBps: 3000,  latency: '~120 ns', latencyNs: 120 },
  { level: 'HBM2e',           capacity: '64–128 GB',  bandwidth: '1600–3200 GB/s',bwNumGBps: 3200, latency: '~400 ns', latencyNs: 400,  external: true },
  { level: 'PCIe 4.0 → Host', capacity: 'Host RAM',   bandwidth: '64 GB/s',      bwNumGBps: 64,    latency: '~6 µs',   latencyNs: 6000, external: true },
];

const CDNA3: MemRung[] = [
  { level: 'Registers',       capacity: '512 KB/CU',  bandwidth: '~100 TB/s/CU', bwNumGBps: null,  latency: '<1 ns',   latencyNs: 0.5 },
  { level: 'LDS (Shared)',     capacity: '64 KB/CU',   bandwidth: '~20 TB/s/CU',  bwNumGBps: null,  latency: '~4 ns',   latencyNs: 4   },
  { level: 'L1 Cache',        capacity: '32 KB/CU',   bandwidth: '~15 TB/s/CU',  bwNumGBps: null,  latency: '~20 ns',  latencyNs: 20  },
  { level: 'L2 per XCD',      capacity: '4 MB/XCD',   bandwidth: '~5 TB/s',      bwNumGBps: 5000,  latency: '~100 ns', latencyNs: 100 },
  { level: 'HBM3',            capacity: '192 GB',     bandwidth: '5300 GB/s',    bwNumGBps: 5300,  latency: '~350 ns', latencyNs: 350,  external: true },
  { level: 'PCIe 5.0 → Host', capacity: 'Host RAM',   bandwidth: '128 GB/s',     bwNumGBps: 128,   latency: '~5 µs',   latencyNs: 5000, external: true },
];

const BY_ARCH: Record<string, MemRung[]> = {
  Hopper: HOPPER,
  'Ada Lovelace': ADA,
  Blackwell: BLACKWELL,
  CDNA2: CDNA2,
  CDNA3: CDNA3,
};

export function hierarchyForCard(spec: GpuSpec): MemRung[] {
  return BY_ARCH[spec.arch] ?? HOPPER;
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/test/memoryHierarchy.test.ts --reporter=verbose
```

Expected: PASS — all 5 tests green (3 existing + 2 new).

- [ ] **Step 5: Commit**

```bash
git add src/data/memoryHierarchy.ts src/test/memoryHierarchy.test.ts
git commit -m "feat: add bwNumGBps and latencyNs to MemRung for bandwidth chart"
```

---

## Task 8: Bandwidth cliff bar chart in MemoryHierarchy

**Files:**
- Modify: `src/learn/MemoryHierarchy.tsx`

- [ ] **Step 1: Replace MemoryHierarchy.tsx**

The chart uses Recharts `BarChart layout="vertical"` on a log x-axis. Only rungs with non-null `bwNumGBps` are plotted (skips per-SM register/L1 rows). The latency string is shown as a label on the right side of each bar.

Replace the full content of `src/learn/MemoryHierarchy.tsx`:

```typescript
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { GPU_MAP } from '../data/gpus';
import { hierarchyForCard, type MemRung } from '../data/memoryHierarchy';

function BandwidthBar({ rungs }: { rungs: MemRung[] }) {
  const data = rungs
    .filter((r) => r.bwNumGBps !== null)
    .map((r) => ({
      level: r.level.replace(' → Host', ''),
      bw: r.bwNumGBps as number,
      latency: r.latency,
      external: r.external ?? false,
    }))
    .reverse(); // fastest at top

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 90, bottom: 16, left: 8 }}>
          <XAxis
            type="number"
            scale="log"
            domain={[10, 100000]}
            allowDataOverflow
            tick={{ fill: '#8b949e', fontSize: 8, fontFamily: 'monospace' }}
            tickFormatter={(v: number) => v >= 1000 ? `${v / 1000}T` : `${v}G`}
            label={{ value: 'GB/s (log)', fill: '#8b949e', fontSize: 9, position: 'insideBottomRight', offset: -4 }}
          />
          <YAxis
            type="category"
            dataKey="level"
            width={90}
            tick={{ fill: '#8b949e', fontSize: 8, fontFamily: 'monospace' }}
          />
          <Tooltip
            contentStyle={{ background: '#11151c', border: '1px solid #2a323d', fontFamily: 'monospace', fontSize: 9 }}
            formatter={(val: number) => [`${val.toLocaleString()} GB/s`, 'Bandwidth']}
          />
          <Bar dataKey="bw" isAnimationActive={false} radius={[0, 2, 2, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.external ? '#f85149' : '#3fb950'} fillOpacity={0.7} />
            ))}
            <LabelList
              dataKey="latency"
              position="right"
              style={{ fill: '#8b949e', fontSize: 8, fontFamily: 'monospace' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MemoryHierarchy({ cardId }: { cardId: string }) {
  const spec = GPU_MAP[cardId];
  if (!spec) return null;
  const rungs = hierarchyForCard(spec);

  return (
    <div className="flex flex-col gap-3">
      <span className="font-mono text-xs text-muted uppercase tracking-widest">Memory Hierarchy · {spec.name}</span>
      <BandwidthBar rungs={rungs} />
      <div className="flex flex-col gap-1">
        {rungs.map((r, i) => (
          <div
            key={r.level}
            className={`flex items-center gap-3 px-3 py-2 rounded border font-mono text-[11px] ${
              r.external ? 'border-amd/40 bg-amd/5' : 'border-edge bg-surface'
            }`}
            style={{ marginLeft: `${i * 14}px` }}
          >
            <span className="text-primary w-32">{r.level}</span>
            <span className="text-muted w-28">{r.capacity}</span>
            <span className={r.external ? 'text-amd w-32' : 'text-good w-32'}>{r.bandwidth}</span>
            <span className="text-muted">{r.latency}</span>
          </div>
        ))}
      </div>
      <p className="font-mono text-[10px] text-muted leading-relaxed">
        Each step down is bigger but slower. Once working data spills past L2, every access pays the external-memory tax —
        this is exactly where HBM3 ({spec.arch.startsWith('CDNA') ? 'AMD' : 'NVIDIA'} HPC parts) crushes GDDR6/7.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Run the full test suite**

```bash
npx vitest run --reporter=verbose 2>&1 | tail -10
```

Expected: all 69+ tests pass (the MemoryHierarchy component has no direct render test, but the full suite catches regressions).

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/learn/MemoryHierarchy.tsx
git commit -m "feat: bandwidth cliff bar chart in memory hierarchy — visualizes the L2→DRAM→host bandwidth drop"
```

---

## Self-Review

### 1. Spec coverage

| Requirement | Task |
|-------------|------|
| Editable price interface | Task 1 (store) + Task 2 (UI) ✓ |
| FP16/$ and TFLOPS/W efficiency | Task 2 ✓ |
| Bottleneck verdict per workload | Task 3 (logic) + Task 4 (UI) ✓ |
| Active workload highlighted on roofline | Task 4 ✓ |
| FP format bit-layout visualizer | Task 5 (data) + Task 6 (component) ✓ |
| Memory hierarchy with bandwidth chart | Task 7 (data) + Task 8 (chart) ✓ |

### 2. Placeholder scan

No TBDs, no "add error handling" vagueness, no references to undefined types. Every task has complete code.

### 3. Type consistency

- `customPrices: Record<string, number>` defined in Task 1; read in Task 2 as `customPrices[s.id]` ✓
- `bottleneck()` defined in Task 3; imported in Task 4 from `'../lib/roofline'` ✓
- `PrecisionFormat.exponentBits / .mantissaBits` defined in Task 5; used in Task 6 `barWidthPct` calc ✓
- `MemRung.bwNumGBps: number | null` defined in Task 7; filtered with `r.bwNumGBps !== null` in Task 8 ✓

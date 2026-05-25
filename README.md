# gpu-arch-viz

Interactive GPU architecture visualizer for comparing NVIDIA and AMD GPUs across workloads.

## Features

**Explorer view**
- Side-by-side 2D die diagrams (individual SM/CU cells) for up to 3 GPUs
- Multi-die GPUs (MI250 dual-die, MI300X 8 XCDs) with clickable layer tabs
- Workload selector — highlights active blocks per workload
- Click any block for a detailed description of its role and topology context
- Compare table: FP64/FP32/FP16 throughput, memory bandwidth, TDP, price, efficiency (TFLOPS/W, FP16/$k), and bottleneck verdict
- Editable price inputs for up-to-date efficiency calculations
- Memory bandwidth bar chart

**Learn view**
- Roofline model chart with per-GPU ceilings and active workload marker
- Floating-point format visualizer — stacked bit-field bars for FP64 → INT8
- Memory hierarchy ladder with bandwidth cliff bar chart (log scale)
- Warp scheduler / occupancy simulator
- Memory access pattern visualizer (coalesced vs strided)

## Stack

- React 18 + TypeScript + Vite
- Zustand 5 (state)
- Recharts (charts)
- Tailwind CSS v3
- Vitest + @testing-library/react

## Getting started

```bash
npm install
npm run dev
```

```bash
npm test
```

## GPUs included

| GPU | Vendor | Architecture |
|-----|--------|-------------|
| H100 SXM | NVIDIA | Hopper |
| H200 SXM | NVIDIA | Hopper |
| RTX Pro 6000 | NVIDIA | Blackwell |
| L20 | NVIDIA | Ada |
| MI300X | AMD | CDNA3 (8 XCDs) |
| MI250 | AMD | CDNA2 (dual-die) |

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkloadSelector } from '../panels/WorkloadSelector';
import { useAppStore, INITIAL_CARDS } from '../store/useAppStore';

describe('WorkloadSelector', () => {
  beforeEach(() => {
    useAppStore.setState({ selectedCards: [...INITIAL_CARDS], workload: 'fp64-sim' });
  });

  it('renders all 4 workloads', () => {
    render(<WorkloadSelector />);
    expect(screen.getByText(/FP64 Scientific Sim/i)).toBeInTheDocument();
    expect(screen.getByText(/FP32 Image Processing/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Inference/i)).toBeInTheDocument();
    expect(screen.getByText(/MatMul Training/i)).toBeInTheDocument();
  });

  it('selecting a workload updates the store', () => {
    render(<WorkloadSelector />);
    fireEvent.click(screen.getByLabelText(/Dense MatMul Training/i));
    expect(useAppStore.getState().workload).toBe('matmul-training');
  });

  it('shows a utilization figure per selected card', () => {
    render(<WorkloadSelector />);
    // H100 on fp64-sim: 34 / 81.7 (mi300x) ≈ 42%
    expect(screen.getAllByText(/%/).length).toBeGreaterThanOrEqual(3);
  });
});

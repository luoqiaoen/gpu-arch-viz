import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompareTable } from '../panels/CompareTable';
import { useAppStore } from '../store/useAppStore';

describe('CompareTable', () => {
  beforeEach(() => {
    useAppStore.setState({ selectedCards: ['l20', 'mi210', null], marketingMode: false, customPrices: {} });
  });

  it('renders a column header per selected card', () => {
    render(<CompareTable />);
    expect(screen.getByText('NVIDIA L20')).toBeInTheDocument();
    expect(screen.getByText('MI210')).toBeInTheDocument();
  });

  it('shows all metric rows', () => {
    render(<CompareTable />);
    for (const row of ['FP64', 'FP32', 'FP16', 'INT8', 'Memory', 'BW', 'TDP', 'Price ($)', 'FP16/$k', 'TFLOPS/W', 'Bottleneck']) {
      expect(screen.getByText(row)).toBeInTheDocument();
    }
  });

  it('marketing mode swaps FP16 to the sparse figure', () => {
    const { rerender } = render(<CompareTable />);
    expect(screen.getByText(/119\.5 TFLOPS/)).toBeInTheDocument(); // L20 dense FP16
    useAppStore.setState({ marketingMode: true });
    rerender(<CompareTable />);
    expect(screen.getByText(/239 TFLOPS/)).toBeInTheDocument(); // L20 sparse FP16
  });

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

  it('setCustomPrice updates when price input changes', () => {
    render(<CompareTable />);
    const input = screen.getByRole('spinbutton', { name: /price-l20/i });
    fireEvent.change(input, { target: { value: '7000' } });
    expect(useAppStore.getState().customPrices['l20']).toBe(7000);
  });

  it('renders a Bottleneck row with memory/compute verdict', () => {
    useAppStore.setState({ selectedCards: ['l20', 'mi210', null], workload: 'fp64-sim', customPrices: {} });
    render(<CompareTable />);
    expect(screen.getByText('Bottleneck')).toBeInTheDocument();
    // fp64-sim has arithmeticIntensity=2, both cards are memory-bound at AI=2
    const cells = screen.getAllByText(/Mem BW/);
    expect(cells.length).toBeGreaterThanOrEqual(1);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExplorerView } from '../views/ExplorerView';
import { useAppStore, INITIAL_CARDS } from '../store/useAppStore';

describe('ExplorerView', () => {
  beforeEach(() => {
    useAppStore.setState({ selectedCards: [...INITIAL_CARDS], workload: 'fp64-sim', activeBlockId: null });
  });

  it('renders workload selector, table, and bottom-drawer tabs', () => {
    render(<ExplorerView />);
    expect(screen.getByText(/FP64 Scientific Sim/i)).toBeInTheDocument();
    expect(screen.getByText('FP64')).toBeInTheDocument(); // table row
    expect(screen.getByRole('button', { name: /precision/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /bandwidth/i })).toBeInTheDocument();
  });

  it('switches the bottom drawer between Precision and Memory Flow', () => {
    render(<ExplorerView />);
    fireEvent.click(screen.getByRole('button', { name: /bandwidth/i }));
    expect(screen.getByRole('button', { name: /bandwidth/i })).toBeInTheDocument();
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LearnView } from '../views/LearnView';
import { useAppStore } from '../store/useAppStore';

describe('LearnView', () => {
  beforeEach(() => {
    useAppStore.setState({ learnCard: 'h100-sxm' });
  });

  it('renders all five learn sections', () => {
    render(<LearnView />);
    expect(screen.getByText(/Roofline/i)).toBeInTheDocument();
    expect(screen.getByText(/Floating-Point Formats/i)).toBeInTheDocument();
    expect(screen.getByText(/Memory Hierarchy/i)).toBeInTheDocument();
    expect(screen.getByText(/Warp Scheduler/i)).toBeInTheDocument();
    expect(screen.getByText(/Memory Access Patterns/i)).toBeInTheDocument();
  });

  it('changing the learn card selector updates the store', () => {
    render(<LearnView />);
    fireEvent.change(screen.getByLabelText(/learn card/i), { target: { value: 'l20' } });
    expect(useAppStore.getState().learnCard).toBe('l20');
  });
});

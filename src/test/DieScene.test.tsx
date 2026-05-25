import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { DieScene } from '../scene/DieScene';
import { useAppStore, INITIAL_CARDS } from '../store/useAppStore';

describe('DieScene', () => {
  beforeEach(() => {
    useAppStore.setState({ selectedCards: [...INITIAL_CARDS], workload: 'fp64-sim', activeBlockId: null });
  });

  it('renders without throwing for the default 3-card selection', () => {
    expect(() => render(<DieScene />)).not.toThrow();
  });

  it('renders with a single card selected', () => {
    useAppStore.setState({ selectedCards: ['mi250', null, null] });
    expect(() => render(<DieScene />)).not.toThrow();
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryFlow } from '../panels/MemoryFlow';
import { useAppStore } from '../store/useAppStore';

describe('MemoryFlow', () => {
  beforeEach(() => {
    useAppStore.setState({ selectedCards: ['l20', 'h100-sxm', 'mi300x'] });
  });

  it('renders without throwing', () => {
    expect(() => render(<MemoryFlow />)).not.toThrow();
  });
});

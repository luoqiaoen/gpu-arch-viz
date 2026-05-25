import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TopBar } from '../panels/TopBar';
import { useAppStore, INITIAL_CARDS } from '../store/useAppStore';

describe('TopBar', () => {
  beforeEach(() => {
    useAppStore.setState({ view: 'explorer', selectedCards: [...INITIAL_CARDS], marketingMode: false });
  });

  it('renders the view toggle buttons', () => {
    render(<TopBar />);
    expect(screen.getByRole('button', { name: /explorer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /learn/i })).toBeInTheDocument();
  });

  it('clicking Learn switches the view in the store', () => {
    render(<TopBar />);
    fireEvent.click(screen.getByRole('button', { name: /learn/i }));
    expect(useAppStore.getState().view).toBe('learn');
  });

  it('toggling marketing mode updates the store', () => {
    render(<TopBar />);
    fireEvent.click(screen.getByLabelText(/AI TFLOPs/i));
    expect(useAppStore.getState().marketingMode).toBe(true);
  });
});

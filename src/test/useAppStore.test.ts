import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore, INITIAL_CARDS } from '../store/useAppStore';

describe('useAppStore', () => {
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

  it('initializes with defaults', () => {
    const s = useAppStore.getState();
    expect(s.view).toBe('explorer');
    expect(s.selectedCards).toEqual(['l20', 'rtx-pro-6000', 'w7900']);
    expect(s.workload).toBe('fp64-sim');
  });

  it('setView switches view', () => {
    useAppStore.getState().setView('learn');
    expect(useAppStore.getState().view).toBe('learn');
  });

  it('setCard updates only the targeted slot', () => {
    useAppStore.getState().setCard(1, 'mi210');
    expect(useAppStore.getState().selectedCards).toEqual(['l20', 'mi210', 'w7900']);
  });

  it('setCard can null a slot', () => {
    useAppStore.getState().setCard(2, null);
    expect(useAppStore.getState().selectedCards[2]).toBeNull();
  });

  it('setWorkload, setMarketingMode, setActiveBlock, setLearnCard mutate state', () => {
    const a = useAppStore.getState();
    a.setWorkload('matmul-training');
    a.setMarketingMode(true);
    a.setActiveBlock('h100-sxm-d0-tensor-3');
    a.setLearnCard('mi300x');
    const s = useAppStore.getState();
    expect(s.workload).toBe('matmul-training');
    expect(s.marketingMode).toBe(true);
    expect(s.activeBlockId).toBe('h100-sxm-d0-tensor-3');
    expect(s.learnCard).toBe('mi300x');
  });

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
});

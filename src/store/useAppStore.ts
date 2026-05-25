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
  return [cards[0], cards[1], cards[2]].filter((c): c is string => c !== null);
}

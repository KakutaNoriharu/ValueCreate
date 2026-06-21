import { create } from 'zustand';
import type { ChickenRaceEntry, Season, SurvivorStats } from '../types';

interface ChickenRaceState {
  season: Season | null;
  stats: SurvivorStats | null;
  survivors: ChickenRaceEntry[];
  obituaries: ChickenRaceEntry[];
  myEntry: ChickenRaceEntry | null;
  isLoading: boolean;

  setSeason: (season: Season) => void;
  setStats: (stats: SurvivorStats) => void;
  setSurvivors: (entries: ChickenRaceEntry[]) => void;
  setObituaries: (entries: ChickenRaceEntry[]) => void;
  setMyEntry: (entry: ChickenRaceEntry | null) => void;
  setLoading: (loading: boolean) => void;
  addObituary: (entry: ChickenRaceEntry) => void;
}

export const useChickenRaceStore = create<ChickenRaceState>((set) => ({
  season: null,
  stats: null,
  survivors: [],
  obituaries: [],
  myEntry: null,
  isLoading: false,

  setSeason: (season) => set({ season }),
  setStats: (stats) => set({ stats }),
  setSurvivors: (survivors) => set({ survivors }),
  setObituaries: (obituaries) => set({ obituaries }),
  setMyEntry: (myEntry) => set({ myEntry }),
  setLoading: (loading) => set({ isLoading: loading }),

  addObituary: (entry) =>
    set((state) => ({
      obituaries: [entry, ...state.obituaries],
      survivors: state.survivors.filter((s) => s.user_id !== entry.user_id),
      stats: state.stats
        ? {
            ...state.stats,
            survivor_count: Math.max(0, state.stats.survivor_count - 1),
            today_eliminated: state.stats.today_eliminated + 1,
          }
        : null,
    })),
}));

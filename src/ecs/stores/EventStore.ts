/**
 * ECS - EventStore
 * 管理游戏事件历史
 */

import { create } from 'zustand';

interface EventHistoryEntry {
  id: string;
  year: number;
  month: number;
  message: string;
  timestamp: number;
}

interface EventState {
  history: EventHistoryEntry[];
  lastCheckMonth: number;
}

interface EventActions {
  addEvent: (year: number, month: number, message: string) => void;
  clearHistory: () => void;
  reset: () => void;
  getRecentEvents: (count?: number) => EventHistoryEntry[];
}

function createInitialState(): EventState {
  return {
    history: [],
    lastCheckMonth: 0,
  };
}

export const useEventStore = create<EventState & EventActions>((set, get) => ({
  ...createInitialState(),

  addEvent: (year, month, message) => {
    const entry: EventHistoryEntry = {
      id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      year,
      month,
      message,
      timestamp: Date.now(),
    };

    set(state => ({
      history: [...state.history, entry],
    }));
  },

  clearHistory: () => set({ history: [] }),

  reset: () => set(createInitialState()),

  getRecentEvents: (count = 10) => {
    const history = get().history;
    return history.slice(-count);
  },
}));

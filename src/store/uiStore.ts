import { create } from 'zustand';
import type { UIState, Notification, Person } from './types';

interface UIActions {
  // 人员选择
  selectPerson: (id: string | null) => void;
  hoverPerson: (person: Person | null) => void;

  // 面板控制
  togglePolicyPanel: () => void;
  toggleStatsPanel: () => void;
  toggleAchievementsPanel: () => void;
  setPolicyPanelVisible: (show: boolean) => void;
  setStatsPanelVisible: (show: boolean) => void;
  setAchievementsPanelVisible: (show: boolean) => void;

  // 通知管理
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIState & UIActions>((set, get) => ({
  selectedPersonId: null,
  showPolicyPanel: false,
  showStatsPanel: false,
  showAchievementsPanel: false,
  hoveredPerson: null,
  notifications: [],

  // 人员选择
  selectPerson: (id) => set({ selectedPersonId: id }),

  hoverPerson: (person) => set({ hoveredPerson: person }),

  // 面板控制
  togglePolicyPanel: () => set((state) => ({ showPolicyPanel: !state.showPolicyPanel })),

  toggleStatsPanel: () => set((state) => ({ showStatsPanel: !state.showStatsPanel })),

  toggleAchievementsPanel: () =>
    set((state) => ({ showAchievementsPanel: !state.showAchievementsPanel })),

  setPolicyPanelVisible: (show) => set({ showPolicyPanel: show }),

  setStatsPanelVisible: (show) => set({ showStatsPanel: show }),

  setAchievementsPanelVisible: (show) => set({ showAchievementsPanel: show }),

  // 通知管理
  addNotification: (notification) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
    };

    set((state) => ({
      notifications: [...state.notifications.slice(-9), newNotification],
    }));

    // 自动移除通知（5秒后）
    setTimeout(() => {
      get().removeNotification(id);
    }, 5000);
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),
}));

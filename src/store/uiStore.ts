import { create } from 'zustand';
import type { UIState, Notification, Person } from './types';

interface UIActions {
  // 人员选择
  selectPerson: (id: string | null) => void;
  hoverPerson: (person: Person | null) => void;

  // 面板控制
  togglePolicyPanel: () => void;
  toggleStatsPanel: () => void;
  toggleResourcePanel: () => void;
  toggleAchievementsPanel: () => void;
  setPolicyPanelVisible: (show: boolean) => void;
  setStatsPanelVisible: (show: boolean) => void;
  setResourcePanelVisible: (show: boolean) => void;
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
  showResourcePanel: false,
  showAchievementsPanel: false,
  hoveredPerson: null,
  notifications: [],

  // 人员选择
  selectPerson: (id) => set({ selectedPersonId: id }),

  hoverPerson: (person) => set({ hoveredPerson: person }),

  // 面板控制 - 互斥显示（只显示一个面板）
  togglePolicyPanel: () => set(() => ({
    showPolicyPanel: true,
    showStatsPanel: false,
    showResourcePanel: false,
    showAchievementsPanel: false
  })),

  toggleStatsPanel: () => set(() => ({
    showPolicyPanel: false,
    showStatsPanel: true,
    showResourcePanel: false,
    showAchievementsPanel: false
  })),

  toggleResourcePanel: () => set(() => ({
    showPolicyPanel: false,
    showStatsPanel: false,
    showResourcePanel: true,
    showAchievementsPanel: false
  })),

  toggleAchievementsPanel: () =>
    set(() => ({
      showPolicyPanel: false,
      showStatsPanel: false,
      showResourcePanel: false,
      showAchievementsPanel: true
    })),

  setPolicyPanelVisible: (show) => set({ showPolicyPanel: show }),

  setStatsPanelVisible: (show) => set({ showStatsPanel: show }),

  setResourcePanelVisible: (show) => set({ showResourcePanel: show }),

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

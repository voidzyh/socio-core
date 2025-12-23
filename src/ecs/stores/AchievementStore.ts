/**
 * ECS - AchievementStore
 * 管理成就系统
 */

import { create } from 'zustand';
import type { Achievement } from '../../store/types';
import { ACHIEVEMENTS } from '../../constants/achievements';

interface AchievementState {
  achievements: Achievement[];
  unlockedAchievements: string[];
}

interface AchievementActions {
  checkAchievements: (state: {
    populationCount: number;
    resources: { food: number; money: number };
    statistics: {
      totalBirths: number;
      birthsHistory: { year: number; count: number }[];
      averageAge: number;
      averageHealth: number;
      averageEducation: number;
    };
    currentYear: number;
  }) => string[]; // 返回新解锁的成就ID
  reset: () => void;
  getUnlockedCount: () => number;
}

function createInitialState(): AchievementState {
  return {
    achievements: ACHIEVEMENTS.map(a => ({ ...a, unlocked: false })),
    unlockedAchievements: [],
  };
}

export const useAchievementStore = create<AchievementState & AchievementActions>((set, get) => ({
  ...createInitialState(),

  checkAchievements: (state) => {
    const current = get();
    const newUnlocked: string[] = [];

    const newAchievements = current.achievements.map((achievement) => {
      if (!achievement.unlocked && achievement.condition(state as any)) {
        newUnlocked.push(achievement.id);
        return { ...achievement, unlocked: true };
      }
      return achievement;
    });

    if (newUnlocked.length > 0) {
      set({
        achievements: newAchievements,
        unlockedAchievements: [...current.unlockedAchievements, ...newUnlocked],
      });
    }

    return newUnlocked;
  },

  reset: () => set(createInitialState()),

  getUnlockedCount: () => get().unlockedAchievements.length,
}));

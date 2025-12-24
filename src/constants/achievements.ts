import type { Achievement } from '../store/types';

// 成就列表
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'population-100',
    name: '人口破百',
    description: '人口达到 100 人',
    icon: '👥',
    unlocked: false,
    condition: (state) => state.populationCount >= 100,
  },
  {
    id: 'longevity',
    name: '长寿之乡',
    description: '平均寿命超过 70 岁',
    icon: '🏆',
    unlocked: false,
    condition: (state) => {
      // 使用统计数据中的平均年龄
      return state.statistics.averageAge >= 70;
    },
  },
  {
    id: 'economic-prosperity',
    name: '经济繁荣',
    description: '资金超过 5,000',
    icon: '💰',
    unlocked: false,
    condition: (state) => state.resources.money >= 5000,
  },
  {
    id: 'century-foundation',
    name: '百年基业',
    description: '游戏持续 50 年',
    icon: '🎂',
    unlocked: false,
    condition: (state) => state.currentYear >= 50,
  },
  {
    id: 'zero-hunger',
    name: '零饥饿',
    description: '食物储备超过 500',
    icon: '🍎',
    unlocked: false,
    condition: (state) => state.resources.food >= 500,
  },
  {
    id: 'education-power',
    name: '教育强国',
    description: '平均教育水平 > 6',
    icon: '📚',
    unlocked: false,
    condition: (state) => state.statistics.averageEducation >= 6,
  },
  {
    id: 'baby-boom',
    name: '人口大爆炸',
    description: '单年出生人口 > 15',
    icon: '👶',
    unlocked: false,
    condition: (state) => {
      const recentYears = state.statistics.birthsHistory.slice(-5);
      return recentYears.some(year => year.count >= 15);
    },
  },
  {
    id: 'perfect-health',
    name: '健康社会',
    description: '平均健康值 > 75',
    icon: '❤️',
    unlocked: false,
    condition: (state) => state.statistics.averageHealth >= 75,
  },
  {
    id: 'survivor',
    name: '幸存者',
    description: '游戏持续 20 年',
    icon: '🛡️',
    unlocked: false,
    condition: (state) => state.currentYear >= 20,
  },
];

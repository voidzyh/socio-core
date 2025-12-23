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
    description: '平均寿命超过 80 岁',
    icon: '🏆',
    unlocked: false,
    condition: (state) => {
      const livingPeople = Array.from(state.people.values()).filter(p => p.isAlive);
      if (livingPeople.length === 0) return false;
      const avgAge = livingPeople.reduce((sum, p) => sum + p.age, 0) / livingPeople.length;
      return avgAge >= 80;
    },
  },
  {
    id: 'economic-prosperity',
    name: '经济繁荣',
    description: '资金超过 10,000',
    icon: '💰',
    unlocked: false,
    condition: (state) => state.resources.money >= 10000,
  },
  {
    id: 'century-foundation',
    name: '百年基业',
    description: '游戏持续 100 年',
    icon: '🎂',
    unlocked: false,
    condition: (state) => state.currentYear >= 100,
  },
  {
    id: 'zero-hunger',
    name: '零饥饿',
    description: '食物储备超过 1000 且无人饥饿',
    icon: '🍎',
    unlocked: false,
    condition: (state) => state.resources.food >= 1000,
  },
  {
    id: 'education-power',
    name: '教育强国',
    description: '平均教育水平 > 8',
    icon: '📚',
    unlocked: false,
    condition: (state) => state.statistics.averageEducation >= 8,
  },
  {
    id: 'baby-boom',
    name: '人口大爆炸',
    description: '单年出生人口 > 20',
    icon: '👶',
    unlocked: false,
    condition: (state) => {
      const recentYears = state.statistics.birthsHistory.slice(-5);
      return recentYears.some(year => year.count >= 20);
    },
  },
  {
    id: 'perfect-health',
    name: '健康社会',
    description: '平均健康值 > 90',
    icon: '❤️',
    unlocked: false,
    condition: (state) => state.statistics.averageHealth >= 90,
  },
  {
    id: 'first-birth',
    name: '新生命',
    description: '见证第一个新生儿的诞生',
    icon: '👣',
    unlocked: false,
    condition: (state) => state.statistics.totalBirths >= 1,
  },
];

import type { RandomEvent } from '../store/types';

// 随机事件列表
export const RANDOM_EVENTS: RandomEvent[] = [
  // ===== 自然灾害 =====
  {
    id: 'earthquake',
    name: '地震',
    description: '一场强烈的地震袭击了这片土地！',
    effects: {
      deathRateChange: 0.1,
      housingChange: -20,
    },
    probability: 0.005, // 0.5% 每月
  },
  {
    id: 'flood',
    name: '洪水',
    description: '洪水泛滥，农田被淹！',
    effects: {
      foodChange: -0.3,
      deathRateChange: 0.02,
    },
    probability: 0.008, // 0.8% 每月
  },
  {
    id: 'drought',
    name: '干旱',
    description: '严重的干旱影响了农业生产！',
    effects: {
      foodChange: -0.5,
    },
    probability: 0.01, // 1% 每月
  },

  // ===== 疫情 =====
  {
    id: 'epidemic',
    name: '传染病',
    description: '一场传染病爆发了！',
    effects: {
      deathRateChange: 0.2,
    },
    probability: 0.003, // 0.3% 每月
  },

  // ===== 科技突破 =====
  {
    id: 'medical-breakthrough',
    name: '医疗革命',
    description: '医疗技术取得重大突破！',
    effects: {
      deathRateChange: -0.1,
    },
    probability: 0.002, // 0.2% 每月
  },
  {
    id: 'hybrid-rice',
    name: '杂交水稻',
    description: '农业技术革新，粮食产量大幅提升！',
    effects: {
      foodChange: 0.3,
    },
    probability: 0.002, // 0.2% 每月
  },

  // ===== 社会事件 =====
  {
    id: 'war',
    name: '战争',
    description: '战争爆发了！',
    effects: {
      deathRateChange: 0.15,
      moneyChange: -500,
    },
    probability: 0.001, // 0.1% 每月
  },
  {
    id: 'economic-boom',
    name: '经济繁荣',
    description: '经济繁荣发展！',
    effects: {
      moneyChange: 1000,
    },
    probability: 0.005, // 0.5% 每月
  },
];

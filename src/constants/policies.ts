import type { Policy } from '../store/types';

// 政策列表
export const POLICIES: Policy[] = [
  // ===== 生育政策 =====
  {
    id: 'family-planning',
    name: '计划生育',
    description: '控制人口增长，实施计划生育政策',
    detail: '生育率 -30%，教育资源 +1/月',
    cost: 750,  // 500 * 1.5
    effects: {
      fertilityRate: -0.3,
      education: 1,
    },
    active: false,
    category: 'fertility',
  },
  {
    id: 'birth-subsidy',
    name: '鼓励生育补贴',
    description: '为生育家庭提供经济补贴',
    detail: '生育率 +20%，资金 -200/月，持续10年',
    cost: 1500,  // 1000 * 1.5
    effects: {
      fertilityRate: 0.2,
      economy: -200,
    },
    duration: 120, // 10年
    active: false,
    category: 'fertility',
  },
  {
    id: 'extended-leave',
    name: '延长产假',
    description: '延长产假，鼓励家庭生育',
    detail: '生育率 +10%，经济 -5%',
    cost: 450,  // 300 * 1.5
    effects: {
      fertilityRate: 0.1,
      economy: -0.05,
    },
    active: false,
    category: 'fertility',
  },
  {
    id: 'child-welfare',
    name: '儿童福利',
    description: '提供儿童福利保障',
    detail: '生育率 +15%，幸福度 +10',
    cost: 1200,  // 800 * 1.5
    effects: {
      fertilityRate: 0.15,
      happiness: 10,
    },
    active: false,
    category: 'fertility',
  },

  // ===== 医疗政策 =====
  {
    id: 'public-healthcare',
    name: '公共医疗',
    description: '建立公共医疗体系',
    detail: '死亡率 -15%，资金 -300/月，持续10年',
    cost: 2250,  // 1500 * 1.5
    effects: {
      deathRate: -0.15,
      economy: -300,
    },
    duration: 120, // 10年
    active: false,
    category: 'medical',
  },
  {
    id: 'elderly-care',
    name: '老年医疗',
    description: '为老年人提供专门医疗服务',
    detail: '老年人死亡率 -25%，资金 -200/月，持续10年',
    cost: 1500,  // 1000 * 1.5
    effects: {
      deathRate: -0.25, // 仅对老年人有效
      economy: -200,
    },
    duration: 120, // 10年
    active: false,
    category: 'medical',
  },
  {
    id: 'disease-control',
    name: '疾病防控',
    description: '加强疾病预防和控制',
    detail: '死亡率 -10%',
    cost: 750,  // 500 * 1.5
    effects: {
      deathRate: -0.1,
    },
    active: false,
    category: 'medical',
  },

  // ===== 教育政策 =====
  {
    id: 'compulsory-education',
    name: '义务教育',
    description: '实施义务教育制度',
    detail: '教育资源 +2/月，经济 +10%',
    cost: 1800,  // 1200 * 1.5
    effects: {
      education: 2,
      economy: 0.1,
    },
    active: false,
    category: 'education',
  },
  {
    id: 'vocational-training',
    name: '职业培训',
    description: '提供职业培训，提高生产效率',
    detail: '经济 +15%',
    cost: 1200,  // 800 * 1.5
    effects: {
      economy: 0.15,
    },
    active: false,
    category: 'education',
  },
  {
    id: 'research-investment',
    name: '科研投入',
    description: '加大科研投入，推动技术进步',
    detail: '经济 +5%（长期效果）',
    cost: 3000,  // 2000 * 1.5
    effects: {
      economy: 0.05,
    },
    active: false,
    category: 'education',
  },

  // ===== 经济政策 =====
  {
    id: 'tax-reform',
    name: '税收改革',
    description: '改革税收制度',
    detail: '经济 +20%，幸福度 -10',
    cost: 600,  // 400 * 1.5
    effects: {
      economy: 0.2,
      happiness: -10,
    },
    active: false,
    category: 'economic',
  },
  {
    id: 'housing-subsidy',
    name: '住房补贴',
    description: '为居民提供住房补贴',
    detail: '住房容量 +20%，资金 -300/月，持续10年',
    cost: 1500,  // 1000 * 1.5
    effects: {
      housingCapacity: 0.2,
      economy: -300,
    },
    duration: 120, // 10年
    active: false,
    category: 'economic',
  },
  {
    id: 'food-rationing',
    name: '食物配给',
    description: '实施食物配给制度',
    detail: '经济 -10%，幸福度 -15',
    cost: 300,  // 200 * 1.5
    effects: {
      economy: -0.1,
      happiness: -15,
    },
    active: false,
    category: 'economic',
  },

  // ===== 社会政策 =====
  {
    id: 'pension-insurance',
    name: '养老保险',
    description: '建立养老保险制度',
    detail: '幸福度 +15，资金 -250/月，持续10年',
    cost: 1350,  // 900 * 1.5
    effects: {
      happiness: 15,
      economy: -250,
    },
    duration: 120, // 10年
    active: false,
    category: 'social',
  },
  {
    id: 'immigration-open',
    name: '移民开放',
    description: '开放移民政策',
    detail: '经济 +5%（可能带来新人口）',
    cost: 900,  // 600 * 1.5
    effects: {
      economy: 0.05,
    },
    active: false,
    category: 'social',
  },
];

// 按类别分组政策
export const POLICIES_BY_CATEGORY = {
  fertility: POLICIES.filter(p => p.category === 'fertility'),
  medical: POLICIES.filter(p => p.category === 'medical'),
  education: POLICIES.filter(p => p.category === 'education'),
  economic: POLICIES.filter(p => p.category === 'economic'),
  social: POLICIES.filter(p => p.category === 'social'),
};

// 政策类别名称
export const POLICY_CATEGORY_NAMES = {
  fertility: '生育政策',
  medical: '医疗政策',
  education: '教育政策',
  economic: '经济政策',
  social: '社会政策',
};

import type { Policy } from '../store/types';

// 政策列表
export const POLICIES: Policy[] = [
  // ===== 生育政策 =====
  {
    id: 'family-planning',
    name: '计划生育',
    description: '控制人口增长，实施计划生育政策',
    cost: 500,
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
    cost: 1000,
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
    cost: 300,
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
    cost: 800,
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
    cost: 1500,
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
    cost: 1000,
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
    cost: 500,
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
    cost: 1200,
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
    cost: 800,
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
    cost: 2000,
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
    cost: 400,
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
    cost: 1000,
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
    cost: 200,
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
    cost: 900,
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
    cost: 600,
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

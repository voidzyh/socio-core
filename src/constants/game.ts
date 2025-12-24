import type { Occupation, Resources } from '../store/types';
import { POPULATION, DEATH_RATE, BIRTH_RATE } from './balance';

// 游戏时间常量
export const GAME_CONSTANTS = {
  MONTHS_PER_YEAR: 12,
  MAX_YEARS: 100,
  INITIAL_POPULATION: 50,
  INITIAL_AGE_MIN: 18,
  INITIAL_AGE_MAX: 75, // 增加最大年龄，包含更多老年人
} as const;

// 人口常量
export const POPULATION_CONSTANTS = {
  // 年龄限制
  MIN_AGE_FOR_MARRIAGE: 20,
  MAX_AGE_FOR_MARRIAGE: 35,
  MIN_AGE_FOR_CHILDBEARING: 18,
  MAX_AGE_FOR_CHILDBEARING: 45,
  ELDERLY_AGE: 60,

  // 生育率
  BASE_FERTILITY_RATE: 0.05, // 基础生育率 5%
  MAX_CHILDREN_PER_FAMILY: 5,

  // 死亡率
  BASE_DEATH_RATE: 0.001, // 基础月死亡率 0.1%（降低至合理水平）
  ELDERLY_DEATH_RATE_MULTIPLIER: 3, // 老年死亡率倍数
  LOW_HEALTH_DEATH_MULTIPLIER: 2, // 低健康死亡率倍数

  // 健康衰减
  HEALTH_DECAY_AGE_60: 0.1, // 60岁以上每月健康衰减
  HEALTH_DECAY_AGE_80: 0.3, // 80岁以上每月健康衰减

  // 教育消耗
  EDUCATION_AGE_START: 6,
  EDUCATION_AGE_END: 18,
} as const;

// 资源常量
export const RESOURCE_CONSTANTS = {
  // 初始资源
  INITIAL_FOOD: 200,
  INITIAL_HOUSING: 100,
  INITIAL_MEDICINE: 100,
  INITIAL_EDUCATION: 100,
  INITIAL_MONEY: 500,  // 降低初始资金，增加初期挑战

  // 每月消耗
  FOOD_PER_PERSON: 1,
  MEDICINE_PER_ELDERLY: 0.5,
  MEDICINE_PER_SICK: 1,
  EDUCATION_PER_STUDENT: 0.5,

  // 生产率
  FOOD_PER_FARMER: 5,
  RESEARCH_PER_SCIENTIST: 1,

  // 住房
  HOUSING_PER_PERSON: 1,
} as const;

// 职业分布（初始人口职业分配）
export const OCCUPATION_DISTRIBUTION: Record<Occupation, number> = {
  farmer: 0.5,      // 50%
  worker: 0.3,      // 30%
  scientist: 0.1,   // 10%
  unemployed: 0.1,  // 10%
};

// 游戏速度倍数
export const SPEED_MULTIPLIERS = {
  paused: 0,
  '1x': 1,
  '2x': 2,
  '5x': 5,
  '10x': 10,
} as const;

// Canvas 渲染常量
export const CANVAS_CONSTANTS = {
  PERSON_RADIUS: 5,
  PERSON_RADIUS_CHILD: 3,
  COLOR_MALE: '#3b82f6', // 蓝色
  COLOR_FEMALE: '#ec4899', // 粉色
  COLOR_MALE_YOUNG: '#60a5fa',
  COLOR_FEMALE_YOUNG: '#f472b6',
  COLOR_MALE_OLD: '#1e40af',
  COLOR_FEMALE_OLD: '#be185d',
  COLOR_DEAD: '#9ca3af', // 灰色
  BACKGROUND_COLOR: '#111827',
  HOVER_COLOR: '#fbbf24', // 黄色高亮
} as const;

// 创建初始资源
export function createInitialResources(): Resources {
  return {
    food: RESOURCE_CONSTANTS.INITIAL_FOOD,
    housing: RESOURCE_CONSTANTS.INITIAL_HOUSING,
    medicine: RESOURCE_CONSTANTS.INITIAL_MEDICINE,
    education: RESOURCE_CONSTANTS.INITIAL_EDUCATION,
    money: RESOURCE_CONSTANTS.INITIAL_MONEY,
    productionRate: {
      food: 0,
      money: 0,
      research: 0,
    },
  };
}

// 计算生育能力（基于年龄）
export function calculateFertility(age: number, gender: string): number {
  if (gender !== 'female') return 0;
  if (age < POPULATION.MIN_AGE_FOR_CHILDBEARING) return 0;
  if (age > POPULATION.MAX_AGE_FOR_CHILDBEARING) return 0;

  // 生育能力随年龄变化，峰值在 25-30 岁
  if (age >= BIRTH_RATE.PEAK_AGE_START && age <= BIRTH_RATE.PEAK_AGE_END) return 1.0;
  if (age >= 20 && age < BIRTH_RATE.PEAK_AGE_START) return 0.8;
  if (age >= (BIRTH_RATE.PEAK_AGE_END + 1) && age <= 35) return 0.7;
  if (age >= 36 && age <= 40) return 0.4;
  if (age >= 41) return 0.1;

  return 0;
}

// 计算死亡率（基于年龄和健康）
export function calculateDeathRate(age: number, health: number): number {
  let rate = DEATH_RATE.BASE;

  // 老年死亡率平缓增长（避免指数爆炸）
  if (age >= POPULATION.ELDERLY_AGE) {
    const elderlyYears = age - POPULATION.ELDERLY_AGE;
    rate *= (1 + elderlyYears * 0.1); // 每增加10岁，死亡率翻倍，而非指数增长
  }

  // 低健康死亡率增加
  if (health < 30) {
    rate *= DEATH_RATE.LOW_HEALTH_MULTIPLIER;
  } else if (health < 50) {
    rate *= 1.3; // 中低健康稍微增加死亡率
  }

  return rate;
}

// 生成随机ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

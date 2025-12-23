/**
 * ECS - 资源选择器
 * 提供记忆化的资源数据查询和派生状态计算
 */

import { useMemo } from 'react';
import { useResourceStore } from '../stores/ResourceStore';
import type { Resources } from '../../store/types';

/**
 * 资源状态摘要
 */
export interface ResourceSummary {
  food: number;
  money: number;
  education: number;
  medicine: number;
  hasFoodShortage: boolean;
  hasMoneyShortage: boolean;
  hasEducationShortage: boolean;
  hasMedicineShortage: boolean;
  hasAnyShortage: boolean;
}

/**
 * 资源生产预测
 */
export interface ProductionForecast {
  food: number;
  money: number;
  education: number;
  medicine: number;
}

/**
 * 基础选择器函数
 */
export const resourceSelectors = {
  // 获取所有资源
  getAllResources: (state: ReturnType<typeof useResourceStore.getState>): Resources => {
    return state.resources;
  },

  // 获取单个资源值
  getFood: (state: ReturnType<typeof useResourceStore.getState>): number => {
    return state.resources.food;
  },

  getMoney: (state: ReturnType<typeof useResourceStore.getState>): number => {
    return state.resources.money;
  },

  getEducation: (state: ReturnType<typeof useResourceStore.getState>): number => {
    return state.resources.education;
  },

  getMedicine: (state: ReturnType<typeof useResourceStore.getState>): number => {
    return state.resources.medicine;
  },

  // 检查短缺状态
  hasFoodShortage: (state: ReturnType<typeof useResourceStore.getState>): boolean => {
    return state.shortageStatus.food;
  },

  hasMoneyShortage: (state: ReturnType<typeof useResourceStore.getState>): boolean => {
    return state.shortageStatus.money;
  },

  hasEducationShortage: (state: ReturnType<typeof useResourceStore.getState>): boolean => {
    return state.shortageStatus.education;
  },

  hasMedicineShortage: (state: ReturnType<typeof useResourceStore.getState>): boolean => {
    return state.shortageStatus.medicine;
  },

  hasAnyShortage: (state: ReturnType<typeof useResourceStore.getState>): boolean => {
    return Object.values(state.shortageStatus).some(status => status);
  },

  // 获取资源摘要
  getResourceSummary: (state: ReturnType<typeof useResourceStore.getState>): ResourceSummary => {
    return {
      food: state.resources.food,
      money: state.resources.money,
      education: state.resources.education,
      medicine: state.resources.medicine,
      hasFoodShortage: state.shortageStatus.food,
      hasMoneyShortage: state.shortageStatus.money,
      hasEducationShortage: state.shortageStatus.education,
      hasMedicineShortage: state.shortageStatus.medicine,
      hasAnyShortage: resourceSelectors.hasAnyShortage(state),
    };
  },

  // 计算预测产量（根据当前生产率和季节修正）
  calculateProduction: (
    state: ReturnType<typeof useResourceStore.getState>,
    population: number
  ): ProductionForecast => {
    const seasonalMod = state.seasonalModifier;

    return {
      food: population * state.productionRates.food * seasonalMod,
      money: population * state.productionRates.money,
      education: population * state.productionRates.education,
      medicine: population * state.productionRates.medicine,
    };
  },

  // 计算资源自给率（产量 / 消耗量）
  calculateSufficiency: (
    state: ReturnType<typeof useResourceStore.getState>,
    population: number
  ): { food: number; money: number; education: number; medicine: number } => {
    // 假设每人每月消耗
    const consumptionPerPerson = {
      food: 10,
      money: 0,
      education: 0.5,
      medicine: 0.3,
    };

    const production = resourceSelectors.calculateProduction(state, population);

    return {
      food: production.food / (population * consumptionPerPerson.food),
      money: production.money / (population * consumptionPerPerson.money || 1),
      education: production.education / (population * consumptionPerPerson.education),
      medicine: production.medicine / (population * consumptionPerPerson.medicine),
    };
  },
};

/**
 * 记忆化Selector Hooks
 */

// 获取所有资源
export const useResources = (): Resources => {
  return useResourceStore(state => state.resources);
};

// 获取食物数量
export const useFood = (): number => {
  return useResourceStore(state => state.resources.food);
};

// 获取资金数量
export const useMoney = (): number => {
  return useResourceStore(state => state.resources.money);
};

// 获取教育数量
export const useEducation = (): number => {
  return useResourceStore(state => state.resources.education);
};

// 获取医疗数量
export const useMedicine = (): number => {
  return useResourceStore(state => state.resources.medicine);
};

// 获取资源摘要
export const useResourceSummary = (): ResourceSummary => {
  const store = useResourceStore();
  return useMemo(
    () => resourceSelectors.getResourceSummary(store),
    [store.resources, store.shortageStatus]
  );
};

// 获取短缺状态
export const useShortageStatus = () => {
  return useResourceStore(state => state.shortageStatus);
};

// 检查是否有食物短缺
export const useHasFoodShortage = (): boolean => {
  return useResourceStore(state => state.shortageStatus.food);
};

// 检查是否有资金短缺
export const useHasMoneyShortage = (): boolean => {
  return useResourceStore(state => state.shortageStatus.money);
};

// 检查是否有任何短缺
export const useHasAnyShortage = (): boolean => {
  const store = useResourceStore();
  return useMemo(
    () => resourceSelectors.hasAnyShortage(store),
    [store.shortageStatus]
  );
};

// 计算生产预测
export const useProductionForecast = (population: number): ProductionForecast => {
  const store = useResourceStore();
  return useMemo(
    () => resourceSelectors.calculateProduction(store, population),
    [store.productionRates, store.seasonalModifier, population]
  );
};

// 计算资源自给率
export const useResourceSufficiency = (population: number) => {
  const store = useResourceStore();
  return useMemo(
    () => resourceSelectors.calculateSufficiency(store, population),
    [store.productionRates, store.seasonalModifier, population]
  );
};

// 获取季节修正值
export const useSeasonalModifier = (): number => {
  return useResourceStore(state => state.seasonalModifier);
};

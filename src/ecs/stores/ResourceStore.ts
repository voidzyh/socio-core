/**
 * ECS - ResourceStore（资源状态管理）
 * 管理资源相关状态和操作
 */

import { create } from 'zustand';
import type { Resources } from '../../store/types';
import { createInitialResources } from '../../constants/game';

/**
 * 生产率配置
 */
export interface ProductionRates {
  food: number; // 每人每月食物产量
  money: number; // 每人每月资金收入
  education: number; // 每人每月教育产出
  medicine: number; // 每人每月医疗产出
}

/**
 * 短缺状态
 */
export interface ShortageStatus {
  food: boolean;
  money: boolean;
  education: boolean;
  medicine: boolean;
}

/**
 * 资源Store状态
 */
interface ResourceState {
  // 资源数据
  resources: Resources;

  // 生产率
  productionRates: ProductionRates;

  // 短缺状态
  shortageStatus: ShortageStatus;

  // 季节修正值（用于计算）
  seasonalModifier: number;
}

/**
 * 资源Store操作
 */
interface ResourceActions {
  // 资源更新
  updateResources: (updates: Partial<Resources>) => void;
  setResources: (resources: Resources) => void;

  // 生产率管理
  setProductionRates: (rates: Partial<ProductionRates>) => void;

  // 短缺状态更新
  updateShortageStatus: (status: Partial<ShortageStatus>) => void;

  // 季节修正
  setSeasonalModifier: (month: number) => void;

  // 批量资源更新（性能优化）
  batchUpdate: (updates: {
    resources?: Partial<Resources>;
    productionRates?: Partial<ProductionRates>;
    shortageStatus?: Partial<ShortageStatus>;
  }) => void;

  // 重置
  reset: () => void;
}

/**
 * 默认生产率
 */
const defaultProductionRates: ProductionRates = {
  food: 10,
  money: 5,
  education: 1,
  medicine: 0.5,
};

/**
 * 资源Store
 */
export const useResourceStore = create<ResourceState & ResourceActions>((set, get) => ({
  // 初始状态
  resources: createInitialResources(),
  productionRates: defaultProductionRates,
  shortageStatus: {
    food: false,
    money: false,
    education: false,
    medicine: false,
  },
  seasonalModifier: 1.0,

  // 更新资源
  updateResources: (updates) => {
    const state = get();
    set({
      resources: { ...state.resources, ...updates },
    });
  },

  // 设置资源
  setResources: (resources) => {
    set({ resources });
  },

  // 设置生产率
  setProductionRates: (rates) => {
    const state = get();
    set({
      productionRates: { ...state.productionRates, ...rates },
    });
  },

  // 更新短缺状态
  updateShortageStatus: (status) => {
    const state = get();
    set({
      shortageStatus: { ...state.shortageStatus, ...status },
    });
  },

  // 设置季节修正
  setSeasonalModifier: (month) => {
    // 春季(2-7月)产量+20%，其他月份-20%
    const modifier = (month >= 2 && month <= 7) ? 1.2 : 0.8;
    set({ seasonalModifier: modifier });
  },

  // 批量更新
  batchUpdate: (updates) => {
    const state = get();
    const newState: Partial<ResourceState> = {};

    if (updates.resources) {
      newState.resources = { ...state.resources, ...updates.resources };
    }

    if (updates.productionRates) {
      newState.productionRates = { ...state.productionRates, ...updates.productionRates };
    }

    if (updates.shortageStatus) {
      newState.shortageStatus = { ...state.shortageStatus, ...updates.shortageStatus };
    }

    set(newState as Partial<ResourceState>);
  },

  // 重置
  reset: () => {
    set({
      resources: createInitialResources(),
      productionRates: defaultProductionRates,
      shortageStatus: {
        food: false,
        money: false,
        education: false,
        medicine: false,
      },
      seasonalModifier: 1.0,
    });
  },
}));

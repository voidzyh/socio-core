/**
 * ECS - PolicyStore（政策状态管理）
 * 管理政策相关状态和操作
 */

import { create } from 'zustand';
import type { Policy } from '../../store/types';
import { POLICIES } from '../../constants/policies';

/**
 * 政策状态
 */
interface PolicyState {
  // 所有政策
  policies: Policy[];

  // 激活的政策ID列表
  activePolicies: string[];

  // 政策效果缓存
  currentEffects: {
    fertilityRate: number;
    deathRate: number;
    foodProduction: number;
    economy: number;
    medicineConsumption: number;
  };
}

/**
 * 政策Store操作
 */
interface PolicyActions {
  // 激活政策
  activatePolicy: (policyId: string, currentMoney: number) => { success: boolean; cost: number };

  // 停用政策
  deactivatePolicy: (policyId: string) => boolean;

  // 更新政策持续时间
  updateDurations: () => void;

  // 检查政策是否激活
  isPolicyActive: (policyId: string) => boolean;

  // 获取激活的政策列表
  getActivePolicies: () => Policy[];

  // 计算当前政策效果
  calculateEffects: () => void;

  // 重置
  reset: () => void;
}

/**
 * 初始化政策（深拷贝以避免修改原数据）
 */
function initializePolicies(): Policy[] {
  return POLICIES.map(p => ({ ...p }));
}

/**
 * 政策Store
 */
export const usePolicyStore = create<PolicyState & PolicyActions>((set, get) => ({
  // 初始状态
  policies: initializePolicies(),
  activePolicies: [],
  currentEffects: {
    fertilityRate: 0,
    deathRate: 0,
    foodProduction: 0,
    economy: 0,
    medicineConsumption: 0,
  },

  // 激活政策
  activatePolicy: (policyId, currentMoney) => {
    const state = get();
    const policy = state.policies.find(p => p.id === policyId);

    if (!policy || state.activePolicies.includes(policyId)) {
      return { success: false, cost: 0 };
    }

    // 检查资金是否足够
    if (currentMoney < policy.cost) {
      return { success: false, cost: policy.cost };
    }

    // 激活政策
    const newPolicies = state.policies.map(p =>
      p.id === policyId ? { ...p, active: true } : p
    );

    set({
      policies: newPolicies,
      activePolicies: [...state.activePolicies, policyId],
    });

    // 重新计算效果
    get().calculateEffects();

    return { success: true, cost: policy.cost };
  },

  // 停用政策
  deactivatePolicy: (policyId) => {
    const state = get();
    const policy = state.policies.find(p => p.id === policyId);

    if (!policy || !state.activePolicies.includes(policyId)) {
      return false;
    }

    // 停用政策
    const newPolicies = state.policies.map(p =>
      p.id === policyId ? { ...p, active: false, duration: p.initialDuration } : p
    );

    set({
      policies: newPolicies,
      activePolicies: state.activePolicies.filter(id => id !== policyId),
    });

    // 重新计算效果
    get().calculateEffects();

    return true;
  },

  // 更新政策持续时间
  updateDurations: () => {
    const state = get();
    const policiesToDeactivate: string[] = [];

    const newPolicies = state.policies.map(policy => {
      if (policy.active && policy.duration) {
        const newDuration = policy.duration - 1;
        if (newDuration <= 0) {
          policiesToDeactivate.push(policy.id);
          return { ...policy, active: false, duration: 0 };
        }
        return { ...policy, duration: newDuration };
      }
      return policy;
    });

    set({
      policies: newPolicies,
      activePolicies: state.activePolicies.filter(
        id => !policiesToDeactivate.includes(id)
      ),
    });

    // 如果有政策停用，重新计算效果
    if (policiesToDeactivate.length > 0) {
      get().calculateEffects();
    }
  },

  // 检查政策是否激活
  isPolicyActive: (policyId) => {
    return get().activePolicies.includes(policyId);
  },

  // 获取激活的政策列表
  getActivePolicies: () => {
    const state = get();
    return state.policies.filter(p => state.activePolicies.includes(p.id));
  },

  // 计算当前政策效果
  calculateEffects: () => {
    const state = get();
    const effects = {
      fertilityRate: 0,
      deathRate: 0,
      foodProduction: 0,
      economy: 0,
      medicineConsumption: 0,
    };

    // 累加所有激活政策的效果
    state.policies.forEach(policy => {
      if (!policy.active) return;

      if (policy.effects.fertilityRate) {
        effects.fertilityRate += policy.effects.fertilityRate;
      }
      if (policy.effects.deathRate) {
        effects.deathRate += policy.effects.deathRate;
      }
      if (policy.effects.foodProduction) {
        effects.foodProduction += policy.effects.foodProduction;
      }
      if (policy.effects.economy) {
        effects.economy += policy.effects.economy;
      }
      if (policy.effects.medicineConsumption) {
        effects.medicineConsumption += policy.effects.medicineConsumption;
      }
    });

    set({ currentEffects: effects });
  },

  // 重置
  reset: () => {
    set({
      policies: initializePolicies(),
      activePolicies: [],
      currentEffects: {
        fertilityRate: 0,
        deathRate: 0,
        foodProduction: 0,
        economy: 0,
        medicineConsumption: 0,
      },
    });
  },
}));

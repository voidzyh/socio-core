/**
 * ECS - 政策选择器
 * 提供记忆化的政策数据查询
 */

import { useMemo } from 'react';
import { usePolicyStore } from '../stores/PolicyStore';
import type { Policy } from '../../store/types';

/**
 * 基础选择器函数
 */
export const policySelectors = {
  // 获取所有政策
  getAllPolicies: (state: ReturnType<typeof usePolicyStore.getState>): Policy[] => {
    return state.policies;
  },

  // 获取激活的政策
  getActivePolicies: (state: ReturnType<typeof usePolicyStore.getState>): Policy[] => {
    return state.policies.filter(p => p.active);
  },

  // 获取可激活的政策（未激活且资金足够）
  getAvailablePolicies: (
    state: ReturnType<typeof usePolicyStore.getState>,
    currentMoney: number
  ): Policy[] => {
    return state.policies.filter(p => !p.active && p.cost <= currentMoney);
  },

  // 获取政策效果
  getPolicyEffects: (state: ReturnType<typeof usePolicyStore.getState>) => {
    return state.currentEffects;
  },

  // 计算激活政策总数
  getActivePolicyCount: (state: ReturnType<typeof usePolicyStore.getState>): number => {
    return state.activePolicies.length;
  },

  // 检查政策是否激活
  isPolicyActive: (
    state: ReturnType<typeof usePolicyStore.getState>,
    policyId: string
  ): boolean => {
    return state.activePolicies.includes(policyId);
  },
};

/**
 * 记忆化Selector Hooks
 */

// 获取所有政策
export const useAllPolicies = (): Policy[] => {
  return usePolicyStore(state => state.policies);
};

// 获取激活的政策
export const useActivePolicies = (): Policy[] => {
  const store = usePolicyStore();
  return useMemo(
    () => policySelectors.getActivePolicies(store),
    [store.activePolicies]
  );
};

// 获取可激活的政策
export const useAvailablePolicies = (currentMoney: number): Policy[] => {
  const store = usePolicyStore();
  return useMemo(
    () => policySelectors.getAvailablePolicies(store, currentMoney),
    [store.policies, currentMoney]
  );
};

// 获取政策效果
export const usePolicyEffects = () => {
  return usePolicyStore(state => state.currentEffects);
};

// 获取激活政策数量
export const useActivePolicyCount = (): number => {
  return usePolicyStore(state => state.activePolicies.length);
};

// 检查特定政策是否激活
export const useIsPolicyActive = (policyId: string): boolean => {
  const store = usePolicyStore();
  return useMemo(
    () => policySelectors.isPolicyActive(store, policyId),
    [store.activePolicies, policyId]
  );
};

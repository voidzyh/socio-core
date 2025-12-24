/**
 * ECS - PolicySystem（政策系统）
 * 管理政策的激活、停用和效果应用
 */

import { System } from '../core/System';
import type { World } from '../core/World';
import type { Policy } from '../../store/types';
import { POLICIES } from '../../constants/policies';

/**
 * 政策状态
 */
interface PolicyState {
  policy: Policy;
  activeMonth: number; // 激活月份（用于计算持续时间）
}

/**
 * 政策系统
 * 管理所有政策的生命周期和效果
 */
export class PolicySystem extends System {
  readonly name = 'PolicySystem';
  readonly priority = 60; // 中等优先级

  // 政策状态管理
  private policyStates: Map<string, PolicyState> = new Map();

  // 初始化政策状态
  constructor() {
    super();
    POLICIES.forEach(policy => {
      this.policyStates.set(policy.id, {
        policy: { ...policy },
        activeMonth: 0,
      });
    });
  }

  /**
   * 每月更新政策持续时间
   */
  update(_deltaTime: number): void {
    const world = this.getWorld();
    const currentMonth = this.getCurrentMonth(world);

    // 更新政策持续时间
    this.updateDurations(currentMonth);

    // 计算当前活跃政策的总效果
    const activeEffects = this.calculateActiveEffects();

    // 发出政策效果事件（其他系统监听并应用）
    world.getEventBus().emit('policy:effects', {
      effects: activeEffects,
      activePolicies: this.getActivePolicyIds(),
      month: currentMonth,
    });
  }

  /**
   * 激活政策
   */
  activatePolicy(policyId: string, currentMoney: number): { success: boolean; cost: number } {
    const policyState = this.policyStates.get(policyId);
    if (!policyState) {
      return { success: false, cost: 0 };
    }

    const policy = policyState.policy;

    // 检查是否已激活
    if (policy.active) {
      return { success: false, cost: 0 };
    }

    // 检查资金是否足够
    if (currentMoney < policy.cost) {
      return { success: false, cost: policy.cost };
    }

    // 激活政策
    policy.active = true;
    policyState.activeMonth = this.getCurrentMonth(this.getWorld() as World);

    // 发出政策激活事件
    this.getWorld().getEventBus().emit('policy:activated', {
      policyId,
      policy,
      cost: policy.cost,
    });

    return { success: true, cost: policy.cost };
  }

  /**
   * 停用政策
   */
  deactivatePolicy(policyId: string): boolean {
    const policyState = this.policyStates.get(policyId);
    if (!policyState || !policyState.policy.active) {
      return false;
    }

    // 停用政策
    policyState.policy.active = false;
    policyState.activeMonth = 0;

    // 发出政策停用事件
    this.getWorld().getEventBus().emit('policy:deactivated', {
      policyId,
      policy: policyState.policy,
    });

    return true;
  }

  /**
   * 更新政策持续时间
   */
  private updateDurations(currentMonth: number): void {
    const policiesToDeactivate: string[] = [];

    this.policyStates.forEach((state, policyId) => {
      const policy = state.policy;

      if (!policy.active || !policy.duration) return;

      // 计算已激活的月数
      const monthsActive = currentMonth - state.activeMonth;

      // 检查是否到期
      if (monthsActive >= policy.duration) {
        policiesToDeactivate.push(policyId);
      }
    });

    // 停用到期的政策
    policiesToDeactivate.forEach(policyId => {
      this.deactivatePolicy(policyId);
      // 发出政策到期事件
      this.getWorld().getEventBus().emit('policy:expired', {
        policyId,
      });
    });
  }

  /**
   * 计算当前活跃政策的总效果
   */
  private calculateActiveEffects(): PolicyEffects {
    const effects: PolicyEffects = {
      fertilityRate: 0,
      deathRate: 0,
      foodProduction: 0,
      economy: 0,
      medicineConsumption: 0,
    };

    this.policyStates.forEach(state => {
      const policy = state.policy;
      if (!policy.active) return;

      // 累加效果
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

    return effects;
  }

  /**
   * 获取所有政策
   */
  getPolicies(): Policy[] {
    return Array.from(this.policyStates.values()).map(state => state.policy);
  }

  /**
   * 获取活跃政策ID列表
   */
  getActivePolicyIds(): string[] {
    return Array.from(this.policyStates.values())
      .filter(state => state.policy.active)
      .map(state => state.policy.id);
  }

  /**
   * 获取活跃政策列表
   */
  getActivePolicies(): Policy[] {
    return Array.from(this.policyStates.values())
      .filter(state => state.policy.active)
      .map(state => state.policy);
  }

  /**
   * 检查政策是否激活
   */
  isPolicyActive(policyId: string): boolean {
    const state = this.policyStates.get(policyId);
    return state ? state.policy.active : false;
  }

  /**
   * 获取政策剩余持续时间
   */
  getPolicyRemainingDuration(policyId: string, currentMonth: number): number | null {
    const state = this.policyStates.get(policyId);
    if (!state || !state.policy.active || !state.policy.duration) {
      return null;
    }

    const monthsActive = currentMonth - state.activeMonth;
    return Math.max(0, state.policy.duration - monthsActive);
  }

  /**
   * 重置所有政策
   */
  reset(): void {
    this.policyStates.forEach(state => {
      state.policy.active = false;
      state.activeMonth = 0;
    });
  }

  /**
   * 获取当前月份
   */
  private getCurrentMonth(world: World): number {
    return world.getTotalMonths();
  }
}

/**
 * 政策效果聚合
 */
export interface PolicyEffects {
  fertilityRate: number; // 生育率修正
  deathRate: number; // 死亡率修正
  foodProduction: number; // 食物产出修正
  economy: number; // 经济修正（资金）
  medicineConsumption: number; // 医疗消耗修正
}

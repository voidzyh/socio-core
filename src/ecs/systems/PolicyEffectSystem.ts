/**
 * ECS - PolicyEffectSystem（政策效果系统）
 * 将政策效果应用到各个系统
 */

import { System } from '../core/System';
import type { World } from '../core/World';
import type { PolicyEffects } from './PolicySystem';

/**
 * 政策效果系统
 * 负责将政策效果应用到游戏状态
 */
export class PolicyEffectSystem extends System {
  readonly name = 'PolicyEffectSystem';
  readonly priority = 65; // 在PolicySystem之后执行

  private currentEffects: PolicyEffects = {
    fertilityRate: 0,
    deathRate: 0,
    foodProduction: 0,
    economy: 0,
    medicineConsumption: 0,
  };

  /**
   * 初始化系统
   */
  initialize(world: World): void {
    super.initialize(world);

    // 监听政策效果事件
    world.getEventBus().on('policy:effects', (data: any) => {
      this.currentEffects = data.effects;
    });
  }

  /**
   * 更新系统（可选，如果需要每帧执行逻辑）
   */
  update(deltaTime: number): void {
    // 政策效果主要通过EventBus传递
    // 这里可以添加一些持续性效果的应用逻辑
  }

  /**
   * 获取当前政策效果
   */
  getCurrentEffects(): PolicyEffects {
    return this.currentEffects;
  }

  /**
   * 获取生育率修正
   */
  getFertilityRateModifier(): number {
    return this.currentEffects.fertilityRate;
  }

  /**
   * 获取死亡率修正
   */
  getDeathRateModifier(): number {
    return this.currentEffects.deathRate;
  }

  /**
   * 获取食物产出修正
   */
  getFoodProductionModifier(): number {
    return this.currentEffects.foodProduction;
  }

  /**
   * 获取经济修正
   */
  getEconomyModifier(): number {
    return this.currentEffects.economy;
  }

  /**
   * 获取医疗消耗修正
   */
  getMedicineConsumptionModifier(): number {
    return this.currentEffects.medicineConsumption;
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    // 取消事件监听
    if (this.world) {
      this.world.getEventBus().off('policy:effects');
    }
  }
}

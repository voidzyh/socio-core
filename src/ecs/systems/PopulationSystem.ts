/**
 * ECS - PopulationSystem（人口系统）
 * 协调人口相关系统的执行
 * 注意：具体的生育、死亡、婚姻逻辑已移至独立的子系统处理
 */

import { System, type ISystem } from '../core/System';

/**
 * 人口系统
 * 作为协调器，确保人口相关的各个子系统正确执行
 * 具体逻辑由以下独立系统处理：
 * - AgingSystem: 年龄增长和健康衰减
 * - DeathSystem: 死亡判定（含政策修正）
 * - BirthSystem: 生育逻辑（含政策修正）
 * - MarriageSystem: 婚姻匹配
 */
export class PopulationSystem extends System implements ISystem {
  readonly name = 'PopulationSystem';
  readonly priority = 100; // 最高优先级，首先执行

  constructor() {
    super();
  }

  /**
   * 每月更新人口
   * 注意：具体的生育、死亡、婚姻逻辑已移至独立系统处理
   */
  update(_deltaTime: number): void {
    // 人口逻辑由独立系统处理：
    // - AgingSystem (priority 100): 年龄增长和健康衰减
    // - DeathSystem (priority 95): 死亡判定
    // - BirthSystem (priority 90):生育逻辑
    // - MarriageSystem (priority 85): 婚姻匹配

    // 这里可以添加人口统计、事件监听等协调逻辑
    // 例如：监听子系统的发出的事件并更新统计数据
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    // 暂无需要清理的资源
  }
}

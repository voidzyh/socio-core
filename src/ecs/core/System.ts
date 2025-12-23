/**
 * ECS - System（系统层）
 * 系统包含逻辑，操作具有特定组件组合的实体
 */

import type { World } from './World';

/**
 * 系统接口
 * 所有系统必须实现此接口
 */
export interface ISystem {
  /**
   * 系统名称（唯一标识符）
   */
  readonly name: string;

  /**
   * 系统优先级（数字越大越先执行）
   */
  readonly priority: number;

  /**
   * 初始化系统
   * @param world World实例
   */
  initialize(world: World): void;

  /**
   * 每帧更新
   * @param deltaTime 时间增量（秒）
   */
  update(deltaTime: number): void;

  /**
   * 清理资源（可选）
   */
  cleanup?: () => void;
}

/**
 * 系统基类
 * 提供默认实现，简化系统创建
 */
export abstract class System implements ISystem {
  abstract readonly name: string;
  readonly priority: number = 0;

  protected world: World | null = null;

  initialize(world: World): void {
    this.world = world;
  }

  abstract update(deltaTime: number): void;

  /**
   * 获取World实例
   */
  protected getWorld(): World {
    if (!this.world) {
      throw new Error(`System ${this.name} not initialized`);
    }
    return this.world;
  }
}

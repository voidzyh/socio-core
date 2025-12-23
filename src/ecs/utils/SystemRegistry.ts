/**
 * ECS - SystemRegistry（系统注册表）
 * 管理所有系统的注册、移除和更新
 */

import type { ISystem } from '../core/System';

/**
 * 系统注册表
 * 负责管理系统的生命周期和执行顺序
 */
export class SystemRegistry {
  private systems: Map<string, ISystem> = new Map();

  /**
   * 添加系统
   */
  add(system: ISystem): void {
    if (this.systems.has(system.name)) {
      throw new Error(`System ${system.name} already registered`);
    }
    this.systems.set(system.name, system);
  }

  /**
   * 移除系统
   */
  remove(name: string): void {
    const system = this.systems.get(name);
    if (system) {
      // 调用清理方法
      if (system.cleanup) {
        system.cleanup();
      }
      this.systems.delete(name);
    }
  }

  /**
   * 获取系统
   */
  get(name: string): ISystem | undefined {
    return this.systems.get(name);
  }

  /**
   * 检查系统是否存在
   */
  has(name: string): boolean {
    return this.systems.has(name);
  }

  /**
   * 获取所有系统
   */
  getAll(): ISystem[] {
    return Array.from(this.systems.values());
  }

  /**
   * 更新所有系统
   * 按优先级从高到低执行
   */
  updateAll(deltaTime: number): void {
    // 按优先级排序（数字越大越先执行）
    const sorted = Array.from(this.systems.values()).sort(
      (a, b) => b.priority - a.priority
    );

    sorted.forEach(system => {
      try {
        system.update(deltaTime);
      } catch (error) {
        console.error(`Error in system ${system.name}:`, error);
      }
    });
  }

  /**
   * 清除所有系统
   */
  clear(): void {
    this.systems.forEach(system => {
      if (system.cleanup) {
        system.cleanup();
      }
    });
    this.systems.clear();
  }

  /**
   * 获取系统数量
   */
  get size(): number {
    return this.systems.size;
  }
}

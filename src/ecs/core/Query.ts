/**
 * ECS - Query（查询系统）
 * 用于根据组件类型筛选实体
 */

import type { Entity, ComponentType } from './Entity';
import type { World } from './World';

/**
 * 查询类
 * 根据组件类型筛选实体
 */
export class Query {
  private cacheKey: string;

  constructor(
    private readonly requiredComponents: ComponentType[],
    private readonly excludedComponents: ComponentType[] = []
  ) {
    // 生成缓存键
    this.cacheKey = this.generateCacheKey();
  }

  /**
   * 执行查询
   */
  execute(world: World): Entity[] {
    return world.getEntities().filter(entity =>
      this.hasAllComponents(entity) &&
      this.hasNoExcludedComponents(entity)
    );
  }

  /**
   * 检查实体是否包含所有必需组件
   */
  private hasAllComponents(entity: Entity): boolean {
    return this.requiredComponents.every(type =>
      entity.hasComponent(type)
    );
  }

  /**
   * 检查实体是否不包含任何排除组件
   */
  private hasNoExcludedComponents(entity: Entity): boolean {
    return this.excludedComponents.every(type =>
      !entity.hasComponent(type)
    );
  }

  /**
   * 获取缓存键
   */
  getCacheKey(): string {
    return this.cacheKey;
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(): string {
    const required = this.requiredComponents.join(',');
    const excluded = this.excludedComponents.map(c => `!${c}`).join(',');
    return `${required}|${excluded}`;
  }
}

/**
 * 查询构建器
 * 提供链式API构建查询
 */
export class QueryBuilder {
  private required: ComponentType[] = [];
  private excluded: ComponentType[] = [];

  /**
   * 要求实体包含指定组件
   */
  require(...types: ComponentType[]): QueryBuilder {
    this.required.push(...types);
    return this;
  }

  /**
   * 要求实体不包含指定组件
   */
  exclude(...types: ComponentType[]): QueryBuilder {
    this.excluded.push(...types);
    return this;
  }

  /**
   * 构建查询对象
   */
  build(): Query {
    return new Query(this.required, this.excluded);
  }
}

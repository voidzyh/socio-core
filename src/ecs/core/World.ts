/**
 * ECS - World（世界管理器）
 * 协调所有实体、组件和系统
 */

import { Entity } from './Entity';
import type { EntityID, ComponentType, Component } from './Entity';
import type { ISystem } from './System';
import type { Query } from './Query';
import { EventBus } from './EventBus';
import { SystemRegistry } from '../utils/SystemRegistry';

/**
 * World类
 * 是ECS架构的核心，管理整个游戏世界
 */
export class World {
  private entities: Map<EntityID, Entity> = new Map();
  private components: Map<ComponentType, Map<EntityID, Component>> = new Map();
  private systems: SystemRegistry = new SystemRegistry();
  private eventBus: EventBus;
  private entityIdCounter: number = 0;

  // 游戏时间状态
  private currentMonth: number = 0;
  private currentYear: number = 0;
  private totalMonths: number = 0;

  constructor() {
    this.eventBus = new EventBus();
  }

  // ========== 实体管理 ==========

  /**
   * 创建新实体
   */
  createEntity(): Entity {
    const id = this.generateEntityId();
    const entity = new Entity(id);
    this.entities.set(id, entity);
    this.eventBus.emit('entity:created', { entityId: id });
    return entity;
  }

  /**
   * 销毁实体
   */
  destroyEntity(id: EntityID): void {
    const entity = this.entities.get(id);
    if (!entity) return;

    // 移除所有组件
    entity.components.forEach(type => {
      this.removeComponent(id, type);
    });

    this.entities.delete(id);
    this.eventBus.emit('entity:destroyed', { entityId: id });
  }

  /**
   * 获取实体
   */
  getEntity(id: EntityID): Entity | undefined {
    return this.entities.get(id);
  }

  /**
   * 获取所有实体
   */
  getEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  /**
   * 检查实体是否存在
   */
  hasEntity(id: EntityID): boolean {
    return this.entities.has(id);
  }

  /**
   * 获取实体数量
   */
  getEntityCount(): number {
    return this.entities.size;
  }

  // ========== 组件管理 ==========

  /**
   * 添加组件到实体
   */
  addComponent<T extends Component>(
    entityId: EntityID,
    type: ComponentType,
    component: T
  ): void {
    const entity = this.entities.get(entityId);
    if (!entity) {
      throw new Error(`Entity ${entityId} not found`);
    }

    // 创建组件Map（如果不存在）
    if (!this.components.has(type)) {
      this.components.set(type, new Map());
    }

    // 添加组件数据
    this.components.get(type)!.set(entityId, component);
    entity.addComponent(type);

    this.eventBus.emit('component:added', { entityId, type, component });
  }

  /**
   * 获取实体组件
   */
  getComponent<T extends Component>(
    entityId: EntityID,
    type: ComponentType
  ): T | undefined {
    return this.components.get(type)?.get(entityId) as T;
  }

  /**
   * 检查实体是否有组件
   */
  hasComponent(entityId: EntityID, type: ComponentType): boolean {
    const entity = this.entities.get(entityId);
    return entity ? entity.hasComponent(type) : false;
  }

  /**
   * 更新实体组件
   */
  updateComponent<T extends Component>(
    entityId: EntityID,
    type: ComponentType,
    updates: Partial<T>
  ): void {
    const component = this.getComponent<T>(entityId, type);
    if (!component) {
      throw new Error(`Component ${type} not found on entity ${entityId}`);
    }

    Object.assign(component, updates);
    this.eventBus.emit('component:updated', { entityId, type });
  }

  /**
   * 移除实体组件
   */
  removeComponent(entityId: EntityID, type: ComponentType): void {
    const entity = this.entities.get(entityId);
    if (!entity) return;

    this.components.get(type)?.delete(entityId);
    entity.removeComponent(type);

    this.eventBus.emit('component:removed', { entityId, type });
  }

  /**
   * 获取所有指定类型的组件
   */
  getComponentsByType<T extends Component>(type: ComponentType): Map<EntityID, T> {
    const components = this.components.get(type);
    return components as Map<EntityID, T> || new Map();
  }

  // ========== 查询系统 ==========

  /**
   * 执行查询
   */
  query(query: Query): Entity[] {
    return query.execute(this);
  }

  // ========== 系统管理 ==========

  /**
   * 添加系统
   */
  addSystem(system: ISystem): void {
    this.systems.add(system);
    system.initialize(this);
    this.eventBus.emit('system:added', { systemName: system.name });
  }

  /**
   * 移除系统
   */
  removeSystem(systemName: string): void {
    this.systems.remove(systemName);
    this.eventBus.emit('system:removed', { systemName });
  }

  /**
   * 获取系统
   */
  getSystem(name: string): ISystem | undefined {
    return this.systems.get(name);
  }

  /**
   * 检查系统是否存在
   */
  hasSystem(name: string): boolean {
    return this.systems.has(name);
  }

  /**
   * 获取所有系统
   */
  getSystems(): ISystem[] {
    return this.systems.getAll();
  }

  // ========== 游戏循环 ==========

  /**
   * 更新世界
   * 按优先级顺序执行所有系统
   */
  update(deltaTime: number): void {
    this.systems.updateAll(deltaTime);
  }

  // ========== 事件系统 ==========

  /**
   * 获取事件总线
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }

  // ========== 时间管理 ==========

  /**
   * 获取当前月份（0-11）
   */
  getCurrentMonth(): number {
    return this.currentMonth;
  }

  /**
   * 获取当前年份
   */
  getCurrentYear(): number {
    return this.currentYear;
  }

  /**
   * 获取总月数
   */
  getTotalMonths(): number {
    return this.totalMonths;
  }

  /**
   * 推进时间
   * @param months 要推进的月数
   */
  advanceTime(months: number): void {
    this.totalMonths += months;
    const newTotalMonth = this.totalMonths;
    this.currentYear = Math.floor(newTotalMonth / 12);
    this.currentMonth = newTotalMonth % 12;

    // 发出时间推进事件
    this.eventBus.emit('time:advanced', {
      totalMonths: this.totalMonths,
      currentYear: this.currentYear,
      currentMonth: this.currentMonth,
      advancedMonths: months,
    });
  }

  /**
   * 重置时间
   */
  resetTime(): void {
    this.currentMonth = 0;
    this.currentYear = 0;
    this.totalMonths = 0;
    this.eventBus.emit('time:reset', {});
  }

  // ========== 工具方法 ==========

  /**
   * 生成实体ID
   */
  private generateEntityId(): EntityID {
    return `entity-${Date.now()}-${this.entityIdCounter++}`;
  }

  /**
   * 清除所有实体、组件和系统
   */
  clear(): void {
    // 清除所有实体
    this.entities.forEach(entity => {
      entity.components.forEach(type => {
        this.removeComponent(entity.id, type);
      });
    });
    this.entities.clear();

    // 清除所有组件
    this.components.clear();

    // 清除所有系统
    this.systems.clear();

    // 清除事件监听器
    this.eventBus.clear();

    this.entityIdCounter = 0;
  }

  /**
   * 获取世界统计信息
   */
  getStats() {
    return {
      entityCount: this.entities.size,
      systemCount: this.systems.size,
      componentTypes: this.components.size,
    };
  }
}

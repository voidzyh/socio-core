/**
 * ECS - Entity（实体层）
 * 实体只是唯一标识符，不包含数据和逻辑
 */

export type EntityID = string;
export type ComponentType = string;

/**
 * 实体类
 * 实体代表游戏世界中的一个对象，本身只包含ID和组件类型集合
 * 所有数据存储在组件中，所有逻辑在系统中处理
 */
export class Entity {
  readonly id: EntityID;
  readonly components: Set<ComponentType> = new Set();

  constructor(id: EntityID) {
    this.id = id;
  }

  /**
   * 检查实体是否包含指定类型的组件
   */
  hasComponent(type: ComponentType): boolean {
    return this.components.has(type);
  }

  /**
   * 添加组件类型到实体（由World调用）
   */
  addComponent(type: ComponentType): void {
    this.components.add(type);
  }

  /**
   * 从实体移除组件类型（由World调用）
   */
  removeComponent(type: ComponentType): void {
    this.components.delete(type);
  }
}

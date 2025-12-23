/**
 * ECS - Component（组件层）
 * 组件是纯数据容器，不包含逻辑
 */

/**
 * 组件类型定义
 * 组件可以是任何JavaScript对象，只负责存储数据
 */
export type Component = Record<string, any>;

/**
 * 组件快照
 * 用于缓存和比较组件状态
 */
export interface ComponentSnapshot {
  type: string;
  data: Component;
  version: number;
}

/**
 * 组件工厂函数类型
 */
export type ComponentFactory<T extends Component = Component> = () => T;

/**
 * 创建组件工厂
 * 用于批量创建相同类型的组件
 */
export function createComponentFactory<T extends Component>(
  defaultData: T
): ComponentFactory<T> {
  return () => ({ ...defaultData });
}

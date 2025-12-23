/**
 * ECS - ResourceComponents（资源组件）
 * 定义资源相关的组件类型
 *
 * 注意：这个文件主要是为了导出PersonComponents中的资源相关组件
 * 实际的资源组件定义在PersonComponents.ts中
 */

export {
  ConsumptionComponent,
  ProductionComponent,
} from './PersonComponents';

// 重新导出组件工厂函数
export { createConsumptionComponent, createProductionComponent } from './PersonComponents';

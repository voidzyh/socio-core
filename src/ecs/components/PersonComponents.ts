/**
 * ECS - PersonComponents（人口组件）
 * 定义人口相关的所有组件类型
 */

import type { EntityID } from '../core/Entity';

// ========== 组件类型枚举 ==========

/**
 * 组件类型枚举
 * 用于标识和查询不同类型的组件
 */
export enum ComponentType {
  // 人口基础组件
  Identity = 'identity',
  Biological = 'biological',
  Cognitive = 'cognitive',
  Relationship = 'relationship',
  Occupation = 'occupation',

  // 资源组件
  Consumption = 'consumption',
  Production = 'production',
}

// ========== 人口组件定义 ==========

/**
 * 身份组件
 * 存储人口的基本身份信息
 */
export interface IdentityComponent {
  entityId: EntityID;
  gender: 'male' | 'female';
  birthMonth: number; // 出生月份（用于计算年龄）
}

/**
 * 生物特征组件
 * 存储人口的生理特征
 */
export interface BiologicalComponent {
  health: number; // 0-100 健康值
  fertility: number; // 0-1 生育能力
  isAlive: boolean;
  deathMonth?: number; // 死亡月份
}

/**
 * 认知特征组件
 * 存储人口的教育和技能
 */
export interface CognitiveComponent {
  education: number; // 0-10 教育水平
  skills: Set<SkillType>;
}

/**
 * 技能类型
 */
export type SkillType =
  | 'farming' // 农业技能
  | 'craftsmanship' // 手工技能
  | 'research' // 研究技能
  | 'teaching'; // 教学技能

/**
 * 关系组件
 * 存储人口的家庭关系
 */
export interface RelationshipComponent {
  partnerId?: EntityID;
  parentIds: [EntityID, EntityID] | null;
  childrenIds: Set<EntityID>;
}

/**
 * 职业组件
 * 存储人口的工作信息
 */
export interface OccupationComponent {
  occupation: OccupationType;
  experience: number; // 职业经验（月）
  productivity: number; // 生产效率系数
}

/**
 * 职业类型
 */
export type OccupationType =
  | 'farmer' // 农民
  | 'worker' // 工人
  | 'scientist' // 科学家
  | 'unemployed'; // 失业

// ========== 资源组件定义 ==========

/**
 * 资源消耗组件
 * 存储实体的资源消耗数据
 */
export interface ConsumptionComponent {
  foodConsumption: number;
  medicineConsumption: number;
  housingNeeds: number;
  educationConsumption: number;
}

/**
 * 资源生产组件
 * 存储实体的资源生产数据
 */
export interface ProductionComponent {
  foodProduction: number;
  moneyIncome: number;
  researchOutput: number;
}

// ========== 组件工厂函数 ==========

/**
 * 创建身份组件
 */
export function createIdentityComponent(
  gender: 'male' | 'female',
  birthMonth: number
): IdentityComponent {
  return {
    entityId: '' as EntityID, // 在添加到实体时设置
    gender,
    birthMonth,
  };
}

/**
 * 创建生物特征组件
 */
export function createBiologicalComponent(
  health: number = 60 + Math.random() * 40
): BiologicalComponent {
  return {
    health,
    fertility: 0,
    isAlive: true,
  };
}

/**
 * 创建认知特征组件
 */
export function createCognitiveComponent(
  education: number = Math.floor(Math.random() * 5)
): CognitiveComponent {
  return {
    education,
    skills: new Set<SkillType>(),
  };
}

/**
 * 创建关系组件
 */
export function createRelationshipComponent(): RelationshipComponent {
  return {
    parentIds: null,
    childrenIds: new Set<EntityID>(),
  };
}

/**
 * 创建职业组件
 */
export function createOccupationComponent(
  occupation: OccupationType
): OccupationComponent {
  return {
    occupation,
    experience: 0,
    productivity: 1.0,
  };
}

/**
 * 创建资源消耗组件
 */
export function createConsumptionComponent(): ConsumptionComponent {
  return {
    foodConsumption: 1.0,
    medicineConsumption: 0,
    housingNeeds: 1,
    educationConsumption: 0,
  };
}

/**
 * 创建资源生产组件
 */
export function createProductionComponent(
  occupation: OccupationType
): ProductionComponent {
  switch (occupation) {
    case 'farmer':
      return {
        foodProduction: 8,
        moneyIncome: 3,
        researchOutput: 0,
      };
    case 'worker':
      return {
        foodProduction: 3,
        moneyIncome: 15,
        researchOutput: 0,
      };
    case 'scientist':
      return {
        foodProduction: 0,
        moneyIncome: 20,
        researchOutput: 2,
      };
    case 'unemployed':
      return {
        foodProduction: 0,
        moneyIncome: 0,
        researchOutput: 0,
      };
  }
}

/**
 * ECS - BirthSystem（生育系统）
 * 处理人口的生育逻辑
 */

import { System } from '../core/System';
import type { World } from '../core/World';
import { Query } from '../core/Query';
import {
  ComponentType,
  type IdentityComponent,
  type BiologicalComponent,
  type RelationshipComponent,
} from '../components/PersonComponents';
import { POPULATION_CONSTANTS, GAME_CONSTANTS } from '../../constants/game';

/**
 * 生育系统
 * 专门处理人口生育逻辑
 */
export class BirthSystem extends System {
  readonly name = 'BirthSystem';
  readonly priority = 90; // 在PopulationSystem之后执行

  private livingPeopleQuery: Query;

  constructor() {
    super();
    this.livingPeopleQuery = new Query([
      ComponentType.Identity,
      ComponentType.Biological,
      ComponentType.Relationship,
    ]);
  }

  /**
   * 处理生育
   */
  update(deltaTime: number): void {
    const world = this.getWorld();
    const entities = world.query(this.livingPeopleQuery);

    // 获取当前月份
    const currentMonth = this.getCurrentMonth(world);

    // 筛选育龄女性
    const fertileFemales = this.filterFertileFemales(world, entities, currentMonth);

    // 生育判定
    fertileFemales.forEach(femaleEntity => {
      // 基础生育率5%
      // 后续可以通过EventBus获取政策修正值
      const birthChance = POPULATION_CONSTANTS.BASE_FERTILITY_RATE;

      if (Math.random() < birthChance) {
        const relationship = world.getComponent<RelationshipComponent>(
          femaleEntity.id,
          ComponentType.Relationship
        );

        if (relationship && relationship.partnerId) {
          this.handleBirth(world, femaleEntity.id, relationship.partnerId, currentMonth);
        }
      }
    });
  }

  /**
   * 筛选育龄女性
   */
  private filterFertileFemales(world: World, entities: any[], currentMonth: number): any[] {
    return entities.filter(entity => {
      const identity = world.getComponent<IdentityComponent>(entity.id, ComponentType.Identity);
      const biological = world.getComponent<BiologicalComponent>(entity.id, ComponentType.Biological);
      const relationship = world.getComponent<RelationshipComponent>(entity.id, ComponentType.Relationship);

      if (!identity || !biological || !relationship) return false;

      const age = this.calculateAge(identity.birthMonth, currentMonth);

      return (
        identity.gender === 'female' &&
        biological.isAlive &&
        age >= POPULATION_CONSTANTS.MIN_AGE_FOR_CHILDBEARING &&
        age <= POPULATION_CONSTANTS.MAX_AGE_FOR_CHILDBEARING &&
        relationship.partnerId && // 已婚
        relationship.childrenIds.size < POPULATION_CONSTANTS.MAX_CHILDREN_PER_FAMILY
      );
    });
  }

  /**
   * 处理出生
   */
  private handleBirth(world: World, motherId: string, fatherId: string, currentMonth: number): void {
    // 创建新实体
    const baby = world.createEntity();

    // 随机性别
    const gender = Math.random() < 0.5 ? 'male' : 'female';

    // 添加身份组件
    world.addComponent(baby.id, ComponentType.Identity, {
      entityId: baby.id,
      gender,
      birthMonth: currentMonth,
    } as IdentityComponent);

    // 添加生物特征组件
    world.addComponent(baby.id, ComponentType.Biological, {
      health: 70 + Math.random() * 30,
      fertility: 0,
      isAlive: true,
    } as BiologicalComponent);

    // 添加关系组件
    world.addComponent(baby.id, ComponentType.Relationship, {
      parentIds: [motherId, fatherId],
      childrenIds: new Set(),
    } as RelationshipComponent);

    // 添加职业组件
    world.addComponent(baby.id, ComponentType.Occupation, {
      occupation: 'unemployed',
      experience: 0,
      productivity: 1.0,
    });

    // 添加认知组件
    world.addComponent(baby.id, ComponentType.Cognitive, {
      education: 0,
      skills: new Set(),
    });

    // 更新父母的子女列表
    this.updateParentChildren(world, motherId, baby.id);
    this.updateParentChildren(world, fatherId, baby.id);

    // 发出出生事件
    world.getEventBus().emit('person:born', {
      babyId: baby.id,
      motherId,
      fatherId,
      gender,
    });
  }

  /**
   * 更新父母的子女列表
   */
  private updateParentChildren(world: World, parentId: string, babyId: string): void {
    const relationship = world.getComponent<RelationshipComponent>(parentId, ComponentType.Relationship);

    if (relationship) {
      const newChildren = new Set(relationship.childrenIds);
      newChildren.add(baby.id);
      world.updateComponent(parentId, ComponentType.Relationship, {
        childrenIds: newChildren,
      });
    }
  }

  /**
   * 计算年龄
   */
  private calculateAge(birthMonth: number, currentMonth: number): number {
    return (currentMonth - birthMonth) / GAME_CONSTANTS.MONTHS_PER_YEAR;
  }

  /**
   * 获取当前月份
   */
  private getCurrentMonth(world: World): number {
    return (world.getEventBus() as any)['currentMonth'] || 0;
  }
}

/**
 * ECS - MarriageSystem（婚姻系统）
 * 处理人口的婚姻逻辑
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
 * 婚姻系统
 * 专门处理人口婚姻逻辑
 */
export class MarriageSystem extends System {
  readonly name = 'MarriageSystem';
  readonly priority = 85; // 在DeathSystem、BirthSystem之后执行

  private peopleQuery: Query;

  constructor() {
    super();
    this.peopleQuery = new Query([
      ComponentType.Identity,
      ComponentType.Biological,
      ComponentType.Relationship,
    ]);
  }

  /**
   * 处理婚姻
   */
  update(deltaTime: number): void {
    const world = this.getWorld();
    const entities = world.query(this.peopleQuery);

    // 获取当前月份
    const currentMonth = this.getCurrentMonth(world);

    // 筛选适婚未婚者
    const singles = this.filterEligibleSingles(world, entities, currentMonth);

    // 分离男女
    const singleMales = singles.filter(entity => {
      const identity = world.getComponent<IdentityComponent>(entity.id, ComponentType.Identity);
      return identity?.gender === 'male';
    });

    const singleFemales = singles.filter(entity => {
      const identity = world.getComponent<IdentityComponent>(entity.id, ComponentType.Identity);
      return identity?.gender === 'female';
    });

    // 简化的匹配逻辑
    const pairs = Math.min(singleMales.length, singleFemales.length);
    for (let i = 0; i < pairs; i++) {
      if (Math.random() < 0.02) { // 2% 概率结婚
        this.marry(world, singleMales[i].id, singleFemales[i].id);
      }
    }
  }

  /**
   * 筛选适婚未婚者
   */
  private filterEligibleSingles(world: World, entities: any[], currentMonth: number): any[] {
    return entities.filter(entity => {
      const identity = world.getComponent<IdentityComponent>(entity.id, ComponentType.Identity);
      const biological = world.getComponent<BiologicalComponent>(entity.id, ComponentType.Biological);
      const relationship = world.getComponent<RelationshipComponent>(entity.id, ComponentType.Relationship);

      if (!identity || !biological || !relationship) return false;

      const age = this.calculateAge(identity.birthMonth, currentMonth);

      return (
        biological.isAlive &&
        !relationship.partnerId && // 未婚
        age >= POPULATION_CONSTANTS.MIN_AGE_FOR_MARRIAGE &&
        age <= POPULATION_CONSTANTS.MAX_AGE_FOR_MARRIAGE
      );
    });
  }

  /**
   * 结婚
   */
  private marry(world: World, maleId: string, femaleId: string): void {
    // 更新男性的关系组件
    world.updateComponent(maleId, ComponentType.Relationship, {
      partnerId: femaleId,
    });

    // 更新女性的关系组件
    world.updateComponent(femaleId, ComponentType.Relationship, {
      partnerId: maleId,
    });

    // 发出结婚事件
    world.getEventBus().emit('person:married', {
      maleId,
      femaleId,
      month: this.getCurrentMonth(world),
    });
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
    return world.getTotalMonths();
  }
}

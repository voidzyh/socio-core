/**
 * ECS - DeathSystem（死亡系统）
 * 处理人口的死亡逻辑
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
import { calculateDeathRate } from '../../constants/game';
import { GAME_CONSTANTS } from '../../constants/game';

/**
 * 死亡系统
 * 专门处理人口死亡逻辑
 */
export class DeathSystem extends System {
  readonly name = 'DeathSystem';
  readonly priority = 95; // 在BirthSystem之前执行

  private livingPeopleQuery: Query;

  constructor() {
    super();
    this.livingPeopleQuery = new Query([
      ComponentType.Identity,
      ComponentType.Biological,
    ]);
  }

  /**
   * 处理死亡检查
   */
  update(_deltaTime: number): void {
    const world = this.getWorld();
    const entities = world.query(this.livingPeopleQuery);

    // 获取当前月份
    const currentMonth = this.getCurrentMonth(world);

    // 获取政策修正值
    const policyEffectSystem = world.getSystem('PolicyEffectSystem');
    const policyDeathRateModifier = policyEffectSystem ?
      (policyEffectSystem as any).getDeathRateModifier() : 0;

    // 检查每个存活的人
    entities.forEach(entity => {
      const biological = world.getComponent<BiologicalComponent>(entity.id, ComponentType.Biological);
      if (!biological || !biological.isAlive) return;

      const identity = world.getComponent<IdentityComponent>(entity.id, ComponentType.Identity);
      if (!identity) return;

      // 计算年龄
      const age = this.calculateAge(identity.birthMonth, currentMonth);

      // 计算死亡率（基础 + 政策修正）
      let deathRate = calculateDeathRate(age, biological.health);
      deathRate += policyDeathRateModifier;

      // 确保死亡率在合理范围内
      deathRate = Math.max(0, Math.min(1, deathRate));

      // 死亡判定
      if (Math.random() < deathRate) {
        this.handleDeath(world, entity.id, age, currentMonth);
      }
    });
  }

  /**
   * 处理死亡
   */
  private handleDeath(world: World, personId: string, age: number, currentMonth: number): void {
    // 更新生物特征组件
    world.updateComponent(personId, ComponentType.Biological, {
      isAlive: false,
      deathMonth: currentMonth,
    });

    // 移除配偶关系（双向）
    const relationship = world.getComponent<RelationshipComponent>(personId, ComponentType.Relationship);
    if (relationship && relationship.partnerId) {
      // 移除配偶的伴侣关系
      const partnerRelationship = world.getComponent<RelationshipComponent>(
        relationship.partnerId,
        ComponentType.Relationship
      );

      if (partnerRelationship) {
        world.updateComponent(relationship.partnerId, ComponentType.Relationship, {
          partnerId: undefined,
        });
      }

      // 移除自己的配偶关系
      world.updateComponent(personId, ComponentType.Relationship, {
        partnerId: undefined,
      });
    }

    // 发出死亡事件
    world.getEventBus().emit('person:died', {
      personId,
      age,
      month: currentMonth,
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

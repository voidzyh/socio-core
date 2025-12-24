/**
 * ECS - AgingSystem（老化系统）
 * 处理人口年龄增长和健康衰减
 */

import { System } from '../core/System';
import type { World } from '../core/World';
import { Query } from '../core/Query';
import {
  ComponentType,
  type IdentityComponent,
  type BiologicalComponent,
} from '../components/PersonComponents';
import { GAME_CONSTANTS } from '../../constants/game';
import { HEALTH_SYSTEM, POPULATION } from '../../constants/balance';

/**
 * 老化系统
 * 专门处理人口年龄增长和健康衰减
 */
export class AgingSystem extends System {
  readonly name = 'AgingSystem';
  readonly priority = 100; // 最高优先级，首先执行

  private livingPeopleQuery: Query;

  constructor() {
    super();
    this.livingPeopleQuery = new Query([
      ComponentType.Identity,
      ComponentType.Biological,
    ]);
  }

  /**
   * 处理年龄增长和健康衰减
   */
  update(_deltaTime: number): void {
    const world = this.getWorld();
    const entities = world.query(this.livingPeopleQuery);

    // 获取当前月份
    const currentMonth = this.getCurrentMonth(world);

    // 处理每个人口
    entities.forEach(entity => {
      const biological = world.getComponent<BiologicalComponent>(entity.id, ComponentType.Biological);
      const identity = world.getComponent<IdentityComponent>(entity.id, ComponentType.Identity);

      if (!biological || !identity || !biological.isAlive) return;

      // 计算年龄
      const age = this.calculateAge(identity.birthMonth, currentMonth);

      // 健康变化：自然恢复 - 年龄衰减
      let healthChange = 0;

      // 1. 自然恢复（随年龄增长而减弱）
      if (age < 30) {
        healthChange += HEALTH_SYSTEM.NATURAL_RECOVERY.YOUNG_0_29;
      } else if (age < 50) {
        healthChange += HEALTH_SYSTEM.NATURAL_RECOVERY.MIDDLE_30_49;
      } else if (age < 70) {
        healthChange += HEALTH_SYSTEM.NATURAL_RECOVERY.SENIOR_50_69;
      }
      // 70岁以上不再自然恢复（HEALTH_SYSTEM.NATURAL_RECOVERY.ELDERLY_70_PLUS = 0）

      // 2. 年龄衰减
      if (age >= 80) {
        healthChange -= HEALTH_SYSTEM.AGE_DECAY.VERY_ELDERLY_80_PLUS;
      } else if (age >= 60) {
        healthChange -= HEALTH_SYSTEM.AGE_DECAY.ELDERLY_60_PLUS;
      }

      // 应用健康变化
      let newHealth = biological.health + healthChange;

      // 健康值范围限制
      newHealth = Math.max(0, Math.min(100, newHealth));

      // 更新健康值
      if (newHealth !== biological.health) {
        world.updateComponent(entity.id, ComponentType.Biological, { health: newHealth });
      }

      // 更新生育能力（随年龄变化）
      let fertility = biological.fertility;
      if (identity.gender === 'female') {
        if (age >= POPULATION.MIN_AGE_FOR_CHILDBEARING &&
            age <= POPULATION.MAX_AGE_FOR_CHILDBEARING) {
          // 育龄期，生育能力逐渐达到峰值
          fertility = Math.min(1.0, (age - POPULATION.MIN_AGE_FOR_CHILDBEARING) / 10);
        } else {
          fertility = 0;
        }
      }

      if (fertility !== biological.fertility) {
        world.updateComponent(entity.id, ComponentType.Biological, { fertility });
      }
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

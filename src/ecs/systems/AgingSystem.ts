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
import { POPULATION_CONSTANTS, GAME_CONSTANTS } from '../../constants/game';

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
  update(deltaTime: number): void {
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

      // 健康衰减
      let health = biological.health;

      if (age >= 80) {
        health -= POPULATION_CONSTANTS.HEALTH_DECAY_AGE_80;
      } else if (age >= 60) {
        health -= POPULATION_CONSTANTS.HEALTH_DECAY_AGE_60;
      }

      if (health < 0) health = 0;

      // 更新健康值
      if (health !== biological.health) {
        world.updateComponent(entity.id, ComponentType.Biological, { health });
      }

      // 更新生育能力（随年龄变化）
      let fertility = biological.fertility;
      if (identity.gender === 'female') {
        if (age >= POPULATION_CONSTANTS.MIN_AGE_FOR_CHILDBEARING &&
            age <= POPULATION_CONSTANTS.MAX_AGE_FOR_CHILDBEARING) {
          // 育龄期，生育能力逐渐达到峰值
          fertility = Math.min(1.0, (age - 18) / 10);
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
    return (world.getEventBus() as any)['currentMonth'] || 0;
  }
}

/**
 * ECS - FoodSystem（食物系统）
 * 专门处理食物的生产和消耗
 */

import { System } from '../core/System';
import type { World } from '../core/World';
import { Query } from '../core/Query';
import { ComponentType } from '../components/PersonComponents';
import { GAME_CONSTANTS } from '../../constants/game';

/**
 * 食物系统
 */
export class FoodSystem extends System {
  readonly name = 'FoodSystem';
  readonly priority = 75;

  private peopleQuery: Query;

  constructor() {
    super();
    this.peopleQuery = new Query([
      ComponentType.Identity,
      ComponentType.Biological,
      ComponentType.Occupation,
    ]);
  }

  update(deltaTime: number): void {
    const world = this.getWorld();
    const entities = world.query(this.peopleQuery);
    const currentMonth = this.getCurrentMonth(world);

    // 计算食物生产
    const production = this.calculateProduction(entities, currentMonth);

    // 计算食物消耗
    const consumption = this.calculateConsumption(entities, currentMonth);

    // 发出事件（由ResourceSystem或其他系统监听并处理）
    world.getEventBus().emit('food:calculated', {
      production,
      consumption,
      balance: production - consumption,
    });
  }

  /**
   * 计算食物生产
   */
  private calculateProduction(entities: any[], currentMonth: number): number {
    let production = 0;

    entities.forEach(entity => {
      const occupation = entity.getComponent?.(ComponentType.Occupation);
      const biological = entity.getComponent?.(ComponentType.Biological);
      const identity = entity.getComponent?.(ComponentType.Identity);

      if (!occupation || !biological || !identity || !biological.isAlive) return;

      const age = this.calculateAge(identity.birthMonth, currentMonth);

      // 只有农民和工人生产食物
      if (occupation.occupation === 'farmer') {
        production += this.calculateFarmerProduction(age, biological.health);
      } else if (occupation.occupation === 'worker') {
        production += 3; // 工人副业
      }
    });

    // 季节性调整
    const seasonalModifier = this.getSeasonalModifier(currentMonth);
    production = Math.floor(production * seasonalModifier);

    // 土地限制
    const maxProduction = entities.length * 15;
    production = Math.min(production, maxProduction);

    return production;
  }

  /**
   * 计算食物消耗
   */
  private calculateConsumption(entities: any[], currentMonth: number): number {
    let consumption = 0;

    entities.forEach(entity => {
      const biological = entity.getComponent?.(ComponentType.Biological);
      const identity = entity.getComponent?.(ComponentType.Identity);
      const occupation = entity.getComponent?.(ComponentType.Occupation);

      if (!biological || !identity || !biological.isAlive) return;

      const age = this.calculateAge(identity.birthMonth, currentMonth);
      consumption += this.calculatePersonConsumption(age, biological.health, occupation.occupation);
    });

    return Math.ceil(consumption * 10) / 10;
  }

  /**
   * 计算农民产出
   */
  private calculateFarmerProduction(age: number, health: number): number {
    let production = 8;

    // 年龄效率
    if (age >= 18 && age <= 30) production *= 1.2;
    else if (age >= 51 && age <= 60) production *= 0.8;
    else if (age < 18 || age > 60) production *= 0.5;

    // 健康效率
    if (health > 80) production *= 1.2;
    else if (health < 60) production *= 0.7;
    else if (health < 30) production *= 0.4;

    return production;
  }

  /**
   * 计算个人消耗
   */
  private calculatePersonConsumption(age: number, health: number, occupation: string): number {
    let consumption = 1.0;

    // 年龄段
    if (age < 7) consumption = 0.5;
    else if (age < 13) consumption = 0.7;
    else if (age < 19) consumption = 0.9;
    else if (age >= 60) consumption = 0.8;

    // 健康差
    if (health < 30) consumption += 0.2;

    // 体力劳动
    if (occupation === 'farmer' || occupation === 'worker') consumption += 0.1;

    return consumption;
  }

  /**
   * 季节性修正
   */
  private getSeasonalModifier(month: number): number {
    return (month >= 2 && month <= 7) ? 1.2 : 0.8;
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

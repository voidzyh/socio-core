/**
 * ECS - MoneySystem（资金系统）
 * 处理资金的收入和支出
 */

import { System } from '../core/System';
import type { World } from '../core/World';
import { Query } from '../core/Query';
import { ComponentType } from '../components/PersonComponents';
import { GAME_CONSTANTS } from '../../constants/game';

/**
 * 资金系统
 */
export class MoneySystem extends System {
  readonly name = 'MoneySystem';
  readonly priority = 74;

  private peopleQuery: Query;

  constructor() {
    super();
    this.peopleQuery = new Query([
      ComponentType.Identity,
      ComponentType.Biological,
      ComponentType.Occupation,
      ComponentType.Cognitive,
    ]);
  }

  update(_deltaTime: number): void {
    const world = this.getWorld();
    const entities = world.query(this.peopleQuery);
    const currentMonth = this.getCurrentMonth(world);

    // 获取政策修正值
    const policyEffectSystem = world.getSystem('PolicyEffectSystem');
    const policyEconomyModifier = policyEffectSystem ?
      (policyEffectSystem as any).getEconomyModifier() : 0;

    // 计算收入
    let income = this.calculateIncome(entities, currentMonth);

    // 计算支出
    const expense = this.calculateExpense(entities, currentMonth);

    // 应用经济政策修正（百分比）
    if (policyEconomyModifier !== 0) {
      income *= (1 + policyEconomyModifier);
    }

    // 发出事件
    world.getEventBus().emit('money:calculated', {
      income,
      expense,
      balance: income - expense,
    });
  }

  /**
   * 计算资金收入
   */
  private calculateIncome(entities: any[], currentMonth: number): number {
    let income = 0;

    const world = this.getWorld();

    entities.forEach(entity => {
      const biological = world.getComponent(entity.id, ComponentType.Biological);
      const identity = world.getComponent(entity.id, ComponentType.Identity);
      const occupation = world.getComponent(entity.id, ComponentType.Occupation);
      const cognitive = world.getComponent(entity.id, ComponentType.Cognitive);

      if (!biological || !identity || !occupation || !biological.isAlive) return;

      const age = this.calculateAge(identity.birthMonth, currentMonth);
      const education = cognitive?.education || 0;

      // 税收（受教育程度影响税收能力）
      if (age >= 19 && age <= 60) {
        income += 5 + Math.floor(education * 0.5); // 成年人税收，教育10 = +5元
      } else if (age >= 60) {
        income += 2 + Math.floor(education * 0.3); // 老年人减税，教育10 = +3元
      }

      // 职业产出（教育影响工作效率）
      const educationBonus = Math.floor(education * 1.2); // 教育10 = +12元

      switch (occupation.occupation) {
        case 'worker':
          income += 15 + educationBonus; // 制造业
          break;
        case 'scientist':
          income += 12 + educationBonus * 1.5; // 科研拨款，教育加成更高
          break;
        case 'farmer':
          income += 3 + Math.floor(education * 0.5); // 农产品销售，教育影响较小
          break;
        case 'unemployed':
          // 不产出
          break;
      }
    });

    return Math.floor(income);
  }

  /**
   * 计算资金支出
   */
  private calculateExpense(entities: any[], currentMonth: number): number {
    const population = entities.length;
    let expense = 5; // 基础设施维护

    // 公共服务维护（每人0.5元，随人口增长增加支出压力）
    expense += population * 0.5;

    const world = this.getWorld();

    const unemployedCount = entities.filter(entity => {
      const occupation = world.getComponent(entity.id, ComponentType.Occupation);
      const biological = world.getComponent(entity.id, ComponentType.Biological);
      return (
        occupation?.occupation === 'unemployed' &&
        biological?.isAlive
      );
    }).length;

    // 失业救济金
    expense += unemployedCount * 2;

    // 医疗支出（老年人）
    const elderlyCount = entities.filter(entity => {
      const identity = world.getComponent(entity.id, ComponentType.Identity);
      const biological = world.getComponent(entity.id, ComponentType.Biological);
      if (!identity || !biological || !biological.isAlive) return false;
      const age = this.calculateAge(identity.birthMonth, currentMonth);
      return age >= 60;
    }).length;

    expense += elderlyCount * 1;

    // 教育支出（学生）
    const studentCount = entities.filter(entity => {
      const identity = world.getComponent(entity.id, ComponentType.Identity);
      const biological = world.getComponent(entity.id, ComponentType.Biological);
      if (!identity || !biological || !biological.isAlive) return false;
      const age = this.calculateAge(identity.birthMonth, currentMonth);
      return age >= 6 && age <= 18;
    }).length;

    expense += studentCount * 0.5;

    return Math.ceil(expense);
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

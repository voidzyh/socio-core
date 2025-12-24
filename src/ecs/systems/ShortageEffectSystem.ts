/**
 * ECS - ShortageEffectSystem（短缺效果系统）
 * 处理各种资源短缺对人口的影响
 */

import { System } from '../core/System';
import type { World } from '../core/World';
import { Query } from '../core/Query';
import { ComponentType } from '../components/PersonComponents';

/**
 * 短缺效果系统
 */
export class ShortageEffectSystem extends System {
  readonly name = 'ShortageEffectSystem';
  readonly priority = 70; // 在资源系统之后执行

  private peopleQuery: Query;

  constructor() {
    super();
    this.peopleQuery = new Query([
      ComponentType.Identity,
      ComponentType.Biological,
    ]);
  }

  update(deltaTime: number): void {
    const world = this.getWorld();
    const entities = world.query(this.peopleQuery);

    // 监听资源短缺事件并应用效果
    // 这里简化处理，实际应该通过EventBus监听resource:shortage事件

    // 应用教育自动提升
    this.applyEducationGrowth(world, entities);
  }

  /**
   * 应用食物短缺效果
   */
  applyFoodShortage(world: World, severity: 'low' | 'medium' | 'high'): void {
    const entities = world.query(this.peopleQuery);
    const healthLoss = severity === 'high' ? 5 : 2;

    entities.forEach(entity => {
      const biological = world.getComponent(entity.id, ComponentType.Biological);
      if (biological && biological.isAlive) {
        const newHealth = Math.max(0, biological.health - healthLoss);
        world.updateComponent(entity.id, ComponentType.Biological, { health: newHealth });
      }
    });
  }

  /**
   * 应用医疗短缺效果
   */
  applyMedicineShortage(world: World, severity: 'low' | 'medium' | 'high'): void {
    const entities = world.query(this.peopleQuery);
    const currentMonth = this.getCurrentMonth(world);

    entities.forEach(entity => {
      const biological = world.getComponent(entity.id, ComponentType.Biological);
      const identity = world.getComponent(entity.id, ComponentType.Identity);

      if (!biological || !identity || !biological.isAlive) return;

      const age = this.calculateAge(identity.birthMonth, currentMonth);

      // 老年人和病人健康下降更快
      if (age >= 60 || biological.health < 40) {
        const newHealth = Math.max(0, biological.health - 1);
        world.updateComponent(entity.id, ComponentType.Biological, { health: newHealth });
      }
    });
  }

  /**
   * 应用住房短缺效果
   */
  applyHousingShortage(world: World): void {
    const entities = world.query(this.peopleQuery);

    entities.forEach(entity => {
      const biological = world.getComponent(entity.id, ComponentType.Biological);
      if (biological && biological.isAlive) {
        const newHealth = Math.max(0, biological.health - 0.5);
        world.updateComponent(entity.id, ComponentType.Biological, { health: newHealth });
      }
    });
  }

  /**
   * 应用教育自动提升
   */
  private applyEducationGrowth(world: World, entities: any[]): void {
    const currentMonth = this.getCurrentMonth(world);

    // 检查教育资源
    const hasEducationResource = (world.getEventBus() as any)['educationResource'] > 0;

    // 检查是否有教师
    const hasTeacher = entities.some(entity => {
      const occupation = world.getComponent(entity.id, ComponentType.Occupation);
      const biological = world.getComponent(entity.id, ComponentType.Biological);
      return (
        occupation?.occupation === 'scientist' &&
        biological?.isAlive
      );
    });

    if (!hasTeacher || !hasEducationResource) return;

    // 提升学生教育
    entities.forEach(entity => {
      const cognitive = world.getComponent(entity.id, ComponentType.Cognitive);
      const biological = world.getComponent(entity.id, ComponentType.Biological);
      const identity = world.getComponent(entity.id, ComponentType.Identity);

      if (!cognitive || !biological || !identity || !biological.isAlive) return;

      const age = this.calculateAge(identity.birthMonth, currentMonth);

      // 只有学生（6-18岁）才会自动提升教育
      if (age >= 6 && age <= 18 && cognitive.education < 10) {
        const newEducation = Math.min(10, cognitive.education + 0.1);
        world.updateComponent(entity.id, ComponentType.Cognitive, {
          education: newEducation,
        });
      }
    });
  }

  /**
   * 计算年龄
   */
  private calculateAge(birthMonth: number, currentMonth: number): number {
    return (currentMonth - birthMonth) / 12; // 简化：假设12个月/年
  }

  /**
   * 获取当前月份
   */
  private getCurrentMonth(world: World): number {
    return world.getTotalMonths();
  }
}

/**
 * ECS - ResourceSystem（资源系统）
 * 处理所有资源的生产、消耗和短缺效果
 */

import { System } from '../core/System';
import type { World } from '../core/World';
import { Query } from '../core/Query';
import { ComponentType } from '../components/PersonComponents';
import type { Resources } from '../../store/types';
import { RESOURCE_CONSTANTS, GAME_CONSTANTS } from '../../constants/game';

/**
 * 资源系统
 * 协调所有资源相关的子系统
 */
export class ResourceSystem extends System {
  readonly name = 'ResourceSystem';
  readonly priority = 80; // 在人口系统之后执行

  private livingPeopleQuery: Query;
  private currentResources: Resources;

  constructor() {
    super();
    this.livingPeopleQuery = new Query([
      ComponentType.Identity,
      ComponentType.Biological,
      ComponentType.Occupation,
    ]);

    // 初始化资源状态
    this.currentResources = {
      food: RESOURCE_CONSTANTS.INITIAL_FOOD,
      housing: RESOURCE_CONSTANTS.INITIAL_HOUSING,
      medicine: RESOURCE_CONSTANTS.INITIAL_MEDICINE,
      education: RESOURCE_CONSTANTS.INITIAL_EDUCATION,
      money: RESOURCE_CONSTANTS.INITIAL_MONEY,
      productionRate: {
        food: 0,
        research: 0,
      },
    };
  }

  /**
   * 每月更新资源
   */
  update(deltaTime: number): void {
    const world = this.getWorld();
    const entities = world.query(this.livingPeopleQuery);

    // 获取当前月份
    const currentMonth = this.getCurrentMonth(world);

    // 1. 计算所有资源的生产和消耗
    const production = this.calculateProduction(world, entities, currentMonth);
    const consumption = this.calculateConsumption(world, entities, currentMonth);

    // 2. 更新资源
    this.updateResources(production, consumption);

    // 3. 检查短缺并应用影响
    this.applyShortageEffects(world, entities, production, consumption);

    // 4. 发出资源更新事件
    world.getEventBus().emit('resources:updated', {
      resources: this.currentResources,
      production,
      consumption,
    });
  }

  /**
   * 计算资源生产
   */
  private calculateProduction(world: World, entities: any[], currentMonth: number): {
    food: number;
    money: number;
    education: number;
    medicine: number;
  } {
    // 这里简化处理，实际会委托给各个子系统
    let foodProduction = 0;
    let moneyIncome = 0;
    let educationProduction = 0;
    let medicineProduction = 0;

    entities.forEach(entity => {
      const occupation = entity.getComponent?.(ComponentType.Occupation);
      const biological = entity.getComponent?.(ComponentType.Biological);
      const identity = entity.getComponent?.(ComponentType.Identity);

      if (!occupation || !biological || !identity || !biological.isAlive) return;

      // 计算年龄
      const age = this.calculateAge(identity.birthMonth, currentMonth);

      // 根据职业生产资源
      switch (occupation.occupation) {
        case 'farmer':
          foodProduction += this.calculateFarmerFoodProduction(entity, age, biological.health);
          moneyIncome += 3; // 农产品销售
          break;
        case 'worker':
          foodProduction += 3; // 副业产出
          moneyIncome += 15; // 制造业
          break;
        case 'scientist':
          moneyIncome += 20; // 科研拨款
          educationProduction += 2;
          medicineProduction += 0.5;
          break;
        case 'unemployed':
          // 不生产
          break;
      }
    });

    // 季节性调整（春夏+20%，秋冬-20%）
    const seasonalModifier = this.getSeasonalFoodModifier(currentMonth);
    foodProduction = Math.floor(foodProduction * seasonalModifier);

    return {
      food: foodProduction,
      money: moneyIncome,
      education: educationProduction,
      medicine: medicineProduction,
    };
  }

  /**
   * 计算资源消耗
   */
  private calculateConsumption(world: World, entities: any[], currentMonth: number): {
    food: number;
    money: number;
    education: number;
    medicine: number;
    housing: number;
  } {
    let foodConsumption = 0;
    let moneyExpense = 5; // 基础设施维护
    let educationConsumption = 0;
    let medicineConsumption = 0;
    let housingNeeds = 0;

    entities.forEach(entity => {
      const biological = entity.getComponent?.(ComponentType.Biological);
      const identity = entity.getComponent?.(ComponentType.Identity);
      const cognitive = entity.getComponent?.(ComponentType.Cognitive);
      const occupation = entity.getComponent?.(ComponentType.Occupation);

      if (!biological || !identity || !biological.isAlive) return;

      const age = this.calculateAge(identity.birthMonth, currentMonth);

      // 食物消耗
      foodConsumption += this.calculatePersonFoodConsumption(entity, age, biological.health);

      // 教育消耗
      if (age >= 6 && age <= 18) {
        educationConsumption += 0.5;
      }

      // 医疗消耗
      if (age >= 60) {
        medicineConsumption += 0.5;
      }
      if (biological.health < 40) {
        medicineConsumption += 1;
      }

      // 住房需求
      housingNeeds += 1;

      // 资金支出
      if (occupation?.occupation === 'unemployed') {
        moneyExpense += 2; // 失业救济金
      }
    });

    // 老年医疗支出
    const elderly = entities.filter(entity => {
      const identity = entity.getComponent?.(ComponentType.Identity);
      if (!identity) return false;
      const age = this.calculateAge(identity.birthMonth, currentMonth);
      return age >= 60;
    }).length;
    moneyExpense += elderly * 1;

    return {
      food: foodConsumption,
      money: moneyExpense,
      education: educationConsumption,
      medicine: medicineConsumption,
      housing: housingNeeds,
    };
  }

  /**
   * 更新资源状态
   */
  private updateResources(
    production: { food: number; money: number; education: number; medicine: number },
    consumption: { food: number; money: number; education: number; medicine: number }
  ): void {
    // 计算新资源
    const newFood = this.currentResources.food + production.food - consumption.food;
    const newMoney = this.currentResources.money + production.money - consumption.money;
    const newMedicine = this.currentResources.medicine + production.medicine - consumption.medicine;
    const newEducation = this.currentResources.education + production.education - consumption.education;

    // 更新资源状态
    this.currentResources = {
      food: Math.round(newFood * 10) / 10,
      money: Math.round(newMoney * 10) / 10,
      medicine: Math.round(newMedicine * 10) / 10,
      education: Math.round(newEducation * 10) / 10,
      housing: this.currentResources.housing, // 住房单独管理
      productionRate: {
        food: production.food,
        research: 0, // 后续计算
      },
    };
  }

  /**
   * 应用资源短缺影响
   */
  private applyShortageEffects(
    world: World,
    entities: any[],
    production: any,
    consumption: any
  ): void {
    // 计算净资源
    const netFood = production.food - consumption.food;
    const netMedicine = production.medicine - consumption.medicine;
    const netHousing = this.currentResources.housing - consumption.housing;

    // 食物短缺影响
    if (netFood < 0) {
      this.applyFoodShortageEffect(world, entities);
    }

    // 医疗不足影响
    if (netMedicine < 0) {
      this.applyMedicineShortageEffect(world, entities);
    }

    // 住房不足影响
    if (netHousing < 0) {
      this.applyHousingShortageEffect(world, entities);
    }

    // 教育自动提升
    this.applyEducationGrowth(world, entities);
  }

  /**
   * 应用食物短缺影响
   */
  private applyFoodShortageEffect(world: World, entities: any[]): void {
    // 简化实现：降低所有人健康值
    // 实际应该根据短缺月份累计
    entities.forEach(entity => {
      const biological = world.getComponent(ComponentType.Biological, entity.id);
      if (biological && biological.isAlive) {
        const newHealth = Math.max(0, biological.health - 2);
        world.updateComponent(entity.id, ComponentType.Biological, { health: newHealth });
      }
    });

    world.getEventBus().emit('resource:shortage', {
      type: 'food',
      severity: 'high',
    });
  }

  /**
   * 应用医疗不足影响
   */
  private applyMedicineShortageEffect(world: World, entities: any[]): void {
    entities.forEach(entity => {
      const biological = world.getComponent(ComponentType.Biological, entity.id);
      const identity = world.getComponent(ComponentType.Identity, entity.id);

      if (!biological || !identity || !biological.isAlive) return;

      const age = this.calculateAge(identity.birthMonth, this.getCurrentMonth(world));

      // 老年人和病人健康下降更快
      if (age >= 60 || biological.health < 40) {
        const newHealth = Math.max(0, biological.health - 1);
        world.updateComponent(entity.id, ComponentType.Biological, { health: newHealth });
      }
    });

    world.getEventBus().emit('resource:shortage', {
      type: 'medicine',
      severity: 'medium',
    });
  }

  /**
   * 应用住房不足影响
   */
  private applyHousingShortageEffect(world: World, entities: any[]): void {
    entities.forEach(entity => {
      const biological = world.getComponent(ComponentType.Biological, entity.id);
      if (biological && biological.isAlive) {
        const newHealth = Math.max(0, biological.health - 0.5);
        world.updateComponent(entity.id, ComponentType.Biological, { health: newHealth });
      }
    });

    world.getEventBus().emit('resource:shortage', {
      type: 'housing',
      severity: 'low',
    });
  }

  /**
   * 应用教育自动提升
   */
  private applyEducationGrowth(world: World, entities: any[]): void {
    const currentMonth = this.getCurrentMonth(world);

    entities.forEach(entity => {
      const cognitive = world.getComponent(ComponentType.Cognitive, entity.id);
      const biological = world.getComponent(ComponentType.Biological, entity.id);
      const identity = world.getComponent(ComponentType.Identity, entity.id);

      if (!cognitive || !biological || !identity || !biological.isAlive) return;

      const age = this.calculateAge(identity.birthMonth, currentMonth);

      // 只有学生（6-18岁）才会自动提升教育
      if (age >= 6 && age <= 18 && cognitive.education < 10) {
        // 检查是否有教师
        const hasTeacher = entities.some(e => {
          const occ = e.getComponent?.(ComponentType.Occupation);
          const bio = e.getComponent?.(ComponentType.Biological);
          return (
            occ?.occupation === 'scientist' &&
            bio?.isAlive &&
            e.id !== entity.id
          );
        });

        const hasResource = this.currentResources.education > 0;

        if (hasTeacher && hasResource) {
          const newEducation = Math.min(10, cognitive.education + 0.1);
          world.updateComponent(entity.id, ComponentType.Cognitive, {
            education: newEducation,
          });
        }
      }
    });
  }

  /**
   * 计算农民食物产出
   */
  private calculateFarmerFoodProduction(entity: any, age: number, health: number): number {
    let baseProduction = 8;

    // 年龄效率
    let ageEfficiency = 1.0;
    if (age >= 18 && age <= 30) ageEfficiency = 1.2;
    else if (age >= 51 && age <= 60) ageEfficiency = 0.8;
    else if (age < 18 || age > 60) ageEfficiency = 0.5;

    // 健康效率
    let healthEfficiency = 1.0;
    if (health > 80) healthEfficiency = 1.2;
    else if (health < 60) healthEfficiency = 0.7;
    else if (health < 30) healthEfficiency = 0.4;

    return baseProduction * ageEfficiency * healthEfficiency;
  }

  /**
   * 计算个人食物消耗
   */
  private calculatePersonFoodConsumption(entity: any, age: number, health: number): number {
    let baseConsumption = 1.0;

    // 年龄段消耗
    if (age < 7) baseConsumption = 0.5;
    else if (age < 13) baseConsumption = 0.7;
    else if (age < 19) baseConsumption = 0.9;
    else if (age >= 60) baseConsumption = 0.8;

    // 健康差需要更多营养
    if (health < 30) baseConsumption += 0.2;

    return baseConsumption;
  }

  /**
   * 获取季节性食物产出修正
   */
  private getSeasonalFoodModifier(month: number): number {
    // 3-8月春夏，9-2月秋冬
    const isSpringSummer = month >= 2 && month <= 7;
    return isSpringSummer ? 1.2 : 0.8;
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

  /**
   * 获取当前资源
   */
  getResources(): Resources {
    return this.currentResources;
  }

  /**
   * 设置资源（用于初始化或外部调整）
   */
  setResources(resources: Partial<Resources>): void {
    this.currentResources = {
      ...this.currentResources,
      ...resources,
    };
  }
}

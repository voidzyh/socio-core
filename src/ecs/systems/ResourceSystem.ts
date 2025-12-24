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
import { RESOURCE_CONSUMPTION, RESOURCE_PRODUCTION } from '../../constants/balance';

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
        money: 0,
        research: 0,
      },
    };
  }

  /**
   * 每月更新资源
   */
  update(_deltaTime: number): void {
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
      const occupation = world.getComponent(entity.id, ComponentType.Occupation);
      const biological = world.getComponent(entity.id, ComponentType.Biological);
      const identity = world.getComponent(entity.id, ComponentType.Identity);

      if (!occupation || !biological || !identity || !biological.isAlive) return;

      // 计算年龄
      const age = this.calculateAge(identity.birthMonth, currentMonth);

      // 根据职业生产资源
      switch (occupation.occupation) {
        case 'farmer':
          foodProduction += this.calculateFarmerFoodProduction(entity, age, biological.health);
          moneyIncome += RESOURCE_PRODUCTION.OCCUPATION.FARMER.MONEY_INCOME;
          break;
        case 'worker':
          foodProduction += RESOURCE_PRODUCTION.OCCUPATION.WORKER.SIDE_FOOD;
          moneyIncome += RESOURCE_PRODUCTION.OCCUPATION.WORKER.MONEY_INCOME;
          break;
        case 'scientist':
          moneyIncome += RESOURCE_PRODUCTION.OCCUPATION.SCIENTIST.MONEY_INCOME;
          educationProduction += RESOURCE_PRODUCTION.OCCUPATION.SCIENTIST.EDUCATION_PRODUCTION;
          medicineProduction += RESOURCE_PRODUCTION.OCCUPATION.SCIENTIST.MEDICINE_PRODUCTION;
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
    let moneyExpense = RESOURCE_CONSUMPTION.INFRASTRUCTURE; // 基础设施维护
    let educationConsumption = 0;
    let medicineConsumption = 0;
    let housingNeeds = 0;

    entities.forEach(entity => {
      const biological = world.getComponent(entity.id, ComponentType.Biological);
      const identity = world.getComponent(entity.id, ComponentType.Identity);
      const occupation = world.getComponent(entity.id, ComponentType.Occupation);

      if (!biological || !identity || !biological.isAlive) return;

      const age = this.calculateAge(identity.birthMonth, currentMonth);

      // 食物消耗
      foodConsumption += this.calculatePersonFoodConsumption(entity, age, biological.health);

      // 教育消耗
      if (age >= 6 && age <= 18) {
        educationConsumption += RESOURCE_CONSUMPTION.EDUCATION.STUDENT;
      }

      // 医疗消耗
      if (age >= 60) {
        medicineConsumption += RESOURCE_CONSUMPTION.MEDICINE.ELDERLY;
      }
      if (biological.health < 40) {
        medicineConsumption += RESOURCE_CONSUMPTION.MEDICINE.SICK;
      }

      // 住房需求
      housingNeeds += 1;

      // 资金支出
      if (occupation?.occupation === 'unemployed') {
        moneyExpense += RESOURCE_CONSUMPTION.UNEMPLOYMENT_BENEFIT;
      }
    });

    // 老年医疗支出
    const elderly = entities.filter(entity => {
      const identity = world.getComponent(entity.id, ComponentType.Identity);
      if (!identity) return false;
      const age = this.calculateAge(identity.birthMonth, currentMonth);
      return age >= 60;
    }).length;
    moneyExpense += elderly * RESOURCE_CONSUMPTION.ELDERLY_MEDICAL_COST;

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
        food: production.food - consumption.food,  // 净食物变化
        money: production.money - consumption.money,  // 净资金变化
        research: 0, // 暂无研究系统
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
    const netHousing = this.currentResources.housing - consumption.housing;

    // 食物短缺影响（当月不足）
    if (netFood < 0) {
      this.applyFoodShortageEffect(world, entities);
    } else if (netFood > 10) {
      // 食物充足时，健康恢复加成
      this.applyFoodAbundanceEffect(world, entities);
    }

    // 医疗不足影响（检查存量而非当月净变化）
    // 当存量医疗<=0，且当月消耗>生产时才触发
    if (this.currentResources.medicine <= 0 && consumption.medicine > production.medicine) {
      this.applyMedicineShortageEffect(world, entities);
    } else if (this.currentResources.medicine > 20) {
      // 医疗充足时，健康恢复加成
      this.applyMedicineAbundanceEffect(world, entities);
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
      const biological = world.getComponent(entity.id, ComponentType.Biological);
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
      const biological = world.getComponent(entity.id, ComponentType.Biological);
      const identity = world.getComponent(entity.id, ComponentType.Identity);

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
      const biological = world.getComponent(entity.id, ComponentType.Biological);
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
   * 应用食物充足的健康恢复效果
   */
  private applyFoodAbundanceEffect(world: World, entities: any[]): void {
    entities.forEach(entity => {
      const biological = world.getComponent(entity.id, ComponentType.Biological);
      if (biological && biological.isAlive && biological.health < 100) {
        // 食物充足时，健康恢复+0.3
        const newHealth = Math.min(100, biological.health + 0.3);
        world.updateComponent(entity.id, ComponentType.Biological, { health: newHealth });
      }
    });
  }

  /**
   * 应用医疗充足的健康恢复效果
   */
  private applyMedicineAbundanceEffect(world: World, entities: any[]): void {
    const currentMonth = this.getCurrentMonth(world);

    entities.forEach(entity => {
      const biological = world.getComponent(entity.id, ComponentType.Biological);
      const identity = world.getComponent(entity.id, ComponentType.Identity);

      if (!biological || !identity || !biological.isAlive || biological.health >= 100) return;

      const age = this.calculateAge(identity.birthMonth, currentMonth);

      // 医疗充足时，老人和病人恢复更快
      if (age >= 60 || biological.health < 60) {
        const recovery = age >= 80 ? 0.5 : (age >= 60 ? 0.3 : 0.2);
        const newHealth = Math.min(100, biological.health + recovery);
        world.updateComponent(entity.id, ComponentType.Biological, { health: newHealth });
      }
    });
  }

  /**
   * 应用教育自动提升
   */
  private applyEducationGrowth(world: World, entities: any[]): void {
    const currentMonth = this.getCurrentMonth(world);

    entities.forEach(entity => {
      const cognitive = world.getComponent(entity.id, ComponentType.Cognitive);
      const biological = world.getComponent(entity.id, ComponentType.Biological);
      const identity = world.getComponent(entity.id, ComponentType.Identity);

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
  private calculateFarmerFoodProduction(_entity: any, age: number, health: number): number {
    let baseProduction = RESOURCE_PRODUCTION.OCCUPATION.FARMER.FOOD_BASE;

    // 年龄效率
    let ageEfficiency = 1.0;
    if (age >= 18 && age <= 30) ageEfficiency = RESOURCE_PRODUCTION.OCCUPATION.FARMER.FOOD_AGE_MODIFIER.YOUNG_18_30;
    else if (age >= 51 && age <= 60) ageEfficiency = RESOURCE_PRODUCTION.OCCUPATION.FARMER.FOOD_AGE_MODIFIER.MIDDLE_51_60;
    else if (age < 18 || age > 60) ageEfficiency = RESOURCE_PRODUCTION.OCCUPATION.FARMER.FOOD_AGE_MODIFIER.OLD_OTHER;

    // 健康效率
    let healthEfficiency = 1.0;
    if (health > 80) healthEfficiency = RESOURCE_PRODUCTION.OCCUPATION.FARMER.HEALTH_MODIFIER.EXCELLENT_80;
    else if (health >= 60) healthEfficiency = RESOURCE_PRODUCTION.OCCUPATION.FARMER.HEALTH_MODIFIER.NORMAL_60;
    else if (health >= 30) healthEfficiency = RESOURCE_PRODUCTION.OCCUPATION.FARMER.HEALTH_MODIFIER.POOR_60;
    else healthEfficiency = RESOURCE_PRODUCTION.OCCUPATION.FARMER.HEALTH_MODIFIER.VERY_POOR_30;

    return baseProduction * ageEfficiency * healthEfficiency;
  }

  /**
   * 计算个人食物消耗
   */
  private calculatePersonFoodConsumption(_entity: any, age: number, health: number): number {
    let baseConsumption = RESOURCE_CONSUMPTION.FOOD.BASE;

    // 年龄段消耗
    if (age < 7) baseConsumption = RESOURCE_CONSUMPTION.FOOD.CHILD_0_6;
    else if (age < 13) baseConsumption = RESOURCE_CONSUMPTION.FOOD.CHILD_7_12;
    else if (age < 19) baseConsumption = RESOURCE_CONSUMPTION.FOOD.CHILD_13_18;
    else if (age >= 60) baseConsumption = RESOURCE_CONSUMPTION.FOOD.ELDERLY;

    // 健康差需要更多营养
    if (health < 30) baseConsumption += RESOURCE_CONSUMPTION.FOOD.LOW_HEALTH_BONUS;

    return baseConsumption;
  }

  /**
   * 获取季节性食物产出修正
   */
  private getSeasonalFoodModifier(month: number): number {
    const modifiers = [
      RESOURCE_PRODUCTION.SEASONAL_MODIFIER.MONTH_1,
      RESOURCE_PRODUCTION.SEASONAL_MODIFIER.MONTH_2,
      RESOURCE_PRODUCTION.SEASONAL_MODIFIER.MONTH_3,
      RESOURCE_PRODUCTION.SEASONAL_MODIFIER.MONTH_4,
      RESOURCE_PRODUCTION.SEASONAL_MODIFIER.MONTH_5,
      RESOURCE_PRODUCTION.SEASONAL_MODIFIER.MONTH_6,
      RESOURCE_PRODUCTION.SEASONAL_MODIFIER.MONTH_7,
      RESOURCE_PRODUCTION.SEASONAL_MODIFIER.MONTH_8,
      RESOURCE_PRODUCTION.SEASONAL_MODIFIER.MONTH_9,
      RESOURCE_PRODUCTION.SEASONAL_MODIFIER.MONTH_10,
      RESOURCE_PRODUCTION.SEASONAL_MODIFIER.MONTH_11,
      RESOURCE_PRODUCTION.SEASONAL_MODIFIER.MONTH_12,
    ];
    return modifiers[month] || 1.0;
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
    return world.getCurrentMonth();
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

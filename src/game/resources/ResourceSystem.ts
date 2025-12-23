import type { Person, Resources, Occupation } from '../store/types';

/**
 * 资源产出和消耗系统
 * 基于人口学和经济学原理设计
 */
export class ResourceSystem {
  /**
   * 计算食物产出
   */
  static calculateFoodProduction(people: Person[]): number {
    let production = 0;
    let totalFarmers = 0;
    let totalWorkers = 0;

    for (const person of people) {
      if (!person.isAlive) continue;

      // 只有人口可以生产
      let baseProduction = 0;

      if (person.occupation === 'farmer') {
        baseProduction = 8; // 农民基础产出
        totalFarmers++;
      } else if (person.occupation === 'worker') {
        baseProduction = 3; // 工人副业产出
        totalWorkers++;
      } else {
        continue; // 其他职业不生产食物
      }

      // 年龄效率系数
      let ageEfficiency = 1.0;
      if (person.age >= 18 && person.age <= 30) {
        ageEfficiency = 1.2; // 壮年
      } else if (person.age >= 31 && person.age <= 50) {
        ageEfficiency = 1.0; // 成年
      } else if (person.age >= 51 && person.age <= 60) {
        ageEfficiency = 0.8; // 老年前期
      } else if (person.age < 18 || person.age > 60) {
        ageEfficiency = 0.5; // 非劳动力
      }

      // 健康效率系数
      let healthEfficiency = 1.0;
      if (person.health > 80) {
        healthEfficiency = 1.2;
      } else if (person.health < 60) {
        healthEfficiency = 0.7;
      } else if (person.health < 30) {
        healthEfficiency = 0.4;
      }

      // 技能效率系数（教育）
      let skillEfficiency = 1.0;
      if (person.education >= 7) {
        skillEfficiency = 1.3; // 熟练
      } else if (person.education >= 5) {
        skillEfficiency = 1.1;
      }

      production += baseProduction * ageEfficiency * healthEfficiency * skillEfficiency;
    }

    // 土地限制（模拟人地关系）
    const maxProduction = people.filter(p => p.isAlive).length * 15;
    production = Math.min(production, maxProduction);

    return Math.floor(production);
  }

  /**
   * 计算食物消耗
   */
  static calculateFoodConsumption(people: Person[]): number {
    let consumption = 0;

    for (const person of people) {
      if (!person.isAlive) continue;

      // 基础消耗
      let baseConsumption = 1.0;

      // 年龄段消耗
      if (person.age < 7) {
        baseConsumption = 0.5; // 婴儿
      } else if (person.age < 13) {
        baseConsumption = 0.7; // 儿童
      } else if (person.age < 19) {
        baseConsumption = 0.9; // 少年
      } else if (person.age >= 60) {
        baseConsumption = 0.8; // 老年
      }

      // 特殊消耗
      // 孕妇（这里简化：女性19-45岁可能怀孕）
      if (person.gender === 'female' && person.age >= 19 && person.age <= 45) {
        baseConsumption += 0.1; // 可能怀孕的额外消耗
      }

      // 健康差需要更多营养恢复
      if (person.health < 30) {
        baseConsumption += 0.2;
      }

      // 体力劳动额外消耗
      if (person.occupation === 'farmer' || person.occupation === 'worker') {
        baseConsumption += 0.1;
      }

      consumption += baseConsumption;
    }

    return Math.ceil(consumption * 10) / 10; // 保留一位小数
  }

  /**
   * 计算资金收入
   */
  static calculateMoneyIncome(people: Person[]): number {
    let income = 0;

    for (const person of people) {
      if (!person.isAlive) continue;

      // 税收基础
      if (person.age >= 19 && person.age <= 60) {
        income += 5; // 成年人税收
      } else if (person.age >= 60) {
        income += 2; // 老年人减税
      }
      // 儿童（<19岁）不纳税

      // 职业产出
      if (person.occupation === 'worker') {
        income += 15; // 制造业
      } else if (person.occupation === 'scientist') {
        income += 20; // 科研拨款转化
      } else if (person.occupation === 'farmer') {
        income += 3; // 农产品销售
      }
      // 失业者不产出，反而消耗救济金（在支出部分计算）
    }

    return Math.floor(income);
  }

  /**
   * 计算资金支出
   */
  static calculateMoneyExpense(people: Person[], unemployedCount: number): number {
    let expense = 5; // 基础设施维护

    // 失业救济金
    expense += unemployedCount * 2;

    // 医疗支出（老年人）
    const elderly = people.filter(p => p.isAlive && p.age >= 60).length;
    expense += elderly * 1;

    // 教育支出（学生）
    const students = people.filter(p => p.isAlive && p.age >= 6 && p.age <= 18).length;
    expense += students * 0.5;

    return Math.ceil(expense);
  }

  /**
   * 计算住房需求
   */
  static calculateHousingNeeds(people: Person[]): number {
    const population = people.filter(p => p.isAlive).length;
    return population; // 每人需要1单位住房
  }

  /**
   * 计算教育资源消耗
   */
  static calculateEducationConsumption(people: Person[]): number {
    const students = people.filter(p => p.isAlive && p.age >= 6 && p.age <= 18).length;
    return students * 0.5; // 每个学生消耗0.5教育资源
  }

  /**
   * 计算医疗资源消耗
   */
  static calculateMedicineConsumption(people: Person[]): number {
    let consumption = 0;

    for (const person of people) {
      if (!person.isAlive) continue;

      // 老年人医疗消耗
      if (person.age >= 60) {
        consumption += 0.5;
      }

      // 病人医疗消耗
      if (person.health < 40) {
        consumption += 1;
      }

      // 孕产期医疗消耗
      if (person.gender === 'female' && person.age >= 19 && person.age <= 45) {
        consumption += 0.1;
      }
    }

    return Math.ceil(consumption * 10) / 10;
  }

  /**
   * 计算季节性调整
   */
  static getSeasonalModifier(month: number): { food: number; medicine: number } {
    // 3-8月春夏，9-2月秋冬
    const isSpringSummer = month >= 2 && month <= 7;

    return {
      food: isSpringSummer ? 1.2 : 0.8, // 春夏食物产出+20%，秋冬-20%
      medicine: isSpringSummer ? 1.0 : 1.2, // 冬季医疗消耗+20%
    };
  }

  /**
   * 计算职业分配建议
   */
  static suggestOccupationDistribution(people: Person[]): Record<Occupation, number> {
    const population = people.filter(p => p.isAlive).length;

    // 理想职业分布
    return {
      farmer: Math.floor(population * 0.4), // 40% 农民（保证食物）
      worker: Math.floor(population * 0.35), // 35% 工人（工业）
      scientist: Math.floor(population * 0.15), // 15% 科学家（研究）
      unemployed: Math.floor(population * 0.1), // 10% 自然失业
    };
  }

  /**
   * 计算人口健康状况评估
   */
  static evaluatePopulationHealth(people: Person[]): {
    healthy: number;
    sick: number;
    critical: number;
    averageHealth: number;
  } {
    const living = people.filter(p => p.isAlive);

    return {
      healthy: living.filter(p => p.health >= 70).length,
      sick: living.filter(p => p.health >= 40 && p.health < 70).length,
      critical: living.filter(p => p.health < 40).length,
      averageHealth: living.reduce((sum, p) => sum + p.health, 0) / living.length || 0,
    };
  }

  /**
   * 计算资源平衡状态
   */
  static getResourceBalanceStatus(resources: Resources, foodProduction: number, foodConsumption: number, people: Person[]): {
    foodBalance: 'surplus' | 'balanced' | 'shortage';
    moneyBalance: 'surplus' | 'balanced' | 'shortage';
    housingBalance: 'sufficient' | 'insufficient';
    overallHealth: 'good' | 'warning' | 'critical';
  } {
    // 食物平衡
    const foodRatio = foodConsumption > 0 ? foodProduction / foodConsumption : 1;
    let foodBalance: 'surplus' | 'balanced' | 'shortage';
    if (foodRatio >= 1.2) foodBalance = 'surplus';
    else if (foodRatio >= 0.9) foodBalance = 'balanced';
    else foodBalance = 'shortage';

    // 资金平衡（简单判断：>1000为充足）
    let moneyBalance: 'surplus' | 'balanced' | 'shortage';
    if (resources.money > 1000) moneyBalance = 'surplus';
    else if (resources.money > 0) moneyBalance = 'balanced';
    else moneyBalance = 'shortage';

    // 住房平衡
    const housingNeeds = this.calculateHousingNeeds(people);
    let housingBalance: 'sufficient' | 'insufficient';
    if (resources.housing >= housingNeeds) {
      housingBalance = 'sufficient';
    } else {
      housingBalance = 'insufficient';
    }

    // 整体健康状况
    const health = this.evaluatePopulationHealth(people);
    let overallHealth: 'good' | 'warning' | 'critical';
    if (health.critical > people.length * 0.2 || health.averageHealth < 40) {
      overallHealth = 'critical';
    } else if (health.sick > people.length * 0.3 || health.averageHealth < 60) {
      overallHealth = 'warning';
    } else {
      overallHealth = 'good';
    }

    return { foodBalance, moneyBalance, housingBalance, overallHealth };
  }
}

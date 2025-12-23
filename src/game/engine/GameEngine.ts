import { useGameStore } from '../../store/gameStore';
import { TimeSystem } from './TimeSystem';
import { EventSystem } from './EventSystem';
import { GameEndingSystem } from './GameEndingSystem';
import { ResourceSystem } from '../resources/ResourceSystem';
import { GAME_CONSTANTS, RESOURCE_CONSTANTS, POPULATION_CONSTANTS } from '../../constants/game';
import { calculateDeathRate } from '../../constants/game';

export class GameEngine {
  private timeSystem: TimeSystem;
  private eventSystem: EventSystem;
  private endingSystem: GameEndingSystem;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private lastFrameTime: number = 0;
  private ticksProcessed: number = 0; // 添加计数器

  constructor() {
    this.timeSystem = new TimeSystem(() => this.onTick());
    this.eventSystem = new EventSystem();
    this.endingSystem = new GameEndingSystem();
  }

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.loop();
  }

  pause(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  setGameSpeed(speed: 'paused' | '1x' | '2x' | '5x' | '10x'): void {
    this.timeSystem.setGameSpeed(speed);
  }

  private loop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    this.timeSystem.update(currentTime);

    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  private onTick(): void {
    const state = useGameStore.getState();

    if (state.isGameOver) {
      this.pause();
      return;
    }

    // 增加计数器
    this.ticksProcessed++;

    // 前12个 tick 不检查结束条件，让游戏先运行一段时间
    if (this.ticksProcessed < 12) {
      // 检查随机事件
      const randomEvent = this.eventSystem.checkAndTriggerEvent(state.totalMonths);
      if (randomEvent) {
        this.applyEvent(randomEvent);
      }

      // 推进时间（1个月）
      useGameStore.getState().advanceTime(1);

      // 执行游戏逻辑
      this.processPopulation();
      this.processResources();
      return;
    }

    // 检查随机事件
    const randomEvent = this.eventSystem.checkAndTriggerEvent(state.totalMonths);
    if (randomEvent) {
      this.applyEvent(randomEvent);
    }

    // 记录当前年份，用于判断是否年份增加
    const oldYear = state.currentYear;
    const oldMonth = state.currentMonth;

    // 推进时间（1个月）
    useGameStore.getState().advanceTime(1);

    // 执行游戏逻辑
    this.processPopulation();
    this.processResources();

    // 获取更新后的状态
    const newState = useGameStore.getState();

    // 只在月份变化后更新计数器和检查结束条件
    if (newState.currentMonth !== oldMonth || newState.currentYear !== oldYear) {
      // 更新失败条件计数器
      this.updateFailureCounters();

      // 检查游戏结束条件（只在月份变化后检查）
      const ending = this.endingSystem.checkEndingConditions(newState);
      if (ending) {
        this.triggerGameEnding(ending);
      }
    }
  }

  private updateFailureCounters(): void {
    const state = useGameStore.getState();
    const { resources, statistics } = state;

    // 只在游戏已经开始后才检查
    if (!state.gameStarted) return;

    // 更新负资产计数
    if (resources.money < 0) {
      useGameStore.setState({ negativeMoneyMonths: state.negativeMoneyMonths + 1 });
    } else {
      useGameStore.setState({ negativeMoneyMonths: 0 });
    }

    // 更新缺粮计数
    if (resources.food <= 0) {
      useGameStore.setState({ noFoodMonths: state.noFoodMonths + 1 });
    } else {
      useGameStore.setState({ noFoodMonths: 0 });
    }

    // 更新低幸福度计数（暂时用健康值代替）
    if (statistics.averageHealth < 40) {
      useGameStore.setState({ lowHappinessMonths: state.lowHappinessMonths + 1 });
    } else {
      useGameStore.setState({ lowHappinessMonths: 0 });
    }
  }

  private triggerGameEnding(ending: any): void {
    useGameStore.setState({
      isGameOver: true,
      gameEnding: ending,
    });
    this.pause();
  }

  private applyEvent(event: any): void {
    const state = useGameStore.getState();

    // 应用事件效果
    const updates: any = {};

    if (event.effects.deathRateChange) {
      // 死亡率变化会在人口处理中应用
    }

    if (event.effects.foodChange) {
      const foodChange = Math.floor(state.resources.food * event.effects.foodChange);
      updates.food = state.resources.food + foodChange;
    }

    if (event.effects.housingChange) {
      updates.housing = Math.max(0, state.resources.housing + event.effects.housingChange);
    }

    if (event.effects.moneyChange) {
      updates.money = state.resources.money + event.effects.moneyChange;
    }

    if (Object.keys(updates).length > 0) {
      useGameStore.getState().updateResources(updates);
    }

    // 添加事件到历史
    useGameStore.getState().addEventToHistory(
      `[${state.currentYear}年${state.currentMonth + 1}月] ${event.name}: ${event.description}`
    );
  }

  private processPopulation(): void {
    const state = useGameStore.getState();
    const people = Array.from(state.people.values()).filter(p => p.isAlive);

    // 计算政策对生育率和死亡率的影响
    let fertilityModifier = 0;
    let deathModifier = 0;

    state.activePolicies.forEach(policyId => {
      const policy = state.policies.find(p => p.id === policyId);
      if (policy) {
        if (policy.effects.fertilityRate) fertilityModifier += policy.effects.fertilityRate;
        if (policy.effects.deathRate) deathModifier += policy.effects.deathRate;
      }
    });

    // 处理每个人口
    people.forEach(person => {
      // 年龄增长
      useGameStore.getState().updatePerson(person.id, {
        age: person.age + 1 / 12,
      });

      // 健康衰减
      const newPerson = useGameStore.getState().people.get(person.id);
      if (!newPerson) return;

      let health = newPerson.health;
      if (newPerson.age >= 80) {
        health -= POPULATION_CONSTANTS.HEALTH_DECAY_AGE_80;
      } else if (newPerson.age >= 60) {
        health -= POPULATION_CONSTANTS.HEALTH_DECAY_AGE_60;
      }

      useGameStore.getState().updatePerson(person.id, { health: Math.max(0, health) });

      // 检查死亡
      const deathRate = calculateDeathRate(newPerson.age, newPerson.health) * (1 + deathModifier);
      if (Math.random() < deathRate) {
        this.handleDeath(newPerson.id);
      }
    });

    // 处理生育（简化版：每个育龄女性有概率生育）
    const females = people.filter(p => p.gender === 'female');
    females.forEach(female => {
      if (female.age >= POPULATION_CONSTANTS.MIN_AGE_FOR_CHILDBEARING &&
          female.age <= POPULATION_CONSTANTS.MAX_AGE_FOR_CHILDBEARING &&
          female.partner &&
          female.children.length < POPULATION_CONSTANTS.MAX_CHILDREN_PER_FAMILY) {

        const birthChance = 0.05 * (1 + fertilityModifier);
        if (Math.random() < birthChance) {
          this.handleBirth(female.id);
        }
      }
    });

    // 处理结婚
    const singles = people.filter(p => !p.partner && p.age >= POPULATION_CONSTANTS.MIN_AGE_FOR_MARRIAGE && p.age <= POPULATION_CONSTANTS.MAX_AGE_FOR_MARRIAGE);
    const singleMales = singles.filter(p => p.gender === 'male');
    const singleFemales = singles.filter(p => p.gender === 'female');

    // 简化的匹配逻辑
    const pairs = Math.min(singleMales.length, singleFemales.length);
    for (let i = 0; i < pairs; i++) {
      if (Math.random() < 0.02) { // 2% 概率结婚
        useGameStore.getState().updatePerson(singleMales[i].id, { partner: singleFemales[i].id });
        useGameStore.getState().updatePerson(singleFemales[i].id, { partner: singleMales[i].id });
      }
    }
  }

  private handleBirth(motherId: string): void {
    const state = useGameStore.getState();
    const mother = state.people.get(motherId);
    if (!mother || !mother.partner) return;

    const father = state.people.get(mother.partner);
    if (!father) return;

    const gender = Math.random() < 0.5 ? 'male' : 'female';

    const baby = {
      id: `person-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      age: 0,
      gender,
      health: 70 + Math.random() * 30,
      education: 0,
      fertility: 0,
      isAlive: true,
      parents: [motherId, father.id] as [string, string],
      children: [],
      occupation: 'unemployed' as const,
    };

    useGameStore.getState().addPerson(baby);

    // 更新父母的子女列表
    const newMotherChildren = [...mother.children, baby.id];
    const newFatherChildren = [...father.children, baby.id];
    useGameStore.getState().updatePerson(motherId, { children: newMotherChildren });
    useGameStore.getState().updatePerson(father.id, { children: newFatherChildren });

    // 更新统计
    const stats = state.statistics;
    stats.totalBirths++;

    // 添加通知
    useGameStore.getState().addEventToHistory(`新生儿诞生！性别: ${gender === 'male' ? '男' : '女'}`);
  }

  private handleDeath(personId: string): void {
    const person = useGameStore.getState().people.get(personId);
    if (!person) return;

    useGameStore.getState().updatePerson(personId, { isAlive: false });

    // 更新统计
    const stats = useGameStore.getState().statistics;
    stats.totalDeaths++;

    // 移除配偶关系
    if (person.partner) {
      const partner = useGameStore.getState().people.get(person.partner);
      if (partner) {
        useGameStore.getState().updatePerson(person.partner, { partner: undefined });
      }
    }
  }

  private processResources(): void {
    const state = useGameStore.getState();
    const livingPeople = Array.from(state.people.values()).filter(p => p.isAlive);

    // ========== 使用新的资源系统 ==========

    // 1. 食物系统
    const foodProduction = ResourceSystem.calculateFoodProduction(livingPeople);
    const foodConsumption = ResourceSystem.calculateFoodConsumption(livingPeople);

    // 季节性调整
    const seasonalModifier = ResourceSystem.getSeasonalModifier(state.currentMonth);
    const adjustedFoodProduction = Math.floor(foodProduction * seasonalModifier.food);

    // 2. 资金系统
    const moneyIncome = ResourceSystem.calculateMoneyIncome(livingPeople);
    const unemployedCount = livingPeople.filter(p => p.occupation === 'unemployed').length;
    const moneyExpense = ResourceSystem.calculateMoneyExpense(livingPeople, unemployedCount);

    // 3. 教育系统
    const educationConsumption = ResourceSystem.calculateEducationConsumption(livingPeople);

    // 教育资源获得（可以通过资金购买或政策投入）
    // 这里简化：每月自动获得一定量（模拟学校产出）
    const teachers = livingPeople.filter(p => p.occupation === 'scientist').length;
    const educationProduction = Math.max(0, teachers * 2); // 每个教师产生2教育资源

    // 4. 医疗系统
    const medicineConsumption = ResourceSystem.calculateMedicineConsumption(livingPeople);
    const medicineProduction = Math.max(0, Math.ceil(livingPeople.filter(p => p.occupation === 'scientist').length * 0.5));

    // 5. 住房系统
    const housingNeeds = ResourceSystem.calculateHousingNeeds(livingPeople);

    // ========== 计算政策影响 ==========
    let policyFoodBonus = 0;
    let policyMoneyBonus = 0;
    let policyMedicineBonus = 0;

    state.activePolicies.forEach(policyId => {
      const policy = state.policies.find(p => p.id === policyId);
      if (policy) {
        if (policy.effects.foodProduction) {
          policyFoodBonus += Math.floor(adjustedFoodProduction * policy.effects.foodProduction);
        }
        if (policy.effects.economy) {
          policyMoneyBonus += Math.floor(100 * policy.effects.economy);
        }
        // 医疗政策减少消耗
        if (policy.effects.medicineConsumption && policy.effects.medicineConsumption < 0) {
          policyMedicineBonus += Math.floor(medicineConsumption * Math.abs(policy.effects.medicineConsumption));
        }
      }
    });

    // ========== 更新资源 ==========
    const newFood = state.resources.food + adjustedFoodProduction + policyFoodBonus - foodConsumption;
    const newMoney = state.resources.money + moneyIncome + policyMoneyBonus - moneyExpense;
    const newMedicine = state.resources.medicine + medicineProduction + policyMedicineBonus - medicineConsumption;
    const newEducation = state.resources.education + educationProduction - educationConsumption;

    // 计算生产率（用于UI显示）
    const researchProduction = livingPeople.filter(p => p.occupation === 'scientist').length * RESOURCE_CONSTANTS.RESEARCH_PER_SCIENTIST;

    useGameStore.getState().updateResources({
      food: Math.round(newFood * 10) / 10,
      money: Math.round(newMoney * 10) / 10,
      medicine: Math.round(newMedicine * 10) / 10,
      education: Math.round(newEducation * 10) / 10,
      productionRate: {
        food: adjustedFoodProduction,
        research: researchProduction,
      },
    });

    // ========== 资源短缺影响 ==========
    // 食物短缺影响健康
    if (newFood < 0) {
      this.applyFoodShortageEffect(livingPeople);
    }

    // 住房不足影响
    if (state.resources.housing < housingNeeds) {
      this.applyHousingShortageEffect(livingPeople);
    }

    // 医疗不足影响
    if (newMedicine < 0) {
      this.applyMedicineShortageEffect(livingPeople);
    }

    // 教育提升（自动）
    this.applyEducationGrowth(livingPeople);
  }

  /**
   * 食物短缺影响
   */
  private applyFoodShortageEffect(people: Person[]): void {
    const shortageMonths = useGameStore.getState().noFoodMonths;

    if (shortageMonths >= 3) {
      // 健康值下降
      people.forEach(person => {
        const healthLoss = shortageMonths >= 6 ? 5 : 2;
        useGameStore.getState().updatePerson(person.id, {
          health: Math.max(0, person.health - healthLoss),
        });
      });
    }
  }

  /**
   * 住房不足影响
   */
  private applyHousingShortageEffect(people: Person[]): void {
    // 住房不足导致健康下降
    people.forEach(person => {
      useGameStore.getState().updatePerson(person.id, {
        health: Math.max(0, person.health - 0.5),
      });
    });
  }

  /**
   * 医疗不足影响
   */
  private applyMedicineShortageEffect(people: Person[]): void {
    // 老年人和病人健康下降更快
    people.forEach(person => {
      if (person.age >= 60 || person.health < 40) {
        useGameStore.getState().updatePerson(person.id, {
          health: Math.max(0, person.health - 1),
        });
      }
    });
  }

  /**
   * 教育自动提升
   */
  private applyEducationGrowth(people: Person[]): void {
    people.forEach(person => {
      // 只有学生（6-18岁）才会自动提升教育
      if (person.age >= 6 && person.age <= 18 && person.education < 10) {
        const hasTeacher = people.some(p =>
          p.isAlive &&
          p.occupation === 'scientist' &&
          p.id !== person.id
        );

        const hasResource = useGameStore.getState().resources.education > 0;

        if (hasTeacher && hasResource) {
          // 每月提升0.1教育
          useGameStore.getState().updatePerson(person.id, {
            education: Math.min(10, person.education + 0.1),
          });
        }
      }
    });
  }

  destroy(): void {
    this.pause();
    this.ticksProcessed = 0;
    this.timeSystem.reset();
    this.eventSystem.reset();
  }
}

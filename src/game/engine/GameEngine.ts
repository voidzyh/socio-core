/**
 * GameEngine - 游戏引擎
 * 暂时使用原有gameStore逻辑，ECS系统保留待后续集成
 */

import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { TimeSystem } from './TimeSystem';
import { EventSystem } from './EventSystem';
import { GameEndingSystem } from './GameEndingSystem';

export class GameEngine {
  // 原有系统
  private timeSystem: TimeSystem;
  private eventSystem: EventSystem;
  private endingSystem: GameEndingSystem;

  // 游戏状态
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private ticksProcessed: number = 0;

  constructor() {
    // 初始化系统
    this.timeSystem = new TimeSystem(() => this.onTick());
    this.eventSystem = new EventSystem();
    this.endingSystem = new GameEndingSystem();
  }

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
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

  /**
   * 调试信息：获取引擎状态
   */
  getDebugInfo() {
    const state = useGameStore.getState();
    return {
      isRunning: this.isRunning,
      ticksProcessed: this.ticksProcessed,
      currentMonth: state.currentMonth,
      populationCount: state.populationCount,
      resources: state.resources,
    };
  }

  /**
   * 游戏主循环Tick
   * 暂时使用原有逻辑，ECS系统后续集成
   */
  private onTick(): void {
    const state = useGameStore.getState();

    if (state.isGameOver) {
      this.pause();
      return;
    }

    this.ticksProcessed++;

    console.log('[GameEngine] Tick #' + this.ticksProcessed + ', Month: ' + state.currentMonth);

    // 前12个 tick 不检查结束条件
    const skipEndingCheck = this.ticksProcessed < 12;

    // 1. 检查随机事件
    const randomEvent = this.eventSystem.checkAndTriggerEvent(state.totalMonths);
    if (randomEvent) {
      this.applyEvent(randomEvent);
    }

    // 2. 推进时间（1个月）
    useGameStore.getState().advanceTime(1);

    // 3. 使用原有逻辑处理人口和资源
    this.processPopulation();
    this.processResources();

    // 4. 更新UI
    this.updateUIState();

    // 5. 检查游戏结束条件
    if (!skipEndingCheck) {
      this.updateFailureCounters();
      const newState = useGameStore.getState();
      const ending = this.endingSystem.checkEndingConditions(newState);
      if (ending) {
        this.triggerGameEnding(ending);
      }
    }

    console.log('[GameEngine] Resources after tick:', {
      food: state.resources.food,
      money: state.resources.money,
      population: state.populationCount
    });
  }

  /**
   * 处理人口逻辑（原有方式）
   */
  private processPopulation(): void {
    const state = useGameStore.getState();
    const people = Array.from(state.people.values()).filter(p => p.isAlive);

    console.log('[processPopulation] Processing', people.length, 'living people');

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

    let deaths = 0;
    let births = 0;

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
        health -= 1; // 老年健康衰减
      } else if (newPerson.age >= 60) {
        health -= 0.5;
      }

      useGameStore.getState().updatePerson(person.id, { health: Math.max(0, health) });

      // 检查死亡
      const deathRate = this.calculateDeathRate(newPerson.age, newPerson.health) * (1 + deathModifier);
      if (Math.random() < deathRate) {
        this.handleDeath(newPerson.id);
        deaths++;
      }
    });

    // 处理生育
    const females = people.filter(p => p.gender === 'female');
    females.forEach(female => {
      if (female.age >= 18 && female.age <= 45 && female.children.length < 5) {
        const birthChance = 0.05 * (1 + fertilityModifier);
        if (Math.random() < birthChance) {
          this.handleBirth(female.id);
          births++;
        }
      }
    });

    console.log('[processPopulation] Population changes:', { deaths, births });
  }

  /**
   * 计算死亡率
   */
  private calculateDeathRate(age: number, health: number): number {
    if (age < 40) return 0.001;
    if (age < 60) return 0.005 + (100 - health) * 0.0001;
    if (age < 80) return 0.02 + (100 - health) * 0.0005;
    return 0.05 + (100 - health) * 0.001;
  }

  /**
   * 处理出生
   */
  private handleBirth(motherId: string): void {
    const state = useGameStore.getState();
    const mother = state.people.get(motherId);
    if (!mother || !mother.partner) return;

    const father = state.people.get(mother.partner);
    if (!father) return;

    const gender = Math.random() < 0.5 ? 'male' : 'female';
    const genderText = gender === 'male' ? '男' : '女';

    const baby = {
      id: `person-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      age: 0,
      gender,
      health: 70 + Math.random() * 30,
      education: 0,
      fertility: 0,
      isAlive: true,
      children: [],
      occupation: 'unemployed' as const,
      partner: undefined,
    };

    useGameStore.getState().addPerson(baby);

    // 将孩子添加到父母的children数组
    useGameStore.getState().updatePerson(motherId, {
      children: [...mother.children, baby.id]
    });

    useGameStore.getState().updatePerson(father.id, {
      children: [...father.children, baby.id]
    });

    // 记录出生统计
    useGameStore.getState().recordBirth();

    // 添加事件
    useGameStore.getState().addEventToHistory(
      `[${state.currentYear}年${state.currentMonth + 1}月] ${mother.id}和${father.id}迎来了一个${genderText}孩`
    );

    console.log('[handleBirth] New baby born:', baby.id, 'to', motherId, 'and', father.id);
  }

  /**
   * 处理死亡
   */
  private handleDeath(personId: string): void {
    const state = useGameStore.getState();
    const person = state.people.get(personId);
    if (!person) return;

    useGameStore.getState().updatePerson(personId, { isAlive: false });

    // 记录死亡统计
    useGameStore.getState().recordDeath();

    // 添加事件
    useGameStore.getState().addEventToHistory(
      `[${state.currentYear}年${state.currentMonth + 1}月] ${personId}去世了，享年${Math.floor(person.age)}岁`
    );

    console.log('[handleDeath] Person died:', personId, 'age', Math.floor(person.age));
  }

  /**
   * 处理资源
   */
  private processResources(): void {
    const state = useGameStore.getState();
    const livingPeople = Array.from(state.people.values()).filter(p => p.isAlive);
    const currentMonth = state.currentMonth;

    console.log('[processResources] Processing resources for', livingPeople.length, 'people');

    // 使用ResourceSystem计算资源
    const foodProduction = this.calculateFoodProduction(livingPeople);
    const foodConsumption = this.calculateFoodConsumption(livingPeople);
    const moneyIncome = this.calculateMoneyIncome(livingPeople);
    const moneyExpense = this.calculateMoneyExpense(livingPeople);

    console.log('[processResources] Calculated:', {
      foodProduction,
      foodConsumption,
      moneyIncome,
      moneyExpense
    });

    // 季节性调整
    const seasonalModifier = this.getSeasonalModifier(currentMonth);
    const adjustedFoodProduction = Math.floor(foodProduction * seasonalModifier.food);

    // 计算政策影响
    let policyFoodBonus = 0;
    let policyMoneyBonus = 0;

    state.activePolicies.forEach(policyId => {
      const policy = state.policies.find(p => p.id === policyId);
      if (policy && policy.active) {
        if (policy.effects.foodProduction) {
          policyFoodBonus += Math.floor(adjustedFoodProduction * policy.effects.foodProduction);
        }
        if (policy.effects.economy) {
          policyMoneyBonus += Math.floor(100 * policy.effects.economy);
        }
      }
    });

    // 计算新的资源值
    const newFood = state.resources.food + adjustedFoodProduction + policyFoodBonus - foodConsumption;
    const newMoney = state.resources.money + moneyIncome + policyMoneyBonus - moneyExpense;

    console.log('[processResources] Updating resources:', {
      oldFood: state.resources.food,
      newFood,
      oldMoney: state.resources.money,
      newMoney
    });

    // 更新资源
    useGameStore.getState().updateResources({
      food: Math.round(newFood * 10) / 10,
      money: Math.round(newMoney * 10) / 10,
    });

    // 资源短缺影响
    if (newFood < 0) {
      livingPeople.forEach(person => {
        useGameStore.getState().updatePerson(person.id, {
          health: Math.max(0, person.health - 2),
        });
      });
    }
  }

  /**
   * 计算食物产出
   */
  private calculateFoodProduction(people: any[]): number {
    let production = 0;

    for (const person of people) {
      if (!person.isAlive) continue;

      let baseProduction = 0;

      if (person.occupation === 'farmer') {
        baseProduction = 8;
      } else if (person.occupation === 'worker') {
        baseProduction = 3;
      } else {
        continue;
      }

      // 年龄效率系数
      let ageEfficiency = 1.0;
      if (person.age >= 18 && person.age <= 30) {
        ageEfficiency = 1.2;
      } else if (person.age >= 51 && person.age <= 60) {
        ageEfficiency = 0.8;
      } else if (person.age < 18 || person.age > 60) {
        ageEfficiency = 0.5;
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

      // 技能效率系数
      let skillEfficiency = 1.0;
      if (person.education >= 7) {
        skillEfficiency = 1.3;
      } else if (person.education >= 5) {
        skillEfficiency = 1.1;
      }

      production += baseProduction * ageEfficiency * healthEfficiency * skillEfficiency;
    }

    // 土地限制
    const maxProduction = people.length * 15;
    production = Math.min(production, maxProduction);

    return Math.floor(production);
  }

  /**
   * 计算食物消耗
   */
  private calculateFoodConsumption(people: any[]): number {
    let consumption = 0;

    for (const person of people) {
      if (!person.isAlive) continue;

      let baseConsumption = 1.0;

      // 年龄段消耗
      if (person.age < 7) {
        baseConsumption = 0.5;
      } else if (person.age < 13) {
        baseConsumption = 0.7;
      } else if (person.age < 19) {
        baseConsumption = 0.9;
      } else if (person.age >= 60) {
        baseConsumption = 0.8;
      }

      // 体力劳动额外消耗
      if (person.occupation === 'farmer' || person.occupation === 'worker') {
        baseConsumption += 0.1;
      }

      consumption += baseConsumption;
    }

    return Math.ceil(consumption * 10) / 10;
  }

  /**
   * 计算资金收入
   */
  private calculateMoneyIncome(people: any[]): number {
    let income = 0;

    for (const person of people) {
      if (!person.isAlive) continue;

      // 成年人税收
      if (person.age >= 19 && person.age <= 60) {
        income += 5;
      } else if (person.age >= 60) {
        income += 2;
      }

      // 职业产出
      if (person.occupation === 'worker') {
        income += 15;
      } else if (person.occupation === 'scientist') {
        income += 20;
      } else if (person.occupation === 'farmer') {
        income += 3;
      }
    }

    return Math.floor(income);
  }

  /**
   * 计算资金支出
   */
  private calculateMoneyExpense(people: any[]): number {
    let expense = 0;

    for (const person of people) {
      if (!person.isAlive) continue;

      // 基础支出
      if (person.age >= 19) {
        expense += 1;
      }

      // 失业者救济金
      if (person.occupation === 'unemployed') {
        expense += 2;
      }
    }

    return expense;
  }

  /**
   * 获取季节修正
   */
  private getSeasonalModifier(month: number): { food: number } {
    // 春季(2-7月)产量+20%，其他月份-20%
    return {
      food: (month >= 2 && month <= 7) ? 1.2 : 0.8
    };
  }

  /**
   * 更新UI状态
   */
  private updateUIState(): void {
    // 触发UI更新事件
    const month = useGameStore.getState().currentMonth;
    // 可以在这里添加其他UI更新逻辑
  }

  /**
   * 更新失败条件计数器
   */
  private updateFailureCounters(): void {
    const state = useGameStore.getState();
    const { resources, statistics } = state;

    if (!state.gameStarted) return;

    // 更新各种计数器
    if (resources.money < 0) {
      useGameStore.setState({ negativeMoneyMonths: state.negativeMoneyMonths + 1 });
    } else {
      useGameStore.setState({ negativeMoneyMonths: 0 });
    }

    if (resources.food <= 0) {
      useGameStore.setState({ noFoodMonths: state.noFoodMonths + 1 });
    } else {
      useGameStore.setState({ noFoodMonths: 0 });
    }

    // 使用平均健康
    if (statistics.averageHealth < 40) {
      useGameStore.setState({ lowHappinessMonths: state.lowHappinessMonths + 1 });
    } else {
      useGameStore.setState({ lowHappinessMonths: 0 });
    }
  }

  /**
   * 触发游戏结束
   */
  private triggerGameEnding(ending: any): void {
    useGameStore.setState({
      isGameOver: true,
      gameEnding: ending,
    });
    this.pause();
  }

  /**
   * 应用事件效果
   */
  private applyEvent(event: any): void {
    const state = useGameStore.getState();
    const updates: any = {};

    if (event.effects.foodChange) {
      const foodChange = Math.floor(state.resources.food * event.effects.foodChange);
      updates.food = state.resources.food + foodChange;
    }

    if (event.effects.moneyChange) {
      updates.money = state.resources.money + event.effects.moneyChange;
    }

    if (Object.keys(updates).length > 0) {
      useGameStore.getState().updateResources(updates);
    }

    useGameStore.getState().addEventToHistory(
      `[${state.currentYear}年${state.currentMonth + 1}月] ${event.name}: ${event.description}`
    );

    useUIStore.getState().addNotification({
      message: event.name,
      type: 'info',
    });
  }

  /**
   * 重置游戏
   */
  destroy(): void {
    this.pause();
    this.ticksProcessed = 0;
    this.timeSystem.reset();
    this.eventSystem.reset();
  }
}

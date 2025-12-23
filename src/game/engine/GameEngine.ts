/**
 * GameEngine - 游戏引擎
 * ECS架构：使用World协调所有Systems
 */

import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { GAME_CONSTANTS } from '../../constants/game';
import { TimeSystem } from './TimeSystem';
import { EventSystem } from './EventSystem';
import { GameEndingSystem } from './GameEndingSystem';

// ECS核心
import { World } from '../../ecs/core/World';
import { EntityFactory } from '../../ecs/utils/EntityFactory';
import { SyncManager } from '../../ecs/sync/SyncManager';
import { EventManager } from '../../ecs/events/EventManager';

// ECS Stores
import { usePersonStore } from '../../ecs/stores/PersonStore';
import { useResourceStore } from '../../ecs/stores/ResourceStore';
import { useStatisticsStore } from '../../ecs/stores/StatisticsStore';

// ECS Systems
import {
  PopulationSystem,
  AgingSystem,
  BirthSystem,
  DeathSystem,
  MarriageSystem,
  ResourceSystem,
  FoodSystem,
  MoneySystem,
  ShortageEffectSystem,
  PolicySystem,
  PolicyEffectSystem,
  StatisticsSystem,
  AchievementSystem,
} from '../../ecs/systems';

// 类型
import { ComponentType } from '../../ecs/components/PersonComponents';
import type { Person } from '../../store/types';

export class GameEngine {
  // ECS核心
  private world: World;
  private entityFactory: EntityFactory;
  private syncManager: SyncManager;
  private eventManager: EventManager;

  // 原有系统
  private timeSystem: TimeSystem;
  private eventSystem: EventSystem;
  private endingSystem: GameEndingSystem;

  // 游戏状态
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private ticksProcessed: number = 0;

  constructor() {
    // 初始化ECS World
    this.world = new World();
    this.entityFactory = new EntityFactory(this.world);
    this.syncManager = new SyncManager(this.world);
    this.eventManager = new EventManager(this.world);
    this.initializeECSSystems();

    // 初始化原有系统
    this.timeSystem = new TimeSystem(() => this.onTick());
    this.eventSystem = new EventSystem();
    this.endingSystem = new GameEndingSystem();

    // 监听ECS事件并同步到gameStore
    this.setupECSEventListeners();

    // 初始化ECS人口（使用EntityFactory）
    this.initializeECSPopulation();
  }

  /**
   * 初始化所有ECS Systems
   */
  private initializeECSSystems(): void {
    // 人口系统
    this.world.addSystem(new PopulationSystem());
    this.world.addSystem(new AgingSystem());
    this.world.addSystem(new BirthSystem());
    this.world.addSystem(new DeathSystem());
    this.world.addSystem(new MarriageSystem());

    // 资源系统
    this.world.addSystem(new ResourceSystem());
    this.world.addSystem(new FoodSystem());
    this.world.addSystem(new MoneySystem());
    this.world.addSystem(new ShortageEffectSystem());

    // 政策系统
    this.world.addSystem(new PolicySystem());
    this.world.addSystem(new PolicyEffectSystem());

    // 统计与成就
    this.world.addSystem(new StatisticsSystem());
    this.world.addSystem(new AchievementSystem());
  }

  /**
   * 初始化ECS人口
   * 从gameStore读取初始人口并创建ECS实体
   */
  private initializeECSPopulation(): void {
    const state = useGameStore.getState();

    // 遍历gameStore中的初始人口，为每个Person创建ECS实体
    state.people.forEach((person: Person) => {
      this.entityFactory.createPersonFromData(person);
    });
  }

  /**
   * 设置ECS事件监听器
   * 监听ECS Systems发出的事件并同步到ECS Stores和gameStore
   */
  private setupECSEventListeners(): void {
    const eventBus = this.world.getEventBus();

    // 监听出生事件
    eventBus.on('person:born', (data: any) => {
      // 同步到ECS Stores
      useStatisticsStore.getState().recordBirth();

      // 兼容：同步到gameStore
      useGameStore.getState().recordBirth();
    });

    // 监听死亡事件
    eventBus.on('person:died', (data: any) => {
      // 同步到ECS Stores
      useStatisticsStore.getState().recordDeath();

      // 兼容：同步到gameStore
      useGameStore.getState().recordDeath();
    });

    // 监听资源更新事件
    eventBus.on('resources:updated', (data: any) => {
      const resources = data.resources;

      // 同步到ECS Stores
      useResourceStore.getState().updateResources({
        food: resources.food || 0,
        money: resources.money || 0,
        education: resources.education || 0,
        medicine: resources.medicine || 0,
      });

      // 兼容：同步到gameStore
      this.syncManager.syncResources({
        food: resources.food || 0,
        money: resources.money || 0,
      });
    });

    // 监听食物计算事件
    eventBus.on('food:calculated', (data: any) => {
      // 更新短缺状态
      const hasShortage = data.balance < 0;
      useResourceStore.getState().updateShortageStatus({
        food: hasShortage,
      });
    });

    // 监听资金计算事件
    eventBus.on('money:calculated', (data: any) => {
      // 更新短缺状态
      const hasShortage = data.balance < 0;
      useResourceStore.getState().updateShortageStatus({
        money: hasShortage,
      });
    });
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
   * 同步ECS数据到ECS Stores和gameStore（UI兼容层）
   */
  private syncToUI(): void {
    // 同步人口数据到ECS PersonStore
    const entities = this.world.getEntities();
    const peopleMap = new Map<string, Person>();

    for (const entity of entities) {
      const identity = this.world.getComponent<any>(entity.id, ComponentType.Identity);
      const biological = this.world.getComponent<any>(entity.id, ComponentType.Biological);
      const cognitive = this.world.getComponent<any>(entity.id, ComponentType.Cognitive);
      const relationship = this.world.getComponent<any>(entity.id, ComponentType.Relationship);
      const occupation = this.world.getComponent<any>(entity.id, ComponentType.Occupation);

      if (!identity || !biological || !cognitive || !relationship || !occupation) {
        continue;
      }

      // 计算年龄
      const currentMonth = this.world.getTotalMonths();
      const age = (currentMonth - identity.birthMonth) / GAME_CONSTANTS.MONTHS_PER_YEAR;

      // 转换childrenIds Set为数组
      const childrenArray = Array.from(relationship.childrenIds || []) as string[];

      const person: Person = {
        id: entity.id,
        age,
        gender: identity.gender as 'male' | 'female',
        health: biological.health,
        education: cognitive.education,
        fertility: biological.fertility,
        isAlive: biological.isAlive,
        children: childrenArray,
        occupation: occupation.occupation,
        partner: relationship.partnerId,
      };

      peopleMap.set(entity.id, person);
    }

    // 更新ECS PersonStore
    usePersonStore.getState().setPeople(peopleMap);

    // 使用SyncManager将ECS数据同步到gameStore（兼容层）
    this.syncManager.syncToStore();
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
   * ECS架构：World.update()协调所有Systems
   */
  private onTick(): void {
    const state = useGameStore.getState();

    if (state.isGameOver) {
      this.pause();
      return;
    }

    this.ticksProcessed++;

    // 前12个 tick 不检查结束条件
    const skipEndingCheck = this.ticksProcessed < 12;

    // 1. 检查随机事件
    const randomEvent = this.eventSystem.checkAndTriggerEvent(this.world.getTotalMonths());
    if (randomEvent) {
      this.applyEvent(randomEvent);
    }

    // 2. 推进时间（1个月）- 同时更新World和gameStore
    this.world.advanceTime(1);
    useGameStore.getState().advanceTime(1);

    // 3. ECS Systems处理游戏逻辑（已激活）
    this.world.update(1.0); // deltaTime = 1.0 (1个月)

    // 4. 同步ECS数据到gameStore（保持UI兼容）
    this.syncToUI();

    // 5. 原有逻辑已禁用（ECS接管）
    // this.processPopulation();
    // this.processResources();

    // 6. 更新UI
    this.updateUIState();

    // 7. 检查游戏结束条件
    if (!skipEndingCheck) {
      this.updateFailureCounters();
      const newState = useGameStore.getState();
      const ending = this.endingSystem.checkEndingConditions(newState);
      if (ending) {
        this.triggerGameEnding(ending);
      }
    }
  }

  /**
   * 处理人口逻辑（原有方式）
   */
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
        health -= 1; // 老年健康衰减
      } else if (newPerson.age >= 60) {
        health -= 0.5;
      }

      useGameStore.getState().updatePerson(person.id, { health: Math.max(0, health) });

      // 检查死亡
      const deathRate = this.calculateDeathRate(newPerson.age, newPerson.health) * (1 + deathModifier);
      if (Math.random() < deathRate) {
        this.handleDeath(newPerson.id);
      }
    });

    // 处理生育
    const females = people.filter(p => p.gender === 'female');
    females.forEach(female => {
      if (female.age >= 18 && female.age <= 45 && female.children.length < 5) {
        const birthChance = 0.05 * (1 + fertilityModifier);
        if (Math.random() < birthChance) {
          this.handleBirth(female.id);
        }
      }
    });
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
      gender: gender as 'male' | 'female',
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
  }

  /**
   * 处理资源
   */
  private processResources(): void {
    const state = useGameStore.getState();
    const livingPeople = Array.from(state.people.values()).filter(p => p.isAlive);
    const currentMonth = state.currentMonth;

    // 使用ResourceSystem计算资源
    const foodProduction = this.calculateFoodProduction(livingPeople);
    const foodConsumption = this.calculateFoodConsumption(livingPeople);
    const moneyIncome = this.calculateMoneyIncome(livingPeople);
    const moneyExpense = this.calculateMoneyExpense(livingPeople);

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

    // 重置ECS World
    this.world.resetTime();
    // 注意：这里不重置实体，因为resetGame会重新创建gameStore状态
    // 下次initializeECSPopulation会重新创建ECS实体
  }

  // ========== UI事件处理公开方法 ==========

  /**
   * 处理政策激活
   */
  handlePolicyActivation(policyId: string): void {
    this.eventManager.handlePolicyActivation(policyId);
  }

  /**
   * 处理政策停用
   */
  handlePolicyDeactivation(policyId: string): void {
    this.eventManager.handlePolicyDeactivation(policyId);
  }

  /**
   * 处理游戏速度变更
   */
  handleGameSpeedChange(speed: 'paused' | '1x' | '2x' | '5x' | '10x'): void {
    this.eventManager.handleGameSpeedChange(speed);
  }

  /**
   * 处理游戏暂停
   */
  handleGamePause(): void {
    this.eventManager.handleGamePause();
  }

  /**
   * 处理游戏开始
   */
  handleGameStart(): void {
    this.eventManager.handleGameStart();
  }

  /**
   * 处理游戏重置
   */
  handleGameReset(): void {
    // 重置游戏引擎状态
    this.pause();
    this.ticksProcessed = 0;
    this.timeSystem.reset();
    this.eventSystem.reset();

    // 重置ECS World
    this.world.resetTime();

    // 清除所有ECS实体
    const entities = this.world.getEntities();
    entities.forEach(entity => {
      this.world.destroyEntity(entity.id);
    });

    // 重置ECS Stores
    usePersonStore.getState().reset();
    useResourceStore.getState().reset();
    useStatisticsStore.getState().reset();

    // 重新初始化ECS人口（从新的gameStore状态）
    this.initializeECSPopulation();

    // 触发重置事件
    this.eventManager.handleGameReset();
  }

  /**
   * 处理实体选择
   */
  handleEntitySelect(entityId: string): void {
    this.eventManager.handleEntitySelect(entityId);
  }

  /**
   * 处理职业变更
   */
  handleOccupationChange(entityId: string, newOccupation: string): void {
    this.eventManager.handleOccupationChange(entityId, newOccupation);
  }
}

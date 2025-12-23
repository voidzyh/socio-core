/**
 * GameEngine - 游戏引擎
 * ECS架构：使用World协调所有Systems
 */

import { useUIStore } from '../../store/uiStore';
import { GAME_CONSTANTS } from '../../constants/game';
import { TimeSystem } from './TimeSystem';
import { EventSystem } from './EventSystem';
import { GameEndingSystem } from './GameEndingSystem';

// ECS核心
import { World } from '../../ecs/core/World';
import { EntityFactory } from '../../ecs/utils/EntityFactory';
import { EventManager } from '../../ecs/events/EventManager';

// ECS Stores
import { usePersonStore } from '../../ecs/stores/PersonStore';
import { useResourceStore } from '../../ecs/stores/ResourceStore';
import { useStatisticsStore } from '../../ecs/stores/StatisticsStore';
import { useGameStateStore } from '../../ecs/stores/GameStateStore';
import { useAchievementStore } from '../../ecs/stores/AchievementStore';
import { useEventStore } from '../../ecs/stores/EventStore';

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
   * 使用EntityFactory创建初始人口
   */
  private initializeECSPopulation(): void {
    // 使用EntityFactory创建初始人口（包含婚姻配对）
    this.entityFactory.createInitialPopulation();
  }

  /**
   * 设置ECS事件监听器
   * 监听ECS Systems发出的事件并同步到ECS Stores
   */
  private setupECSEventListeners(): void {
    const eventBus = this.world.getEventBus();

    // 监听出生事件
    eventBus.on('person:born', () => {
      useStatisticsStore.getState().recordBirth();
    });

    // 监听死亡事件
    eventBus.on('person:died', () => {
      useStatisticsStore.getState().recordDeath();
    });

    // 监听资源更新事件
    eventBus.on('resources:updated', (data: any) => {
      const resources = data.resources;
      useResourceStore.getState().updateResources({
        food: resources.food || 0,
        money: resources.money || 0,
        education: resources.education || 0,
        medicine: resources.medicine || 0,
      });
    });

    // 监听食物计算事件
    eventBus.on('food:calculated', (data: any) => {
      const hasShortage = data.balance < 0;
      useResourceStore.getState().updateShortageStatus({
        food: hasShortage,
      });
    });

    // 监听资金计算事件
    eventBus.on('money:calculated', (data: any) => {
      const hasShortage = data.balance < 0;
      useResourceStore.getState().updateShortageStatus({
        money: hasShortage,
      });
    });

    // 监听年度统计事件，检查成就并更新历史
    eventBus.on('statistics:yearly', (data: any) => {
      const resourceStore = useResourceStore.getState();
      const personStore = usePersonStore.getState();

      // 更新年度统计数据到StatisticsStore
      useStatisticsStore.getState().updateStatistics(
        data.year,
        personStore.count,
        resourceStore.resources
      );

      const newUnlocked = useAchievementStore.getState().checkAchievements({
        populationCount: personStore.count,
        resources: resourceStore.resources,
        statistics: useStatisticsStore.getState().statistics,
        currentYear: data.year,
      });

      // 通知新解锁的成就
      if (newUnlocked.length > 0) {
        useUIStore.getState().addNotification({
          message: `解锁成就：${newUnlocked.length}个`,
          type: 'achievement',
        });
      }
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
   * 同步ECS数据到ECS Stores
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

    // 同步StatisticsSystem的实时数据到StatisticsStore
    const statisticsSystem = this.world.getSystem<any>('StatisticsSystem');
    if (statisticsSystem) {
      const stats = statisticsSystem.getStatistics();
      useStatisticsStore.getState().updateRealtimeStats({
        avgAge: stats.averageAge,
        avgHealth: stats.averageHealth,
        avgEducation: stats.averageEducation,
      });
    }
  }

  /**
   * 构建GameState对象供GameEndingSystem使用（从ECS Stores聚合数据）
   */
  private buildGameStateForEnding(): any {
    const gameStateStore = useGameStateStore.getState();
    const personStore = usePersonStore.getState();
    const resourceStore = useResourceStore.getState();
    const statisticsStore = useStatisticsStore.getState();
    const achievementStore = useAchievementStore.getState();

    return {
      currentYear: gameStateStore.currentYear,
      currentMonth: gameStateStore.currentMonth,
      totalMonths: gameStateStore.totalMonths,
      people: personStore.entities,
      populationCount: personStore.count,
      resources: resourceStore.resources,
      statistics: statisticsStore.statistics,
      negativeMoneyMonths: gameStateStore.negativeMoneyMonths,
      noFoodMonths: gameStateStore.noFoodMonths,
      lowHappinessMonths: gameStateStore.lowHappinessMonths,
      unlockedAchievements: achievementStore.unlockedAchievements,
      activePolicies: [], // TODO: PolicyStore
    };
  }

  /**
   * 调试信息：获取引擎状态
   */
  getDebugInfo() {
    const gameState = useGameStateStore.getState();
    const resourceStore = useResourceStore.getState();
    const statisticsStore = useStatisticsStore.getState();

    return {
      isRunning: this.isRunning,
      ticksProcessed: this.ticksProcessed,
      currentMonth: gameState.currentMonth,
      currentYear: gameState.currentYear,
      populationCount: statisticsStore.statistics.totalBirths - statisticsStore.statistics.totalDeaths + GAME_CONSTANTS.INITIAL_POPULATION,
      resources: resourceStore.resources,
    };
  }

  /**
   * 游戏主循环Tick
   * ECS架构：World.update()协调所有Systems
   */
  private onTick(): void {
    const gameState = useGameStateStore.getState();

    if (gameState.isGameOver) {
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

    // 2. 推进时间（1个月）- 同时更新World和GameStateStore
    this.world.advanceTime(1);
    useGameStateStore.getState().advanceTime(1);

    // 3. ECS Systems处理游戏逻辑（已激活）
    this.world.update(1.0); // deltaTime = 1.0 (1个月)

    // 4. 同步ECS数据到ECS Stores
    this.syncToUI();

    // 5. 检查游戏结束条件
    if (!skipEndingCheck) {
      this.updateFailureCounters();
      const ending = this.endingSystem.checkEndingConditions(this.buildGameStateForEnding());
      if (ending) {
        this.triggerGameEnding(ending);
      }
    }
  }

  /**
   * 处理人口逻辑（原有方式）
   */

  /**
   * 更新失败条件计数器
   */
  private updateFailureCounters(): void {
    const gameStateStore = useGameStateStore.getState();
    const resourceStore = useResourceStore.getState();
    const statisticsStore = useStatisticsStore.getState();

    if (!gameStateStore.gameStarted) return;

    // 更新各种计数器
    gameStateStore.updateFailureCounters({
      negativeMoney: resourceStore.resources.money < 0,
      noFood: resourceStore.resources.food <= 0,
      lowHappiness: statisticsStore.statistics.averageHealth < 40,
    });
  }

  /**
   * 触发游戏结束
   */
  private triggerGameEnding(ending: any): void {
    useGameStateStore.getState().setGameEnding(ending);
    this.pause();
  }

  /**
   * 应用事件效果
   */
  private applyEvent(event: any): void {
    const resourceStore = useResourceStore.getState();
    const gameStateStore = useGameStateStore.getState();
    const updates: any = {};

    if (event.effects.foodChange) {
      const foodChange = Math.floor(resourceStore.resources.food * event.effects.foodChange);
      updates.food = resourceStore.resources.food + foodChange;
    }

    if (event.effects.moneyChange) {
      updates.money = resourceStore.resources.money + event.effects.moneyChange;
    }

    if (Object.keys(updates).length > 0) {
      useResourceStore.getState().updateResources(updates);
    }

    // 添加事件到EventStore
    useEventStore.getState().addEvent(
      gameStateStore.currentYear,
      gameStateStore.currentMonth,
      `[${gameStateStore.currentYear}年${gameStateStore.currentMonth + 1}月] ${event.name}: ${event.description}`
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
    useAchievementStore.getState().reset();
    useEventStore.getState().reset();

    // 重新初始化ECS人口
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

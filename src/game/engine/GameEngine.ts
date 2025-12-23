/**
 * GameEngine - 游戏引擎重构版
 * 使用ECS架构（World + System）替代直接处理逻辑
 */

import { World } from '../../ecs/core/World';
import { EntityFactory } from '../../ecs/utils/EntityFactory';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { usePersonStore } from '../../ecs/stores/PersonStore';
import { useResourceStore } from '../../ecs/stores/ResourceStore';
import { usePolicyStore } from '../../ecs/stores/PolicyStore';
import { useStatisticsStore } from '../../ecs/stores/StatisticsStore';
import { TimeSystem } from './TimeSystem';
import { EventSystem } from './EventSystem';
import { GameEndingSystem } from './GameEndingSystem';
import { GAME_CONSTANTS } from '../../constants/game';

// ECS Systems
import { AgingSystem } from '../../ecs/systems/AgingSystem';
import { DeathSystem } from '../../ecs/systems/DeathSystem';
import { BirthSystem } from '../../ecs/systems/BirthSystem';
import { MarriageSystem } from '../../ecs/systems/MarriageSystem';
import { FoodSystem } from '../../ecs/systems/FoodSystem';
import { MoneySystem } from '../../ecs/systems/MoneySystem';
import { ShortageEffectSystem } from '../../ecs/systems/ShortageEffectSystem';
import { PolicySystem } from '../../ecs/systems/PolicySystem';
import { PolicyEffectSystem } from '../../ecs/systems/PolicyEffectSystem';
import { StatisticsSystem } from '../../ecs/systems/StatisticsSystem';
import { AchievementSystem } from '../../ecs/systems/AchievementSystem';
import { PopulationSystem } from '../../ecs/systems/PopulationSystem';

export class GameEngine {
  // ECS核心
  private world: World;
  private entityFactory: EntityFactory;

  // 原有系统（保留）
  private timeSystem: TimeSystem;
  private eventSystem: EventSystem;
  private endingSystem: GameEndingSystem;

  // 游戏状态
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private ticksProcessed: number = 0;

  constructor() {
    // 创建ECS World
    this.world = new World();
    this.entityFactory = new EntityFactory(this.world);

    // 初始化原有系统
    this.timeSystem = new TimeSystem(() => this.onTick());
    this.eventSystem = new EventSystem();
    this.endingSystem = new GameEndingSystem();

    // 初始化ECS Systems
    this.initializeECSSystems();

    // 同步初始人口到ECS
    this.syncInitialPopulation();
  }

  /**
   * 初始化所有ECS Systems
   */
  private initializeECSSystems(): void {
    // 人口系统（按优先级排序）
    this.world.addSystem(new AgingSystem());
    this.world.addSystem(new DeathSystem());
    this.world.addSystem(new BirthSystem());
    this.world.addSystem(new MarriageSystem());
    this.world.addSystem(new PopulationSystem());

    // 资源系统
    this.world.addSystem(new FoodSystem());
    this.world.addSystem(new MoneySystem());
    this.world.addSystem(new ShortageEffectSystem());

    // 政策系统
    this.world.addSystem(new PolicySystem());
    this.world.addSystem(new PolicyEffectSystem());

    // 统计和成就系统
    this.world.addSystem(new StatisticsSystem());
    this.world.addSystem(new AchievementSystem());
  }

  /**
   * 同步初始人口到ECS World
   * 从PersonStore获取人口数据并创建ECS实体
   */
  private syncInitialPopulation(): void {
    const personStore = usePersonStore.getState();

    // 确保人口已初始化
    if (personStore.count === 0) {
      personStore.initializePopulation();
    }

    // 为每个人创建ECS实体
    const people = personStore.getAllPeople();
    people.forEach(person => {
      this.entityFactory.createPersonFromData(person);
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
   * 游戏主循环Tick - 重构版
   * 将逻辑委托给ECS World
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
    const randomEvent = this.eventSystem.checkAndTriggerEvent(state.totalMonths);
    if (randomEvent) {
      this.applyEvent(randomEvent);
    }

    // 2. 推进时间（1个月）
    useGameStore.getState().advanceTime(1);

    // 3. 设置World的当前月份（用于System计算）
    (this.world.getEventBus() as any).currentMonth = state.currentMonth + 1;

    // 4. 执行ECS Systems（核心逻辑）
    this.world.update(1); // deltaTime = 1 month

    // 5. 同步ECS状态到Store
    this.syncFromECSToStores();

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
   * 同步ECS状态到Store
   * 将ECS World中的实体状态同步回PersonStore和ResourceStore
   */
  private syncFromECSToStores(): void {
    const state = useGameStore.getState();

    // 同步人口状态
    const personStore = usePersonStore.getState();
    const entities = this.world.getEntities();

    const updates: Array<{ id: string; data: any }> = [];

    entities.forEach(entity => {
      const identity = this.world.getComponent('Identity', entity.id);
      const biological = this.world.getComponent('Biological', entity.id);
      const cognitive = this.world.getComponent('Cognitive', entity.id);
      const relationship = this.world.getComponent('Relationship', entity.id);
      const occupation = this.world.getComponent('Occupation', entity.id);

      if (identity && biological) {
        updates.push({
          id: entity.id,
          data: {
            age: (state.currentMonth - identity.birthMonth) / 12,
            health: biological.health,
            fertility: biological.fertility,
            isAlive: biological.isAlive,
            education: cognitive?.education || 0,
            partnerId: relationship?.partnerId,
            children: relationship?.childrenIds ? Array.from(relationship.childrenIds) : [],
            occupation: occupation?.occupation || 'unemployed',
          },
        });
      }
    });

    if (updates.length > 0) {
      personStore.batchUpdate(updates);
    }

    // 资源和统计由各自的System直接更新Store
  }

  /**
   * 更新UI状态
   */
  private updateUIState(): void {
    // 这里可以触发UI刷新事件
    this.world.getEventBus().emit('ui:update', {
      month: useGameStore.getState().currentMonth,
    });
  }

  /**
   * 更新失败条件计数器
   */
  private updateFailureCounters(): void {
    const state = useGameStore.getState();
    const { resources } = state;

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

    // 使用统计Store中的平均健康
    const statistics = useStatisticsStore.getState().statistics;
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
      useResourceStore.getState().updateResources(updates);
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

    // 清理World
    // TODO: 添加World.cleanup()方法
  }

  /**
   * 获取World实例（用于调试和外部访问）
   */
  getWorld(): World {
    return this.world;
  }
}

/**
 * ECS - StatisticsSystem（统计系统）
 * 收集和计算游戏统计数据
 */

import { System } from '../core/System';
import type { World } from '../core/World';
import { Query } from '../core/Query';
import { ComponentType } from '../components/PersonComponents';
import type { GameStatistics } from '../../store/types';
import { GAME_CONSTANTS } from '../../constants/game';

/**
 * 统计系统
 * 负责收集和计算游戏统计数据
 */
export class StatisticsSystem extends System {
  readonly name = 'StatisticsSystem';
  readonly priority = 50; // 较低优先级，在其他系统之后执行

  private peopleQuery: Query;
  private statistics: GameStatistics;
  private lastYearRecorded: number = -1;
  private eventBusUnsubscribers: Array<() => void> = [];

  // 追踪每年的出生和死亡
  private birthsThisYear: number = 0;
  private deathsThisYear: number = 0;

  constructor() {
    super();
    this.peopleQuery = new Query([
      ComponentType.Identity,
      ComponentType.Biological,
    ]);

    // 初始化统计
    this.statistics = this.createInitialStatistics();
  }

  /**
   * 初始化系统
   */
  initialize(world: World): void {
    super.initialize(world);

    const eventBus = world.getEventBus();

    // 监听出生事件
    this.eventBusUnsubscribers.push(
      eventBus.on('person:born', () => {
        this.statistics.totalBirths++;
        this.birthsThisYear++;
      })
    );

    // 监听死亡事件
    this.eventBusUnsubscribers.push(
      eventBus.on('person:died', () => {
        this.statistics.totalDeaths++;
        this.deathsThisYear++;
      })
    );
  }

  /**
   * 每月更新统计
   */
  update(_deltaTime: number): void {
    const world = this.getWorld();
    const currentMonth = this.getCurrentMonth(world);
    const currentYear = Math.floor(currentMonth / GAME_CONSTANTS.MONTHS_PER_YEAR);

    // 每年记录一次统计
    if (currentYear > this.lastYearRecorded && currentYear > 0) {
      this.recordYearStatistics(world, currentYear);
      this.lastYearRecorded = currentYear;
    }

    // 实时更新平均指标
    this.updateRealtimeStats(world);
  }

  /**
   * 记录年度统计
   */
  private recordYearStatistics(world: World, year: number): void {
    const entities = world.query(this.peopleQuery);
    const livingPeople = entities.filter(entity => {
      const biological = world.getComponent(entity.id, ComponentType.Biological);
      return biological?.isAlive;
    });

    // 更新人口历史
    this.statistics.populationHistory.push({
      year,
      count: livingPeople.length,
    });

    // 更新出生历史
    this.statistics.birthsHistory.push({
      year,
      count: this.birthsThisYear,
    });

    // 更新死亡历史
    this.statistics.deathsHistory.push({
      year,
      count: this.deathsThisYear,
    });

    // 重置年度计数器
    this.birthsThisYear = 0;
    this.deathsThisYear = 0;

    // 发出年度统计事件
    world.getEventBus().emit('statistics:yearly', {
      year,
      population: livingPeople.length,
      statistics: this.statistics,
    });
  }

  /**
   * 更新实时统计
   */
  private updateRealtimeStats(world: World): void {
    const entities = world.query(this.peopleQuery);
    const livingPeople = entities.filter(entity => {
      const biological = world.getComponent(entity.id, ComponentType.Biological);
      return biological?.isAlive;
    });

    if (livingPeople.length === 0) return;

    // 计算平均年龄
    const currentMonth = this.getCurrentMonth(world);
    const ages = livingPeople.map(entity => {
      const identity = world.getComponent(entity.id, ComponentType.Identity);
      return this.calculateAge(identity?.birthMonth || 0, currentMonth);
    });

    const avgAge = ages.reduce((sum, age) => sum + age, 0) / ages.length;

    // 计算平均健康
    const healthValues = livingPeople.map(entity => {
      const biological = world.getComponent(entity.id, ComponentType.Biological);
      return biological?.health || 0;
    });

    const avgHealth = healthValues.reduce((sum, health) => sum + health, 0) / healthValues.length;

    // 计算平均教育
    const educationValues = livingPeople.map(entity => {
      const cognitive = world.getComponent(entity.id, ComponentType.Cognitive);
      return cognitive?.education || 0;
    });

    const avgEducation = educationValues.reduce((sum, edu) => sum + edu, 0) / educationValues.length;

    // 更新统计数据
    this.statistics.averageAge = avgAge;
    this.statistics.averageHealth = avgHealth;
    this.statistics.averageEducation = avgEducation;

    // 发出统计更新事件
    world.getEventBus().emit('statistics:updated', {
      populationCount: livingPeople.length,
      avgAge,
      avgHealth,
      avgEducation,
    });
  }

  /**
   * 获取统计
   */
  getStatistics(): GameStatistics {
    return this.statistics;
  }

  /**
   * 创建初始统计
   */
  private createInitialStatistics(): GameStatistics {
    return {
      totalBirths: 0,
      totalDeaths: 0,
      populationHistory: [
        { year: 0, count: GAME_CONSTANTS.INITIAL_POPULATION }
      ],
      birthsHistory: [{ year: 0, count: 0 }],
      deathsHistory: [{ year: 0, count: 0 }],
      resourceHistory: [],
      averageAge: 35,
      averageHealth: 75,
      averageEducation: 2,
    };
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

  /**
   * 重置统计
   */
  reset(): void {
    // 重置属性值，不重新创建对象（避免事件监听器闭包问题）
    const initialStats = this.createInitialStatistics();

    this.statistics.totalBirths = initialStats.totalBirths;
    this.statistics.totalDeaths = initialStats.totalDeaths;
    this.statistics.populationHistory = [...initialStats.populationHistory];
    this.statistics.birthsHistory = [...initialStats.birthsHistory];
    this.statistics.deathsHistory = [...initialStats.deathsHistory];
    this.statistics.resourceHistory = [...initialStats.resourceHistory];
    this.statistics.averageAge = initialStats.averageAge;
    this.statistics.averageHealth = initialStats.averageHealth;
    this.statistics.averageEducation = initialStats.averageEducation;

    this.lastYearRecorded = -1;
    this.birthsThisYear = 0;
    this.deathsThisYear = 0;
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    // 取消所有事件监听
    this.eventBusUnsubscribers.forEach(unsub => unsub());
    this.eventBusUnsubscribers = [];
  }
}

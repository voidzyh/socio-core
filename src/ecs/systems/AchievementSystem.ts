/**
 * ECS - AchievementSystem（成就系统）
 * 管理成就的解锁和检测
 */

import { System } from '../core/System';
import type { World } from '../core/World';
import type { Achievement } from '../../store/types';
import { ACHIEVEMENTS } from '../../constants/achievements';

/**
 * 成就系统
 * 负责检测和管理游戏成就
 */
export class AchievementSystem extends System {
  readonly name = 'AchievementSystem';
  readonly priority = 40; // 低优先级，在统计系统之后执行

  private achievements: Map<string, Achievement>;
  private unlockedAchievements: Set<string> = new Set();

  constructor() {
    super();

    // 初始化成就
    this.achievements = new Map();
    ACHIEVEMENTS.forEach(achievement => {
      this.achievements.set(achievement.id, { ...achievement });
    });
  }

  /**
   * 每月检查成就解锁条件
   */
  update(deltaTime: number): void {
    const world = this.getWorld();

    // 检查每个成就
    this.achievements.forEach((achievement, id) => {
      if (achievement.unlocked) return;

      // 检查解锁条件
      const unlocked = this.checkAchievement(world, achievement);

      if (unlocked) {
        this.unlockAchievement(id, achievement);
      }
    });
  }

  /**
   * 检查成就解锁条件
   */
  private checkAchievement(world: World, achievement: Achievement): boolean {
    // 这里需要根据成就的具体条件来检查
    // 由于原成就系统使用GameState作为参数，我们需要从World中获取相应数据

    switch (achievement.id) {
      case 'population-100':
        return this.checkPopulation100(world);
      case 'longevity':
        return this.checkLongevity(world);
      case 'economic-prosperity':
        return this.checkEconomicProsperity(world);
      case 'century':
        return this.checkCentury(world);
      default:
        return false;
    }
  }

  /**
   * 检查人口破百成就
   */
  private checkPopulation100(world: World): boolean {
    const entities = world.getEntities();
    const livingCount = entities.filter(entity => {
      const biological = world.getComponent(entity.id, 'Biological');
      return biological?.isAlive;
    }).length;

    return livingCount >= 100;
  }

  /**
   * 检查长寿之乡成就
   */
  private checkLongevity(world: World): boolean {
    const entities = world.getEntities();
    const currentMonth = this.getCurrentMonth(world);

    // 检查是否有人年龄超过80岁
    const hasElderly = entities.some(entity => {
      const identity = world.getComponent(entity.id, 'Identity');
      const biological = world.getComponent(entity.id, 'Biological');

      if (!identity || !biological || !biological.isAlive) return false;

      const age = this.calculateAge(identity.birthMonth, currentMonth);
      return age >= 80;
    });

    return hasElderly;
  }

  /**
   * 检查经济繁荣成就
   */
  private checkEconomicProsperity(world: World): boolean {
    // 简化实现：检查资金是否超过5000
    // 实际应该从ResourceSystem获取
    return false; // 暂不实现，需要ResourceSystem先运行
  }

  /**
   * 检查百年基业成就
   */
  private checkCentury(world: World): boolean {
    const currentMonth = this.getCurrentMonth(world);
    const years = currentMonth / 12;
    return years >= 100;
  }

  /**
   * 解锁成就
   */
  private unlockAchievement(id: string, achievement: Achievement): void {
    // 标记为已解锁
    achievement.unlocked = true;
    this.unlockedAchievements.add(id);

    // 发出成就解锁事件
    this.getWorld().getEventBus().emit('achievement:unlocked', {
      achievementId: id,
      achievement,
    });
  }

  /**
   * 获取所有成就
   */
  getAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  /**
   * 获取已解锁成就
   */
  getUnlockedAchievements(): Achievement[] {
    return Array.from(this.unlockedAchievements).map(id =>
      this.achievements.get(id)!
    );
  }

  /**
   * 检查成就是否解锁
   */
  isAchievementUnlocked(id: string): boolean {
    return this.unlockedAchievements.has(id);
  }

  /**
   * 计算年龄
   */
  private calculateAge(birthMonth: number, currentMonth: number): number {
    return (currentMonth - birthMonth) / 12;
  }

  /**
   * 获取当前月份
   */
  private getCurrentMonth(world: World): number {
    return world.getTotalMonths();
  }

  /**
   * 重置成就
   */
  reset(): void {
    this.achievements.forEach(achievement => {
      achievement.unlocked = false;
    });
    this.unlockedAchievements.clear();
  }
}

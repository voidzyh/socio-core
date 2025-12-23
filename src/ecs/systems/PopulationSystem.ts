/**
 * ECS - PopulationSystem（人口系统）
 * 处理人口的所有生命周期逻辑：年龄增长、生育、死亡、婚姻
 */

import { System, type ISystem } from '../core/System';
import type { World } from '../core/World';
import { Query } from '../core/Query';
import {
  ComponentType,
  type IdentityComponent,
  type BiologicalComponent,
  type RelationshipComponent,
  type OccupationComponent,
} from '../components/PersonComponents';
import { POPULATION_CONSTANTS, GAME_CONSTANTS } from '../../constants/game';
import { calculateDeathRate } from '../../constants/game';

/**
 * 人口系统
 * 负责处理人口增长、生育、死亡、婚姻等逻辑
 */
export class PopulationSystem extends System implements ISystem {
  readonly name = 'PopulationSystem';
  readonly priority = 100; // 高优先级，首先执行

  // 查询对象
  private livingPeopleQuery: Query;
  private femalesQuery: Query;
  private singlesQuery: Query;

  constructor() {
    super();

    // 查询所有存活的人（需要Identity和Biological组件）
    this.livingPeopleQuery = new Query([ComponentType.Identity, ComponentType.Biological]);

    // 查询所有女性
    // 注意：这里我们会在运行时动态过滤

    // 查询所有未婚者
    this.singlesQuery = new Query([ComponentType.Identity, ComponentType.Biological, ComponentType.Relationship]);
  }

  /**
   * 每月更新人口
   */
  update(deltaTime: number): void {
    const world = this.getWorld();

    // 获取所有存活的人
    const livingEntities = world.query(this.livingPeopleQuery);

    // 1. 处理年龄增长和健康衰减
    this.processAging(world, livingEntities);

    // 2. 处理死亡检查
    this.processDeath(world, livingEntities);

    // 3. 处理生育
    this.processBirth(world, livingEntities);

    // 4. 处理婚姻
    this.processMarriage(world, livingEntities);
  }

  /**
   * 处理年龄增长和健康衰减
   */
  private processAging(world: World, entities: any[]): void {
    entities.forEach(entity => {
      const biological = world.getComponent<BiologicalComponent>(entity.id, ComponentType.Biological);
      if (!biological || !biological.isAlive) return;

      // 计算年龄（从出生月份开始）
      const identity = world.getComponent<IdentityComponent>(entity.id, ComponentType.Identity);
      if (!identity) return;

      // 年龄增长（每月1/12岁）
      // 注意：在ECS架构中，我们不需要存储年龄，可以从birthMonth计算
      // 但为了兼容现有系统，我们暂时保留年龄在组件中（如果需要）

      // 健康衰减
      const currentMonth = world.getEventBus()['currentMonth'] || 0; // 从World获取当前月份
      const age = this.calculateAge(identity.birthMonth, currentMonth);

      let health = biological.health;

      if (age >= 80) {
        health -= POPULATION_CONSTANTS.HEALTH_DECAY_AGE_80;
      } else if (age >= 60) {
        health -= POPULATION_CONSTANTS.HEALTH_DECAY_AGE_60;
      }

      if (health < 0) health = 0;

      // 更新健康值
      if (health !== biological.health) {
        world.updateComponent(entity.id, ComponentType.Biological, { health });
      }
    });
  }

  /**
   * 处理死亡检查
   */
  private processDeath(world: World, entities: any[]): void {
    entities.forEach(entity => {
      const biological = world.getComponent<BiologicalComponent>(entity.id, ComponentType.Biological);
      if (!biological || !biological.isAlive) return;

      const identity = world.getComponent<IdentityComponent>(entity.id, ComponentType.Identity);
      if (!identity) return;

      // 计算年龄
      const currentMonth = world.getEventBus()['currentMonth'] || 0;
      const age = this.calculateAge(identity.birthMonth, currentMonth);

      // 计算死亡率（暂不考虑政策修正，后续通过EventBus获取）
      const deathRate = calculateDeathRate(age, biological.health);

      // 死亡判定
      if (Math.random() < deathRate) {
        this.handleDeath(world, entity.id, age);
      }
    });
  }

  /**
   * 处理生育
   */
  private processBirth(world: World, entities: any[]): void {
    // 筛选育龄女性
    const currentMonth = world.getEventBus()['currentMonth'] || 0;

    const females = entities.filter(entity => {
      const identity = world.getComponent<IdentityComponent>(entity.id, ComponentType.Identity);
      const biological = world.getComponent<BiologicalComponent>(entity.id, ComponentType.Biological);
      const relationship = world.getComponent<RelationshipComponent>(entity.id, ComponentType.Relationship);

      if (!identity || !biological || !relationship) return false;

      const age = this.calculateAge(identity.birthMonth, currentMonth);

      return (
        identity.gender === 'female' &&
        biological.isAlive &&
        age >= POPULATION_CONSTANTS.MIN_AGE_FOR_CHILDBEARING &&
        age <= POPULATION_CONSTANTS.MAX_AGE_FOR_CHILDBEARING &&
        relationship.partnerId && // 已婚
        relationship.childrenIds.size < POPULATION_CONSTANTS.MAX_CHILDREN_PER_FAMILY
      );
    });

    // 生育判定（基础生育率5%，后续可通过政策修正）
    females.forEach(femaleEntity => {
      if (Math.random() < POPULATION_CONSTANTS.BASE_FERTILITY_RATE) {
        const relationship = world.getComponent<RelationshipComponent>(femaleEntity.id, ComponentType.Relationship);
        if (relationship && relationship.partnerId) {
          this.handleBirth(world, femaleEntity.id, relationship.partnerId);
        }
      }
    });
  }

  /**
   * 处理婚姻
   */
  private processMarriage(world: World, entities: any[]): void {
    const currentMonth = world.getEventBus()['currentMonth'] || 0;

    // 筛选适婚未婚者
    const singles = entities.filter(entity => {
      const identity = world.getComponent<IdentityComponent>(entity.id, ComponentType.Identity);
      const biological = world.getComponent<BiologicalComponent>(entity.id, ComponentType.Biological);
      const relationship = world.getComponent<RelationshipComponent>(entity.id, ComponentType.Relationship);

      if (!identity || !biological || !relationship) return false;

      const age = this.calculateAge(identity.birthMonth, currentMonth);

      return (
        biological.isAlive &&
        !relationship.partnerId &&
        age >= POPULATION_CONSTANTS.MIN_AGE_FOR_MARRIAGE &&
        age <= POPULATION_CONSTANTS.MAX_AGE_FOR_MARRIAGE
      );
    });

    // 分离男女
    const singleMales = singles.filter(entity => {
      const identity = world.getComponent<IdentityComponent>(entity.id, ComponentType.Identity);
      return identity?.gender === 'male';
    });

    const singleFemales = singles.filter(entity => {
      const identity = world.getComponent<IdentityComponent>(entity.id, ComponentType.Identity);
      return identity?.gender === 'female';
    });

    // 简化的匹配逻辑
    const pairs = Math.min(singleMales.length, singleFemales.length);
    for (let i = 0; i < pairs; i++) {
      if (Math.random() < 0.02) { // 2% 概率结婚
        const maleId = singleMales[i].id;
        const femaleId = singleFemales[i].id;

        // 更新双方的关系组件
        const maleRelationship = world.getComponent<RelationshipComponent>(maleId, ComponentType.Relationship);
        const femaleRelationship = world.getComponent<RelationshipComponent>(femaleId, ComponentType.Relationship);

        if (maleRelationship && femaleRelationship) {
          world.updateComponent(maleId, ComponentType.Relationship, {
            partnerId: femaleId,
          });

          world.updateComponent(femaleId, ComponentType.Relationship, {
            partnerId: maleId,
          });

          // 发出结婚事件
          world.getEventBus().emit('person:married', {
            maleId,
            femaleId,
          });
        }
      }
    }
  }

  /**
   * 处理出生
   */
  private handleBirth(world: World, motherId: string, fatherId: string): void {
    // 创建新实体
    const baby = world.createEntity();

    // 随机性别
    const gender = Math.random() < 0.5 ? 'male' : 'female';

    // 当前月份
    const currentMonth = world.getEventBus()['currentMonth'] || 0;

    // 添加身份组件
    world.addComponent(baby.id, ComponentType.Identity, {
      entityId: baby.id,
      gender,
      birthMonth: currentMonth,
    } as IdentityComponent);

    // 添加生物特征组件
    world.addComponent(baby.id, ComponentType.Biological, {
      health: 70 + Math.random() * 30,
      fertility: 0,
      isAlive: true,
    } as BiologicalComponent);

    // 添加关系组件
    world.addComponent(baby.id, ComponentType.Relationship, {
      parentIds: [motherId, fatherId],
      childrenIds: new Set(),
    } as RelationshipComponent);

    // 添加职业组件（新生儿为失业）
    world.addComponent(baby.id, ComponentType.Occupation, {
      occupation: 'unemployed',
      experience: 0,
      productivity: 1.0,
    });

    // 添加认知组件
    world.addComponent(baby.id, ComponentType.Cognitive, {
      education: 0,
      skills: new Set(),
    });

    // 更新父母的子女列表
    const motherRelationship = world.getComponent<RelationshipComponent>(motherId, ComponentType.Relationship);
    const fatherRelationship = world.getComponent<RelationshipComponent>(fatherId, ComponentType.Relationship);

    if (motherRelationship) {
      const newChildren = new Set(motherRelationship.childrenIds);
      newChildren.add(baby.id);
      world.updateComponent(motherId, ComponentType.Relationship, {
        childrenIds: newChildren,
      });
    }

    if (fatherRelationship) {
      const newChildren = new Set(fatherRelationship.childrenIds);
      newChildren.add(baby.id);
      world.updateComponent(fatherId, ComponentType.Relationship, {
        childrenIds: newChildren,
      });
    }

    // 发出出生事件
    world.getEventBus().emit('person:born', {
      babyId: baby.id,
      motherId,
      fatherId,
      gender,
    });
  }

  /**
   * 处理死亡
   */
  private handleDeath(world: World, personId: string, age: number): void {
    // 更新生物特征组件
    world.updateComponent(personId, ComponentType.Biological, {
      isAlive: false,
      deathMonth: world.getEventBus()['currentMonth'] || 0,
    });

    // 移除配偶关系
    const relationship = world.getComponent<RelationshipComponent>(personId, ComponentType.Relationship);
    if (relationship && relationship.partnerId) {
      const partnerRelationship = world.getComponent<RelationshipComponent>(
        relationship.partnerId,
        ComponentType.Relationship
      );

      if (partnerRelationship) {
        world.updateComponent(relationship.partnerId, ComponentType.Relationship, {
          partnerId: undefined,
        });
      }

      // 移除自己的配偶关系
      world.updateComponent(personId, ComponentType.Relationship, {
        partnerId: undefined,
      });
    }

    // 发出死亡事件
    world.getEventBus().emit('person:died', {
      personId,
      age,
    });
  }

  /**
   * 计算年龄
   */
  private calculateAge(birthMonth: number, currentMonth: number): number {
    return currentMonth - birthMonth / GAME_CONSTANTS.MONTHS_PER_YEAR;
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    // 清理查询对象
    this.livingPeopleQuery = null as any;
    this.femalesQuery = null as any;
    this.singlesQuery = null as any;
  }
}

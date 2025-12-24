/**
 * EntityFactory - 实体工厂
 * 负责创建ECS实体并附加组件
 */

import type { World } from '../core/World';
import { ComponentType } from '../components/PersonComponents';
import type {
  IdentityComponent,
  BiologicalComponent,
  CognitiveComponent,
  RelationshipComponent,
  OccupationComponent,
} from '../components/PersonComponents';
import type { Person } from '../../store/types';
import { GAME_CONSTANTS } from '../../constants/game';

/**
 * 实体工厂
 * 提供便捷方法创建完整的ECS实体
 */
export class EntityFactory {
  private world: World;

  constructor(world: World) {
    this.world = world;
  }

  /**
   * 从Person数据创建ECS实体
   */
  createPersonFromData(person: Person): string {
    const entity = this.world.createEntity();

    // 计算出生月份（根据年龄反推）
    // 这里简化处理，假设当前月份为0
    const birthMonth = 0 - person.age * 12;

    // 创建Identity组件
    const identity: IdentityComponent = {
      entityId: entity.id,
      gender: person.gender,
      birthMonth,
    };

    // 创建Biological组件
    const biological: BiologicalComponent = {
      health: person.health,
      fertility: person.fertility,
      isAlive: person.isAlive,
    };

    // 创建Cognitive组件
    const cognitive: CognitiveComponent = {
      education: person.education,
      skills: new Set(),
    };

    // 创建Relationship组件
    const relationship: RelationshipComponent = {
      partnerId: person.partner,
      parentIds: person.parents || null,
      childrenIds: new Set(person.children || []),
    };

    // 创建Occupation组件
    const occupation: OccupationComponent = {
      occupation: person.occupation,
      experience: 0,
      productivity: 1.0,
    };

    // 添加所有组件到实体
    this.world.addComponent(entity.id, ComponentType.Identity, identity);
    this.world.addComponent(entity.id, ComponentType.Biological, biological);
    this.world.addComponent(entity.id, ComponentType.Cognitive, cognitive);
    this.world.addComponent(entity.id, ComponentType.Relationship, relationship);
    this.world.addComponent(entity.id, ComponentType.Occupation, occupation);

    return entity.id;
  }

  /**
   * 创建新出生的婴儿
   */
  createBaby(motherId: string, fatherId: string, currentMonth: number): string {
    const entity = this.world.createEntity();

    const gender = Math.random() < 0.5 ? 'male' : 'female';

    // Identity
    const identity: IdentityComponent = {
      entityId: entity.id,
      gender,
      birthMonth: currentMonth,
    };

    // Biological
    const biological: BiologicalComponent = {
      health: 70 + Math.random() * 30,
      fertility: 0,
      isAlive: true,
    };

    // Cognitive
    const cognitive: CognitiveComponent = {
      education: 0,
      skills: new Set(),
    };

    // Relationship
    const relationship: RelationshipComponent = {
      parentIds: [motherId, fatherId],
      childrenIds: new Set(),
    };

    // Occupation
    const occupation: OccupationComponent = {
      occupation: 'unemployed',
      experience: 0,
      productivity: 0,
    };

    this.world.addComponent(entity.id, ComponentType.Identity, identity);
    this.world.addComponent(entity.id, ComponentType.Biological, biological);
    this.world.addComponent(entity.id, ComponentType.Cognitive, cognitive);
    this.world.addComponent(entity.id, ComponentType.Relationship, relationship);
    this.world.addComponent(entity.id, ComponentType.Occupation, occupation);

    // 更新父母的children列表
    const motherRelationship = this.world.getComponent<RelationshipComponent>(
      ComponentType.Relationship,
      motherId
    );
    const fatherRelationship = this.world.getComponent<RelationshipComponent>(
      ComponentType.Relationship,
      fatherId
    );

    if (motherRelationship && motherRelationship.childrenIds) {
      motherRelationship.childrenIds.add(entity.id);
    }
    if (fatherRelationship && fatherRelationship.childrenIds) {
      fatherRelationship.childrenIds.add(entity.id);
    }

    return entity.id;
  }

  /**
   * 创建初始人口（增强版 - 包含婚姻配对）
   */
  createInitialPopulation(): string[] {
    const entityIds: string[] = [];
    const genders: Array<'male' | 'female'> = ['male', 'female'];
    const males: string[] = [];
    const females: string[] = [];

    // 职业分配
    const occupationDistribution: Array<'farmer' | 'worker' | 'scientist' | 'unemployed'> = [];
    const farmerCount = Math.floor(GAME_CONSTANTS.INITIAL_POPULATION * 0.4);
    const workerCount = Math.floor(GAME_CONSTANTS.INITIAL_POPULATION * 0.35);
    const scientistCount = Math.floor(GAME_CONSTANTS.INITIAL_POPULATION * 0.15);
    const unemployedCount = GAME_CONSTANTS.INITIAL_POPULATION - farmerCount - workerCount - scientistCount;

    for (let i = 0; i < farmerCount; i++) occupationDistribution.push('farmer');
    for (let i = 0; i < workerCount; i++) occupationDistribution.push('worker');
    for (let i = 0; i < scientistCount; i++) occupationDistribution.push('scientist');
    for (let i = 0; i < unemployedCount; i++) occupationDistribution.push('unemployed');

    // 打乱顺序
    for (let i = occupationDistribution.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [occupationDistribution[i], occupationDistribution[j]] = [occupationDistribution[j], occupationDistribution[i]];
    }

    // 年龄分布配置（模拟稳定人口结构）
    const ageDistribution = [
      { ageRange: [18, 30] as [number, number], weight: 0.4 },    // 40% 青年
      { ageRange: [31, 50] as [number, number], weight: 0.35 },   // 35% 中年
      { ageRange: [51, 65] as [number, number], weight: 0.2 },    // 20% 老年
      { ageRange: [66, 75] as [number, number], weight: 0.05 },   // 5% 超高龄
    ];

    // 创建年龄池
    const agePool: number[] = [];
    ageDistribution.forEach(({ ageRange, weight }) => {
      const count = Math.floor(GAME_CONSTANTS.INITIAL_POPULATION * weight);
      for (let i = 0; i < count; i++) {
        const age = Math.floor(Math.random() * (ageRange[1] - ageRange[0] + 1)) + ageRange[0];
        agePool.push(age);
      }
    });

    // 补齐到目标人口
    while (agePool.length < GAME_CONSTANTS.INITIAL_POPULATION) {
      const age = Math.floor(Math.random() * (30 - 18 + 1)) + 18; // 默认青年
      agePool.push(age);
    }

    // 打乱年龄池
    for (let i = agePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [agePool[i], agePool[j]] = [agePool[j], agePool[i]];
    }

    // 创建人口
    for (let i = 0; i < GAME_CONSTANTS.INITIAL_POPULATION; i++) {
      const entity = this.world.createEntity();
      const gender = genders[Math.floor(Math.random() * genders.length)];
      const age = agePool[i];

      // 根据职业调整教育水平
      let education = Math.floor(Math.random() * 5);
      const occupation = occupationDistribution[i];
      if (occupation === 'scientist') {
        education = 5 + Math.floor(Math.random() * 3);
      }

      // Identity
      const identity: IdentityComponent = {
        entityId: entity.id,
        gender,
        birthMonth: 0 - age * 12,
      };

      // Biological
      const biological: BiologicalComponent = {
        health: 60 + Math.random() * 40,
        fertility: 0,
        isAlive: true,
      };

      // Cognitive
      const cognitive: CognitiveComponent = {
        education,
        skills: new Set(),
      };

      // Relationship
      const relationship: RelationshipComponent = {
        partnerId: undefined,
        parentIds: null,
        childrenIds: new Set(),
      };

      // Occupation
      const occupationComp: OccupationComponent = {
        occupation,
        experience: 0,
        productivity: 1.0,
      };

      this.world.addComponent(entity.id, ComponentType.Identity, identity);
      this.world.addComponent(entity.id, ComponentType.Biological, biological);
      this.world.addComponent(entity.id, ComponentType.Cognitive, cognitive);
      this.world.addComponent(entity.id, ComponentType.Relationship, relationship);
      this.world.addComponent(entity.id, ComponentType.Occupation, occupationComp);

      entityIds.push(entity.id);

      if (gender === 'male') {
        males.push(entity.id);
      } else {
        females.push(entity.id);
      }
    }

    // 配对婚姻
    this.pairMarriages(males, females);

    return entityIds;
  }

  /**
   * 配对婚姻
   */
  private pairMarriages(males: string[], females: string[]): void {
    // 筛选适婚年龄
    const currentMonth = 0;

    const marriageAgeMales = males.filter(id => {
      const identity = this.world.getComponent<IdentityComponent>(id, ComponentType.Identity);
      const age = this.calculateAge(identity!.birthMonth, currentMonth);
      return age >= 20 && age <= 50;
    });

    const marriageAgeFemales = females.filter(id => {
      const identity = this.world.getComponent<IdentityComponent>(id, ComponentType.Identity);
      const age = this.calculateAge(identity!.birthMonth, currentMonth);
      return age >= 20 && age <= 45;
    });

    // 配对
    const pairs = Math.min(marriageAgeMales.length, marriageAgeFemales.length);
    for (let i = 0; i < pairs; i++) {
      const maleId = marriageAgeMales[i];
      const femaleId = marriageAgeFemales[i];

      // 更新男性的关系
      const maleRelationship = this.world.getComponent<RelationshipComponent>(maleId, ComponentType.Relationship);
      if (maleRelationship) {
        this.world.updateComponent(maleId, ComponentType.Relationship, {
          partnerId: femaleId,
        });
      }

      // 更新女性的关系
      const femaleRelationship = this.world.getComponent<RelationshipComponent>(femaleId, ComponentType.Relationship);
      if (femaleRelationship) {
        this.world.updateComponent(femaleId, ComponentType.Relationship, {
          partnerId: maleId,
        });
      }

      // 随机添加孩子
      this.addRandomChildren(maleId, femaleId, currentMonth);
    }
  }

  /**
   * 随机添加初始孩子
   */
  private addRandomChildren(maleId: string, femaleId: string, currentMonth: number): void {
    const maleIdentity = this.world.getComponent<IdentityComponent>(maleId, ComponentType.Identity);
    const femaleIdentity = this.world.getComponent<IdentityComponent>(femaleId, ComponentType.Identity);

    if (!maleIdentity || !femaleIdentity) return;

    const maleAge = this.calculateAge(maleIdentity.birthMonth, currentMonth);
    const femaleAge = this.calculateAge(femaleIdentity.birthMonth, currentMonth);

    // 只有年龄合适的夫妇才会有孩子
    if (maleAge >= 25 && femaleAge >= 25) {
      const childrenCount = Math.floor(Math.random() * 3); // 0-2个孩子

      for (let i = 0; i < childrenCount; i++) {
        const childAge = Math.floor(Math.random() * Math.min(maleAge - 20, femaleAge - 18));

        if (childAge > 0) {
          // 创建孩子
          const childId = this.createBaby(maleId, femaleId, currentMonth - childAge * 12);

          // 更新孩子的年龄
          const childIdentity = this.world.getComponent<IdentityComponent>(childId, ComponentType.Identity);
          if (childIdentity) {
            this.world.updateComponent(childId, ComponentType.Identity, {
              birthMonth: currentMonth - childAge * 12,
            });
          }
        }
      }
    }
  }

  /**
   * 计算年龄
   */
  private calculateAge(birthMonth: number, currentMonth: number): number {
    return (currentMonth - birthMonth) / GAME_CONSTANTS.MONTHS_PER_YEAR;
  }
}

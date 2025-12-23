/**
 * EntityFactory - 实体工厂
 * 负责创建ECS实体并附加组件
 */

import { World } from '../core/World';
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
  constructor(private world: World) {}

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
    };

    // Relationship
    const relationship: RelationshipComponent = {
      parentIds: [motherId, fatherId],
      childrenIds: new Set(),
    };

    // Occupation
    const occupation: OccupationComponent = {
      occupation: 'unemployed',
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
   * 创建初始人口
   */
  createInitialPopulation(): string[] {
    const entityIds: string[] = [];
    const genders: Array<'male' | 'female'> = ['male', 'female'];

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

    // 创建人口
    for (let i = 0; i < GAME_CONSTANTS.INITIAL_POPULATION; i++) {
      const entity = this.world.createEntity();
      const gender = genders[Math.floor(Math.random() * genders.length)];
      const age = Math.floor(
        Math.random() * (GAME_CONSTANTS.INITIAL_AGE_MAX - GAME_CONSTANTS.INITIAL_AGE_MIN + 1)
      ) + GAME_CONSTANTS.INITIAL_AGE_MIN;

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
      };

      // Relationship
      const relationship: RelationshipComponent = {
        parentIds: null,
        childrenIds: new Set(),
      };

      // Occupation
      const occupationComp: OccupationComponent = {
        occupation,
        productivity: 1.0,
      };

      this.world.addComponent(entity.id, ComponentType.Identity, identity);
      this.world.addComponent(entity.id, ComponentType.Biological, biological);
      this.world.addComponent(entity.id, ComponentType.Cognitive, cognitive);
      this.world.addComponent(entity.id, ComponentType.Relationship, relationship);
      this.world.addComponent(entity.id, ComponentType.Occupation, occupationComp);

      entityIds.push(entity.id);
    }

    return entityIds;
  }
}

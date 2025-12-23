/**
 * ECS数据同步管理器
 * 负责将ECS World的数据同步到gameStore（UI兼容层）
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
import { useGameStore } from '../../store/gameStore';

export class SyncManager {
  constructor(private world: World) {}

  /**
   * 同步所有ECS实体数据到gameStore
   */
  syncToStore(): void {
    const entities = this.world.getEntities();
    const peopleMap = new Map<string, Person>();

    for (const entity of entities) {
      const personData = this.extractPersonData(entity.id);
      if (personData) {
        peopleMap.set(entity.id, personData);
      }
    }

    // 更新gameStore
    useGameStore.getState().setPeople(peopleMap);
  }

  /**
   * 从ECS实体提取Person数据
   */
  private extractPersonData(entityId: string): Person | null {
    const identity = this.world.getComponent<IdentityComponent>(
      entityId,
      ComponentType.Identity
    );
    const biological = this.world.getComponent<BiologicalComponent>(
      entityId,
      ComponentType.Biological
    );
    const cognitive = this.world.getComponent<CognitiveComponent>(
      entityId,
      ComponentType.Cognitive
    );
    const relationship = this.world.getComponent<RelationshipComponent>(
      entityId,
      ComponentType.Relationship
    );
    const occupation = this.world.getComponent<OccupationComponent>(
      entityId,
      ComponentType.Occupation
    );

    if (!identity || !biological || !cognitive || !relationship || !occupation) {
      return null;
    }

    // 计算年龄
    const currentMonth = this.world.getTotalMonths();
    const age = this.calculateAge(identity.birthMonth, currentMonth);

    // 转换childrenIds Set为数组
    const childrenArray = Array.from(relationship.childrenIds || []);

    return {
      id: entityId,
      age,
      gender: identity.gender,
      health: biological.health,
      education: cognitive.education,
      fertility: biological.fertility,
      isAlive: biological.isAlive,
      children: childrenArray,
      occupation: occupation.occupation,
      partner: relationship.partnerId,
    };
  }

  /**
   * 计算年龄
   */
  private calculateAge(birthMonth: number, currentMonth: number): number {
    return (currentMonth - birthMonth) / GAME_CONSTANTS.MONTHS_PER_YEAR;
  }

  /**
   * 同步单个实体的更新到gameStore
   */
  syncEntityUpdate(entityId: string): void {
    const personData = this.extractPersonData(entityId);
    if (!personData) return;

    useGameStore.getState().updatePerson(entityId, personData);
  }

  /**
   * 同步资源数据到gameStore
   */
  syncResources(resources: { food: number; money: number }): void {
    useGameStore.getState().updateResources(resources);
  }

  /**
   * 同步统计数据到gameStore
   */
  syncStatistics(statistics: {
    totalBirths: number;
    totalDeaths: number;
    averageAge: number;
    averageHealth: number;
    averageEducation: number;
  }): void {
    const state = useGameStore.getState();

    // 更新统计数据
    useGameStore.setState({
      statistics: {
        ...state.statistics,
        ...statistics,
      },
    });
  }
}

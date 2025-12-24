/**
 * ECS - PersonStore（人口状态管理）
 * 管理人口相关状态和操作
 */

import { create } from 'zustand';
import type { Person } from '../../store/types';
import { GAME_CONSTANTS } from '../../constants/game';

/**
 * 人口创建数据
 */
export interface PersonCreationData {
  id?: string;
  age: number;
  gender: 'male' | 'female';
  health?: number;
  education?: number;
  fertility?: number;
  isAlive?: boolean;
  children?: string[];
  occupation?: 'farmer' | 'worker' | 'scientist' | 'unemployed';
  partnerId?: string;
  parentIds?: [string, string] | null;
}

/**
 * 人口Store状态
 */
interface PersonState {
  // 状态
  entities: Map<string, Person>;
  count: number;

  // 派生状态缓存
  livingCount: number;
  maleCount: number;
  femaleCount: number;
}

/**
 * 人口Store操作
 */
interface PersonActions {
  // 初始化
  initializePopulation: () => void;

  // CRUD操作
  createPerson: (data: PersonCreationData) => string;
  removePerson: (id: string) => void;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  getPerson: (id: string) => Person | undefined;
  getAllPeople: () => Person[];
  getLivingPeople: () => Person[];

  // 批量操作（性能优化）
  batchUpdate: (updates: Array<{ id: string; data: Partial<Person> }>) => void;
  batchRemove: (ids: string[]) => void;

  // 设置操作
  setPeople: (people: Map<string, Person>) => void;

  // 重置
  reset: () => void;
}

/**
 * 创建初始人口
 */
function createInitialPopulation(): Map<string, Person> {
  const people = new Map<string, Person>();
  const genders: Array<'male' | 'female'> = ['male', 'female'];

  // 职业分配：40%农民，35%工人，15%科学家，10%失业
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

  for (let i = 0; i < GAME_CONSTANTS.INITIAL_POPULATION; i++) {
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const age = Math.floor(
      Math.random() * (GAME_CONSTANTS.INITIAL_AGE_MAX - GAME_CONSTANTS.INITIAL_AGE_MIN + 1)
    ) + GAME_CONSTANTS.INITIAL_AGE_MIN;

    // 根据职业调整教育水平
    let education = Math.floor(Math.random() * 5);
    const occupation = occupationDistribution[i];
    if (occupation === 'scientist') {
      education = 5 + Math.floor(Math.random() * 3); // 科学家教育水平更高
    }

    people.set(`person-${i}`, {
      id: `person-${i}`,
      age,
      gender,
      health: 60 + Math.random() * 40,
      education,
      fertility: 0,
      isAlive: true,
      children: [],
      occupation,
    });
  }

  return people;
}

/**
 * 计算派生状态
 */
function computeDerivedState(people: Map<string, Person>) {
  const livingPeople = Array.from(people.values()).filter(p => p.isAlive);
  return {
    count: people.size,
    livingCount: livingPeople.length,
    maleCount: livingPeople.filter(p => p.gender === 'male').length,
    femaleCount: livingPeople.filter(p => p.gender === 'female').length,
  };
}

/**
 * 人口Store
 */
export const usePersonStore = create<PersonState & PersonActions>((set, get) => ({
  // 初始状态
  entities: new Map(),
  count: 0,
  livingCount: 0,
  maleCount: 0,
  femaleCount: 0,

  // 初始化人口
  initializePopulation: () => {
    const people = createInitialPopulation();
    const derived = computeDerivedState(people);
    set({
      entities: people,
      ...derived,
    });
  },

  // 创建单人
  createPerson: (data) => {
    const state = get();
    const id = data.id || `person-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const newPerson: Person = {
      id,
      age: data.age,
      gender: data.gender,
      health: data.health ?? 100,
      education: data.education ?? 0,
      fertility: data.fertility ?? 0,
      isAlive: data.isAlive ?? true,
      children: data.children || [],
      occupation: data.occupation || 'unemployed',
    };

    const newEntities = new Map(state.entities);
    newEntities.set(id, newPerson);

    const derived = computeDerivedState(newEntities);
    set({
      entities: newEntities,
      ...derived,
    });

    return id;
  },

  // 删除单人
  removePerson: (id) => {
    const state = get();
    const newEntities = new Map(state.entities);
    newEntities.delete(id);

    const derived = computeDerivedState(newEntities);
    set({
      entities: newEntities,
      ...derived,
    });
  },

  // 更新单人
  updatePerson: (id, updates) => {
    const state = get();
    const person = state.entities.get(id);
    if (!person) return;

    const newEntities = new Map(state.entities);
    newEntities.set(id, { ...person, ...updates });

    const derived = computeDerivedState(newEntities);
    set({
      entities: newEntities,
      ...derived,
    });
  },

  // 获取单人
  getPerson: (id) => {
    return get().entities.get(id);
  },

  // 获取所有人
  getAllPeople: () => {
    return Array.from(get().entities.values());
  },

  // 获取存活的人
  getLivingPeople: () => {
    return Array.from(get().entities.values()).filter(p => p.isAlive);
  },

  // 批量更新（性能优化）
  batchUpdate: (updates) => {
    const state = get();
    const newEntities = new Map(state.entities);

    updates.forEach(({ id, data }) => {
      const person = newEntities.get(id);
      if (person) {
        newEntities.set(id, { ...person, ...data });
      }
    });

    const derived = computeDerivedState(newEntities);
    set({
      entities: newEntities,
      ...derived,
    });
  },

  // 批量删除
  batchRemove: (ids) => {
    const state = get();
    const newEntities = new Map(state.entities);

    ids.forEach(id => newEntities.delete(id));

    const derived = computeDerivedState(newEntities);
    set({
      entities: newEntities,
      ...derived,
    });
  },

  // 设置所有人
  setPeople: (people) => {
    const derived = computeDerivedState(people);
    set({
      entities: people,
      ...derived,
    });
  },

  // 重置
  reset: () => {
    const people = createInitialPopulation();
    const derived = computeDerivedState(people);
    set({
      entities: people,
      ...derived,
    });
  },
}));

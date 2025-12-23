/**
 * ECS - 人口选择器
 * 提供记忆化的数据查询和派生状态计算
 */

import { useMemo } from 'react';
import { usePersonStore } from '../stores/PersonStore';
import type { Person } from '../../store/types';

/**
 * 年龄分组
 */
export interface AgeGroups {
  children: number;    // 0-17岁
  adults: number;      // 18-59岁
  elderly: number;     // 60岁以上
}

/**
 * 职业分布
 */
export interface OccupationDistribution {
  farmers: number;
  workers: number;
  scientists: number;
  unemployed: number;
}

/**
 * 人口统计详情
 */
export interface PopulationStats {
  total: number;
  living: number;
  male: number;
  female: number;
  ageGroups: AgeGroups;
  occupationDistribution: OccupationDistribution;
  avgAge: number;
  avgHealth: number;
  avgEducation: number;
}

/**
 * 基础选择器函数
 */
export const personSelectors = {
  // 获取所有人
  getAllPeople: (state: ReturnType<typeof usePersonStore.getState>): Person[] => {
    return Array.from(state.entities.values());
  },

  // 获取存活人口
  getLivingPeople: (state: ReturnType<typeof usePersonStore.getState>): Person[] => {
    return Array.from(state.entities.values()).filter(p => p.isAlive);
  },

  // 获取男性人口
  getMalePeople: (state: ReturnType<typeof usePersonStore.getState>): Person[] => {
    return Array.from(state.entities.values()).filter(p => p.gender === 'male' && p.isAlive);
  },

  // 获取女性人口
  getFemalePeople: (state: ReturnType<typeof usePersonStore.getState>): Person[] => {
    return Array.from(state.entities.values()).filter(p => p.gender === 'female' && p.isAlive);
  },

  // 计算年龄分组
  getAgeGroups: (state: ReturnType<typeof usePersonStore.getState>): AgeGroups => {
    const living = personSelectors.getLivingPeople(state);
    return {
      children: living.filter(p => p.age < 18).length,
      adults: living.filter(p => p.age >= 18 && p.age < 60).length,
      elderly: living.filter(p => p.age >= 60).length,
    };
  },

  // 计算职业分布
  getOccupationDistribution: (state: ReturnType<typeof usePersonStore.getState>): OccupationDistribution => {
    const living = personSelectors.getLivingPeople(state);
    return {
      farmers: living.filter(p => p.occupation === 'farmer').length,
      workers: living.filter(p => p.occupation === 'worker').length,
      scientists: living.filter(p => p.occupation === 'scientist').length,
      unemployed: living.filter(p => p.occupation === 'unemployed').length,
    };
  },

  // 计算平均年龄
  getAverageAge: (state: ReturnType<typeof usePersonStore.getState>): number => {
    const living = personSelectors.getLivingPeople(state);
    if (living.length === 0) return 0;
    return living.reduce((sum, p) => sum + p.age, 0) / living.length;
  },

  // 计算平均健康
  getAverageHealth: (state: ReturnType<typeof usePersonStore.getState>): number => {
    const living = personSelectors.getLivingPeople(state);
    if (living.length === 0) return 0;
    return living.reduce((sum, p) => sum + p.health, 0) / living.length;
  },

  // 计算平均教育
  getAverageEducation: (state: ReturnType<typeof usePersonStore.getState>): number => {
    const living = personSelectors.getLivingPeople(state);
    if (living.length === 0) return 0;
    return living.reduce((sum, p) => sum + p.education, 0) / living.length;
  },

  // 获取育龄女性（18-45岁）
  getFertilityAgeWomen: (state: ReturnType<typeof usePersonStore.getState>): Person[] => {
    return personSelectors.getFemalePeople(state).filter(p => p.age >= 18 && p.age <= 45);
  },

  // 获取单身男性
  getSingleMen: (state: ReturnType<typeof usePersonStore.getState>): Person[] => {
    return personSelectors.getMalePeople(state).filter(p => !p.children?.length); // 简化判断
  },

  // 获取单身女性
  getSingleWomen: (state: ReturnType<typeof usePersonStore.getState>): Person[] => {
    return personSelectors.getFemalePeople(state).filter(p => !p.children?.length); // 简化判断
  },

  // 完整人口统计
  getPopulationStats: (state: ReturnType<typeof usePersonStore.getState>): PopulationStats => {
    const living = personSelectors.getLivingPeople(state);
    return {
      total: state.count,
      living: state.livingCount,
      male: state.maleCount,
      female: state.femaleCount,
      ageGroups: personSelectors.getAgeGroups(state),
      occupationDistribution: personSelectors.getOccupationDistribution(state),
      avgAge: personSelectors.getAverageAge(state),
      avgHealth: personSelectors.getAverageHealth(state),
      avgEducation: personSelectors.getAverageEducation(state),
    };
  },
};

/**
 * 记忆化Selector Hooks
 */

// 获取存活人口列表
export const useLivingPeople = (): Person[] => {
  const store = usePersonStore();
  return useMemo(
    () => personSelectors.getLivingPeople(store),
    [store.entities, store.livingCount]
  );
};

// 获取年龄分组
export const useAgeGroups = (): AgeGroups => {
  const store = usePersonStore();
  return useMemo(
    () => personSelectors.getAgeGroups(store),
    [store.entities, store.livingCount]
  );
};

// 获取职业分布
export const useOccupationDistribution = (): OccupationDistribution => {
  const store = usePersonStore();
  return useMemo(
    () => personSelectors.getOccupationDistribution(store),
    [store.entities, store.livingCount]
  );
};

// 获取完整人口统计
export const usePopulationStats = (): PopulationStats => {
  const store = usePersonStore();
  return useMemo(
    () => personSelectors.getPopulationStats(store),
    [store.entities, store.livingCount, store.maleCount, store.femaleCount]
  );
};

// 获取人口数量
export const usePopulationCount = (): number => {
  return usePersonStore(state => state.livingCount);
};

// 获取男性数量
export const useMaleCount = (): number => {
  return usePersonStore(state => state.maleCount);
};

// 获取女性数量
export const useFemaleCount = (): number => {
  return usePersonStore(state => state.femaleCount);
};

// 获取平均年龄
export const useAverageAge = (): number => {
  const store = usePersonStore();
  return useMemo(
    () => personSelectors.getAverageAge(store),
    [store.entities, store.livingCount]
  );
};

// 获取平均健康
export const useAverageHealth = (): number => {
  const store = usePersonStore();
  return useMemo(
    () => personSelectors.getAverageHealth(store),
    [store.entities, store.livingCount]
  );
};

// 获取平均教育
export const useAverageEducation = (): number => {
  const store = usePersonStore();
  return useMemo(
    () => personSelectors.getAverageEducation(store),
    [store.entities, store.livingCount]
  );
};

// 获取育龄女性
export const useFertilityAgeWomen = (): Person[] => {
  const store = usePersonStore();
  return useMemo(
    () => personSelectors.getFertilityAgeWomen(store),
    [store.entities]
  );
};

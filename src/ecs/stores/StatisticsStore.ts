/**
 * ECS - StatisticsStore（统计状态管理）
 * 管理游戏统计数据
 */

import { create } from 'zustand';
import type { GameStatistics } from '../../store/types';
import { GAME_CONSTANTS } from '../../constants/game';

/**
 * 统计Store状态
 */
interface StatisticsState {
  statistics: GameStatistics;
  lastYearRecorded: number;
}

/**
 * 统计Store操作
 */
interface StatisticsActions {
  // 更新统计数据
  updateStatistics: (year: number, populationCount: number, resources: any) => void;

  // 更新实时指标
  updateRealtimeStats: (data: {
    avgAge: number;
    avgHealth: number;
    avgEducation: number;
  }) => void;

  // 记录出生
  recordBirth: () => void;

  // 记录死亡
  recordDeath: () => void;

  // 获取统计
  getStatistics: () => GameStatistics;

  // 重置
  reset: () => void;
}

/**
 * 创建初始统计
 */
function createInitialStatistics(): GameStatistics {
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
 * 统计Store
 */
export const useStatisticsStore = create<StatisticsState & StatisticsActions>((set, get) => ({
  // 初始状态
  statistics: createInitialStatistics(),
  lastYearRecorded: -1,

  // 更新统计数据
  updateStatistics: (year, populationCount, resources) => {
    const state = get();

    // 只在跨年时更新
    if (year <= state.lastYearRecorded) return;

    set({
      statistics: {
        ...state.statistics,
        populationHistory: [
          ...state.statistics.populationHistory,
          { year, count: populationCount },
        ],
        resourceHistory: [
          ...state.statistics.resourceHistory,
          { year, resources },
        ],
      },
      lastYearRecorded: year,
    });
  },

  // 更新实时指标
  updateRealtimeStats: (data) => {
    const state = get();
    set({
      statistics: {
        ...state.statistics,
        averageAge: data.avgAge,
        averageHealth: data.avgHealth,
        averageEducation: data.avgEducation,
      },
    });
  },

  // 记录出生
  recordBirth: () => {
    const state = get();
    set({
      statistics: {
        ...state.statistics,
        totalBirths: state.statistics.totalBirths + 1,
      },
    });
  },

  // 记录死亡
  recordDeath: () => {
    const state = get();
    set({
      statistics: {
        ...state.statistics,
        totalDeaths: state.statistics.totalDeaths + 1,
      },
    });
  },

  // 获取统计
  getStatistics: () => {
    return get().statistics;
  },

  // 重置
  reset: () => {
    set({
      statistics: createInitialStatistics(),
      lastYearRecorded: -1,
    });
  },
}));

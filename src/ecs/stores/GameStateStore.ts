/**
 * ECS - GameStateStore（游戏状态管理）
 * 管理游戏控制状态（速度、暂停、游戏进度等）
 */

import { create } from 'zustand';

export type GameSpeed = 'paused' | '1x' | '2x' | '5x' | '10x';

/**
 * 游戏状态
 */
interface GameStateState {
  // 游戏控制
  gameSpeed: GameSpeed;
  gameStarted: boolean;
  isGameOver: boolean;

  // 游戏时间
  currentYear: number;
  currentMonth: number;
  totalMonths: number;

  // 游戏结束相关
  negativeMoneyMonths: number;
  noFoodMonths: number;
  lowHappinessMonths: number;
}

/**
 * 游戏状态操作
 */
interface GameStateActions {
  // 游戏控制
  setGameSpeed: (speed: GameSpeed) => void;
  startGame: () => void;
  pauseGame: () => void;
  resetGame: () => void;
  setGameOver: (isOver: boolean) => void;

  // 时间推进
  advanceTime: (months: number) => void;

  // 失败条件计数器
  updateFailureCounters: (data: {
    negativeMoney?: boolean;
    noFood?: boolean;
    lowHappiness?: boolean;
  }) => void;
}

/**
 * 创建初始游戏状态
 */
function createInitialState(): GameStateState {
  return {
    gameSpeed: 'paused',
    gameStarted: false,
    isGameOver: false,
    currentYear: 0,
    currentMonth: 0,
    totalMonths: 0,
    negativeMoneyMonths: 0,
    noFoodMonths: 0,
    lowHappinessMonths: 0,
  };
}

/**
 * 游戏状态Store
 */
export const useGameStateStore = create<GameStateState & GameStateActions>((set, get) => ({
  ...createInitialState(),

  // 设置游戏速度
  setGameSpeed: (speed) => {
    set({ gameSpeed: speed });
  },

  // 开始游戏
  startGame: () => {
    set({ gameStarted: true, gameSpeed: '1x' });
  },

  // 暂停游戏
  pauseGame: () => {
    set({ gameSpeed: 'paused' });
  },

  // 重置游戏
  resetGame: () => {
    set(createInitialState());
  },

  // 设置游戏结束
  setGameOver: (isOver) => {
    set({ isGameOver: isOver });
  },

  // 推进时间
  advanceTime: (months) => {
    const state = get();
    const newTotalMonth = state.totalMonths + months;
    const newCurrentMonth = newTotalMonth % 12;
    const newCurrentYear = Math.floor(newTotalMonth / 12);

    set({
      totalMonths: newTotalMonth,
      currentMonth: newCurrentMonth,
      currentYear: newCurrentYear,
    });
  },

  // 更新失败条件计数器
  updateFailureCounters: (data) => {
    const state = get();

    if (data.negativeMoney !== undefined) {
      set({
        negativeMoneyMonths: data.negativeMoney
          ? state.negativeMoneyMonths + 1
          : 0
      });
    }

    if (data.noFood !== undefined) {
      set({
        noFoodMonths: data.noFood
          ? state.noFoodMonths + 1
          : 0
      });
    }

    if (data.lowHappiness !== undefined) {
      set({
        lowHappinessMonths: data.lowHappiness
          ? state.lowHappinessMonths + 1
          : 0
      });
    }
  },
}));

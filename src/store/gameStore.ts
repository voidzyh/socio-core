import { create } from 'zustand';
import type { GameState, GameSpeed, Person, Resources, Policy, GameStatistics, Achievement } from './types';
import { GAME_CONSTANTS, createInitialResources } from '../constants/game';
import { POLICIES } from '../constants/policies';
import { ACHIEVEMENTS } from '../constants/achievements';

// 创建初始人口
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

// 创建初始统计
function createInitialStatistics(): GameStatistics {
  return {
    totalBirths: 0,
    totalDeaths: 0,
    populationHistory: [{ year: 0, count: GAME_CONSTANTS.INITIAL_POPULATION }],
    birthsHistory: [{ year: 0, count: 0 }],
    deathsHistory: [{ year: 0, count: 0 }],
    resourceHistory: [],
    averageAge: 35,
    averageHealth: 75,
    averageEducation: 2,
  };
}

// 创建初始状态
function createInitialState(): GameState {
  const people = createInitialPopulation();
  return {
    currentYear: 0,
    currentMonth: 0,
    totalMonths: 0,
    gameSpeed: 'paused',

    people,
    populationCount: people.size,

    resources: createInitialResources(),

    policies: POLICIES,
    activePolicies: [],

    statistics: createInitialStatistics(),

    achievements: ACHIEVEMENTS,
    unlockedAchievements: [],

    eventHistory: [],
    lastEventCheck: 0,

    isGameOver: false,
    gameStarted: false,

    // 游戏结束条件
    gameEnding: null,
    lowHappinessMonths: 0,
    negativeMoneyMonths: 0,
    noFoodMonths: 0,
  };
}

interface GameActions {
  // 游戏控制
  startGame: () => void;
  pauseGame: () => void;
  setGameSpeed: (speed: GameSpeed) => void;
  resetGame: () => void;

  // 时间推进
  advanceTime: (months: number) => void;

  // 人口管理
  addPerson: (person: Person) => void;
  removePerson: (id: string) => void;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  setPeople: (people: Map<string, Person>) => void;

  // 资源管理
  updateResources: (updates: Partial<Resources>) => void;
  setResources: (resources: Resources) => void;

  // 政策管理
  activatePolicy: (policyId: string) => void;
  deactivatePolicy: (policyId: string) => void;
  updatePolicyDurations: () => void;

  // 统计管理
  updateStatistics: () => void;

  // 成就管理
  checkAchievements: () => void;

  // 事件管理
  addEventToHistory: (event: string) => void;
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...createInitialState(),

  // 游戏控制
  startGame: () => set({ gameStarted: true, gameSpeed: '1x' }),

  pauseGame: () => set({ gameSpeed: 'paused' }),

  setGameSpeed: (speed) => set({ gameSpeed: speed }),

  resetGame: () => set(createInitialState()),

  // 时间推进
  advanceTime: (months) => {
    const state = get();
    const newMonth = state.currentMonth + months;
    const newYear = Math.floor(newMonth / GAME_CONSTANTS.MONTHS_PER_YEAR);
    const currentMonthInYear = newMonth % GAME_CONSTANTS.MONTHS_PER_YEAR;

    set({
      currentMonth: newMonth,
      totalMonths: state.totalMonths + months,
      currentYear: newYear,
    });

    // 每年更新统计
    if (currentMonthInYear === 0 && newYear > 0) {
      get().updateStatistics();
      get().checkAchievements();
    }

    // 更新政策持续时间
    get().updatePolicyDurations();
  },

  // 人口管理
  addPerson: (person) => {
    const state = get();
    const newPeople = new Map(state.people);
    newPeople.set(person.id, person);
    set({
      people: newPeople,
      populationCount: newPeople.size,
    });
  },

  removePerson: (id) => {
    const state = get();
    const newPeople = new Map(state.people);
    newPeople.delete(id);
    set({
      people: newPeople,
      populationCount: newPeople.size,
    });
  },

  updatePerson: (id, updates) => {
    const state = get();
    const person = state.people.get(id);
    if (!person) return;

    const newPeople = new Map(state.people);
    newPeople.set(id, { ...person, ...updates });
    set({ people: newPeople });
  },

  setPeople: (people) => set({ people, populationCount: people.size }),

  // 资源管理
  updateResources: (updates) => {
    const state = get();
    set({
      resources: { ...state.resources, ...updates },
    });
  },

  setResources: (resources) => set({ resources }),

  // 政策管理
  activatePolicy: (policyId) => {
    const state = get();
    const policy = state.policies.find((p) => p.id === policyId);
    if (!policy || state.activePolicies.includes(policyId)) return;

    // 检查资金是否足够
    if (state.resources.money < policy.cost) return;

    const newPolicies = state.policies.map((p) =>
      p.id === policyId ? { ...p, active: true } : p
    );

    set({
      policies: newPolicies,
      activePolicies: [...state.activePolicies, policyId],
      resources: {
        ...state.resources,
        money: state.resources.money - policy.cost,
      },
    });
  },

  deactivatePolicy: (policyId) => {
    const state = get();
    const newPolicies = state.policies.map((p) =>
      p.id === policyId ? { ...p, active: false } : p
    );

    set({
      policies: newPolicies,
      activePolicies: state.activePolicies.filter((id) => id !== policyId),
    });
  },

  updatePolicyDurations: () => {
    const state = get();
    const policiesToDeactivate: string[] = [];

    const newPolicies = state.policies.map((policy) => {
      if (policy.active && policy.duration) {
        const newDuration = policy.duration - 1;
        if (newDuration <= 0) {
          policiesToDeactivate.push(policy.id);
          return { ...policy, active: false, duration: 0 };
        }
        return { ...policy, duration: newDuration };
      }
      return policy;
    });

    set({
      policies: newPolicies,
      activePolicies: state.activePolicies.filter(
        (id) => !policiesToDeactivate.includes(id)
      ),
    });
  },

  // 统计管理
  updateStatistics: () => {
    const state = get();
    const livingPeople = Array.from(state.people.values()).filter((p) => p.isAlive);

    if (livingPeople.length === 0) return;

    const avgAge = livingPeople.reduce((sum, p) => sum + p.age, 0) / livingPeople.length;
    const avgHealth = livingPeople.reduce((sum, p) => sum + p.health, 0) / livingPeople.length;
    const avgEducation = livingPeople.reduce((sum, p) => sum + p.education, 0) / livingPeople.length;

    set({
      statistics: {
        ...state.statistics,
        populationHistory: [
          ...state.statistics.populationHistory,
          { year: state.currentYear, count: livingPeople.length },
        ],
        averageAge: avgAge,
        averageHealth: avgHealth,
        averageEducation: avgEducation,
        resourceHistory: [
          ...state.statistics.resourceHistory,
          { year: state.currentYear, resources: state.resources },
        ],
      },
    });
  },

  // 成就管理
  checkAchievements: () => {
    const state = get();
    const newUnlocked: string[] = [];

    const newAchievements = state.achievements.map((achievement) => {
      if (!achievement.unlocked && achievement.condition(state)) {
        newUnlocked.push(achievement.id);
        return { ...achievement, unlocked: true };
      }
      return achievement;
    });

    if (newUnlocked.length > 0) {
      set({
        achievements: newAchievements,
        unlockedAchievements: [...state.unlockedAchievements, ...newUnlocked],
      });
    }
  },

  // 事件管理
  addEventToHistory: (event) => {
    const state = get();
    set({
      eventHistory: [...state.eventHistory.slice(-19), event],
    });
  },
}));

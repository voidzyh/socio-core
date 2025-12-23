// 核心类型定义

// 性别
export type Gender = 'male' | 'female';

// 职业
export type Occupation = 'farmer' | 'worker' | 'scientist' | 'unemployed';

// 人口实体
export interface Person {
  id: string;
  age: number;
  gender: Gender;
  health: number;        // 0-100 健康值
  education: number;     // 0-10 教育水平
  fertility: number;     // 生育能力（随年龄变化）
  isAlive: boolean;
  partner?: string;      // 配偶ID
  parents?: [string, string]; // 父母ID
  children: string[];    // 子女ID
  occupation: Occupation;
}

// 资源
export interface Resources {
  food: number;
  housing: number;
  medicine: number;
  education: number;
  money: number;
  productionRate: {
    food: number;
    research: number;
  };
}

// 政策效果
export interface PolicyEffects {
  fertilityRate?: number;
  deathRate?: number;
  education?: number;
  economy?: number;
  happiness?: number;
  foodProduction?: number;
  housingCapacity?: number;
  medicineConsumption?: number;
}

// 政策
export interface Policy {
  id: string;
  name: string;
  description: string;
  cost: number;
  effects: PolicyEffects;
  duration?: number;
  active: boolean;
  category: PolicyCategory;
}

// 政策类别
export type PolicyCategory = 'fertility' | 'medical' | 'education' | 'economic' | 'social';

// 游戏统计
export interface GameStatistics {
  totalBirths: number;
  totalDeaths: number;
  populationHistory: { year: number; count: number }[];
  birthsHistory: { year: number; count: number }[];
  deathsHistory: { year: number; count: number }[];
  resourceHistory: { year: number; resources: Resources }[];
  averageAge: number;
  averageHealth: number;
  averageEducation: number;
}

// 随机事件
export interface RandomEvent {
  id: string;
  name: string;
  description: string;
  effects: {
    populationChange?: number;
    deathRateChange?: number;
    foodChange?: number;
    housingChange?: number;
    moneyChange?: number;
  };
  probability: number; // 0-1
}

// 成就
export interface Achievement {
  id: string;
  name: string;
  description: string;
  condition: (state: GameState) => boolean;
  unlocked: boolean;
  icon: string;
}

// 游戏速度
export type GameSpeed = 'paused' | '1x' | '2x' | '5x' | '10x';

// 游戏状态
export interface GameState {
  // 时间系统
  currentYear: number;
  currentMonth: number;
  totalMonths: number;
  gameSpeed: GameSpeed;

  // 人口
  people: Map<string, Person>;
  populationCount: number;

  // 资源
  resources: Resources;

  // 政策
  policies: Policy[];
  activePolicies: string[];

  // 统计
  statistics: GameStatistics;

  // 成就
  achievements: Achievement[];
  unlockedAchievements: string[];

  // 事件
  eventHistory: string[];
  lastEventCheck: number; // 上次检查事件的月份

  // 游戏状态
  isGameOver: boolean;
  gameStarted: boolean;

  // 游戏结束条件
  gameEnding: GameEnding | null;
  lowHappinessMonths: number; // 低幸福度持续月数
  negativeMoneyMonths: number; // 负资产持续月数
  noFoodMonths: number; // 缺粮持续月数
}

// 游戏结局类型
export type GameEndingType =
  | 'extinction'        // 人口灭绝
  | 'economic_collapse' // 经济崩溃
  | 'social_collapse'   // 社会崩溃
  | 'aging_crisis'     // 老龄化危机
  | 'resource_depletion' // 资源枯竭
  | 'perfect'          // 完美结局
  | 'excellent'        // 优秀结局
  | 'good'            // 普通结局
  | 'acceptable';     // 勉强过关

// 游戏结局
export interface GameEnding {
  type: GameEndingType;
  title: string;
  description: string;
  score: GameScore;
}

// 游戏评分
export interface GameScore {
  totalScore: number;      // 0-100 总分
  rank: 'S' | 'A' | 'B' | 'C' | 'D';

  dimensions: {
    population: number;    // 人口得分 (0-20)
    economy: number;       // 经济得分 (0-20)
    happiness: number;     // 幸福度得分 (0-20)
    health: number;        // 健康得分 (0-20)
    education: number;     // 教育得分 (0-20)
  };

  achievements: number;    // 成就解锁数量
  survivalYears: number;   // 生存年数
}

// UI 状态
export interface UIState {
  selectedPersonId: string | null;
  showPolicyPanel: boolean;
  showStatsPanel: boolean;
  showAchievementsPanel: boolean;
  hoveredPerson: Person | null;
  notifications: Notification[];
}

// 通知
export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'achievement';
  timestamp: number;
}

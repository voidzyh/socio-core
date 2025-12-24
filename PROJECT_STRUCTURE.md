# 项目架构详细文档

> **人口模拟器游戏** - ECS架构版本  
> 版本: 1.0.0 | 最后更新: 2024-12-24

---

## 📑 文档导航

本文档详细说明项目的ECS架构设计、目录结构、数据流向和实现细节。

**相关文档**:
- [README.md](./README.md) - 项目概述和快速开始
- [API文档](./docs/API.md) - API参考（待创建）

---

## 目录

- [架构概览](#架构概览)
- [ECS架构详解](#ecs架构详解)
- [目录结构](#目录结构)
- [核心模块](#核心模块)
- [数据流向](#数据流向)
- [设计模式](#设计模式)
- [扩展指南](#扩展指南)

---

## 架构概览

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        用户界面层                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Canvas   │ │ 政策面板 │ │ 统计面板 │ │ 成就面板 │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                     容器组件层                                 │
│  PopulationCanvasContainer  PolicyPanelContainer  等       │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                     选择器层                                   │
│  personSelectors  resourceSelectors  policySelectors          │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    状态管理层                    │
│  PersonStore  ResourceStore  StatisticsStore  GameStateStore  │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  ECS World层                                  │
│  ┌──────────────────────────────────────────────────┐         │
│  │  Systems (13个)                                  │         │
│  │  ├─ PopulationSystem                             │         │
│  │  ├─ AgingSystem                                │         │
│  │  ├─ BirthSystem                                │         │
│  │  ├─ DeathSystem                                │         │
│  │  ├─ MarriageSystem                             │         │
│  │  ├─ ResourceSystem                             │         │
│  │  ├─ FoodSystem                                 │         │
│  │  ├─ MoneySystem                                │         │
│  │  ├─ ShortageEffectSystem                       │         │
│  │  ├─ PolicySystem                               │         │
│  │  ├─ PolicyEffectSystem                         │         │
│  │  ├─ StatisticsSystem                           │         │
│  │  └─ AchievementSystem                          │         │
│  └──────────────────────────────────────────────────┘         │
│  ┌──────────────────────────────────────────────────┐         │
│  │  EventBus (事件总线)                            │         │
│  └──────────────────────────────────────────────────┘         │
│  ┌──────────────────────────────────────────────────┐         │
│  │  Entities + Components                          │         │
│  └──────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   游戏引擎层                                   │
│  GameEngine  TimeSystem  EventSystem  GameEndingSystem        │
└─────────────────────────────────────────────────────────────┘
```

---

## ECS架构详解

### 1. Entity（实体）

**文件位置**: `src/ecs/core/Entity.ts`

**职责**: 实体只是唯一标识符，不包含数据和逻辑。

**定义**:
```typescript
type EntityID = string;
type ComponentType = string;

export class Entity {
  readonly id: EntityID;
  readonly components: Set<ComponentType> = new Set();

  constructor(id: EntityID) {
    this.id = id;
  }

  hasComponent(type: ComponentType): boolean {
    return this.components.has(type);
  }

  addComponent(type: ComponentType): void {
    this.components.add(type);
  }

  removeComponent(type: ComponentType): void {
    this.components.delete(type);
  }
}
```

**特点**:
- ✅ 轻量级：只存储ID和组件类型集合
- ✅ 快速查询：O(1)的组件存在检查
- ✅ 不可变ID：ID一旦创建不可更改

---

### 2. Component（组件）

**文件位置**: `src/ecs/components/`

**职责**: 组件是纯数据容器，不包含逻辑。

#### 2.1 PersonComponents.ts

```typescript
// 身份组件
export interface IdentityComponent {
  entityId: EntityID;
  gender: 'male' | 'female';
  birthMonth: number; // 出生月份（从游戏开始计算的月数）
}

// 生物特征组件
export interface BiologicalComponent {
  health: number;        // 0-100 健康值
  fertility: number;      // 0-1 生育能力
  isAlive: boolean;
  deathMonth?: number;
}

// 认知特征组件
export interface CognitiveComponent {
  education: number;     // 0-10 教育水平
}

// 关系组件
export interface RelationshipComponent {
  partnerId?: EntityID;
  parentIds?: [EntityID, EntityID] | null;
  childrenIds: Set<EntityID>;
}

// 职业组件
export interface OccupationComponent {
  occupation: OccupationType;
  productivity: number;
}
```

#### 2.2 ResourceComponents.ts

```typescript
// 消耗组件
export interface ConsumptionComponent {
  foodConsumption: number;
  medicineConsumption: number;
}

// 生产组件
export interface ProductionComponent {
  foodProduction: number;
  moneyProduction: number;
}
```

**组件设计原则**:
- ✅ **单一职责**: 每个组件只负责一类数据
- ✅ **纯数据**: 不包含任何逻辑方法
- ✅ **可选组合**: 实体可以有任何组件组合
- ✅ **类型安全**: 完整的TypeScript类型定义

---

### 3. System（系统）

**文件位置**: `src/ecs/systems/`

**职责**: 系统包含逻辑，操作具有特定组件组合的实体。

#### 3.1 系统基类

```typescript
export interface ISystem {
  readonly name: string;
  readonly priority: number; // 执行优先级（0-100）
  initialize(world: World): void;
  update(deltaTime: number): void;
}

export abstract class System implements ISystem {
  protected world: World | null = null;

  initialize(world: World): void {
    this.world = world;
  }

  abstract update(deltaTime: number): void;

  protected getWorld(): World {
    if (!this.world) {
      throw new Error(`${this.name}: System not initialized`);
    }
    return this.world;
  }
}
```

#### 3.2 系统优先级

```
优先级从高到低执行：
95 - DeathSystem（死亡系统）
90 - BirthSystem（生育系统）
85 - MarriageSystem（婚姻系统）
80 - AgingSystem（衰老系统）
70 - ResourceSystem（资源系统）
60 - FoodSystem（食物系统）
50 - StatisticsSystem（统计系统）
40 - PolicySystem（政策系统）
30 - AchievementSystem（成就系统）
20 - ShortageEffectSystem（短缺效果系统）
10 - PolicyEffectSystem（政策效果系统）
```

**执行流程**:
```
World.update(deltaTime)
  ├─ DeathSystem.update()    # 先处理死亡
  ├─ BirthSystem.update()    # 再处理出生
  ├─ MarriageSystem.update() # 然后处理婚姻
  └─ ...                    # 其他系统按优先级执行
```

---

### 4. World（世界管理器）

**文件位置**: `src/ecs/core/World.ts`

**职责**: 协调所有系统、实体和组件。

#### 4.1 核心API

```typescript
export class World {
  // ========== 实体管理 ==========
  createEntity(): Entity;
  destroyEntity(id: EntityID): void;
  getEntity(id: EntityID): Entity | undefined;
  getEntities(): Entity[];

  // ========== 组件管理 ==========
  addComponent<T>(entityId: EntityID, type: ComponentType, component: T): void;
  getComponent<T>(entityId: EntityID, type: ComponentType): T | undefined;
  updateComponent<T>(entityId: EntityID, type: ComponentType, updates: Partial<T>): void;
  removeComponent(entityId: EntityID, type: ComponentType): void;

  // ========== 查询系统 ==========
  query(query: Query): Entity[];

  // ========== 系统管理 ==========
  addSystem(system: ISystem): void;
  removeSystem(systemName: string): void;

  // ========== 游戏循环 ==========
  update(deltaTime: number): void;

  // ========== 时间管理 ==========
  getCurrentMonth(): number;  // 0-11
  getCurrentYear(): number;
  getTotalMonths(): number;
  advanceTime(months: number): void;

  // ========== 事件系统 ==========
  getEventBus(): EventBus;
}
```

#### 4.2 时间管理

```typescript
private currentMonth: number = 0;  // 当前月份（0-11）
private currentYear: number = 0;    // 当前年份
private totalMonths: number = 0;    // 总月数

advanceTime(months: number): void {
  this.totalMonths += months;
  this.currentYear = Math.floor(this.totalMonths / 12);
  this.currentMonth = this.totalMonths % 12;
  
  this.eventBus.emit('time:advanced', {
    totalMonths: this.totalMonths,
    currentYear: this.currentYear,
    currentMonth: this.currentMonth,
  });
}
```

---

## 目录结构

### 完整目录树

```
src/
├── ecs/                                    # ⭐ ECS架构核心
│   ├── core/                               # 核心功能模块
│   │   ├── Entity.ts                      # 实体定义
│   │   ├── Component.ts                   # 组件基类
│   │   ├── System.ts                      # 系统基类和接口
│   │   ├── Query.ts                       # 查询系统
│   │   ├── World.ts                       # 世界管理器 ⭐
│   │   ├── EventBus.ts                    # 事件总线 ⭐
│   │   └── index.ts                       # 导出
│   │
│   ├── components/                        # 组件定义
│   │   ├── PersonComponents.ts           # 人口相关组件
│   │   │   ├─ IdentityComponent          # 身份信息
│   │   │   ├─ BiologicalComponent       # 生物特征
│   │   │   ├─ CognitiveComponent        # 认知特征
│   │   │   ├─ RelationshipComponent     # 关系信息
│   │   │   └─ OccupationComponent       # 职业信息
│   │   ├── ResourceComponents.ts         # 资源相关组件
│   │   └── index.ts                      # 导出
│   │
│   ├── systems/                           # 系统实现（13个）
│   │   ├── PopulationSystem.ts          # 人口系统总控
│   │   ├── AgingSystem.ts               # 衰老系统
│   │   ├── BirthSystem.ts               # 生育系统
│   │   ├── DeathSystem.ts               # 死亡系统 ⭐
│   │   ├── MarriageSystem.ts            # 婚姻系统
│   │   ├── ResourceSystem.ts            # 资源系统
│   │   ├── FoodSystem.ts                # 食物系统
│   │   ├── MoneySystem.ts               # 资金系统
│   │   ├── ShortageEffectSystem.ts      # 短缺效果系统
│   │   ├── PolicySystem.ts              # 政策系统
│   │   ├── PolicyEffectSystem.ts        # 政策效果系统
│   │   ├── StatisticsSystem.ts          # 统计系统 ⭐
│   │   └── AchievementSystem.ts         # 成就系统
│   │
│   ├── stores/                            # 状态管理（Zustand）
│   │   ├── PersonStore.ts               # 人口Store ⭐
│   │   │   ├─ entities: Map<PersonID, Person>
│   │   │   ├─ count: number
│   │   │   └─ CRUD操作
│   │   ├── ResourceStore.ts             # 资源Store
│   │   │   ├─ resources: Resources
│   │   │   ├─ productionRates: ProductionRates
│   │   │   └─ shortageStatus: ShortageStatus
│   │   ├── StatisticsStore.ts           # 统计Store ⭐
│   │   │   └─ statistics: GameStatistics
│   │   ├── AchievementStore.ts          # 成就Store
│   │   ├── EventStore.ts                # 事件Store
│   │   ├── GameStateStore.ts            # 游戏状态Store
│   │   │   ├─ currentYear/month/totalMonths
│   │   │   ├─ gameSpeed, gameStarted
│   │   │   └─ failureCounters
│   │   ├── PolicyStore.ts               # 政策Store
│   │   └── index.ts
│   │
│   ├── selectors/                         # 选择器层
│   │   ├── personSelectors.ts           # 人口选择器 ⭐
│   │   │   ├─ getAllPeople()
│   │   │   ├─ getLivingPeople()
│   │   │   ├─ getAgeGroups()
│   │   │   └─ useLivingPeople() Hook
│   │   ├── resourceSelectors.ts         # 资源选择器
│   │   ├── policySelectors.ts           # 政策选择器
│   │   └── index.ts
│   │
│   ├── utils/                             # ECS工具类
│   │   ├── EntityFactory.ts             # 实体工厂 ⭐
│   │   │   └─ createInitialPopulation()
│   │   ├── SystemRegistry.ts            # 系统注册表
│   │   └── ComponentFactory.ts          # 组件工厂
│   │
│   └── events/                            # 事件定义和管理
│       └── EventManager.ts             # 事件管理器
│
├── components/                            # React组件
│   ├── canvas/                           # Canvas可视化
│   │   ├── PopulationCanvas.tsx         # 展示组件（Canvas渲染）
│   │   ├── PopulationCanvasContainer.tsx # 容器组件（连接Selector）
│   │   └── PopulationCanvas.css
│   │
│   ├── policies/                         # 政策面板
│   │   ├── PolicyPanel.tsx              # 展示组件
│   │   ├── PolicyPanelContainer.tsx     # 容器组件
│   │   └── PolicyPanel.css
│   │
│   ├── statistics/                       # 统计面板
│   │   ├── StatsPanel.tsx               # 展示组件
│   │   ├── StatsPanelContainer.tsx      # 容器组件
│   │   └── StatsPanel.css
│   │
│   ├── achievements/                     # 成就面板
│   │   └── AchievementsPanel.tsx
│   │
│   ├── events/                           # 事件通知
│   │   └── EventNotification.tsx
│   │
│   ├── gameending/                       # 游戏结束
│   │   └── GameEndingModal.tsx
│   │
│   └── layout/                           # 布局组件
│       ├── Header.tsx                   # 顶部栏
│       ├── GameLayout.tsx                # 主布局
│       └── GameLayout.css
│
├── game/                                 # 游戏引擎
│   └── engine/
│       ├── GameEngine.ts                # 游戏引擎主类 ⭐
│       │   └─ 协调World、Systems、Stores
│       ├── TimeSystem.ts                # 时间系统
│       │   └─ 管理游戏速度和暂停
│       ├── EventSystem.ts               # 随机事件系统
│       │   └─ 处理随机事件触发
│       └── GameEndingSystem.ts          # 游戏结束检查
│           └─ 检查失败/胜利条件
│
├── constants/                            # 游戏常量
│   ├── game.ts                          # 游戏核心常量
│   │   ├─ GAME_CONSTANTS
│   │   ├─ POPULATION_CONSTANTS
│   │   └─ RESOURCE_CONSTANTS
│   ├── achievements.ts                  # 成就定义（10个）
│   └── policies.ts                      # 政策定义（15个）
│
├── store/                                # 类型定义
│   ├── types.ts                         # 核心类型接口 ⭐
│   │   ├─ Person, Resources
│   │   ├─ Policy, Achievement
│   │   ├─ GameStatistics
│   │   ├─ GameState (聚合接口)
│   │   └─ GameEnding
│   └── uiStore.ts                       # UI状态Store
│       ├─ selectedPersonId
│       ├─ showStatsPanel等
│       └─ notifications
│
├── assets/                               # 静态资源
│   └── data/
│       └── events.json                  # 随机事件数据
│
├── App.tsx                               # 应用入口
├── main.tsx                              # React入口
└── vite-env.d.ts                        # Vite类型声明
```

---

## 核心模块

### 1. 人口管理

#### 1.1 PersonStore

**文件**: `src/ecs/stores/PersonStore.ts`

**状态**:
```typescript
interface PersonState {
  entities: Map<string, Person>;  // 所有实体
  count: number;                   // 总人数
  livingCount: number;             // 存活人数
  maleCount: number;               // 男性人数
  femaleCount: number;             // 女性人数
}
```

**操作**:
```typescript
createPerson(data: PersonCreationData): string;
removePerson(id: string): void;
updatePerson(id: string, updates: Partial<PersonData>): void;
getPerson(id: string): Person | undefined;
setPeople(people: Map<string, Person>): void;
reset(): void;
```

#### 1.2 人口相关Systems

**PopulationSystem** (`src/ecs/systems/PopulationSystem.ts`):
- 总控人口系统
- 协调Aging、Birth、Death、Marriage子系统

**AgingSystem** (`src/ecs/systems/AgingSystem.ts`):
- 处理年龄增长
- 健康衰减（60岁以上）
- 年龄计算

**BirthSystem** (`src/ecs/systems/BirthSystem.ts`):
- 生育逻辑
- 基于年龄、健康、生育能力
- 考虑婚姻状况

**DeathSystem** (`src/ecs/systems/DeathSystem.ts`):
- 死亡判定
- 基于年龄、健康、医疗资源
- 发出`person:died`事件

**MarriageSystem** (`src/ecs/systems/MarriageSystem.ts`):
- 婚姻匹配
- 基于年龄范围
- 单身状态

---

### 2. 统计管理

#### 2.1 StatisticsStore

**文件**: `src/ecs/stores/StatisticsStore.ts`

**状态**:
```typescript
interface StatisticsState {
  statistics: GameStatistics;
  lastYearRecorded: number;
}

interface GameStatistics {
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
```

#### 2.2 StatisticsSystem

**文件**: `src/ecs/systems/StatisticsSystem.ts`

**职责**:
- 监听`person:born`和`person:died`事件
- 维护出生/死亡计数
- 计算平均指标（年龄、健康、教育）
- 每年记录统计历史
- 发出`statistics:yearly`事件

**关键方法**:
```typescript
initialize(world: World): void {
  // 监听出生事件
  eventBus.on('person:born', () => {
    this.statistics.totalBirths++;
  });
  
  // 监听死亡事件
  eventBus.on('person:died', () => {
    this.statistics.totalDeaths++;
  });
}

update(deltaTime: number): void {
  const currentYear = Math.floor(this.getCurrentMonth(world) / 12);
  
  // 每年记录一次
  if (currentYear > this.lastYearRecorded && currentYear > 0) {
    this.recordYearStatistics(world, currentYear);
    this.lastYearRecorded = currentYear;
  }
  
  // 实时更新平均指标
  this.updateRealtimeStats(world);
}

getStatistics(): GameStatistics {
  return this.statistics;
}
```

---

### 3. 游戏引擎

#### 3.1 GameEngine

**文件**: `src/game/engine/GameEngine.ts`

**职责**:
- 初始化ECS World和Systems
- 管理游戏循环（通过TimeSystem）
- 协调World、Systems、Stores之间的数据同步
- 处理UI事件（开始、暂停、重置、速度调整）
- 检查游戏结束条件

**关键流程**:
```typescript
constructor() {
  // 1. 初始化ECS World
  this.world = new World();
  this.entityFactory = new EntityFactory(this.world);
  this.eventManager = new EventManager(this.world);
  
  // 2. 初始化Systems
  this.initializeECSSystems();
  
  // 3. 初始化原有系统
  this.timeSystem = new TimeSystem(() => this.onTick());
  this.eventSystem = new EventSystem();
  this.endingSystem = new GameEndingSystem();
  
  // 4. 监听ECS事件
  this.setupECSEventListeners();
  
  // 5. 初始化人口
  this.initializeECSPopulation();
}

private onTick(): void {
  // 1. 检查随机事件
  const randomEvent = this.eventSystem.checkAndTriggerEvent();
  if (randomEvent) this.applyEvent(randomEvent);
  
  // 2. 推进时间
  this.world.advanceTime(1);
  useGameStateStore.getState().advanceTime(1);
  
  // 3. ECS Systems处理
  this.world.update(1.0);
  
  // 4. 同步到UI
  this.syncToUI();
  
  // 5. 检查游戏结束
  this.updateFailureCounters();
  const ending = this.endingSystem.checkEndingConditions(...);
  if (ending) this.triggerGameEnding(ending);
}
```

---

## 数据流向

### 1. 游戏循环数据流

```
┌─────────────────────────────────────────────────────┐
│ TimeSystem (每秒触发N次，根据游戏速度)               │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ GameEngine.onTick()                                  │
│  1. 检查随机事件                                     │
│  2. 推进时间 (World.advanceTime)                      │
│  3. 执行所有Systems (World.update)                   │
│  4. 同步数据到Stores (syncToUI)                       │
│  5. 检查游戏结束条件                                   │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ World.update(deltaTime)                              │
│  执行所有Systems（按优先级顺序）                      │
│  ┌─────────────────────────────────────────┐         │
│  │ DeathSystem (priority: 95)             │         │
│  │  - 检查死亡                               │         │
│  │  - 发出person:died事件                 │         │
│  └─────────────────────────────────────────┘         │
│  ┌─────────────────────────────────────────┐         │
│  │ BirthSystem (priority: 90)              │         │
│  │  - 检查生育                               │         │
│  │  - 发出person:born事件                 │         │
│  └─────────────────────────────────────────┘         │
│  ...                                                  │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ EventBus (事件总线)                                   │
│  person:born   → StatisticsSystem监听 → 递增计数      │
│  person:died   → StatisticsSystem监听 → 递增计数      │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ syncToUI() - 同步数据到Stores                         │
│  1. 同步Person数据 → PersonStore                      │
│  2. 同步Statistics数据 → StatisticsStore              │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ React组件重新渲染                                     │
│  Canvas更新人口可视化                                 │
│  统计面板更新数字和图表                                │
└─────────────────────────────────────────────────────┘
```

### 2. 死亡数据流示例

```
┌─────────────────────────────────────────────────────┐
│ DeathSystem.update()                                 │
│  foreach entity in livingEntities:                   │
│    age = calculateAge(entity)                         │
│    deathRate = calculateDeathRate(age, health)      │
│    if random() < deathRate:                           │
│      handleDeath(entity)                               │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ DeathSystem.handleDeath()                            │
│  1. 更新BiologicalComponent                           │
│     isAlive = false                                   │
│     deathMonth = currentMonth                          │
│  2. 移除配偶关系                                       │
│  3. 发出person:died事件                                │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ EventBus.emit('person:died', {personId, age})        │
└────────────────┬────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────────┐  ┌─────────────────────┐
│ StatisticsSystem  │  │ GameEngine (已删除)  │
│ .totalDeaths++   │  │ 监听并递增计数     │
└─────────┬────────┘  └─────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────┐
│ syncToUI()                                            │
│  stats = statisticsSystem.getStatistics()             │
│  useStatisticsStore.updateRealtimeStats({            │
│    totalDeaths: stats.totalDeaths,                   │
│    ...                                               │
│  })                                                  │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ StatisticsStore (Zustand)                             │
│  statistics: {                                       │
│    totalDeaths: 11,  ← 更新后的值                    │
│    ...                                               │
│  }                                                    │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ React组件                                            │
│  - StatsPanel: 显示"总死亡: 11人"                    │
│  - PopulationCanvas: 显示"死亡: 11"                 │
└─────────────────────────────────────────────────────┘
```

---

## 设计模式

### 1. Container/Presentational模式

**目的**: 解耦组件与状态管理，提高可测试性和可复用性。

#### Presentational组件（展示组件）

**特点**:
- 纯UI渲染，无Store依赖
- 通过Props接收数据
- 通过回调函数触发操作

**示例**: `StatsPanel.tsx`
```typescript
export interface StatsPanelProps {
  statistics: GameStatistics;
  populationCount: number;
  currentYear: number;
  ageGroups: AgeGroupData;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  statistics,
  populationCount,
  currentYear,
  ageGroups,
}) => {
  // 纯渲染逻辑，无Store依赖
  return (
    <div className="stats-panel">
      <div>总人口: {populationCount}</div>
      <div>总出生: {statistics.totalBirths}</div>
      <div>总死亡: {statistics.totalDeaths}</div>
      {/* ... */}
    </div>
  );
};
```

#### Container组件（容器组件）

**特点**:
- 连接Store和Selector
- 准备数据传递给展示组件
- 处理用户交互

**示例**: `StatsPanelContainer.tsx`
```typescript
export const StatsPanelContainer: React.FC = () => {
  // 从Store获取数据
  const statistics = useStatisticsStore(state => state.statistics);
  const populationCount = usePopulationCount();
  const currentYear = useGameStateStore(state => state.currentYear);
  const ageGroups = useAgeGroups();

  // 计算派生数据
  const ageGroupData = useMemo(() => ({
    children: { name: '0-18岁', value: ageGroups.children, color: '#60a5fa' },
    adults: { name: '19-60岁', value: ageGroups.adults, color: '#34d399' },
    elderly: { name: '60+岁', value: ageGroups.elderly, color: '#fbbf24' },
  }), [ageGroups]);

  // 传递给展示组件
  return (
    <StatsPanel
      statistics={statistics}
      populationCount={populationCount}
      currentYear={currentYear}
      ageGroups={ageGroupData}
    />
  );
};
```

**优点**:
- ✅ 组件解耦：展示组件可以独立测试
- ✅ 可复用性：展示组件可以在不同上下文中使用
- ✅ 关注点分离：容器负责数据，展示负责UI

---

### 2. Selector模式

**目的**: 集中管理数据查询逻辑，提供记忆化和缓存。

#### 基础选择器函数

**文件**: `src/ecs/selectors/personSelectors.ts`

```typescript
export const personSelectors = {
  // 获取所有人
  getAllPeople: (state: PersonStore) => {
    return Array.from(state.entities.values());
  },

  // 获取存活人口
  getLivingPeople: (state: PersonStore) => {
    return Array.from(state.entities.values()).filter(p => p.isAlive);
  },

  // 计算年龄分组
  getAgeGroups: (state: PersonStore): AgeGroups => {
    const living = personSelectors.getLivingPeople(state);
    return {
      children: living.filter(p => p.age < 18).length,
      adults: living.filter(p => p.age >= 18 && p.age < 60).length,
      elderly: living.filter(p => p.age >= 60).length,
    };
  },

  // 计算男性/女性人数
  getMaleCount: (state: PersonStore) => {
    return personSelectors.getLivingPeople(state).filter(p => p.gender === 'male').length;
  },

  getFemaleCount: (state: PersonStore) => {
    return personSelectors.getLivingPeople(state).filter(p => p.gender === 'female').length;
  },
};
```

#### 记忆化Selector Hooks

```typescript
// 获取存活人口列表（记忆化）
export const useLivingPeople = (): Person[] => {
  const store = usePersonStore();
  return useMemo(
    () => personSelectors.getLivingPeople(store),
    [store.entities]
  );
};

// 获取人口计数（记忆化）
export const usePopulationCount = (): number => {
  const store = usePersonStore();
  return useMemo(
    () => store.count,
    [store.count]
  );
};

// 获取年龄分组（记忆化）
export const useAgeGroups = (): AgeGroups => {
  const store = usePersonStore();
  return useMemo(
    () => personSelectors.getAgeGroups(store),
    [store.entities]
  );
};
```

**优点**:
- ✅ **集中管理**: 所有查询逻辑在一处
- ✅ **自动缓存**: useMemo防止不必要的重新计算
- ✅ **易于测试**: 纯函数，易于单元测试
- ✅ **可复用**: 可以在任何组件中使用

---

### 3. 事件驱动架构

**目的**: 解耦系统间的依赖，支持一对多通信。

#### EventBus实现

**文件**: `src/ecs/core/EventBus.ts`

```typescript
export class EventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map();

  // 订阅事件
  on(event: string, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    
    // 返回取消订阅函数
    return () => this.off(event, handler);
  }

  // 取消订阅
  off(event: string, handler: EventHandler): void {
    this.listeners.get(event)?.delete(handler);
  }

  // 发出事件
  emit(event: string, payload: any): void {
    this.listeners.get(event)?.forEach(handler => handler(payload));
  }
  
  // 清除所有监听器
  clear(): void {
    this.listeners.clear();
  }
}
```

#### 使用示例

**发出事件** (`DeathSystem.ts`):
```typescript
handleDeath(world, personId, age, currentMonth): void {
  // 更新组件
  world.updateComponent(personId, ComponentType.Biological, {
    isAlive: false,
    deathMonth: currentMonth,
  });
  
  // 发出死亡事件
  world.getEventBus().emit('person:died', {
    personId,
    age,
    month: currentMonth,
  });
}
```

**监听事件** (`StatisticsSystem.ts`):
```typescript
initialize(world: World): void {
  const eventBus = world.getEventBus();
  
  // 监听出生事件
  eventBus.on('person:born', () => {
    this.statistics.totalBirths++;
  });
  
  // 监听死亡事件
  eventBus.on('person:died', () => {
    this.statistics.totalDeaths++;
  });
}
```

**优点**:
- ✅ **系统解耦**: DeathSystem不需要知道StatisticsSystem
- ✅ **一对多**: 一个事件可以被多个监听器处理
- ✅ **易扩展**: 添加新监听器不需要修改发出者

---

## 扩展指南

### 添加新资源类型

#### 场景：添加"电力"资源

1. **定义组件** (`ecs/components/ResourceComponents.ts`)
```typescript
export interface PowerComponent {
  production: number;
  consumption: number;
  storage: number;
}
```

2. **扩展Resources类型** (`store/types.ts`)
```typescript
export interface Resources {
  food: number;
  housing: number;
  medicine: number;
  education: number;
  money: number;
  power: number;  // 新增
  productionRate: {
    food: number;
    research: number;
    power: number;  // 新增
  };
}
```

3. **更新ResourceStore** (`ecs/stores/ResourceStore.ts`)
```typescript
interface ResourceState {
  resources: Resources;
  productionRates: ProductionRates;
  shortageStatus: ShortageStatus;
}

function createInitialResources(): Resources {
  return {
    food: 200,
    housing: 100,
    medicine: 100,
    education: 100,
    money: 1000,
    power: 150,  // 新增
    productionRate: {
      food: 0,
      research: 0,
      power: 0,  // 新增
    },
  };
}
```

4. **创建PowerSystem** (`ecs/systems/PowerSystem.ts`)
```typescript
export class PowerSystem extends System {
  readonly name = 'PowerSystem';
  readonly priority = 65;

  private engineersQuery: Query;

  constructor() {
    super();
    this.engineersQuery = new Query([
      ComponentType.Identity,
      ComponentType.Biological,
      ComponentType.Occupation,
    ]);
  }

  update(deltaTime: number): void {
    const world = this.getWorld();
    const entities = world.query(this.engineersQuery);

    let production = 0;
    let consumption = 0;

    entities.forEach(entity => {
      const occupation = world.getComponent<OccupationComponent>(
        entity.id,
        ComponentType.Occupation
      );

      if (occupation?.occupation === 'engineer') {
        production += 10;
      }

      consumption += 1; // 每人消耗1单位电力
    });

    // 发出资源更新事件
    world.getEventBus().emit('resources:updated', {
      resources: { power: production - consumption }
    });
  }
}
```

5. **注册到World** (`game/engine/GameEngine.ts`)
```typescript
private initializeECSSystems(): void {
  // ... 其他系统
  this.world.addSystem(new PowerSystem());
}
```

---

### 添加新UI组件

#### 场景：添加"电力管理"面板

1. **创建展示组件** (`components/power/PowerPanel.tsx`)
```typescript
export interface PowerPanelProps {
  powerProduction: number;
  powerConsumption: number;
  powerStorage: number;
  onToggle: () => void;
}

export const PowerPanel: React.FC<PowerPanelProps> = ({
  powerProduction,
  powerConsumption,
  powerStorage,
  onToggle,
}) => {
  return (
    <div className="power-panel">
      <h3>电力管理</h3>
      <div>产出: {powerProduction}</div>
      <div>消耗: {powerConsumption}</div>
      <div>存储: {powerStorage}</div>
      <button onClick={onToggle}>切换电力</button>
    </div>
  );
};
```

2. **创建容器组件** (`components/power/PowerPanelContainer.tsx`)
```typescript
export const PowerPanelContainer: React.FC = () => {
  const resources = useResourceStore(state => state.resources);
  const { togglePower } = usePowerStore();  // 假设有PowerStore

  const powerProduction = usePowerProduction();
  const powerConsumption = usePowerConsumption();

  return (
    <PowerPanel
      powerProduction={powerProduction}
      powerConsumption={powerConsumption}
      powerStorage={resources.power}
      onToggle={togglePower}
    />
  );
};
```

3. **添加到主布局** (`components/layout/GameLayout.tsx`)
```typescript
import { PowerPanelContainer } from '../power/PowerPanelContainer';

export const GameLayout: React.FC = () => {
  return (
    <div className="game-layout">
      <Header />
      <div className="main-content">
        <PopulationCanvasContainer />
        <PowerPanelContainer />  {/* 新增 */}
        {/* ... */}
      </div>
    </div>
  );
};
```

---

### 添加新System

#### 场景：添加"疾病传播系统"

1. **创建DiseaseSystem.ts** (`ecs/systems/DiseaseSystem.ts`)
```typescript
import { System } from '../core/System';
import type { World } from '../core/World';
import { Query } from '../core/Query';
import { ComponentType } from '../components/PersonComponents';

export class DiseaseSystem extends System {
  readonly name = 'DiseaseSystem';
  readonly priority = 85; // 在DeathSystem之前执行

  private livingPeopleQuery: Query;
  private infectionRate = 0.01; // 1%感染率

  constructor() {
    super();
    this.livingPeopleQuery = new Query([
      ComponentType.Identity,
      ComponentType.Biological,
    ]);
  }

  update(deltaTime: number): void {
    const world = this.getWorld();
    const entities = world.query(this.livingPeopleQuery);

    entities.forEach(entity => {
      const biological = world.getComponent<BiologicalComponent>(
        entity.id,
        ComponentType.Biological
      );

      if (!biological || !biological.isAlive) return;

      // 感染逻辑
      if (Math.random() < this.infectionRate) {
        biological.health -= 10;
        
        // 发出感染事件
        world.getEventBus().emit('person:infected', {
          personId: entity.id,
          health: biological.health,
        });
      }
    });
  }
}
```

2. **注册到World** (`game/engine/GameEngine.ts`)
```typescript
private initializeECSSystems(): void {
  // ... 其他系统
  this.world.addSystem(new DiseaseSystem());
}
```

---

## 性能优化策略

### 1. 记忆化Selector

**实现**: 使用React.useMemo缓存计算结果

```typescript
export const useAgeGroups = (): AgeGroups => {
  const store = usePersonStore();
  return useMemo(
    () => personSelectors.getAgeGroups(store),
    [store.entities]  // 依赖项
  );
};
```

**效果**: 避免每次渲染都重新计算年龄分组

### 2. 批量更新

**实现**: 在System中批量处理实体

```typescript
update(deltaTime: number): void {
  const entities = this.world.query(this.livingPeopleQuery);
  
  // 批量收集更新
  const updates: Array<{ id: string; health: number }> = [];
  
  entities.forEach(entity => {
    const biological = this.world.getComponent<BiologicalComponent>(
      entity.id,
      ComponentType.Biological
    );
    
    if (biological.health < 100) {
      updates.push({ id: entity.id, health: biological.health + 1 });
    }
  });
  
  // 批量应用更新
  updates.forEach(({ id, health }) => {
    this.world.updateComponent(id, ComponentType.Biological, { health });
  });
}
```

**效果**: 减少组件更新次数

### 3. 查询缓存

**实现**: World内部缓存查询结果

```typescript
private queryCache: Map<string, Entity[]> = new Map();

query(query: Query): Entity[] {
  const cacheKey = query.getCacheKey();
  
  // 检查缓存
  if (this.queryCache.has(cacheKey)) {
    return this.queryCache.get(cacheKey)!;
  }
  
  // 执行查询
  const result = query.execute(this);
  
  // 缓存结果
  this.queryCache.set(cacheKey, result);
  
  return result;
}

// 组件更新时清除缓存
private invalidateCache(): void {
  this.queryCache.clear();
}
```

**效果**: 避免重复查询实体

### 4. Canvas虚拟化

**实现**: 只渲染视口内的实体

```typescript
render(): void {
  const ctx = this.canvas.getContext('2d');
  if (!ctx) return;
  
  const { width, height } = this.canvas;
  
  // 只渲染视口内的实体
  const visibleEntities = this.people.filter(person => {
    const x = this.calculateX(person);
    const y = this.calculateY(person);
    return x >= 0 && x <= width && y >= 0 && y <= height;
  });
  
  visibleEntities.forEach(person => {
    this.drawPerson(ctx, person);
  });
}
```

**效果**: 大量实体时保持流畅渲染

### 5. 事件防抖

**实现**: 使用lodash.debounce或自定义实现

```typescript
import { debounce } from 'lodash';

class ResourceSystem {
  private debouncedUpdate = debounce(() => {
    this.updateResources();
  }, 100); // 100ms防抖
  
  update(deltaTime: number): void {
    // 计算资源变化
    this.debouncedUpdate();
  }
}
```

**效果**: 避免频繁的状态更新导致性能问题

---

## 最佳实践

### ✅ 推荐做法

1. **使用Selector访问Store**
   ```typescript
   // ✅ 推荐
   const livingPeople = useLivingPeople();
   
   // ❌ 不推荐
   const entities = usePersonStore(state => state.entities);
   const living = entities.filter(p => p.isAlive);
   ```

2. **Container/Presentational分离**
   ```typescript
   // ✅ 推荐
   // MyComponentContainer.tsx
   // MyComponent.tsx
   
   // ❌ 不推荐
   // MyComponent.tsx (直接连接Store)
   ```

3. **使用EventBus进行系统间通信**
   ```typescript
   // ✅ 推荐
   eventBus.emit('person:died', data);
   
   // ❌ 不推荐
   statisticsSystem.recordDeath();
   ```

4. **在System中批量处理**
   ```typescript
   // ✅ 推荐
   entities.forEach(entity => {
     // 处理逻辑
   });
   
   // ❌ 不推荐
   for (let i = 0; i < entities.length; i++) {
     // 处理逻辑
   }
   ```

### ❌ 避免的做法

1. **在展示组件中直接访问Store**
   ```typescript
   // ❌ 错误
   export const MyComponent: React.FC = () => {
     const data = usePersonStore(state => state.data);
     return <div>{data}</div>;
   };
   ```

2. **在System中直接调用setState**
   ```typescript
   // ❌ 错误
   class MySystem extends System {
     update(deltaTime: number): void {
       useSomeStore.setState({ ... });
     }
   }
   ```

3. **在组件中包含业务逻辑**
   ```typescript
   // ❌ 错误
   export const MyComponent: React.FC = () => {
     const [data, setData] = useState([]);
     
     useEffect(() => {
       // 复杂的业务逻辑
       const processed = complexLogic(data);
       setData(processed);
     }, [data]);
   };
   ```

---

## 版本历史

### v1.0.0 (2024-12-24)

**ECS架构重构完成**
- ✅ 完整的ECS架构实现
- ✅ 13个游戏系统
- ✅ 6个状态管理Store
- ✅ Container/Presentational组件模式
- ✅ Selector模式
- ✅ 事件驱动架构

**删除的旧代码**
- ❌ 单体gameStore（340行）
- ❌ 旧的ResourceSystem实现
- ❌ 所有空目录

**功能完整性**
- ✅ 人口系统（出生、死亡、婚姻、老龄化）
- ✅ 资源系统（食物、资金、教育、医疗）
- ✅ 政策系统（15项政策）
- ✅ 成就系统（10个成就）
- ✅ 统计可视化
- ✅ Canvas可视化

---

## 贡献指南

### 代码规范

1. **TypeScript**
   - 所有函数必须添加类型注解
   - 使用interface定义数据结构
   - 避免使用any类型

2. **组件命名**
   - 展示组件：`PascalCase`（如`StatsPanel`）
   - 容器组件：`PascalCase + Container`（如`StatsPanelContainer`）
   - Hook：`use`前缀（如`useLivingPeople`）

3. **文件组织**
   - 一个文件只导出一个主要类或组件
   - 使用index.ts统一导出
   - 相关功能放在同一目录

4. **注释规范**
   - 公共API必须添加JSDoc注释
   - 复杂逻辑添加说明注释
   - TODO标记待完成功能

### 提交规范

```
feat: 添加新功能
fix: 修复bug
docs: 更新文档
refactor: 重构代码
perf: 性能优化
test: 添加测试
```

---

## 许可证

MIT License

---

**文档维护**: 本文档应随项目更新保持最新  
**最后审查**: 2024-12-24  
**下次更新**: 重大架构变更时

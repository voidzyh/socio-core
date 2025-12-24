# 人口模拟器游戏 - ECS架构版本

一个基于 **ECS（Entity-Component-System）架构** 的人口模拟器游戏，使用 React + TypeScript + Vite 开发。

---

## 📋 目录

- [项目概述](#项目概述)
- [技术栈](#技术栈)
- [ECS架构](#ecs架构)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [核心概念](#核心概念)
- [开发指南](#开发指南)
- [性能优化](#性能优化)

---

## 项目概述

这是一个人口模拟器游戏，玩家需要管理人口、资源、政策和社会发展，应对各种随机事件，最终建立繁荣的社会。

### 游戏特色

- 🎮 **完整的人口系统**：出生、死亡、婚姻、老龄化
- 🌾 **资源管理**：食物、资金、教育、医疗、住房
- 📜 **政策系统**：15项不同类别的政策
- 🏆 **成就系统**：10个可解锁成就
- 📊 **数据可视化**：实时统计和图表
- 🎨 **Canvas可视化**：人口分布可视化

### 技术亮点

- ✅ **ECS架构**：高内聚低耦合的代码组织
- ✅ **React 18**：最新特性和性能优化
- ✅ **TypeScript**：完整的类型安全
- ✅ **Zustand**：轻量级状态管理
- ✅ **Container/Presentational模式**：组件解耦
- ✅ **Selector模式**：数据查询和派生
- ✅ **事件驱动架构**：系统间通过EventBus通信

---

## 技术栈

### 前端框架
- **React 18.3** - UI框架
- **TypeScript 5.6** - 类型安全
- **Vite 7.3** - 构建工具

### 状态管理
- **Zustand** - 轻量级状态管理库
- **6个领域Store** - Person、Resource、Statistics、GameState、Achievement、Event

### 可视化
- **HTML5 Canvas** - 人口可视化
- **Recharts** - 图表库（折线图、饼图）

### 架构模式
- **ECS (Entity-Component-System)** - 游戏架构模式
- **Container/Presentational** - 组件模式
- **Selector** - 数据选择模式
- **Event-Driven** - 事件驱动架构

---

## ECS架构

### 核心概念

ECS架构将游戏逻辑分为三个核心部分：

#### 1. Entity（实体）
实体只是唯一标识符，不包含数据和逻辑。

```typescript
type EntityID = string;

class Entity {
  readonly id: EntityID;
  readonly components: Set<ComponentType> = new Set();
}
```

#### 2. Component（组件）
组件是纯数据容器，不包含逻辑。

```typescript
// 身份组件
interface IdentityComponent {
  entityId: EntityID;
  gender: 'male' | 'female';
  birthMonth: number;
}

// 生物特征组件
interface BiologicalComponent {
  health: number;        // 0-100
  fertility: number;      // 0-1
  isAlive: boolean;
}
```

#### 3. System（系统）
系统包含逻辑，操作具有特定组件组合的实体。

```typescript
class DeathSystem extends System {
  readonly name = 'DeathSystem';
  readonly priority = 95;

  update(deltaTime: number): void {
    // 处理所有活人的死亡逻辑
    const entities = world.query(this.livingPeopleQuery);
    entities.forEach(entity => {
      // 计算死亡率
      // 判断是否死亡
    });
  }
}
```

#### 4. World（世界管理器）
协调所有系统、实体和组件。

```typescript
class World {
  private entities: Map<EntityID, Entity>;
  private components: Map<ComponentType, Map<EntityID, Component>>;
  private systems: SystemRegistry;
  private eventBus: EventBus;

  createEntity(): Entity;
  addComponent<T>(entityId: EntityID, type: ComponentType, component: T): void;
  query(query: Query): Entity[];
  update(deltaTime: number): void;
}
```

### 架构优势

- ✅ **高内聚低耦合**：系统、组件、实体职责清晰
- ✅ **易扩展**：添加新功能只需新增System和组件
- ✅ **高性能**：批量处理、查询缓存、记忆化选择器
- ✅ **易测试**：各层独立，可单元测试

---

## 项目结构

```
socio-core/
├── src/
│   ├── ecs/                          # ⭐ ECS架构核心
│   │   ├── core/                     # 核心功能
│   │   │   ├── Entity.ts            # 实体定义
│   │   │   ├── System.ts            # 系统基类
│   │   │   ├── Query.ts             # 查询系统
│   │   │   ├── World.ts             # 世界管理器
│   │   │   └── EventBus.ts          # 事件总线
│   │   │
│   │   ├── components/               # 组件定义
│   │   │   ├── PersonComponents.ts  # 人口组件（Identity, Biological等）
│   │   │   └── ResourceComponents.ts# 资源组件
│   │   │
│   │   ├── systems/                  # 系统实现（13个）
│   │   │   ├── PopulationSystem.ts  # 人口系统
│   │   │   ├── AgingSystem.ts       # 衰老系统
│   │   │   ├── BirthSystem.ts       # 生育系统
│   │   │   ├── DeathSystem.ts       # 死亡系统
│   │   │   ├── MarriageSystem.ts    # 婚姻系统
│   │   │   ├── ResourceSystem.ts    # 资源系统
│   │   │   ├── FoodSystem.ts        # 食物系统
│   │   │   ├── MoneySystem.ts       # 资金系统
│   │   │   ├── ShortageEffectSystem.ts # 短缺效果系统
│   │   │   ├── PolicySystem.ts      # 政策系统
│   │   │   ├── PolicyEffectSystem.ts # 政策效果系统
│   │   │   ├── StatisticsSystem.ts  # 统计系统
│   │   │   └── AchievementSystem.ts # 成就系统
│   │   │
│   │   ├── stores/                   # 状态管理（Zustand）
│   │   │   ├── PersonStore.ts       # 人口Store
│   │   │   ├── ResourceStore.ts     # 资源Store
│   │   │   ├── StatisticsStore.ts   # 统计Store
│   │   │   ├── AchievementStore.ts  # 成就Store
│   │   │   ├── EventStore.ts        # 事件Store
│   │   │   ├── GameStateStore.ts    # 游戏状态Store
│   │   │   └── PolicyStore.ts       # 政策Store
│   │   │
│   │   ├── selectors/                # 选择器层（数据查询和派生）
│   │   │   ├── personSelectors.ts   # 人口选择器
│   │   │   ├── resourceSelectors.ts # 资源选择器
│   │   │   └── policySelectors.ts   # 政策选择器
│   │   │
│   │   ├── utils/                    # ECS工具
│   │   │   ├── EntityFactory.ts     # 实体工厂
│   │   │   └── SystemRegistry.ts    # 系统注册表
│   │   │
│   │   └── events/                   # 事件定义
│   │       └── EventManager.ts      # 事件管理器
│   │
│   ├── components/                   # React组件
│   │   ├── canvas/                  # Canvas可视化
│   │   │   ├── PopulationCanvas.tsx          # 展示组件
│   │   │   └── PopulationCanvasContainer.tsx # 容器组件
│   │   │
│   │   ├── policies/                # 政策面板
│   │   │   ├── PolicyPanel.tsx
│   │   │   └── PolicyPanelContainer.tsx
│   │   │
│   │   ├── statistics/              # 统计面板
│   │   │   ├── StatsPanel.tsx
│   │   │   └── StatsPanelContainer.tsx
│   │   │
│   │   ├── achievements/            # 成就面板
│   │   │   └── AchievementsPanel.tsx
│   │   │
│   │   ├── events/                  # 事件通知
│   │   │   └── EventNotification.tsx
│   │   │
│   │   ├── gameending/              # 游戏结束
│   │   │   └── GameEndingModal.tsx
│   │   │
│   │   └── layout/                  # 布局组件
│   │       ├── Header.tsx
│   │       └── GameLayout.tsx
│   │
│   ├── game/                        # 游戏引擎
│   │   └── engine/
│   │       ├── GameEngine.ts        # 游戏引擎主类
│   │       ├── TimeSystem.ts        # 时间系统
│   │       ├── EventSystem.ts       # 事件系统
│   │       └── GameEndingSystem.ts  # 游戏结束系统
│   │
│   ├── constants/                   # 游戏常量
│   │   ├── game.ts                 # 游戏核心常量
│   │   ├── achievements.ts         # 成就定义
│   │   └── policies.ts             # 政策定义
│   │
│   ├── store/                       # 类型定义
│   │   ├── types.ts                # 核心类型接口
│   │   └── uiStore.ts              # UI状态Store
│   │
│   └── App.tsx                      # 应用入口
│
├── public/                          # 静态资源
├── index.html                       # HTML入口
├── vite.config.ts                   # Vite配置
├── tsconfig.json                    # TypeScript配置
├── package.json                     # 项目依赖
├── PROJECT_STRUCTURE.md             # 详细架构文档
└── README.md                        # 本文档
```

---

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

---

## 核心概念

### 数据流向

```
┌─────────────────────────────────────────────┐
│            World (ECS层)                    │
│  ├─ System.update() 处理游戏逻辑           │
│  └─ EventBus 事件通信                      │
└────────────────┬────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────┐
│         Stores (状态层 - Zustand)          │
│  ├─ PersonStore     # 人口数据             │
│  ├─ ResourceStore   # 资源数据             │
│  ├─ StatisticsStore # 统计数据             │
│  └─ 通过事件总线通信                        │
└────────────────┬────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────┐
│      Selectors (选择器层)                   │
│  ├─ personSelectors # 数据查询和派生       │
│  └─ 记忆化优化                               │
└────────────────┬────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────┐
│    Components (视图层 - React)              │
│  ├─ Container组件（连接Selector）          │
│  └─ Presentational组件（纯UI）             │
└────────────────┬────────────────────────────┘
                 ↓
           User Actions
                 ↓
      回到 World (ECS层)
```

### 关键设计模式

#### 1. Container/Presentational模式

```typescript
// 容器组件 - 连接Store
export const StatsPanelContainer: React.FC = () => {
  const statistics = useStatisticsStore(state => state.statistics);
  const ageGroups = useAgeGroups();
  
  return <StatsPanel statistics={statistics} ageGroups={ageGroups} />;
};

// 展示组件 - 纯UI
export const StatsPanel: React.FC<StatsPanelProps> = ({ statistics, ageGroups }) => {
  return <div>{/* 渲染逻辑 */}</div>;
};
```

**优点**：
- 组件解耦
- 易于测试
- 可复用性强

#### 2. Selector模式

```typescript
// 基础选择器
export const personSelectors = {
  getAllPeople: (state) => Array.from(state.entities.values()),
  getLivingPeople: (state) => Array.from(state.entities.values()).filter(p => p.isAlive),
};

// 记忆化Hook
export const useLivingPeople = (): Person[] => {
  const store = usePersonStore();
  return useMemo(() => personSelectors.getLivingPeople(store), [store.entities]);
};
```

**优点**：
- 集中管理数据查询逻辑
- 自动缓存和优化
- 易于扩展

#### 3. 事件驱动架构

```typescript
// System发出事件
world.getEventBus().emit('person:died', { personId, age });

// GameEngine监听事件
eventBus.on('person:died', () => {
  useStatisticsStore.getState().recordDeath();
});
```

**优点**：
- 系统解耦
- 易于扩展新功能
- 支持多个监听器

---

## 开发指南

### 添加新资源类型

1. **定义组件** (`ecs/components/ResourceComponents.ts`)
```typescript
export interface NewResourceComponent {
  amount: number;
  productionRate: number;
}
```

2. **添加到Store** (`ecs/stores/ResourceStore.ts`)
```typescript
interface Resources {
  newResource: number;
}
```

3. **在System中处理** (`ecs/systems/NewResourceSystem.ts`)
```typescript
class NewResourceSystem extends System {
  update(deltaTime: number): void {
    // 处理新资源逻辑
  }
}
```

4. **注册到World** (`game/engine/GameEngine.ts`)
```typescript
private initializeECSSystems(): void {
  this.world.addSystem(new NewResourceSystem());
}
```

### 添加新UI组件

1. **创建展示组件** (`components/newfeature/NewFeaturePanel.tsx`)
```typescript
export interface NewFeaturePanelProps {
  data: any;
}

export const NewFeaturePanel: React.FC<NewFeaturePanelProps> = ({ data }) => {
  return <div>{/* 纯渲染逻辑 */}</div>;
};
```

2. **创建容器组件** (`components/newfeature/NewFeaturePanelContainer.tsx`)
```typescript
export const NewFeaturePanelContainer: React.FC = () => {
  const data = useSomeSelector();
  
  return <NewFeaturePanel data={data} />;
};
```

3. **添加到布局** (`components/layout/GameLayout.tsx`)
```typescript
import { NewFeaturePanelContainer } from './newfeature/NewFeaturePanelContainer';

// 在JSX中添加
<NewFeaturePanelContainer />
```

### 添加新System

1. **创建System类** (`ecs/systems/NewSystem.ts`)
```typescript
import { System } from '../core/System';
import type { World } from '../core/World';

export class NewSystem extends System {
  readonly name = 'NewSystem';
  readonly priority = 50;

  initialize(world: World): void {
    // 初始化逻辑
  }

  update(deltaTime: number): void {
    // 每帧更新逻辑
  }
}
```

2. **注册到World** (`game/engine/GameEngine.ts`)
```typescript
private initializeECSSystems(): void {
  this.world.addSystem(new NewSystem());
}
```

### 调试技巧

1. **启用日志**：在System中添加`console.log`
2. **检查Store状态**：使用Zustand DevTools
3. **查看事件**：在EventBus中添加监听器
4. **性能分析**：使用React DevTools Profiler

---

## 性能优化

### 已实现的优化

1. **记忆化Selector**
```typescript
export const useLivingPeople = (): Person[] => {
  const store = usePersonStore();
  return useMemo(() => personSelectors.getLivingPeople(store), [store.entities]);
};
```

2. **批量更新**
```typescript
// 在System中批量处理实体
entities.forEach(entity => {
  // 批量操作
});
```

3. **查询缓存**
```typescript
// World内部缓存查询结果
private queryCache: Map<string, Entity[]> = new Map();
```

4. **Canvas虚拟化**
```typescript
// 只渲染视口内的实体
const visibleEntities = entities.filter(e => isInViewport(e));
```

5. **事件防抖**
```typescript
// 避免频繁的状态更新
const debouncedUpdate = debounce(update, 100);
```

### 性能指标

- ⚡ **60 FPS**：流畅的游戏循环
- 📦 **< 500KB**：打包后大小
- 🚀 **< 2s**：首屏加载时间
- 💾 **低内存占用**：高效的实体管理

---

## 游戏机制

### 人口系统

- **出生**：基于年龄、健康、生育率
- **死亡**：基于年龄、健康、医疗资源
- **婚姻**：基于年龄、性别比例
- **老龄化**：健康随年龄衰减

### 资源系统

- **食物**：农民生产，所有人消耗
- **资金**：工人生产，政策消耗
- **教育**：科学家生产，学生消耗
- **医疗**：老年人消耗，影响死亡率
- **住房**：影响人口上限

### 政策系统

- **生育政策**：影响出生率
- **医疗政策**：影响健康和死亡率
- **教育政策**：影响生产效率
- **经济政策**：影响资金收入

### 成就系统

- **人口破百**：人口达到100人
- **长寿之乡**：平均寿命超过80岁
- **经济繁荣**：资金超过10,000
- **百年基业**：游戏持续100年
- 等...

---

## 常见问题

### Q: 为什么使用ECS架构？

A: ECS架构提供：
- 清晰的职责分离
- 高性能的批量处理
- 易于扩展和维护
- 适合模拟类游戏

### Q: 如何调试游戏逻辑？

A: 
1. 查看浏览器控制台日志
2. 使用React DevTools查看组件状态
3. 使用Zustand DevTools查看Store状态
4. 在System中添加断点调试

### Q: 性能如何？

A: 
- 游戏循环稳定在60 FPS
- 支持1000+实体同时运行
- 优化的渲染和状态更新

---

## 贡献指南

### 代码风格

- 使用TypeScript类型注解
- 遵循Container/Presentational模式
- 使用Selector进行数据查询
- 添加适当的注释

### 提交规范

```
feat: 添加新功能
fix: 修复bug
docs: 更新文档
refactor: 重构代码
```

---

## 许可证

MIT License

---

## 联系方式

- GitHub Issues: [项目地址]
- Email: [联系邮箱]

---

**版本**: 1.0.0  
**最后更新**: 2024-12-24

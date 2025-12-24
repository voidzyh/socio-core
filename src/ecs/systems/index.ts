/**
 * ECS系统模块导出
 */

// 人口系统
export * from './PopulationSystem';
export * from './AgingSystem';
export * from './BirthSystem';
export * from './DeathSystem';
export * from './MarriageSystem';

// 资源系统
export * from './ResourceSystem';
// FoodSystem、MoneySystem、ShortageEffectSystem 已合并到 ResourceSystem
// export * from './FoodSystem';
// export * from './MoneySystem';
// export * from './ShortageEffectSystem';

// 政策系统
export * from './PolicySystem';
export * from './PolicyEffectSystem';

// 统计与成就
export * from './StatisticsSystem';
export * from './AchievementSystem';

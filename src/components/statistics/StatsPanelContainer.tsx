/**
 * StatsPanelContainer - 容器组件
 * 连接ECS Selectors和Store，提供数据给展示组件
 */

import React from 'react';
import { StatsPanel } from './StatsPanel';
import type { StatsPanelProps } from './StatsPanel';
import { useGameStateStore } from '../../ecs/stores/GameStateStore';
import { useAgeGroups, usePopulationCount, usePopulationStats } from '../../ecs/selectors/personSelectors';
import { useStatisticsStore } from '../../ecs/stores/StatisticsStore';

/**
 * StatsPanelContainer
 * 容器组件，负责数据获取和状态管理
 */
export const StatsPanelContainer: React.FC = () => {
  // 从ECS GameStateStore获取时间信息
  const { currentYear } = useGameStateStore();

  // 从ECS Selectors获取数据
  const ageGroups = useAgeGroups();
  const populationCount = usePopulationCount();
  const populationStats = usePopulationStats();

  // 从ECS StatisticsStore获取统计数据
  const statistics = useStatisticsStore(state => state.statistics);

  // 构造年龄组数据
  const ageGroupData = React.useMemo(() => ({
    children: { name: '0-18岁', value: ageGroups.children, color: '#60a5fa' },
    adults: { name: '19-60岁', value: ageGroups.adults, color: '#34d399' },
    elderly: { name: '60+岁', value: ageGroups.elderly, color: '#fbbf24' },
  }), [ageGroups]);

  // 更新实时统计数据
  React.useEffect(() => {
    useStatisticsStore.getState().updateRealtimeStats({
      avgAge: populationStats.avgAge,
      avgHealth: populationStats.avgHealth,
      avgEducation: populationStats.avgEducation,
    });
  }, [populationStats]);

  // 传递给展示组件的props
  const props: StatsPanelProps = {
    statistics,
    populationCount,
    currentYear,
    ageGroups: ageGroupData,
  };

  return <StatsPanel {...props} />;
};

export default StatsPanelContainer;

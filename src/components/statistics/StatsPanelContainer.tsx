/**
 * StatsPanelContainer - 容器组件
 * 连接Selector和Store，提供数据给展示组件
 */

import React, { useMemo } from 'react';
import { StatsPanel, StatsPanelProps } from './StatsPanel';
import { usePopulationCount, useAgeGroups, useLivingPeople } from '../../ecs/selectors/personSelectors';
import { useStatisticsStore } from '../../ecs/stores/StatisticsStore';
import { useGameStore } from '../../store/gameStore';

/**
 * StatsPanelContainer
 * 容器组件，负责数据获取和状态管理
 */
export const StatsPanelContainer: React.FC = () => {
  // 使用Selector获取数据
  const populationCount = usePopulationCount();
  const ageGroups = useAgeGroups();
  const livingPeople = useLivingPeople();

  // 统计数据
  const statistics = useStatisticsStore(state => state.statistics);

  // 当前年份（从gameStore获取，暂时保留）
  const { currentYear } = useGameStore();

  // 构造年龄组数据
  const ageGroupData = useMemo(() => ({
    children: { name: '0-18岁', value: ageGroups.children, color: '#60a5fa' },
    adults: { name: '19-60岁', value: ageGroups.adults, color: '#34d399' },
    elderly: { name: '60+岁', value: ageGroups.elderly, color: '#fbbf24' },
  }), [ageGroups]);

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

/**
 * StatsPanelContainer - 容器组件
 * 连接Selector和Store，提供数据给展示组件
 */

import React, { useMemo } from 'react';
import { StatsPanel } from './StatsPanel';
import type { StatsPanelProps } from './StatsPanel';
import { useGameStore } from '../../store/gameStore';

/**
 * StatsPanelContainer
 * 容器组件，负责数据获取和状态管理
 */
export const StatsPanelContainer: React.FC = () => {
  // 从gameStore获取数据（ECS暂未集成）
  const { people, populationCount, currentYear, statistics } = useGameStore();

  // 计算存活人口
  const livingPeople = useMemo(
    () => Array.from(people.values()).filter(p => p.isAlive),
    [people]
  );

  // 计算年龄组
  const ageGroups = useMemo(() => {
    const children = livingPeople.filter(p => p.age < 18).length;
    const adults = livingPeople.filter(p => p.age >= 18 && p.age < 60).length;
    const elderly = livingPeople.filter(p => p.age >= 60).length;

    return { children, adults, elderly };
  }, [livingPeople]);

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

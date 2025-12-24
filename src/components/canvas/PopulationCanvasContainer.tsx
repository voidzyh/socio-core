/**
 * PopulationCanvasContainer - 容器组件
 * 连接ECS Selectors和Store，提供数据给展示组件
 */

import React from 'react';
import { PopulationCanvas } from './PopulationCanvas';
import type { PopulationCanvasProps } from './PopulationCanvas';
import { useUIStore } from '../../store/uiStore';
import { useLivingPeople, usePopulationCount } from '../../ecs/selectors/personSelectors';
import { useStatisticsStore } from '../../ecs/stores/StatisticsStore';

/**
 * PopulationCanvasContainer
 * 容器组件，负责数据获取和状态管理
 */
export const PopulationCanvasContainer: React.FC = () => {
  // 从ECS Selectors获取数据
  const livingPeople = useLivingPeople();
  const populationCount = usePopulationCount();

  // 从StatisticsStore获取死亡人数（正确的数据源）
  const totalDeaths = useStatisticsStore(state => state.statistics.totalDeaths);

  // UI状态和交互
  const { hoveredPerson, selectPerson, hoverPerson } = useUIStore();

  // 传递给展示组件的props
  const props: PopulationCanvasProps = {
    people: livingPeople,
    livingCount: populationCount,
    deadCount: totalDeaths,
    onPersonSelect: selectPerson,
    onPersonHover: hoverPerson,
    hoveredPerson,
  };

  return <PopulationCanvas {...props} />;
};

export default PopulationCanvasContainer;

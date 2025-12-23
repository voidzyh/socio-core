/**
 * PopulationCanvasContainer - 容器组件
 * 连接ECS Selectors和Store，提供数据给展示组件
 */

import React from 'react';
import { PopulationCanvas } from './PopulationCanvas';
import type { PopulationCanvasProps } from './PopulationCanvas';
import { useUIStore } from '../../store/uiStore';
import { useLivingPeople, usePopulationCount, useMaleCount, useFemaleCount } from '../../ecs/selectors/personSelectors';

/**
 * PopulationCanvasContainer
 * 容器组件，负责数据获取和状态管理
 */
export const PopulationCanvasContainer: React.FC = () => {
  // 从ECS Selectors获取数据
  const livingPeople = useLivingPeople();
  const populationCount = usePopulationCount();
  const maleCount = useMaleCount();
  const femaleCount = useFemaleCount();

  // 计算死亡人数
  const deadCount = React.useMemo(
    () => maleCount + femaleCount - populationCount,
    [maleCount, femaleCount, populationCount]
  );

  // UI状态和交互
  const { hoveredPerson, selectPerson, hoverPerson } = useUIStore();

  // 传递给展示组件的props
  const props: PopulationCanvasProps = {
    people: livingPeople,
    livingCount: populationCount,
    deadCount,
    onPersonSelect: selectPerson,
    onPersonHover: hoverPerson,
    hoveredPerson,
  };

  return <PopulationCanvas {...props} />;
};

export default PopulationCanvasContainer;

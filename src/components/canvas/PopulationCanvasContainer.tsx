/**
 * PopulationCanvasContainer - 容器组件
 * 连接Selector和Store，提供数据给展示组件
 */

import React from 'react';
import { PopulationCanvas, PopulationCanvasProps } from './PopulationCanvas';
import { useUIStore } from '../../store/uiStore';
import { useLivingPeople, usePopulationCount } from '../../ecs/selectors/personSelectors';
import { usePersonStore } from '../../ecs/stores/PersonStore';

/**
 * PopulationCanvasContainer
 * 容器组件，负责数据获取和状态管理
 */
export const PopulationCanvasContainer: React.FC = () => {
  // 使用Selector获取数据
  const livingPeople = useLivingPeople();
  const populationCount = usePopulationCount();
  const { count: totalCount } = usePersonStore();

  // UI状态和交互
  const { hoveredPerson, selectPerson, hoverPerson } = useUIStore();

  // 计算死亡人数
  const deadCount = totalCount - populationCount;

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

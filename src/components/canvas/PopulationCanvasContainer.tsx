/**
 * PopulationCanvasContainer - 容器组件
 * 连接Selector和Store，提供数据给展示组件
 */

import React from 'react';
import { PopulationCanvas } from './PopulationCanvas';
import type { PopulationCanvasProps } from './PopulationCanvas';
import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';

/**
 * PopulationCanvasContainer
 * 容器组件，负责数据获取和状态管理
 */
export const PopulationCanvasContainer: React.FC = () => {
  // 从gameStore获取数据（ECS暂未集成）
  const { people, populationCount } = useGameStore();

  // 计算存活人口
  const livingPeople = React.useMemo(
    () => Array.from(people.values()).filter(p => p.isAlive),
    [people]
  );

  // 计算死亡人数
  const deadCount = people.size - populationCount;

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

/**
 * PolicyPanelContainer - 容器组件
 * 连接Selector和Store，提供数据给展示组件
 */

import React from 'react';
import { PolicyPanel } from './PolicyPanel';
import type { PolicyPanelProps } from './PolicyPanel';
import { useGameStore } from '../../store/gameStore';

/**
 * PolicyPanelContainer
 * 容器组件，负责数据获取和状态管理
 */
export const PolicyPanelContainer: React.FC = () => {
  // 从gameStore获取数据（ECS暂未集成）
  const { policies, activePolicies, resources } = useGameStore();

  // 处理政策激活
  const handleActivatePolicy = (policyId: string) => {
    useGameStore.getState().activatePolicy(policyId);
  };

  // 处理政策停用
  const handleDeactivatePolicy = (policyId: string) => {
    useGameStore.getState().deactivatePolicy(policyId);
  };

  // 传递给展示组件的props
  const props: PolicyPanelProps = {
    policies,
    activePolicies,
    resources,
    onActivatePolicy: handleActivatePolicy,
    onDeactivatePolicy: handleDeactivatePolicy,
  };

  return <PolicyPanel {...props} />;
};

export default PolicyPanelContainer;

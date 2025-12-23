/**
 * PolicyPanelContainer - 容器组件
 * 连接ECS Selectors和Store，提供数据给展示组件
 */

import React from 'react';
import { PolicyPanel } from './PolicyPanel';
import type { PolicyPanelProps } from './PolicyPanel';
import { usePolicyStore } from '../../ecs/stores/PolicyStore';
import { useResources } from '../../ecs/selectors/resourceSelectors';

/**
 * PolicyPanelContainer
 * 容器组件，负责数据获取和状态管理
 */
export const PolicyPanelContainer: React.FC = () => {
  // 从ECS Store获取数据
  const policies = usePolicyStore(state => state.policies);
  const activePolicies = usePolicyStore(state => state.activePolicies);
  const resources = useResources();

  // 处理政策激活
  const handleActivatePolicy = (policyId: string) => {
    usePolicyStore.getState().activatePolicy(policyId, resources.money);
  };

  // 处理政策停用
  const handleDeactivatePolicy = (policyId: string) => {
    usePolicyStore.getState().deactivatePolicy(policyId);
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

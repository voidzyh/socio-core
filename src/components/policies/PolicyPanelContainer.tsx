/**
 * PolicyPanelContainer - 容器组件
 * 连接Selector和Store，提供数据给展示组件
 */

import React from 'react';
import { PolicyPanel, PolicyPanelProps } from './PolicyPanel';
import { useAllPolicies, useActivePolicies } from '../../ecs/selectors/policySelectors';
import { useMoney } from '../../ecs/selectors/resourceSelectors';
import { usePolicyStore } from '../../ecs/stores/PolicyStore';
import { useResourceStore } from '../../ecs/stores/ResourceStore';

/**
 * PolicyPanelContainer
 * 容器组件，负责数据获取和状态管理
 */
export const PolicyPanelContainer: React.FC = () => {
  // 使用Selector获取数据
  const policies = useAllPolicies();
  const activePolicies = useActivePolicies();
  const money = useMoney();

  // 获取激活政策ID列表
  const { activePolicies: activePolicyIds } = usePolicyStore();
  const { resources } = useResourceStore();

  // 处理政策激活
  const handleActivatePolicy = (policyId: string) => {
    const result = usePolicyStore.getState().activatePolicy(policyId, money);
    if (result.success) {
      // 扣除资金
      useResourceStore.getState().updateResources({
        money: money - result.cost,
      });
    }
  };

  // 处理政策停用
  const handleDeactivatePolicy = (policyId: string) => {
    usePolicyStore.getState().deactivatePolicy(policyId);
  };

  // 传递给展示组件的props
  const props: PolicyPanelProps = {
    policies,
    activePolicies: activePolicyIds,
    resources,
    onActivatePolicy: handleActivatePolicy,
    onDeactivatePolicy: handleDeactivatePolicy,
  };

  return <PolicyPanel {...props} />;
};

export default PolicyPanelContainer;

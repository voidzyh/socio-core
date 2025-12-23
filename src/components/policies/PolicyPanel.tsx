import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { POLICY_CATEGORY_NAMES, POLICIES_BY_CATEGORY } from '../../constants/policies';
import './PolicyPanel.css';

export const PolicyPanel: React.FC = () => {
  const { policies, activePolicies, resources, activatePolicy, deactivatePolicy } = useGameStore();

  const handleTogglePolicy = (policyId: string) => {
    const isActive = activePolicies.includes(policyId);
    if (isActive) {
      deactivatePolicy(policyId);
    } else {
      activatePolicy(policyId);
    }
  };

  return (
    <div className="policy-panel">
      <h2 className="panel-title">政策管理</h2>

      <div className="policy-budget">
        <span className="budget-label">可用资金:</span>
        <span className="budget-value">{Math.floor(resources.money)} 💰</span>
      </div>

      {Object.entries(POLICIES_BY_CATEGORY).map(([category, categoryPolicies]) => (
        <div key={category} className="policy-category">
          <h3 className="category-title">{POLICY_CATEGORY_NAMES[category as keyof typeof POLICY_CATEGORY_NAMES]}</h3>

          <div className="policy-list">
            {categoryPolicies.map((policy) => {
              const isActive = activePolicies.includes(policy.id);
              const canAfford = resources.money >= policy.cost;

              return (
                <div
                  key={policy.id}
                  className={`policy-card ${isActive ? 'active' : ''} ${!canAfford && !isActive ? 'disabled' : ''}`}
                  onClick={() => canAfford && handleTogglePolicy(policy.id)}
                >
                  <div className="policy-header">
                    <h4 className="policy-name">{policy.name}</h4>
                    {isActive && <span className="active-badge">✓ 已启用</span>}
                  </div>

                  <p className="policy-description">{policy.description}</p>

                  <div className="policy-meta">
                    <span className="policy-cost">💰 {policy.cost}</span>
                    {policy.duration && (
                      <span className="policy-duration">⏱ {Math.floor(policy.duration / 12)}年</span>
                    )}
                  </div>

                  <div className="policy-effects">
                    {policy.effects.fertilityRate && (
                      <span className="effect-tag">
                        生育率 {policy.effects.fertilityRate > 0 ? '+' : ''}
                        {Math.floor(policy.effects.fertilityRate * 100)}%
                      </span>
                    )}
                    {policy.effects.deathRate && (
                      <span className="effect-tag">
                        死亡率 {policy.effects.deathRate > 0 ? '+' : ''}
                        {Math.floor(policy.effects.deathRate * 100)}%
                      </span>
                    )}
                    {policy.effects.education && (
                      <span className="effect-tag">教育 +{policy.effects.education}</span>
                    )}
                    {policy.effects.happiness && (
                      <span className="effect-tag">
                        幸福度 {policy.effects.happiness > 0 ? '+' : ''}
                        {policy.effects.happiness}
                      </span>
                    )}
                    {policy.effects.economy && (
                      <span className="effect-tag">
                        经济 {policy.effects.economy > 0 ? '+' : ''}
                        {Math.floor(policy.effects.economy * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

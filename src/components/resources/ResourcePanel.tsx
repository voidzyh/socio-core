import React from 'react';
import { useResources } from '../../ecs/selectors/resourceSelectors';
import { UI_DISPLAY } from '../../constants/balance';
import './ResourcePanel.css';

export const ResourcePanel: React.FC = () => {
  const resources = useResources();

  return (
    <div className="resource-panel">
      <div className="panel-header">
        <h2 className="panel-title">📦 资源详情</h2>
      </div>

      <div className="resource-content">
        {/* 食物 */}
        <section className="resource-section">
          <h3 className="section-title">🍞 食物</h3>
          <div className="resource-details">
            <div className="detail-row">
              <span className="detail-label">当前储备:</span>
              <span className="detail-value">{Math.floor(resources.food)}</span>
            </div>
            {resources.productionRate && (
              <>
                <div className="detail-row">
                  <span className="detail-label">月度变化:</span>
                  <span className={`detail-value ${resources.productionRate.food >= 0 ? 'positive' : 'negative'}`}>
                    {resources.productionRate.food >= 0 ? '+' : ''}{Math.floor(resources.productionRate.food)}
                  </span>
                </div>
                <div className="detail-info">
                  <small>📊 产出 - 消耗 = 净变化</small>
                </div>
              </>
            )}
          </div>
        </section>

        {/* 资金 */}
        <section className="resource-section">
          <h3 className="section-title">💰 资金</h3>
          <div className="resource-details">
            <div className="detail-row">
              <span className="detail-label">当前储备:</span>
              <span className="detail-value">{Math.floor(resources.money)}</span>
            </div>
            {resources.productionRate && (
              <>
                <div className="detail-row">
                  <span className="detail-label">月度变化:</span>
                  <span className={`detail-value ${resources.productionRate.money >= 0 ? 'positive' : 'negative'}`}>
                    {resources.productionRate.money >= 0 ? '+' : ''}{Math.floor(resources.productionRate.money)}
                  </span>
                </div>
                <div className="detail-info">
                  <small>💡 收入来源: 税收、职业产出</small>
                  <small>💡 支出项目: 公共服务、失业救济、医疗、教育</small>
                </div>
              </>
            )}
          </div>
        </section>

        {/* 其他资源 */}
        <section className="resource-section">
          <h3 className="section-title">📦 其他资源</h3>
          <div className="resource-details">
            <div className="detail-row">
              <span className="detail-label">🏠 住房:</span>
              <span className="detail-value">{Math.floor(resources.housing)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">💊 医疗:</span>
              <span className="detail-value">{Math.floor(resources.medicine)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">📚 教育:</span>
              <span className="detail-value">{Math.floor(resources.education)}</span>
            </div>
          </div>
        </section>

        {/* 资源说明 */}
        <section className="resource-section info-section">
          <h3 className="section-title">📖 资源说明</h3>
          <div className="info-content">
            <div className="info-item">
              <strong>食物</strong>: {UI_DISPLAY.RESOURCE_DESCRIPTIONS.FOOD}
            </div>
            <div className="info-item">
              <strong>资金</strong>: {UI_DISPLAY.RESOURCE_DESCRIPTIONS.MONEY}
            </div>
            <div className="info-item">
              <strong>教育</strong>: {UI_DISPLAY.RESOURCE_DESCRIPTIONS.EDUCATION}
            </div>
            <div className="info-item">
              <strong>医疗</strong>: {UI_DISPLAY.RESOURCE_DESCRIPTIONS.MEDICINE}
            </div>
            <div className="info-item">
              <strong>健康</strong>: {UI_DISPLAY.RESOURCE_DESCRIPTIONS.HEALTH}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

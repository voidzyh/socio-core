import React from 'react';
import type { GameStatistics } from '../../store/types';
import './GameTimeline.css';

interface EventHistoryEntry {
  id: string;
  year: number;
  month: number;
  message: string;
  timestamp: number;
}

interface GameTimelineProps {
  statistics: GameStatistics;
  eventHistory: EventHistoryEntry[];
  survivalYears: number;
}

export const GameTimeline: React.FC<GameTimelineProps> = ({
  statistics,
  eventHistory,
  survivalYears,
}) => {
  // 按年份组织事件
  const getEventsByYear = (year: number): string[] => {
    return eventHistory
      .filter(event => event.year === year)
      .map(event => event.message);
  };

  // 获取该年的资源数据
  const getResourceByYear = (year: number) => {
    const resourceData = statistics.resourceHistory.find(r => r.year === year);
    return resourceData?.resources;
  };

  // 计算人口变化
  const getPopulationChange = (year: number): number => {
    const current = statistics.populationHistory.find(p => p.year === year)?.count || 0;
    const prev = statistics.populationHistory.find(p => p.year === year - 1)?.count || current;
    return current - prev;
  };

  // 生成年份列表
  const years = Array.from({ length: survivalYears }, (_, i) => i + 1);

  return (
    <div className="game-timeline">
      <h3 className="timeline-title">📊 历史时间轴</h3>

      <div className="timeline-container">
        {years.map(year => {
          const population = statistics.populationHistory.find(p => p.year === year)?.count || 0;
          const popChange = getPopulationChange(year);
          const resources = getResourceByYear(year);
          const events = getEventsByYear(year);

          return (
            <div key={year} className="timeline-year">
              <div className="year-header">
                <span className="year-number">📅 第{year}年</span>
                <span className={`year-pop-change ${popChange >= 0 ? 'positive' : 'negative'}`}>
                  {popChange >= 0 ? '+' : ''}{popChange}人
                </span>
              </div>

              <div className="year-content">
                <div className="year-stats">
                  <div className="stat-item">
                    <span className="stat-label">👥 人口:</span>
                    <span className="stat-value">{population}</span>
                  </div>

                  {resources && (
                    <>
                      <div className="stat-item">
                        <span className="stat-label">🍞 食物:</span>
                        <span className={`stat-value ${resources.food <= 0 ? 'danger' : resources.food < 50 ? 'warning' : ''}`}>
                          {Math.floor(resources.food)}
                        </span>
                      </div>

                      <div className="stat-item">
                        <span className="stat-label">💰 资金:</span>
                        <span className={`stat-value ${resources.money < 0 ? 'danger' : resources.money < 200 ? 'warning' : ''}`}>
                          {Math.floor(resources.money)}
                        </span>
                      </div>

                      <div className="stat-item">
                        <span className="stat-label">💊 医疗:</span>
                        <span className={`stat-value ${resources.medicine <= 0 ? 'danger' : ''}`}>
                          {Math.floor(resources.medicine)}
                        </span>
                      </div>

                      <div className="stat-item">
                        <span className="stat-label">📚 教育:</span>
                        <span className="stat-value">{Math.floor(resources.education)}</span>
                      </div>
                    </>
                  )}
                </div>

                {events.length > 0 && (
                  <div className="year-events">
                    {events.map((event, idx) => (
                      <div key={idx} className="event-item">
                        📢 {event}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

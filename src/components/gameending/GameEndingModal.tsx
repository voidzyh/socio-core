import React, { useState } from 'react';
import { useGameStateStore } from '../../ecs/stores/GameStateStore';
import { useStatisticsStore } from '../../ecs/stores/StatisticsStore';
import { useEventStore } from '../../ecs/stores/EventStore';
import { GameTimeline } from '../timeline/GameTimeline';
import { GameTrendCharts } from '../timeline/GameTrendCharts';
import './GameEndingModal.css';

type TabType = 'score' | 'timeline' | 'charts';

export const GameEndingModal: React.FC = () => {
  const { gameEnding, resetGame } = useGameStateStore();
  const statistics = useStatisticsStore((state) => state.statistics);
  const eventHistory = useEventStore((state) => state.history);
  const [activeTab, setActiveTab] = useState<TabType>('score');

  if (!gameEnding) return null;

  const isVictory = ['perfect', 'excellent', 'good', 'acceptable'].includes(gameEnding.type);
  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'S': return '#fbbf24';
      case 'A': return '#a78bfa';
      case 'B': return '#60a5fa';
      case 'C': return '#34d399';
      case 'D': return '#94a3b8';
      default: return '#94a3b8';
    }
  };

  const getRankLabel = (rank: string) => {
    switch (rank) {
      case 'S': return 'S级 - 完美';
      case 'A': return 'A级 - 优秀';
      case 'B': return 'B级 - 良好';
      case 'C': return 'C级 - 及格';
      case 'D': return 'D级 - 失败';
      default: return rank;
    }
  };

  return (
    <div className="ending-overlay">
      <div className={`ending-modal ${isVictory ? 'victory' : 'defeat'}`}>
        <div className="ending-header">
          <h1 className="ending-title">{gameEnding.title}</h1>
          {isVictory && (
            <div
              className="ending-rank"
              style={{ color: getRankColor(gameEnding.score.rank) }}
            >
              {getRankLabel(gameEnding.score.rank)}
            </div>
          )}
        </div>

        <div className="ending-description">
          {gameEnding.description}
        </div>

        {/* 标签页切换 */}
        <div className="ending-tabs">
          <button
            className={`tab-button ${activeTab === 'score' ? 'active' : ''}`}
            onClick={() => setActiveTab('score')}
          >
            📊 评分
          </button>
          <button
            className={`tab-button ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            📅 时间轴
          </button>
          <button
            className={`tab-button ${activeTab === 'charts' ? 'active' : ''}`}
            onClick={() => setActiveTab('charts')}
          >
            📈 趋势图
          </button>
        </div>

        {/* 评分详情 */}
        {activeTab === 'score' && isVictory && (
          <div className="ending-score">
            <h3 className="score-title">📊 评分详情</h3>

            <div className="score-dimensions">
              <div className="score-item">
                <span className="score-label">👥 人口</span>
                <div className="score-bar">
                  <div
                    className="score-fill"
                    style={{ width: `${gameEnding.score.dimensions.population}%` }}
                  />
                  <span className="score-value">{gameEnding.score.dimensions.population}/20</span>
                </div>
              </div>

              <div className="score-item">
                <span className="score-label">💰 经济</span>
                <div className="score-bar">
                  <div
                    className="score-fill"
                    style={{ width: `${gameEnding.score.dimensions.economy}%` }}
                  />
                  <span className="score-value">{gameEnding.score.dimensions.economy}/20</span>
                </div>
              </div>

              <div className="score-item">
                <span className="score-label">😊 幸福度</span>
                <div className="score-bar">
                  <div
                    className="score-fill"
                    style={{ width: `${gameEnding.score.dimensions.happiness}%` }}
                  />
                  <span className="score-value">{gameEnding.score.dimensions.happiness}/20</span>
                </div>
              </div>

              <div className="score-item">
                <span className="score-label">❤️ 健康</span>
                <div className="score-bar">
                  <div
                    className="score-fill"
                    style={{ width: `${gameEnding.score.dimensions.health}%` }}
                  />
                  <span className="score-value">{gameEnding.score.dimensions.health}/20</span>
                </div>
              </div>

              <div className="score-item">
                <span className="score-label">📚 教育</span>
                <div className="score-bar">
                  <div
                    className="score-fill"
                    style={{ width: `${gameEnding.score.dimensions.education}%` }}
                  />
                  <span className="score-value">{gameEnding.score.dimensions.education}/20</span>
                </div>
              </div>
            </div>

            <div className="score-summary">
              <div className="summary-item">
                <span className="summary-label">总分:</span>
                <span className="summary-value">{gameEnding.score.totalScore}/100</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">生存年数:</span>
                <span className="summary-value">{gameEnding.score.survivalYears} 年</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">解锁成就:</span>
                <span className="summary-value">{gameEnding.score.achievements} 个</span>
              </div>
            </div>
          </div>
        )}

        {/* 失败信息 */}
        {activeTab === 'score' && !isVictory && (
          <div className="ending-stats">
            <div className="stat-item">
              <span className="stat-label">生存年数:</span>
              <span className="stat-value">{gameEnding.score.survivalYears} 年</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">最终人口:</span>
              <span className="stat-value">{gameEnding.score.finalPopulation} 人</span>
            </div>
          </div>
        )}

        {/* 时间轴 */}
        {activeTab === 'timeline' && (
          <GameTimeline
            statistics={statistics}
            eventHistory={eventHistory}
            survivalYears={gameEnding.score.survivalYears}
          />
        )}

        {/* 趋势图 */}
        {activeTab === 'charts' && (
          <GameTrendCharts statistics={statistics} />
        )}

        <div className="ending-actions">
          <button className="btn-restart" onClick={resetGame}>
            🔄 重新开始
          </button>
          <button className="btn-share" onClick={() => alert('分享功能开发中...')}>
            📤 分享成绩
          </button>
        </div>
      </div>
    </div>
  );
};

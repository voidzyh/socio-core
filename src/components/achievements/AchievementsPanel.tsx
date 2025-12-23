import React from 'react';
import { useGameStore } from '../../store/gameStore';
import './AchievementsPanel.css';

export const AchievementsPanel: React.FC = () => {
  const { achievements, unlockedAchievements } = useGameStore();

  const lockedCount = achievements.length - unlockedAchievements.length;

  return (
    <div className="achievements-panel">
      <h2 className="panel-title">成就系统</h2>

      <div className="achievement-summary">
        <div className="summary-item">
          <span className="summary-label">已解锁:</span>
          <span className="summary-value">{unlockedAchievements.length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">未解锁:</span>
          <span className="summary-value">{lockedCount}</span>
        </div>
      </div>

      <div className="achievement-list">
        {achievements.map((achievement) => {
          const isUnlocked = unlockedAchievements.includes(achievement.id);

          return (
            <div
              key={achievement.id}
              className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}
            >
              <div className="achievement-icon">{achievement.icon}</div>

              <div className="achievement-info">
                <h4 className="achievement-name">{achievement.name}</h4>
                <p className="achievement-description">{achievement.description}</p>
              </div>

              {isUnlocked && (
                <div className="achievement-status">
                  <span className="status-badge">✓</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

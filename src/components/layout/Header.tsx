import React from 'react';
import { useGameStateStore } from '../../ecs/stores/GameStateStore';
import { usePopulationCount } from '../../ecs/selectors/personSelectors';
import { useResources } from '../../ecs/selectors/resourceSelectors';
import { useUIStore } from '../../store/uiStore';
import './Header.css';

export const Header: React.FC = () => {
  const { currentYear, currentMonth, gameSpeed, setGameSpeed, pauseGame, startGame } = useGameStateStore();
  const populationCount = usePopulationCount();
  const resources = useResources();
  const { togglePolicyPanel, toggleStatsPanel, toggleAchievementsPanel } = useUIStore();

  const speeds: Array<'paused' | '1x' | '2x' | '5x' | '10x'> = ['paused', '1x', '2x', '5x', '10x'];

  const handleSpeedChange = (speed: 'paused' | '1x' | '2x' | '5x' | '10x') => {
    if (speed === 'paused') {
      pauseGame();
    } else {
      if (gameSpeed === 'paused') {
        startGame();
      }
      setGameSpeed(speed);
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="game-title">人口模拟器</h1>
        <div className="time-display">
          <span className="year">{currentYear}年</span>
          <span className="month">{currentMonth + 1}月</span>
        </div>
      </div>

      <div className="header-center">
        <div className="speed-controls">
          {speeds.map((speed) => (
            <button
              key={speed}
              className={`speed-btn ${gameSpeed === speed ? 'active' : ''}`}
              onClick={() => handleSpeedChange(speed)}
            >
              {speed === 'paused' ? '⏸' : speed}
            </button>
          ))}
        </div>
      </div>

      <div className="header-right">
        <div className="resource-summary">
          <span className="resource-item">👥 {populationCount}</span>
          <span className="resource-item">🍞 {Math.floor(resources.food)}</span>
          <span className="resource-item">💰 {Math.floor(resources.money)}</span>
        </div>

        <div className="panel-toggles">
          <button onClick={togglePolicyPanel} title="政策">📋</button>
          <button onClick={toggleStatsPanel} title="统计">📊</button>
          <button onClick={toggleAchievementsPanel} title="成就">🏆</button>
        </div>
      </div>
    </header>
  );
};

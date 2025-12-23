import React from 'react';
import { Header } from './Header';
import { useUIStore } from '../../store/uiStore';
import { PolicyPanel } from '../policies/PolicyPanel';
import { StatsPanel } from '../statistics/StatsPanel';
import { AchievementsPanel } from '../achievements/AchievementsPanel';
import { EventNotification } from '../events/EventNotification';
import './GameLayout.css';

interface GameLayoutProps {
  children: React.ReactNode;
}

export const GameLayout: React.FC<GameLayoutProps> = ({ children }) => {
  const { showPolicyPanel, showStatsPanel, showAchievementsPanel } = useUIStore();

  return (
    <div className="game-layout">
      <Header />

      <main className="game-main">
        <div className="game-content">{children}</div>

        {/* 侧边面板 */}
        <aside className="game-sidebar">
          {showPolicyPanel && <PolicyPanel />}
          {showStatsPanel && <StatsPanel />}
          {showAchievementsPanel && <AchievementsPanel />}
        </aside>
      </main>

      {/* 事件通知 */}
      <EventNotification />
    </div>
  );
};

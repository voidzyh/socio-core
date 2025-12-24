import React, { useEffect, useRef } from 'react';
import { GameEngine } from './game/engine/GameEngine';
import { GameLayout } from './components/layout/GameLayout';
import { PopulationCanvasContainer } from './components/canvas/PopulationCanvasContainer';
import { GameEndingModal } from './components/gameending/GameEndingModal';
import { useGameStateStore } from './ecs/stores/GameStateStore';
import { useUIStore } from './store/uiStore';
import './index.css';

function App() {
  const gameEngineRef = useRef<GameEngine | null>(null);
  const { gameSpeed, isGameOver, gameStarted, startGame, totalMonths } = useGameStateStore();
  const { addNotification } = useUIStore();

  // 追踪上次的totalMonths，用于检测游戏重置
  const lastTotalMonthsRef = useRef<number>(0);

  // 初始化游戏引擎
  useEffect(() => {
    gameEngineRef.current = new GameEngine();

    return () => {
      gameEngineRef.current?.destroy();
    };
  }, []);

  // 根据游戏速度控制引擎
  useEffect(() => {
    if (!gameEngineRef.current) return;

    // 设置游戏引擎速度
    gameEngineRef.current.setGameSpeed(gameSpeed);

    if (gameStarted && gameSpeed !== 'paused' && !isGameOver) {
      gameEngineRef.current.start();
    } else {
      gameEngineRef.current?.pause();
    }
  }, [gameSpeed, gameStarted, isGameOver]);

  // 游戏结束时通知
  useEffect(() => {
    if (isGameOver) {
      addNotification({
        message: '游戏结束！人口已全部灭亡。',
        type: 'error',
      });
    }
  }, [isGameOver, addNotification]);

  // 监听游戏重置（totalMonths从非0变为0）
  useEffect(() => {
    if (lastTotalMonthsRef.current > 0 && totalMonths === 0) {
      // 游戏已重置，重新初始化ECS
      gameEngineRef.current?.handleGameReset();
    }
    lastTotalMonthsRef.current = totalMonths;
  }, [totalMonths]);

  const handleStartGame = () => {
    startGame();
    addNotification({
      message: '游戏开始！点击速度按钮控制时间流逝。',
      type: 'info',
    });
  };

  return (
    <GameLayout>
      {!gameStarted ? (
        <div className="start-screen">
          <div className="start-content">
            <h1 className="start-title">人口模拟器</h1>
            <p className="start-description">
              通过政策干预，管理人口增长、资源分配和社会发展
            </p>
            <div className="start-features">
              <div className="feature-item">👥 动态人口系统</div>
              <div className="feature-item">📊 数据可视化</div>
              <div className="feature-item">📋 政策管理</div>
              <div className="feature-item">🏆 成就系统</div>
            </div>
            <button className="start-button" onClick={handleStartGame}>
              开始游戏
            </button>
          </div>
        </div>
      ) : (
        <PopulationCanvasContainer />
      )}

      {/* 游戏结局界面 */}
      <GameEndingModal />
    </GameLayout>
  );
}

export default App;

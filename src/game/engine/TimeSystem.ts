import { SPEED_MULTIPLIERS } from '../../constants/game';
import type { GameSpeed } from '../../store/types';

export class TimeSystem {
  private lastUpdateTime: number | null = null;
  private accumulatedTime: number = 0;
  private tickInterval: number = 1000; // 基础tick间隔（毫秒）
  private gameSpeed: GameSpeed = 'paused';
  private onTick?: () => void;

  constructor(onTick?: () => void) {
    this.onTick = onTick;
  }

  setGameSpeed(speed: GameSpeed): void {
    this.gameSpeed = speed;
  }

  getGameSpeed(): GameSpeed {
    return this.gameSpeed;
  }

  update(currentTime: number): void {
    // 第一次更新时初始化 lastUpdateTime
    if (this.lastUpdateTime === null) {
      this.lastUpdateTime = currentTime;
    }

    if (this.gameSpeed === 'paused') {
      this.lastUpdateTime = currentTime;
      return;
    }

    const deltaTime = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;

    const speed = SPEED_MULTIPLIERS[this.gameSpeed];
    this.accumulatedTime += deltaTime * speed;

    while (this.accumulatedTime >= this.tickInterval) {
      this.onTick?.();
      this.accumulatedTime -= this.tickInterval;
    }
  }

  reset(): void {
    this.lastUpdateTime = null;
    this.accumulatedTime = 0;
  }
}

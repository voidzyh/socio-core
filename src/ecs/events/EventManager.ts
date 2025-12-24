/**
 * ECS事件管理器
 * 处理UI操作并将其转发到ECS Systems
 */

import type { World } from '../core/World';
import { ComponentType } from '../components/PersonComponents';

export class EventManager {
  private world: World;

  constructor(world: World) {
    this.world = world;
  }

  /**
   * 处理政策激活
   */
  handlePolicyActivation(policyId: string): void {
    // 通过EventBus通知PolicySystem
    const eventBus = this.world.getEventBus();
    eventBus.emit('policy:activate', { policyId });
  }

  /**
   * 处理政策停用
   */
  handlePolicyDeactivation(policyId: string): void {
    const eventBus = this.world.getEventBus();
    eventBus.emit('policy:deactivate', { policyId });
  }

  /**
   * 处理游戏速度变更
   */
  handleGameSpeedChange(speed: 'paused' | '1x' | '2x' | '5x' | '10x'): void {
    const eventBus = this.world.getEventBus();
    eventBus.emit('game:speedChange', { speed });
  }

  /**
   * 处理游戏暂停
   */
  handleGamePause(): void {
    const eventBus = this.world.getEventBus();
    eventBus.emit('game:pause', {});
  }

  /**
   * 处理游戏开始
   */
  handleGameStart(): void {
    const eventBus = this.world.getEventBus();
    eventBus.emit('game:start', {});
  }

  /**
   * 处理游戏重置
   */
  handleGameReset(): void {
    const eventBus = this.world.getEventBus();
    eventBus.emit('game:reset', {});
  }

  /**
   * 处理实体选择（用于查看详情）
   */
  handleEntitySelect(entityId: string): void {
    const eventBus = this.world.getEventBus();
    eventBus.emit('entity:selected', { entityId });
  }

  /**
   * 处理职业变更
   */
  handleOccupationChange(entityId: string, newOccupation: string): void {
    const eventBus = this.world.getEventBus();
    eventBus.emit('entity:occupationChange', { entityId, newOccupation });
  }

  /**
   * 处理手动生育（调试功能）
   */
  handleManualBirth(motherId: string, fatherId: string): void {
    const eventBus = this.world.getEventBus();
    eventBus.emit('population:manualBirth', { motherId, fatherId });
  }

  /**
   * 处理手动死亡（调试功能）
   */
  handleManualDeath(entityId: string): void {
    const eventBus = this.world.getEventBus();
    eventBus.emit('population:manualDeath', { entityId });
  }

  /**
   * 批量更新实体组件
   */
  handleBatchEntityUpdates(updates: Array<{ entityId: string; componentType: ComponentType; data: any }>): void {
    const eventBus = this.world.getEventBus();
    eventBus.emit('entities:batchUpdate', { updates });
  }
}

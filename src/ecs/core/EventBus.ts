/**
 * ECS - EventBus（事件总线）
 * 实现发布-订阅模式，用于系统间通信
 */

type EventHandler = (payload: any) => void;

/**
 * 事件总线
 * 用于解耦系统之间的依赖关系
 */
export class EventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map();

  /**
   * 订阅事件
   * @param event 事件名称
   * @param handler 事件处理函数
   * @returns 取消订阅函数
   */
  on(event: string, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // 返回取消订阅函数
    return () => this.off(event, handler);
  }

  /**
   * 取消订阅事件
   */
  off(event: string, handler: EventHandler): void {
    this.listeners.get(event)?.delete(handler);
  }

  /**
   * 发布事件
   */
  emit(event: string, payload: any): void {
    this.listeners.get(event)?.forEach(handler => {
      handler(payload);
    });
  }

  /**
   * 订阅一次性事件
   */
  once(event: string, handler: EventHandler): void {
    const wrappedHandler = (payload: any) => {
      handler(payload);
      this.off(event, wrappedHandler);
    };

    this.on(event, wrappedHandler);
  }

  /**
   * 清除所有事件监听器
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * 清除指定事件的所有监听器
   */
  clearEvent(event: string): void {
    this.listeners.delete(event);
  }
}

/**
 * 全局事件总线实例
 * 用于跨系统、跨Store通信
 */
export const globalEventBus = new EventBus();

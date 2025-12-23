import { RANDOM_EVENTS } from '../../constants/events';
import type { RandomEvent } from '../../store/types';

export class EventSystem {
  private lastCheckMonth: number = 0;

  checkAndTriggerEvent(currentMonth: number): RandomEvent | null {
    // 每月只检查一次
    if (this.lastCheckMonth === currentMonth) {
      return null;
    }

    this.lastCheckMonth = currentMonth;

    // 随机检查是否有事件触发
    for (const event of RANDOM_EVENTS) {
      if (Math.random() < event.probability) {
        return event;
      }
    }

    return null;
  }

  reset(): void {
    this.lastCheckMonth = 0;
  }
}

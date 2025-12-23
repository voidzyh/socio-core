import React, { useEffect } from 'react';
import { useEventStore } from '../../ecs/stores/EventStore';
import { useUIStore } from '../../store/uiStore';
import './EventNotification.css';

export const EventNotification: React.FC = () => {
  const eventHistory = useEventStore(state => state.history);
  const { notifications } = useUIStore();

  return (
    <div className="event-notification-container">
      {/* 通知 */}
      <div className="notifications-list">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification notification-${notification.type}`}
          >
            <span className="notification-message">{notification.message}</span>
          </div>
        ))}
      </div>

      {/* 事件历史 */}
      {eventHistory.length > 0 && (
        <div className="event-history">
          <h4 className="history-title">📜 事件记录</h4>
          <div className="history-list">
            {eventHistory.slice(-10).reverse().map((event) => (
              <div key={event.id} className="history-item">
                {event.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

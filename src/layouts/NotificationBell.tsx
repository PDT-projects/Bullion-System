import { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { Notification } from '../types/Notification';

type Props = {
  notifications: Notification[];
  setNotifications: (n: Notification[]) => void;
};

export function NotificationBell({ notifications, setNotifications }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Auto-remove expired notifications
  useEffect(() => {
    const timer = setInterval(() => {
      setNotifications(
        notifications.filter(
          n => !n.expiresAt || new Date(n.expiresAt) > new Date()
        )
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [notifications, setNotifications]);

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  return (
    <div className="relative z-50">
      {/* Bell Button */}
      <button
        ref={bellRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 bg-gray-100 rounded-full shadow-neumorph hover:shadow-neumorph-hover transition-all"
      >
        <Bell size={24} className="text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-neumorph-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Dropdown */}
          <div
            className="absolute right-0 mt-2 w-[44rem] max-w-[95vw] bg-gray-100 rounded-3xl shadow-neumorph-card border border-gray-200 z-50 max-h-[36rem] overflow-y-auto flex flex-col transform transition-transform duration-250 origin-top-right animate-slide-down"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-100 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 p-3 space-y-3">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center">
                  <Bell size={32} className="opacity-40 mb-3" />
                  <p className="text-base">No notifications yet</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-2xl transition-all cursor-pointer shadow-neumorph-item hover:shadow-neumorph-item-hover ${
                      notif.isRead ? 'bg-gray-100' : 'bg-blue-50'
                    }`}
                    onClick={() => markAsRead(notif.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {notif.title}
                          </h4>
                          {!notif.isRead && (
                            <span className="h-2 w-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mt-1 break-words">
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notif.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-1"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

import { NotificationBell } from './NotificationBell';
import { Notification } from '../types/Notification';

type Props = {
  notifications: Notification[];
  setNotifications: (n: Notification[]) => void;
};

export function TopBar({ notifications, setNotifications }: Props) {
  return (
    <div className="flex items-center justify-between">
      {/* Left section: title or breadcrumbs */}
      <div className="text-lg font-semibold text-gray-800">
        Dashboard
      </div>

      {/* Right section: notification bell + profile */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <NotificationBell notifications={notifications} setNotifications={setNotifications} />

        {/* User Profile */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">
            AD
          </div>
          <span className="text-gray-700 font-medium">Admin</span>
        </div>
      </div>
    </div>
  );
}

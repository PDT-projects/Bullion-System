import { useEffect, useState } from 'react';
import { type UserData, type Screen, hasScreenPermission, getUserScreens } from '../models/userService';

interface UseUserPermissionsReturn {
  userData: UserData | null;
  isLoading: boolean;
  hasPermission: (screen: Screen) => boolean;
  availableScreens: Screen[];
  isSuperAdmin: boolean;
  userEmail: string;
  userBranch: string;
}

export function useUserPermissions(): UseUserPermissionsReturn {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserData = () => {
      try {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
          const parsed = JSON.parse(userInfo);
          setUserData(parsed);
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  return {
    userData,
    isLoading,
    hasPermission: (screen: Screen) => hasScreenPermission(userData, screen),
    availableScreens: getUserScreens(userData),
    isSuperAdmin: userData?.role === 'super_admin',
    userEmail: userData?.email || '',
    userBranch: userData?.branch || '',
  };
}
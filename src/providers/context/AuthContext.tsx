import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../api/firebase/firebase';

type AuthContextType = {
  user: any;
  role: 'super_admin' | 'user' | null;
  permissions: string[];
  branch: string;
  setUser: (user: any) => void;
  setRole: (role: 'super_admin' | 'user' | null) => void;
  setPermissions: (permissions: string[]) => void;
  setBranch: (branch: string) => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'super_admin' | 'user' | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [branch, setBranch] = useState<string>('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userRole = userData.role === 'superAdmin' ? 'super_admin' : 'user';
            const userPermissions = userData.permissions || [];
            const userBranch = userData.branch || '';

            setUser(firebaseUser);
            setRole(userRole);
            setPermissions(userPermissions);
            setBranch(userBranch);

            // ✅ Save to localStorage so useUserPermissions can read it
            localStorage.setItem('userInfo', JSON.stringify({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: userRole,
              permissions: userPermissions,
              branch: userBranch,
            }));
          } else {
            await signOut(auth);
            localStorage.removeItem('userInfo');
            setUser(null);
            setRole(null);
            setPermissions([]);
            setBranch('');
          }
        } catch (err) {
          console.error('Error loading user data:', err);
          setUser(null);
          setRole(null);
          localStorage.removeItem('userInfo');
        }
      } else {
        localStorage.removeItem('userInfo');
        setUser(null);
        setRole(null);
        setPermissions([]);
        setBranch('');
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, permissions, branch, setUser, setRole, setPermissions, setBranch }}>
      {children}
    </AuthContext.Provider>
  );
}
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAccessToken: (accessToken) => {
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
        } else {
          localStorage.removeItem('accessToken');
        }
        set({ accessToken, isAuthenticated: !!accessToken });
      },
      logout: () => {
        localStorage.removeItem('accessToken');
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
      hasPermission: (permission: string) => {
        const user = get().user;
        if (!user) return false;
        // SUPER_ADMIN มีสิทธิ์ทุกเมนู
        if (user.role === 'SUPER_ADMIN') return true;
        return user.permissions?.includes(permission) ?? false;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);


import { create } from 'zustand';
import { storage } from '../utils/storage';
import api from '../api/axios';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'consumer' | 'owner' | 'admin';
  avatar?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  loadUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  loadUser: async () => {
    const token = await storage.getItem('accessToken');
    if (!token) { set({ loading: false }); return; }
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, loading: false });
    } catch {
      await storage.deleteItem('accessToken');
      await storage.deleteItem('refreshToken');
      set({ user: null, loading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    await storage.setItem('accessToken', data.accessToken);
    await storage.setItem('refreshToken', data.refreshToken);
    set({ user: data.user });
    return data.user;
  },

  register: async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password, role: 'consumer' });
    await storage.setItem('accessToken', data.accessToken);
    await storage.setItem('refreshToken', data.refreshToken);
    set({ user: data.user });
    return data.user;
  },

  logout: async () => {
    try {
      const refreshToken = await storage.getItem('refreshToken');
      await api.post('/auth/logout', { refreshToken });
    } catch {}
    await storage.deleteItem('accessToken');
    await storage.deleteItem('refreshToken');
    set({ user: null });
  },
}));

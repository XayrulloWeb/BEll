// Файл: src/store/useAuthStore.ts (ПОЛНАЯ ЗАМЕНА)

import { create } from 'zustand'; // <-- ИСПРАВЛЕНИЕ 1: Импортируем create
import { persist } from 'zustand/middleware';
import { toast } from 'sonner'; // <-- ИСПРАВЛЕНИЕ 2: Импортируем toast

// ВНИМАНИЕ: избегаем циклической зависимости с useStore. Будем подтягивать его лениво внутри logout

export interface User {
    id: string;
    username: string;
    schoolId: string | null; // SchoolId может быть null для superadmin
    role: 'admin' | 'superadmin';
    schoolName?: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    _isRestored: boolean; // Внутренний флаг для отслеживания восстановления состояния
}

export interface AuthActions {
    login: (username: string, password: string) => Promise<boolean>;
    register: (username: string, password: string, schoolId: string, role?: 'admin' | 'superadmin') => Promise<boolean>;
    logout: () => void;
    clearError: () => void;
    changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>; 
}

const API_URL = 'http://localhost:4000/api';

const getAuthHeaders = () => {
    const token = useAuthStore.getState().token;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
};

export const useAuthStore = create<AuthState & AuthActions>()(
    persist(
        (set) => ({
            // --- Начальное состояние ---
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: true,
            error: null,
            _isRestored: false,

            // --- Действия ---
            login: async (username, password) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`${API_URL}/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password }),
                    });

                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message || 'Ошибка входа в систему');

                    set({ user: data.user, token: data.token, isAuthenticated: true, error: null });
                    try {
                        const useStore = (await import('./useStore')).default;
                        await useStore.getState().fetchInitialData?.();
                    } catch {}
                    return true;
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
                    set({ error: errorMessage, isAuthenticated: false, user: null, token: null });
                    return false;
                } finally {
                    set({ isLoading: false });
                }
            },

            register: async (username, password, schoolId, role = 'admin') => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`${API_URL}/auth/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password, schoolId, role }),
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message || 'Ошибка регистрации');

                    set({ user: data.user, token: data.token, isAuthenticated: true, error: null });
                    try {
                        const useStore = (await import('./useStore')).default;
                        await useStore.getState().fetchInitialData?.();
                    } catch {}
                    return true;
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
                    set({ error: errorMessage, isAuthenticated: false, user: null, token: null });
                    return false;
                } finally {
                    set({ isLoading: false });
                }
            },

            logout: () => {
                void import('./useStore')
                    .then(m => {
                        try { m.default.getState().resetState?.(); } catch {}
                    })
                    .catch(() => {});

                set({ user: null, token: null, isAuthenticated: false, error: null });
            },

            clearError: () => {
                set({ error: null });
            },

             changePassword: async (oldPassword, newPassword) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`${API_URL}/settings/password`, {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ oldPassword, newPassword }),
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message || 'Ошибка смены пароля');

                    toast.success("Пароль успешно изменен!");
                    set({ isLoading: false });
                    return true;
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
                    toast.error(errorMessage);
                    set({ error: errorMessage, isLoading: false });
                    return false;
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state._isRestored = true;
                    state.isLoading = false;
                }
            },
        }
    )
);

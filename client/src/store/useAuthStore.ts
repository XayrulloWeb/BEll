import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// ВНИМАНИЕ: избегаем циклической зависимости с useStore. Будем подтягивать его лениво внутри logout

export interface User {
    id: string;
    username: string;
    schoolId: string | null; // SchoolId может быть null для superadmin
    role: 'admin' | 'superadmin';
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
}

const API_URL = 'http://localhost:4000/api';

export const useAuthStore = create<AuthState & AuthActions>()(
    persist(
        (set) => ({
            // --- Начальное состояние ---
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: true,  // Теперь по умолчанию true, чтобы показать загрузку при старте
            error: null,
            _isRestored: false, // Флаг еще не восстановлен

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
                // Сбрасываем хранилище данных приложения, чтобы не остались "хвосты"
                // ленивый импорт через динамический import, чтобы избежать цикла импорта и ошибок require
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
        }),
        {
            name: 'auth-storage',
            // Выбираем, какие поля сохранять в localStorage
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
            // Эта функция будет вызвана после того, как состояние будет восстановлено
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state._isRestored = true;
                    state.isLoading = false; // Заканчиваем первоначальную загрузку
                }
            },
        }
    )
);
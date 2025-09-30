import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { useAuthStore } from './useAuthStore';

// --- ИНТЕРФЕЙСЫ --- (без изменений)
export interface Bell { id: string; time: string; name: string; day: string; enabled: boolean; soundId: string; scheduleId: string; bellType: 'lesson' | 'break'; breakDuration: number; }
export interface ScheduleSet { id: string; name: string; bells: Bell[]; }
export interface Sound { id: string; name: string; url: string; }
export interface ActivityLog { timestamp: number; message: string; }
export type BellData = Omit<Bell, 'id' | 'scheduleId'>;

// --- ИНТЕРФЕЙС ХРАНИЛИЩА ---
export interface StoreState {
    // Состояние
    isLoading: boolean;
    isServerError: boolean;
    currentTime: Date;
    schedules: Record<string, ScheduleSet>;
    activeScheduleId: string | null;
    sounds: Sound[];
    activityLog: ActivityLog[];
    // Действия
    fetchInitialData: () => Promise<void>;
    updateCurrentTime: () => void;
    addLogEntry: (message: string) => void;

    addScheduleSet: (name: string) => Promise<void>;
    deleteScheduleSet: (scheduleId: string) => Promise<void>;
    setActiveSchedule: (scheduleId: string) => Promise<void>;

    addBell: (scheduleId: string, bellData: BellData) => Promise<void>;
    updateBell: (bellId: string, updatedData: Partial<BellData>) => Promise<void>;
    deleteBell: (bellId: string) => Promise<void>;
    // Генератор простых звонков для дня
    generateDayBells?: (params: { scheduleId: string; day: string; startTime: string; lessons: number; lessonMinutes: number; breakMinutes: number; }) => Promise<void>;
    resetState?: () => void;
}
const initialState = {
    isLoading: true,
    isServerError: false,
    currentTime: new Date(),
    schedules: {},
    activeScheduleId: null,
    sounds: [],
    activityLog: [],
};

const API_URL = 'http://localhost:4000/api';

// Функция для получения заголовков с токеном
const getAuthHeaders = () => {
    const token = useAuthStore.getState().token;
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };
};

const useStore = create<StoreState>((set, get) => ({
    // --- НАЧАЛЬНОЕ СОСТОЯНИЕ --- (без изменений)
    ...initialState,
    isLoading: true, isServerError: false, currentTime: new Date(), schedules: {}, activeScheduleId: null, sounds: [], activityLog: [],
    resetState: () => set(initialState),
    // --- ДЕЙСТВИЯ ---

    // fetchInitialData с аутентификацией
    fetchInitialData: async () => { 
        set({ isLoading: true, isServerError: false }); 
        try { 
            const response = await fetch(`${API_URL}/data`, {
                headers: getAuthHeaders()
            }); 
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    // Токен недействителен, выходим из системы
                    useAuthStore.getState().logout();
                    throw new Error('Сессия истекла или доступ запрещен. Войдите снова.');
                }
                throw new Error('Server response was not ok'); 
            }
            const data = await response.json(); 
            set({ 
                schedules: data.schedules, 
                sounds: data.sounds, 
                activeScheduleId: data.activeScheduleId, 
                activityLog: [{ timestamp: Date.now(), message: "System initialized and data loaded." }], 
                isLoading: false, 
            }); 
        } catch (error) { 
            console.error("Критическая ошибка при загрузке данных:", error); 
            set({ 
                isLoading: false, 
                isServerError: true, 
                activityLog: [{ timestamp: Date.now(), message: "Failed to load data from server." }] 
            }); 
        } 
    },
    // updateCurrentTime и addLogEntry без изменений
    updateCurrentTime: () => set({ currentTime: new Date() }),
    addLogEntry: (message: string) => set(state => ({ activityLog: [...state.activityLog, { timestamp: Date.now(), message }] })),

    // addScheduleSet с аутентификацией
    addScheduleSet: async (name: string) => { 
        const originalSchedules = get().schedules; 
        const tempId = `schedule-${Date.now()}`; 
        const newScheduleSet: ScheduleSet = { id: tempId, name, bells: [] }; 
        set(state => ({ schedules: { ...state.schedules, [tempId]: newScheduleSet } })); 
        try { 
            await fetch(`${API_URL}/schedules`, { 
                method: 'POST', 
                headers: getAuthHeaders(), 
                body: JSON.stringify({ id: tempId, name }), 
            }); 
            get().addLogEntry(`New schedule "${name}" created.`); 
        } catch (error) { 
            console.error("Ошибка добавления набора расписаний:", error); 
            get().addLogEntry(`Failed to create schedule "${name}".`); 
            set({ schedules: originalSchedules }); 
        } 
    },

    deleteScheduleSet: async (scheduleId: string) => {
        const { schedules, activeScheduleId } = get();
        const scheduleToDelete = schedules[scheduleId];
        if (!scheduleToDelete) return;

        // Сохраняем состояние для возможного отката
        const originalSchedules = schedules;

        // Оптимистичное обновление UI
        const newSchedules = { ...schedules };
        delete newSchedules[scheduleId];
        set({ schedules: newSchedules });

        // Если удалили активное расписание, нужно сбросить activeScheduleId
        if (activeScheduleId === scheduleId) {
            set({ activeScheduleId: null });
            // В будущем тут можно будет устанавливать другое расписание активным по умолчанию
        }

        try {
            const response = await fetch(`${API_URL}/schedules/${scheduleId}`, { method: 'DELETE', headers: getAuthHeaders() });
            if (!response.ok) throw new Error('Failed to delete schedule on server');
            get().addLogEntry(`Schedule "${scheduleToDelete.name}" deleted.`);
        } catch(error) {
            console.error("Ошибка удаления расписания:", error);
            get().addLogEntry(`Failed to delete schedule "${scheduleToDelete.name}".`);
            // Откат в случае ошибки
            set({ schedules: originalSchedules, activeScheduleId });
        }
    },

    // setActiveSchedule с аутентификацией
    setActiveSchedule: async (scheduleId: string) => { 
        const originalId = get().activeScheduleId; 
        set({ activeScheduleId: scheduleId }); 
        try { 
            await fetch(`${API_URL}/settings/activeSchedule`, { 
                method: 'POST', 
                headers: getAuthHeaders(), 
                body: JSON.stringify({ id: scheduleId }), 
            }); 
            get().addLogEntry(`Active schedule changed.`); 
        } catch (error) { 
            console.error("Ошибка смены активного расписания:", error); 
            get().addLogEntry(`Failed to change active schedule.`); 
            set({ activeScheduleId: originalId }); 
        } 
    },

    // Функции для звонков с аутентификацией
    addBell: async (scheduleId, bellData) => { 
        const newBell: Bell = { ...bellData, id: uuidv4(), scheduleId: scheduleId }; 
        const originalSchedules = get().schedules; 
        const scheduleToUpdate = originalSchedules[scheduleId]; 
        if (!scheduleToUpdate) return; 
        const updatedSchedule = { ...scheduleToUpdate, bells: [...scheduleToUpdate.bells, newBell] }; 
        set({ schedules: { ...originalSchedules, [scheduleId]: updatedSchedule } }); 
        try { 
            await fetch(`${API_URL}/bells`, { 
                method: 'POST', 
                headers: getAuthHeaders(), 
                body: JSON.stringify(newBell), 
            }); 
            get().addLogEntry(`New bell "${newBell.name}" added.`); 
        } catch (error) { 
            console.error("Ошибка сохранения звонка:", error); 
            get().addLogEntry(`Failed to add bell "${newBell.name}".`); 
            set({ schedules: originalSchedules }); 
        } 
    },
    updateBell: async (bellId, updatedData) => { 
        const originalSchedules = get().schedules; 
        let targetScheduleId: string | null = null; 
        for (const scheduleId in originalSchedules) { 
            if (originalSchedules[scheduleId].bells.some(b => b.id === bellId)) { 
                targetScheduleId = scheduleId; 
                break; 
            } 
        } 
        if (!targetScheduleId) return; 
        const scheduleToUpdate = originalSchedules[targetScheduleId]; 
        const updatedBells = scheduleToUpdate.bells.map(b => b.id === bellId ? { ...b, ...updatedData } : b); 
        const updatedSchedule = { ...scheduleToUpdate, bells: updatedBells }; 
        set({ schedules: { ...originalSchedules, [targetScheduleId]: updatedSchedule } }); 
        try { 
            await fetch(`${API_URL}/bells/${bellId}`, { 
                method: 'PUT', 
                headers: getAuthHeaders(), 
                body: JSON.stringify(updatedData), 
            }); 
            get().addLogEntry(`Bell updated.`); 
        } catch (error) { 
            console.error("Ошибка обновления звонка:", error); 
            get().addLogEntry(`Failed to update bell.`); 
            set({ schedules: originalSchedules }); 
        } 
    },
    deleteBell: async (bellId) => { 
        const originalSchedules = get().schedules; 
        let targetScheduleId: string | null = null; 
        for (const scheduleId in originalSchedules) { 
            if (originalSchedules[scheduleId].bells.some(b => b.id === bellId)) { 
                targetScheduleId = scheduleId; 
                break; 
            } 
        } 
        if (!targetScheduleId) return; 
        const scheduleToUpdate = originalSchedules[targetScheduleId]; 
        const updatedBells = scheduleToUpdate.bells.filter(b => b.id !== bellId); 
        const updatedSchedule = { ...scheduleToUpdate, bells: updatedBells }; 
        set({ schedules: { ...originalSchedules, [targetScheduleId]: updatedSchedule } }); 
        try { 
            await fetch(`${API_URL}/bells/${bellId}`, { 
                method: 'DELETE',
                headers: getAuthHeaders()
            }); 
            get().addLogEntry(`Bell deleted.`); 
        } catch (error) { 
            console.error("Ошибка удаления звонка:", error); 
            get().addLogEntry(`Failed to delete bell.`); 
            set({ schedules: originalSchedules }); 
        } 
    },

    generateDayBells: async ({ scheduleId, day, startTime, lessons, lessonMinutes, breakMinutes }) => {
        // вспомогательная функция
        const addMinutes = (t: string, add: number) => {
            const [h, m] = t.split(':').map(Number);
            const d = new Date(2000, 0, 1, h, m, 0);
            d.setMinutes(d.getMinutes() + add);
            const hh = String(d.getHours()).padStart(2, '0');
            const mm = String(d.getMinutes()).padStart(2, '0');
            return `${hh}:${mm}`;
        };

        let time = startTime;
        for (let i = 1; i <= lessons; i++) {
            const lessonStart = time;
            const lessonEnd = addMinutes(lessonStart, lessonMinutes);
            const breakStart = lessonEnd;
            const breakEnd = addMinutes(breakStart, breakMinutes);

            // создаём четыре звонка (как обычные записи)
            await get().addBell(scheduleId, { time: lessonStart, name: `Начало ${i}-го урока`, day, enabled: true, soundId: 'sound-1', bellType: 'lesson', breakDuration: 0 });
            await get().addBell(scheduleId, { time: lessonEnd, name: `Конец ${i}-го урока`, day, enabled: true, soundId: 'sound-1', bellType: 'lesson', breakDuration: 0 });
            if (breakMinutes > 0 && i < lessons) {
                await get().addBell(scheduleId, { time: breakStart, name: `Начало перемены`, day, enabled: true, soundId: 'sound-1', bellType: 'break', breakDuration: breakMinutes });
                await get().addBell(scheduleId, { time: breakEnd, name: `Конец перемены`, day, enabled: true, soundId: 'sound-1', bellType: 'break', breakDuration: breakMinutes });
            }

            time = breakEnd; // следующий урок начинается после перемены
        }
    },

    // --- Убраны все SLOTS по требованию ---
}));

export default useStore;
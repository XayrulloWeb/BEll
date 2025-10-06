// Файл: src/store/useStore.ts (ПОЛНАЯ ФИНАЛЬНАЯ ЗАМЕНА)
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { useAuthStore } from './useAuthStore';

// --- ИНТЕРФЕЙСЫ ---
export interface Bell { id: string; time: string; name: string; day: string; enabled: boolean; soundId: string; scheduleId: string; bellType: 'lesson' | 'break'; breakDuration: number; }
export interface ScheduleSet { id: string; name: string; bells: Bell[]; }
export interface Sound { id: string; name: string; url: string; }
export interface ActivityLog { timestamp: number; message: string; }
export type BellData = Omit<Bell, 'id' | 'scheduleId'>;

// <<< НОВЫЙ ИНТЕРФЕЙС ДЛЯ НАСТРОЙКИ КАЖДОГО УРОКА >>>
export interface LessonConfig {
    lessonDuration: number;
    breakDuration: number;
}

// <<< ОБНОВЛЕННЫЙ ИНТЕРФЕЙС ДЛЯ ПАРАМЕТРОВ ГЕНЕРАТОРА >>>
export interface GeneratorParams {
    scheduleId: string;
    day: string;
    startTime: string;
    lessonConfigs: LessonConfig[]; // Вместо отдельных чисел - массив объектов
    action: 'append' | 'overwrite';
}

// --- ИНТЕРФЕЙС ХРАНИЛИЩА ---
export interface StoreState {
    // Состояние
    isLoading: boolean; isServerError: boolean; currentTime: Date; schedules: Record<string, ScheduleSet>;
    activeScheduleId: string | null; sounds: Sound[]; activityLog: ActivityLog[];
    // Действия
    fetchInitialData: () => Promise<void>; addScheduleSet: (name: string) => Promise<void>; deleteScheduleSet: (scheduleId: string) => Promise<void>; setActiveSchedule: (scheduleId: string) => Promise<void>; addBell: (scheduleId: string, bellData: BellData) => Promise<void>; updateBell: (bellId: string, updatedData: Partial<BellData>) => Promise<void>; deleteBell: (bellId: string) => Promise<void>;
    generateDayBells: (params: GeneratorParams) => Promise<void>; // Обновленный тип
    // Утилиты
    updateCurrentTime: () => void; addLogEntry: (message: string) => void; resetState?: () => void;
}
const initialState = { isLoading: true, isServerError: false, currentTime: new Date(), schedules: {}, activeScheduleId: null, sounds: [], activityLog: [] };
const API_URL = 'http://localhost:4000/api';
const getAuthHeaders = () => { const token = useAuthStore.getState().token; return { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) }; };

const useStore = create<StoreState>((set, get) => ({
    ...initialState,
    resetState: () => set(initialState),

    fetchInitialData: async () => { set({ isLoading: true, isServerError: false }); try { const response = await fetch(`${API_URL}/data`, { headers: getAuthHeaders() }); if (!response.ok) { if (response.status === 401 || response.status === 403) { useAuthStore.getState().logout(); throw new Error('Сессия истекла или доступ запрещен. Войдите снова.'); } throw new Error('Server response was not ok'); } const data = await response.json(); set({ schedules: data.schedules, sounds: data.sounds, activeScheduleId: data.activeScheduleId, activityLog: [{ timestamp: Date.now(), message: "System initialized and data loaded." }], isLoading: false }); } catch (error) { console.error("Критическая ошибка при загрузке данных:", error); set({ isLoading: false, isServerError: true, activityLog: [{ timestamp: Date.now(), message: "Failed to load data from server." }] }); } },
    updateCurrentTime: () => set({ currentTime: new Date() }),
    addLogEntry: (message: string) => set(state => ({ activityLog: [...state.activityLog, { timestamp: Date.now(), message }] })),

    addScheduleSet: async (name: string) => { const o = get().schedules; const t = `schedule-${Date.now()}`; const n:ScheduleSet={id:t,name,bells:[]}; set(s=>({schedules:{...s.schedules,[t]:n}})); try{await fetch(`${API_URL}/schedules`,{method:'POST',headers:getAuthHeaders(),body:JSON.stringify({id:t,name})}); get().addLogEntry(`New schedule "${name}" created.`);} catch(e){console.error("E:",e);get().addLogEntry(`Failed to create schedule "${name}".`); set({schedules:o});}},
    deleteScheduleSet: async (scheduleId) => { const {schedules:s, activeScheduleId:a}=get();const d=s[scheduleId];if(!d)return;const n={...s};delete n[scheduleId];set({schedules:n});if(a===scheduleId)set({activeScheduleId:null});try{const r=await fetch(`${API_URL}/schedules/${scheduleId}`,{method:'DELETE',headers:getAuthHeaders()});if(!r.ok)throw new Error('Failed'); get().addLogEntry(`Schedule "${d.name}" deleted.`);}catch(e){console.error("E:",e);get().addLogEntry(`Failed to delete schedule "${d.name}".`);set({schedules:s,activeScheduleId:a});}},
    setActiveSchedule: async (scheduleId) => { const o=get().activeScheduleId;set({activeScheduleId:scheduleId});try{await fetch(`${API_URL}/settings/activeSchedule`,{method:'POST',headers:getAuthHeaders(),body:JSON.stringify({id:scheduleId})}); get().addLogEntry(`Active schedule changed.`);}catch(e){console.error("E:",e);get().addLogEntry(`Failed to change active schedule.`);set({activeScheduleId:o});}},
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
    updateBell: async (bellId, updatedData) => { const o=get().schedules;let t:string|null=null;for(const s in o){if(o[s].bells.some(b=>b.id===bellId)){t=s;break;}} if(!t)return;const s=o[t];const u=s.bells.map(b=>b.id===bellId?{...b,...updatedData}:b);const d={...s,bells:u};set({schedules:{...o,[t]:d}});try{await fetch(`${API_URL}/bells/${bellId}`,{method:'PUT',headers:getAuthHeaders(),body:JSON.stringify(updatedData)}); get().addLogEntry(`Bell updated.`);}catch(e){console.error("E:",e);get().addLogEntry(`Failed to update bell.`);set({schedules:o});}},
    deleteBell: async (bellId) => { const o=get().schedules;let t:string|null=null;for(const s in o){if(o[s].bells.some(b=>b.id===bellId)){t=s;break;}} if(!t)return;const s=o[t];const u=s.bells.filter(b=>b.id!==bellId);const d={...s,bells:u};set({schedules:{...o,[t]:d}});try{await fetch(`${API_URL}/bells/${bellId}`,{method:'DELETE',headers:getAuthHeaders()}); get().addLogEntry(`Bell deleted.`);}catch(e){console.error("E:",e);get().addLogEntry(`Failed to delete bell.`);set({schedules:o});}},

    // <<< ПОЛНОСТЬЮ ПЕРЕПИСАННАЯ ФУНКЦИЯ ГЕНЕРАЦИИ >>>
    generateDayBells: async ({ scheduleId, day, startTime, lessonConfigs, action }) => {
        // 1. Обработка перезаписи (очистка дня, если нужно)
        if (action === 'overwrite') {
            const state = get();
            const schedule = state.schedules[scheduleId];
            if (schedule) {
                const bellIdsToDelete = schedule.bells.filter(bell => bell.day === day).map(bell => bell.id);
                if (bellIdsToDelete.length > 0) {
                    // Используем ваш существующий deleteBell для оптимистичного UI и запросов
                    for (const bellId of bellIdsToDelete) {
                        await state.deleteBell(bellId);
                    }
                    get().addLogEntry(`Очищено ${bellIdsToDelete.length} звонков для ${day}.`);
                }
            }
        }

        // 2. Новая, гибкая логика генерации на основе массива настроек
        const addMinutes = (timeString: string, minutesToAdd: number) => {
            const [hours, minutes] = timeString.split(':').map(Number);
            const date = new Date(); // Неважно, какая дата, главное - время
            date.setHours(hours, minutes, 0, 0);
            date.setMinutes(date.getMinutes() + minutesToAdd);
            const hh = String(date.getHours()).padStart(2, '0');
            const mm = String(date.getMinutes()).padStart(2, '0');
            return `${hh}:${mm}`;
        };

        let currentTime = startTime;
        // Итерируемся по массиву с индивидуальными настройками для каждого урока
        for (let i = 0; i < lessonConfigs.length; i++) {
            const config = lessonConfigs[i];
            const lessonNumber = i + 1;
            
            const lessonStart = currentTime;
            const lessonEnd = addMinutes(lessonStart, config.lessonDuration);
            
            // Звонок на начало урока
            await get().addBell(scheduleId, { 
                time: lessonStart, 
                name: `Начало ${lessonNumber}-го урока`, 
                day, enabled: true, 
                soundId: 'sound-1', 
                bellType: 'lesson', 
                breakDuration: 0 
            });

            // Звонок на конец урока (который является началом перемены)
            await get().addBell(scheduleId, { 
                time: lessonEnd, 
                name: `Конец ${lessonNumber}-го урока`, 
                day, enabled: true, 
                soundId: 'sound-1', 
                bellType: 'break', 
                breakDuration: config.breakDuration 
            });

            // Время начала следующего урока = время конца этого + длительность перемены после него
            currentTime = addMinutes(lessonEnd, config.breakDuration);
        }

        get().addLogEntry(`Сгенерировано расписание для ${lessonConfigs.length} уроков в дне: ${day}.`);
    },
}));

export default useStore;
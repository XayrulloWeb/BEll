import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { useAuthStore } from "./useAuthStore";

// --- ИНТЕРФЕЙСЫ ---
export interface Bell {
  id: string;
  time: string;
  name: string;
  day: string;
  enabled: boolean;
  soundId: string;
  scheduleId: string;
  bellType: "lesson" | "break";
  breakDuration: number;
}
export interface ScheduleSet {
  id: string;
  name: string;
  bells: Bell[];
}
export interface Sound {
  id: string;
  name: string;
  url: string;
}
export interface ActivityLog {
  timestamp: number;
  message: string;
}
export type BellData = Omit<Bell, "id" | "scheduleId">;
export interface LessonConfig {
  lessonDuration: number;
  breakDuration: number;
}
export interface GeneratorParams {
  scheduleId: string;
  day: string;
  startTime: string;
  lessonConfigs: LessonConfig[];
  action: "append" | "overwrite";
}
export interface SpecialDay {
  date: string;
  school_id: string;
  type: "HOLIDAY" | "OVERRIDE";
  override_schedule_id: string | null;
}

// --- ИНТЕРФЕЙС ХРАНИЛИЩА ---
export interface StoreState {
  isLoading: boolean;
  isServerError: boolean;
  currentTime: Date;
  schedules: Record<string, ScheduleSet>;
  activeScheduleId: string | null;
  sounds: Sound[];
  activityLog: ActivityLog[];
  specialDays: SpecialDay[];
  isCalendarLoading: boolean;

  fetchInitialData: () => Promise<void>;
  addScheduleSet: (name: string) => Promise<void>;
  deleteScheduleSet: (scheduleId: string) => Promise<void>;
  setActiveSchedule: (scheduleId: string) => Promise<void>;
  addBell: (scheduleId: string, bellData: BellData) => Promise<void>;
  updateBell: (bellId: string, updatedData: Partial<BellData>) => Promise<void>;
  deleteBell: (bellId: string) => Promise<void>;
  generateDayBells: (params: GeneratorParams) => Promise<void>;
  
  fetchSpecialDays: () => Promise<void>;
  setSpecialDay: (dayData: Omit<SpecialDay, "school_id">) => Promise<void>;
  deleteSpecialDay: (date: string) => Promise<void>;
  
  updateCurrentTime: () => void;
  addLogEntry: (message: string) => void;
  resetState?: () => void;
}

// --- НАЧАЛЬНОЕ СОСТОЯНИЕ ---
const initialState = {
  isLoading: true,
  isServerError: false,
  currentTime: new Date(),
  schedules: {},
  activeScheduleId: null,
  sounds: [],
  activityLog: [],
  specialDays: [],
  isCalendarLoading: false,
};

const API_URL = "http://localhost:4000/api";
const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  if (!token) {
    console.error("Попытка сделать запрос без токена аутентификации!");
    // В реальном приложении можно было бы выбросить ошибку или сделать logout
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

const useStore = create<StoreState>((set, get) => ({
  ...initialState,

  fetchInitialData: async () => {
    // Убедимся, что токен существует перед запросом. Это важно при первой загрузке.
    const token = useAuthStore.getState().token;
    if (!token) {
        set({ isLoading: false, isServerError: true });
        // Нет смысла делать запрос, если мы знаем, что он провалится
        return; 
    }

    set({ isLoading: true, isServerError: false });
    try {
        // ИСПРАВЛЕНИЕ №1: Правильный URL в соответствии с вашим бэкендом
        const response = await fetch(`${API_URL}/schedules/data`, {
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                toast.error("Сессия истекла или доступ запрещен. Войдите снова.");
                // Вызываем logout, чтобы очистить состояние и перенаправить на страницу входа
                useAuthStore.getState().logout();
            }
            // Выбрасываем ошибку, чтобы она была поймана блоком catch
            throw new Error("Ошибка загрузки данных с сервера");
        }

        const data = await response.json();
        set({
            // ИСПРАВЛЕНИЕ №2: Проверяем, что data.schedules существует, иначе ставим пустой объект
            schedules: data.schedules || {},
            sounds: data.sounds || [],
            activeScheduleId: data.activeScheduleId,
            activityLog: [
                ...get().activityLog, // Добавляем к существующему логу, а не заменяем его
                {
                    timestamp: Date.now(),
                    message: "Данные системы успешно загружены.",
                },
            ],
            isLoading: false,
        });
    } catch (error) {
        console.error("Критическая ошибка при загрузке данных:", error);
        toast.error(error instanceof Error ? error.message : "Не удалось загрузить данные");
        set({
            isLoading: false,
            isServerError: true,
            activityLog: [
                ...get().activityLog,
                {
                    timestamp: Date.now(),
                    message: "Ошибка загрузки данных с сервера.",
                },
            ],
        });
    }
},

  updateCurrentTime: () => set({ currentTime: new Date() }),

  addLogEntry: (message: string) =>
    set((state) => ({
      activityLog: [...state.activityLog, { timestamp: Date.now(), message }],
    })),

  addScheduleSet: async (name: string) => {
    const originalSchedules = get().schedules;
    const tempId = `schedule-${Date.now()}`;
    const newSchedule: ScheduleSet = { id: tempId, name, bells: [] };
    set((s) => ({ schedules: { ...s.schedules, [tempId]: newSchedule } }));
    try {
      await fetch(`${API_URL}/schedules/schedules`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: tempId, name }),
      });
      toast.success(`Новое расписание "${name}" успешно создано.`);
      get().addLogEntry(`New schedule "${name}" created.`);
    } catch (e) {
      console.error("Error creating schedule:", e);
      toast.error(`Ошибка при создании расписания "${name}".`);
      get().addLogEntry(`Failed to create schedule "${name}".`);
      set({ schedules: originalSchedules });
    }
  },

  deleteScheduleSet: async (scheduleId: string) => {
    const { schedules, activeScheduleId } = get();
    const scheduleToDelete = schedules[scheduleId];
    if (!scheduleToDelete) return;
    
    const newSchedules = { ...schedules };
    delete newSchedules[scheduleId];
    set({ schedules: newSchedules });
    if (activeScheduleId === scheduleId) set({ activeScheduleId: null });

    try {
      const response = await fetch(`${API_URL}/schedules/schedules/${scheduleId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to delete schedule on server");
      get().addLogEntry(`Schedule "${scheduleToDelete.name}" deleted.`);
      toast.success(`Расписание "${scheduleToDelete.name}" удалено.`);
    } catch (e) {
      console.error("Error deleting schedule:", e);
      get().addLogEntry(`Failed to delete schedule "${scheduleToDelete.name}".`);
      set({ schedules, activeScheduleId }); // Rollback
      toast.error(`Ошибка при удалении расписания "${scheduleToDelete.name}".`);
    }
  },

  setActiveSchedule: async (scheduleId: string) => {
    const originalActiveId = get().activeScheduleId;
    set({ activeScheduleId: scheduleId });
    try {
      await fetch(`${API_URL}/schedules/settings/activeSchedule`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: scheduleId }),
      });
      get().addLogEntry(`Active schedule changed.`);
      toast.success('Активное расписание изменено.');
    } catch (e) {
      console.error("Error setting active schedule:", e);
      get().addLogEntry(`Failed to change active schedule.`);
      set({ activeScheduleId: originalActiveId });
      toast.error('Не удалось изменить активное расписание.');
    }
  },

  addBell: async (scheduleId, bellData) => {
    const newBell: Bell = { ...bellData, id: uuidv4(), scheduleId: scheduleId };
    const originalSchedules = get().schedules;
    const scheduleToUpdate = originalSchedules[scheduleId];
    if (!scheduleToUpdate) return;
    
    const updatedSchedule = {
      ...scheduleToUpdate,
      bells: [...scheduleToUpdate.bells, newBell],
    };
    set({ schedules: { ...originalSchedules, [scheduleId]: updatedSchedule } });
    
    try {
      await fetch(`${API_URL}/bells`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newBell),
      });
      get().addLogEntry(`New bell "${newBell.name}" added.`);
      toast.success(`Звонок "${newBell.name}" добавлен.`);
    } catch (error) {
      console.error("Ошибка сохранения звонка:", error);
      get().addLogEntry(`Failed to add bell "${newBell.name}".`);
      set({ schedules: originalSchedules });
      toast.error(`Не удалось добавить звонок "${newBell.name}".`);
    }
  },

  updateBell: async (bellId, updatedData) => {
    const originalSchedules = get().schedules;
    let targetScheduleId: string | null = null;
    for (const scheduleId in originalSchedules) {
      if (originalSchedules[scheduleId].bells.some((b) => b.id === bellId)) {
        targetScheduleId = scheduleId;
        break;
      }
    }
    if (!targetScheduleId) return;

    const targetSchedule = originalSchedules[targetScheduleId];
    const updatedBells = targetSchedule.bells.map((b) =>
      b.id === bellId ? { ...b, ...updatedData } : b
    );
    const updatedSchedule = { ...targetSchedule, bells: updatedBells };
    set({ schedules: { ...originalSchedules, [targetScheduleId]: updatedSchedule } });
    
    try {
      await fetch(`${API_URL}/bells/${bellId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedData),
      });
      get().addLogEntry(`Bell updated.`);
      toast.success('Звонок обновлен.');
    } catch (e) {
      console.error("Error updating bell:", e);
      get().addLogEntry(`Failed to update bell.`);
      set({ schedules: originalSchedules });
      toast.error('Не удалось обновить звонок.');
    }
  },

  deleteBell: async (bellId) => {
    const originalSchedules = get().schedules;
    let targetScheduleId: string | null = null;
    for (const scheduleId in originalSchedules) {
      if (originalSchedules[scheduleId].bells.some((b) => b.id === bellId)) {
        targetScheduleId = scheduleId;
        break;
      }
    }
    if (!targetScheduleId) return;

    const targetSchedule = originalSchedules[targetScheduleId];
    const updatedBells = targetSchedule.bells.filter((b) => b.id !== bellId);
    const updatedSchedule = { ...targetSchedule, bells: updatedBells };
    set({ schedules: { ...originalSchedules, [targetScheduleId]: updatedSchedule } });

    try {
      await fetch(`${API_URL}/bells/${bellId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      toast.success(`Звонок успешно удален.`);
      get().addLogEntry(`Bell deleted.`);
    } catch (e) {
      console.error("Error deleting bell:", e);
      toast.error(`Не удалось удалить звонок.`);
      get().addLogEntry(`Failed to delete bell.`);
      set({ schedules: originalSchedules });
    }
  },

  generateDayBells: async (params) => {
    const { scheduleId, day, startTime, lessonConfigs, action } = params;
    if (action === "overwrite") {
      const state = get();
      const schedule = state.schedules[scheduleId];
      if (schedule) {
        const bellIdsToDelete = schedule.bells.filter((bell) => bell.day === day).map((bell) => bell.id);
        if (bellIdsToDelete.length > 0) {
          for (const bellId of bellIdsToDelete) {
            await state.deleteBell(bellId);
          }
          get().addLogEntry(`Очищено ${bellIdsToDelete.length} звонков для ${day}.`);
        }
      }
    }

    const addMinutes = (timeString: string, minutesToAdd: number) => {
      const [hours, minutes] = timeString.split(":").map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      date.setMinutes(date.getMinutes() + minutesToAdd);
      const hh = String(date.getHours()).padStart(2, "0");
      const mm = String(date.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    };

    let currentTime = startTime;
    for (let i = 0; i < lessonConfigs.length; i++) {
      const config = lessonConfigs[i];
      const lessonNumber = i + 1;

      const lessonStart = currentTime;
      const lessonEnd = addMinutes(lessonStart, config.lessonDuration);
      
      await get().addBell(scheduleId, { time: lessonStart, name: `Начало ${lessonNumber}-го урока`, day, enabled: true, soundId: "sound-1", bellType: "lesson", breakDuration: 0 });
      await get().addBell(scheduleId, { time: lessonEnd, name: `Конец ${lessonNumber}-го урока`, day, enabled: true, soundId: "sound-1", bellType: "break", breakDuration: config.breakDuration });

      currentTime = addMinutes(lessonEnd, config.breakDuration);
    }
    
    get().addLogEntry(`Сгенерировано расписание для ${lessonConfigs.length} уроков в дне: ${day}.`);
    toast.success(`Расписание для дня "${day}" сгенерировано.`);
  },

  fetchSpecialDays: async () => {
    set({ isCalendarLoading: true });
    try {
        const response = await fetch(`${API_URL}/calendar`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Не удалось загрузить данные календаря');
        const data = await response.json();
        set({ specialDays: data, isCalendarLoading: false });
    } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ошибка загрузки календаря");
        set({ isCalendarLoading: false });
    }
  },

  setSpecialDay: async (dayData) => {
    const originalDays = get().specialDays;
    const optimisticDay = { ...dayData, school_id: '' };
    
    const existingRuleIndex = originalDays.findIndex(d => d.date === dayData.date);
    let newDays: SpecialDay[];
    if (existingRuleIndex > -1) {
        newDays = originalDays.map(d => d.date === dayData.date ? { ...d, ...optimisticDay } : d);
    } else {
        newDays = [...originalDays, optimisticDay];
    }
    set({ specialDays: newDays.sort((a, b) => a.date.localeCompare(b.date)) });

    try {
        const response = await fetch(`${API_URL}/calendar`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(dayData)
        });
        const responseData = await response.json();
        if (!response.ok) throw new Error(responseData.message || 'Не удалось сохранить правило');
        toast.success("Правило для дня успешно сохранено");
        await get().fetchSpecialDays();
    } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ошибка сохранения правила");
        set({ specialDays: originalDays });
    }
  },

  deleteSpecialDay: async (date: string) => {
      const originalDays = get().specialDays;
      const newDays = originalDays.filter(day => day.date !== date);
      set({ specialDays: newDays });

      try {
          const response = await fetch(`${API_URL}/calendar/${date}`, {
              method: 'DELETE',
              headers: getAuthHeaders()
          });
          const responseData = await response.json();
          if (!response.ok) throw new Error(responseData.message ||'Не удалось удалить правило');
          toast.success("Правило для дня успешно удалено");
      } catch (error) {
          toast.error(error instanceof Error ? error.message : "Ошибка удаления правила");
          set({ specialDays: originalDays });
      }
  },

  resetState: () => set(initialState),
}));

export default useStore;
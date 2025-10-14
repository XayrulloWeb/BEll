// Файл: src/validation.schemas.ts (ПОЛНАЯ ЗАМЕНА С ИСПРАВЛЕНИЕМ)

import { z } from 'zod';

// --- Auth ---
export const registerUserSchema = z.object({
  body: z.object({
    username: z.string().min(3, "Имя пользователя должно быть не менее 3 символов"),
    password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
    schoolId: z.string().min(1, "ID школы обязателен"),
    role: z.enum(['admin', 'superadmin']).optional(),
  }),
});

export const loginUserSchema = z.object({
  body: z.object({
    username: z.string().min(1),
    password: z.string().min(1),
  }),
});


// --- Schedule ---
export const createScheduleSchema = z.object({
  body: z.object({
    id: z.string().min(1),
    name: z.string().min(1, "Название расписания не может быть пустым"),
  }),
});

export const setActiveScheduleSchema = z.object({
  body: z.object({
    id: z.string().min(1),
  }),
});


// --- Bell ---
export const createBellSchema = z.object({
  body: z.object({
    id: z.string().uuid(),
    scheduleId: z.string(),
    name: z.string().min(1, "Название звонка обязательно"),
    time: z.string().regex(/^\d{2}:\d{2}$/, "Неверный формат времени"),
    day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
    enabled: z.boolean(),
    soundId: z.string(),
    bellType: z.enum(['lesson', 'break']),
    breakDuration: z.number().min(0),
  }),
});

export const updateBellSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']).optional(),
    enabled: z.boolean().optional(),
    soundId: z.string().optional(),
    bellType: z.enum(['lesson', 'break']).optional(),
    breakDuration: z.number().min(0).optional(),
  }).strict(), // <-- ИСПРАВЛЕНИЕ: Убираем аргумент отсюда
  params: z.object({
      id: z.string(),
  })
});


// --- Calendar ---
export const setSpecialDaySchema = z.object({
  body: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Неверный формат даты"),
    type: z.enum(['HOLIDAY', 'OVERRIDE']),
    override_schedule_id: z.string().nullable().optional(),
  }).refine(data => {
    return data.type !== 'OVERRIDE' || typeof data.override_schedule_id === 'string';
  }, {
    message: "override_schedule_id обязателен для типа OVERRIDE",
    path: ["override_schedule_id"],
  })
});

// --- Settings ---
export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1, "Текущий пароль обязателен"),
    newPassword: z.string().min(6, "Новый пароль должен быть не менее 6 символов"),
  }),
});

export const updateSchoolNameSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Название школы должно быть не менее 2 символов"),
  }),
});
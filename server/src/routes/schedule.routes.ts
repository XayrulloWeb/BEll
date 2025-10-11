import { Router } from 'express';
import { authenticateToken } from '../auth.middleware';
import { 
    getAllSchoolData,
    createSchedule, 
    deleteSchedule, 
    setActiveSchedule 
} from '../controllers/schedule.controller';
import { validate } from '../validate.middleware';
import { createScheduleSchema, setActiveScheduleSchema } from '../validation.schemas';

const router = Router();

// Маршрут для получения всех данных школы (без валидации, т.к. нет body)
router.get('/data', authenticateToken, getAllSchoolData);

// Маршруты для управления расписаниями
router.post('/schedules', authenticateToken, validate(createScheduleSchema), createSchedule);
router.delete('/schedules/:id', authenticateToken, deleteSchedule); // ID из params, строгая валидация не обязательна

// Маршрут для управления настройками
router.post('/settings/activeSchedule', authenticateToken, validate(setActiveScheduleSchema), setActiveSchedule);

export default router;
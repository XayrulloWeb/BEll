// Файл: src/routes/schedule.routes.ts

import { Router } from 'express';
import { authenticateToken } from '../auth.middleware';
import { 
    getAllSchoolData,
    createSchedule, 
    deleteSchedule, 
    setActiveSchedule 
} from '../controllers/schedule.controller';

const router = Router();

// Маршрут для получения всех данных школы
router.get('/data', authenticateToken, getAllSchoolData);

// Маршруты для управления расписаниями
router.post('/schedules', authenticateToken, createSchedule);
router.delete('/schedules/:id', authenticateToken, deleteSchedule);

// Маршрут для управления настройками
router.post('/settings/activeSchedule', authenticateToken, setActiveSchedule);

export default router;
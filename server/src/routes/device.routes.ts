import { Router } from 'express';
import { authenticateDevice } from '../apiKey.middleware';
import { getMySchedule } from '../controllers/device.controller';

const router = Router();

// Все роуты здесь защищены проверкой API-ключа
router.get('/my-schedule', authenticateDevice, getMySchedule);

export default router;
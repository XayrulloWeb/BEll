// Файл: src/routes/calendar.routes.ts (НОВЫЙ)
import { Router } from 'express';
import { getSpecialDays, setSpecialDay, deleteSpecialDay } from '../controllers/calendar.controller';

const router = Router();

router.get('/', getSpecialDays);
router.post('/', setSpecialDay);
router.delete('/:date', deleteSpecialDay);

export default router;
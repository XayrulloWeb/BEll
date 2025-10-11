import { Router } from 'express';
import { getSpecialDays, setSpecialDay, deleteSpecialDay } from '../controllers/calendar.controller';
import { validate } from '../validate.middleware';
import { setSpecialDaySchema } from '../validation.schemas';

const router = Router();

// GET и DELETE не требуют валидации body
router.get('/', getSpecialDays);
router.delete('/:date', deleteSpecialDay);

// Защищаем только POST роут
router.post('/', validate(setSpecialDaySchema), setSpecialDay);

export default router;
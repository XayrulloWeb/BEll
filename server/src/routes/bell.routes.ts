import { Router } from 'express';
import { authenticateToken } from '../auth.middleware';
import { createBell, updateBell, deleteBell } from '../controllers/bell.controller';
import { validate } from '../validate.middleware';
import { createBellSchema, updateBellSchema } from '../validation.schemas';

const router = Router();

router.post('/', authenticateToken, validate(createBellSchema), createBell);
router.put('/:id', authenticateToken, validate(updateBellSchema), updateBell);
router.delete('/:id', authenticateToken, deleteBell);

export default router;
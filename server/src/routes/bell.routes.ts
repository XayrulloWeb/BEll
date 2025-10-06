// Файл: src/routes/bell.routes.ts

import { Router } from 'express';
import { authenticateToken } from '../auth.middleware';
import { createBell, updateBell, deleteBell } from '../controllers/bell.controller';

const router = Router();

router.post('/', authenticateToken, createBell);
router.put('/:id', authenticateToken, updateBell);
router.delete('/:id', authenticateToken, deleteBell);

export default router;
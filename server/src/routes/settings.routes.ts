// Файл: src/routes/settings.routes.ts (НОВЫЙ ФАЙЛ)

import { Router } from 'express';
import { authenticateToken } from '../auth.middleware';
import { checkRole } from '../role.middleware';
import { validate } from '../validate.middleware';
import { changePasswordSchema, updateSchoolNameSchema } from '../validation.schemas';
import { changePassword, updateSchoolName } from '../controllers/settings.controller';

const router = Router();

// Все роуты здесь требуют аутентификации
router.use(authenticateToken);

// Эндпоинт для смены пароля (доступен всем аутентифицированным пользователям)
router.post('/password', validate(changePasswordSchema), changePassword);

// Эндпоинт для обновления названия школы (доступен только роли 'admin')
router.put('/school', checkRole(['admin']), validate(updateSchoolNameSchema), updateSchoolName);

export default router;
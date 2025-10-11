// Файл: src/routes/auth.routes.ts

import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/auth.controller';
import { validate } from '../validate.middleware';
import { registerUserSchema, loginUserSchema } from '../validation.schemas';

const router = Router();

// Убедитесь, что эндпоинт определен как POST /register
router.post('/register', validate(registerUserSchema), registerUser);

// Убедитесь, что эндпоинт определен как POST /login
router.post('/login', validate(loginUserSchema), loginUser);

export default router;
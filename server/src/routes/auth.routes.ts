// Файл: src/routes/auth.routes.ts

import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/auth.controller';

const router = Router();

// Маршрут для регистрации
router.post('/register', registerUser);

// Маршрут для входа
router.post('/login', loginUser);

export default router;
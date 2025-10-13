// Файл: src/routes/admin.routes.ts (НОВЫЙ ФАЙЛ)

import { Router } from 'express';
import { checkRole } from '../role.middleware';
import { 
    getAllSchools,
    createSchool,
    deleteSchool,
    getUsersBySchool,
    createUser,
    deleteUser
} from '../controllers/admin.controller';

const router = Router();

// Все маршруты в этом файле будут доступны только супер-администратору.
// Мы могли бы добавить `checkRole(['superadmin'])` к каждому роуту,
// но лучше сделать это один раз при подключении роутера в index.ts.

// Маршруты для управления школами
router.get('/schools', getAllSchools);
router.post('/schools', createSchool);
router.delete('/schools/:id', deleteSchool);

// Маршруты для управления пользователями
router.get('/users', getUsersBySchool);       // Получить пользователей по ?schoolId=...
router.post('/users', createUser);
router.delete('/users/:id', deleteUser);

export default router;
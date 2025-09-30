import express, { Request, Response } from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { dbService } from './database.service';
import { authenticateToken, AuthenticatedRequest, requireRole, requireSchoolAccess } from './auth.middleware';
import { generateToken, hashPassword, comparePassword, generateUserId } from './auth.utils';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());
dbService.initialize();

// --- АУТЕНТИФИКАЦИЯ API ENDPOINTS ---
app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
        const { username, password, schoolId, role = 'admin' } = req.body;

        if (!username || !password || !schoolId) {
            return res.status(400).json({ message: 'Неполные данные для регистрации' });
        }

        // Проверяем, существует ли пользователь
        const existingUser = dbService.getUserByUsername(username);
        if (existingUser) {
            return res.status(409).json({ message: 'Пользователь с таким именем уже существует' });
        }

        // Проверяем, существует ли школа
        const schoolData = dbService.getDataForSchool(schoolId);
        if (!schoolData) {
            return res.status(404).json({ message: 'Школа не найдена' });
        }

        // Хешируем пароль
        const bcrypt = require('bcrypt');
        const passwordHash = bcrypt.hashSync(password, 10);
        const userId = generateUserId();

        // Создаем пользователя
        const newUser = dbService.createUser({
            id: userId,
            username,
            passwordHash,
            schoolId,
            role
        });

        // Генерируем токен
        const token = generateToken({
            userId: newUser.id,
            username: newUser.username,
            schoolId: newUser.schoolId,
            role: newUser.role
        });

        res.status(201).json({
            message: 'Пользователь успешно создан',
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                schoolId: newUser.schoolId,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Необходимо указать имя пользователя и пароль' });
        }

        // Находим пользователя
        const user = dbService.getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ message: 'Неверные учетные данные' });
        }

        // Проверяем пароль
        const bcrypt = require('bcrypt');
        const isValidPassword = bcrypt.compareSync(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Неверные учетные данные' });
        }

        // Генерируем токен
        const token = generateToken({
            userId: user.id,
            username: user.username,
            schoolId: user.schoolId,
            role: user.role
        });

        res.status(200).json({
            message: 'Успешный вход в систему',
            token,
            user: {
                id: user.id,
                username: user.username,
                schoolId: user.schoolId,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Ошибка входа:', error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
});

// --- ЗАЩИЩЕННЫЕ МАРШРУТЫ (API ENDPOINTS) ---
app.get('/api/data', authenticateToken, (req: Request, res: Response) => {
    try {
        const schoolId = (req as any).user!.schoolId;
        const data = dbService.getDataForSchool(schoolId);
        if (!data) return res.status(404).json({ message: 'Школа не найдена' });
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
});
app.post('/api/schedules', authenticateToken, (req: Request, res: Response) => {
    try {
        const { id, name } = req.body;
        if (!id || !name) return res.status(400).json({ message: 'Неполные данные' });
        const newSchedule = dbService.addSchedule({ id, name, schoolId: (req as any).user!.schoolId });
        res.status(201).json(newSchedule);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
});

app.delete('/api/schedules/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ message: 'ID расписания не предоставлен' });
        const ok = dbService.deleteSchedule(id);
        if (!ok) return res.status(404).json({ message: 'Расписание не найдено' });
        return res.status(200).json({ message: 'Расписание удалено' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
});

app.post('/api/settings/activeSchedule', authenticateToken, (req: Request, res: Response) => {
    try {
        const { id: scheduleId } = req.body;
        if (!scheduleId) return res.status(400).json({ message: 'ID расписания не предоставлен' });
        const success = dbService.setActiveSchedule((req as any).user!.schoolId, scheduleId);
        if (!success) return res.status(404).json({ message: 'Ошибка установки активного расписания' });
        res.status(200).json({ message: `Активное расписание изменено на ${scheduleId}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
});

app.post('/api/bells', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
        const newBellData: any = req.body;
        if (!newBellData.id || !newBellData.scheduleId) return res.status(400).json({ message: 'Неполные данные' });
        const createdBell = dbService.addBellToSchedule(newBellData);
        res.status(201).json(createdBell);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
});

app.put('/api/bells/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;
        const updatedBell = dbService.updateBell(id, updatedData);
        if (!updatedBell) return res.status(404).json({ message: 'Звонок не найден' });
        res.status(200).json(updatedBell);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
});

app.delete('/api/bells/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const success = dbService.deleteBell(id);
        if (!success) return res.status(404).json({ message: 'Звонок не найден' });
        res.status(200).json({ message: 'Звонок удален' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
});

// --- LESSON SLOTS API (удалено по требованию) ---

// --- ⏰ НОВАЯ ЛОГИКА ПЛАНИРОВЩИКА ⏰ ---

// Порядок дней недели, такой же как в JavaScript's `new Date().getDay()` (Воскресенье=0)
const DAYS_OF_WEEK_JS_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const checkBells = () => {
    // 1. Получаем текущее время и день
    const now = new Date();
    // 'en-GB' дает нам формат HH:mm без AM/PM
    const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const currentDay = DAYS_OF_WEEK_JS_ORDER[now.getDay()];

    console.log(`[Scheduler Tick] ${currentTime} (${currentDay})`);

    try {
        // 2. Вызываем нашу новую мощную функцию из dbService
        const bellsToRing = dbService.getRingingBellsForCurrentTime(currentTime, currentDay);

        // 3. Если есть звонки для этого времени - обрабатываем их
        if (bellsToRing.length > 0) {
            console.log(`🔔🔔🔔 НАЙДЕНО ${bellsToRing.length} ЗВОНКОВ! 🔔🔔🔔`);
            for (const bellInfo of bellsToRing) {
                // В будущем здесь будет логика проигрывания звука для конкретной школы `schoolId`
                console.log(`  -> Школа: "${bellInfo.schoolName}" (${bellInfo.schoolId})`);
                console.log(`     Расписание: "${bellInfo.scheduleName}"`);
                console.log(`     Звонок: "${bellInfo.bellName}"`);
                console.log('----------------------------------------------------');
            }
        }
    } catch (error) {
        console.error('[Scheduler CRITICAL] ❌ Ошибка при проверке звонков:', error);
    }
};

// Запускаем проверку каждую минуту
cron.schedule('* * * * *', checkBells);

console.log('⏰ Мульти-школьный планировщик звонков запущен.');

// --- ЗАПУСК СЕРВЕРА ---
app.listen(PORT, () => {
    console.log(`✅ Сервер успешно запущен на http://localhost:${PORT}`);
});
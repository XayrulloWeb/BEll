// Файл: src/index.ts (ПОЛНАЯ ЗАМЕНА)
import express, { Request, Response } from 'express';
import cors from 'cors';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { dbService } from './database.service';
import { authenticateToken } from './auth.middleware';
import authRoutes from './routes/auth.routes';
import scheduleRoutes from './routes/schedule.routes';
import bellRoutes from './routes/bell.routes';
import calendarRoutes from './routes/calendar.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
dbService.initialize();

// Регистрация маршрутов
app.use('/api/auth', authRoutes); // Открытые
app.use('/api/schedules', authenticateToken, scheduleRoutes);
app.use('/api/bells', authenticateToken, bellRoutes);
app.use('/api/calendar', authenticateToken, calendarRoutes);

// Специальный маршрут для /api/data, который выносится из schedule.routes
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


// Планировщик
const DAYS_OF_WEEK_JS_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const checkBells = () => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const currentDay = DAYS_OF_WEEK_JS_ORDER[now.getDay()];
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const currentDateYYYYMMDD = `${year}-${month}-${day}`;

    try {
        const allSchools = dbService.getAllSchools();
        for (const school of allSchools) {
            const todaysScheduleId = dbService.getScheduleIdForToday(school.id, currentDateYYYYMMDD);
            if (todaysScheduleId) {
                const bellsToRing = dbService.getRingingBellsForSchedule(todaysScheduleId, currentTime, currentDay);
                if (bellsToRing.length > 0) {
                    console.log(`🔔 ЗВОНОК для "${school.name}": ${bellsToRing.map(b => b.name).join(', ')}`);
                }
            }
        }
    } catch (error) {
        console.error('[Scheduler CRITICAL] ❌ Ошибка при проверке звонков:', error);
    }
};

cron.schedule('* * * * *', checkBells);
console.log('⏰ Мульти-школьный планировщик звонков запущен.');

// Запуск сервера
app.listen(PORT, () => {
    console.log(`✅ Сервер успешно запущен на http://localhost:${PORT}`);
});
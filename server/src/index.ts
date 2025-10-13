// Файл: src/index.ts (ПОЛНАЯ ЗАМЕНА)

import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';

import { dbService } from './database.service';
import { authenticateToken } from './auth.middleware';
import { checkRole } from './role.middleware';
import { verifyToken } from './auth.utils';

import authRoutes from './routes/auth.routes';
import scheduleRoutes from './routes/schedule.routes';
import bellRoutes from './routes/bell.routes';
import calendarRoutes from './routes/calendar.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"]
};
app.use(cors(corsOptions));
app.use(express.json());

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: corsOptions
});

// <<< --- ИСПРАВЛЕНИЕ №2: Храним состояние тревог на сервере --- >>>
const alertStates: Record<string, boolean> = {};

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: Token not provided'));
  }
  const payload = verifyToken(token);
  if (!payload) {
    return next(new Error('Authentication error: Invalid token'));
  }
  socket.data.userId = payload.userId;
  socket.data.schoolId = payload.schoolId;
  socket.data.role = payload.role;
  next();
});

io.on('connection', (socket) => {
  const schoolId = socket.data.schoolId;
  console.log(`[Socket.IO] ✅ Пользователь ${socket.data.userId} из школы ${schoolId} подключился.`);

  socket.join(schoolId);
  console.log(`[Socket.IO] 🚪 Пользователь ${socket.data.userId} помещен в комнату ${schoolId}`);
  
  // При подключении сразу сообщаем клиенту, если тревога уже активна
  if (alertStates[schoolId]) {
    socket.emit('play-alert', { alertType: 'fire' });
    console.log(`[Socket.IO] ℹ️ Сообщили новому клиенту ${socket.data.userId}, что тревога активна.`);
  }

  socket.on('emergency-alert', (data) => {
    alertStates[schoolId] = true; // Запоминаем состояние
    io.to(schoolId).emit('play-alert', { alertType: data.alertType || 'fire' });
    console.log(`[Socket.IO] 🔥 Тревога активирована для школы ${schoolId}`);
  });

  socket.on('force-stop-all', () => {
    alertStates[schoolId] = false; // Запоминаем состояние
    io.to(schoolId).emit('stop-alert');
    console.log(`[Socket.IO] 🛑 Тревога для школы ${schoolId} деактивирована.`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] ❌ Пользователь ${socket.data.userId} отключился.`);
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/schedules', authenticateToken, scheduleRoutes);
app.use('/api/bells', authenticateToken, bellRoutes);
app.use('/api/calendar', authenticateToken, calendarRoutes);
app.use('/api/admin', authenticateToken, checkRole(['superadmin']), adminRoutes);

const DAYS_OF_WEEK_JS_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const checkBells = async () => {
  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const currentDay = DAYS_OF_WEEK_JS_ORDER[now.getDay()];
  const currentDateYYYYMMDD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  try {
    const allSchools = await dbService.getAllSchools();
    for (const school of allSchools) {
      const todaysScheduleId = await dbService.getScheduleIdForToday(school.id, currentDateYYYYMMDD);
      if (todaysScheduleId) {
        const bellsToRing = await dbService.getRingingBellsForSchedule(todaysScheduleId, currentTime, currentDay);
        for (const bell of bellsToRing) {
          console.log(`[CRON] 🔔 Звонок для "${school.name}": ${bell.name}. Отправляем событие...`);
          io.to(school.id).emit('ring-the-bell', { 
            bellName: bell.name,
            bellTime: bell.time,
          });
        }
      }
    }
  } catch (error) {
    console.error('[Scheduler CRITICAL] ❌ Ошибка при проверке звонков:', error);
  }
};
cron.schedule('* * * * *', () => { checkBells().catch(console.error); });
console.log('⏰ Мульти-школьный планировщик звонков запущен.');

httpServer.listen(PORT, () => {
  console.log(`✅ Сервер успешно запущен на http://localhost:${PORT}`);
  console.log(`[Socket.IO] 📡 WebSocket сервер слушает на том же порту.`);
});
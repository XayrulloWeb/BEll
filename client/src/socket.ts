// Файл: src/socket.ts (ПОЛНАЯ ЗАМЕНА)

import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './store/useAuthStore';
import useStore from './store/useStore'; // <-- Импортируем наш главный стор
import { toast } from 'sonner';

const URL = 'http://localhost:4000';

let socket: Socket;

export const initiateSocketConnection = () => {
  const token = useAuthStore.getState().token;
  if (!token) return;
  
  socket = io(URL, { auth: { token } });

  socket.on('connect', () => console.log('[Socket.IO] ✅ Успешно подключено к серверу.'));
  socket.on('disconnect', () => console.log('[Socket.IO] ❌ Отключено от сервера.'));
  socket.on('connect_error', (err) => {
    console.error(`[Socket.IO] 🛑 Ошибка подключения: ${err.message}`);
    toast.error("Не удалось подключиться к real-time серверу.");
  });
  
  // --- ОБНОВЛЕННЫЕ ОБРАБОТЧИКИ ---
  
  socket.on('ring-the-bell', (data: { bellName: string, bellTime: string }) => {
    console.log('[Socket.IO] 🔔 Получено событие звонка:', data);
    toast.info(`Прозвенел звонок: ${data.bellName}`, { description: `Время: ${data.bellTime}` });
    useStore.getState().addLogEntry(`Прозвенел звонок: ${data.bellName}`);
  });
  
  socket.on('play-alert', (data: { alertType: string }) => {
    console.log(`[Socket.IO] 🔥 Получено событие тревоги: ${data.alertType}`);
    useStore.getState().activateAlert(); // <-- Вызываем действие в сторе
  });

  socket.on('stop-alert', () => {
    console.log(`[Socket.IO] 🛑 Получено событие остановки тревоги.`);
    useStore.getState().deactivateAlert(); // <-- Вызываем действие в сторе
    toast.success("Тревога отменена.");
  });
};

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};

// --- НОВЫЕ ФУНКЦИИ ДЛЯ ОТПРАВКИ СОБЫТИЙ ---
export const sendEmergencyAlert = (alertType: string) => {
    if (socket) socket.emit('emergency-alert', { alertType });
}

export const sendStopAlert = () => {
    if (socket) socket.emit('force-stop-all');
}
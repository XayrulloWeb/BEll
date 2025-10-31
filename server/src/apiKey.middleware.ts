// Файл: src/apiKey.middleware.ts (НОВЫЙ ФАЙЛ)

import { Response, NextFunction } from 'express';
import { dbService } from './database.service';
import { Request } from 'express';

export interface DeviceRequest extends Request {
    school?: { // Добавляем информацию о школе в запрос
        id: string;
        name: string;
    };
}

export const authenticateDevice = async (req: DeviceRequest, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || typeof apiKey !== 'string') {
        return res.status(401).json({ message: 'API ключ не предоставлен' });
    }

    // Ищем школу по API-ключу
    const school = await dbService.getSchoolByApiKey(apiKey); // Эту функцию мы создадим

    if (!school) {
        return res.status(403).json({ message: 'Неверный API ключ' });
    }

    // Если ключ верный, добавляем информацию о школе в объект запроса
    req.school = school;
    next();
};
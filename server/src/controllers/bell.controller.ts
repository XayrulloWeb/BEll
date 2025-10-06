// Файл: src/controllers/bell.controller.ts

import { Response } from 'express';
import { AuthenticatedRequest } from '../auth.middleware';
import { dbService } from '../database.service';
import { Bell } from '../database.service'; // Убедитесь, что интерфейс Bell экспортируется из dbService

export const createBell = (req: AuthenticatedRequest, res: Response) => {
    try {
        const newBellData: Bell = req.body;
        if (!newBellData.id || !newBellData.scheduleId) return res.status(400).json({ message: 'Неполные данные' });
        const createdBell = dbService.addBellToSchedule(newBellData);
        res.status(201).json(createdBell);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
};

export const updateBell = (req: AuthenticatedRequest, res: Response) => {
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
};

export const deleteBell = (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const success = dbService.deleteBell(id);
        if (!success) return res.status(404).json({ message: 'Звонок не найден' });
        res.status(200).json({ message: 'Звонок удален' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
};
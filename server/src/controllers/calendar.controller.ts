// Файл: src/controllers/calendar.controller.ts (НОВЫЙ)
import { Response } from 'express';
import { AuthenticatedRequest } from '../auth.middleware';
import { dbService } from '../database.service';

export const getSpecialDays = (req: AuthenticatedRequest, res: Response) => {
    try {
        const schoolId = req.user!.schoolId;
        const specialDays = dbService.getSpecialDaysForSchool(schoolId);
        res.status(200).json(specialDays);
    } catch (error) {
        console.error("Ошибка получения особых дней:", error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
};

export const setSpecialDay = (req: AuthenticatedRequest, res: Response) => {
    try {
        const schoolId = req.user!.schoolId;
        const { date, type, override_schedule_id } = req.body;
        
        if (!date || !type || (type === 'OVERRIDE' && !override_schedule_id)) {
            return res.status(400).json({ message: 'Неполные или некорректные данные' });
        }
        
        dbService.setSpecialDay({ date, school_id: schoolId, type, override_schedule_id: override_schedule_id || null });
        res.status(201).json({ message: 'Правило для особого дня успешно сохранено' });
    } catch (error) {
        console.error("Ошибка сохранения особого дня:", error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
};

export const deleteSpecialDay = (req: AuthenticatedRequest, res: Response) => {
    try {
        const schoolId = req.user!.schoolId;
        const { date } = req.params;
        
        const success = dbService.deleteSpecialDay(schoolId, date);
        if (!success) {
            return res.status(404).json({ message: 'Правило для этой даты не найдено' });
        }
        res.status(200).json({ message: 'Правило для особого дня успешно удалено' });
    } catch (error) {
        console.error("Ошибка удаления особого дня:", error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
};
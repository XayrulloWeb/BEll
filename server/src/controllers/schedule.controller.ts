// Файл: src/controllers/schedule.controller.ts

import { Response } from 'express';
import { AuthenticatedRequest } from '../auth.middleware';
import { dbService } from '../database.service';

export const getAllSchoolData = (req: AuthenticatedRequest, res: Response) => {
    try {
        const schoolId = req.user!.schoolId;
        const data = dbService.getDataForSchool(schoolId);
        if (!data) return res.status(404).json({ message: 'Школа не найдена' });
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
};

export const createSchedule = (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id, name } = req.body;
        if (!id || !name) return res.status(400).json({ message: 'Неполные данные' });
        const newSchedule = dbService.addSchedule({ id, name, schoolId: req.user!.schoolId });
        res.status(201).json(newSchedule);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
};

export const deleteSchedule = (req: AuthenticatedRequest, res: Response) => {
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
};

export const setActiveSchedule = (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id: scheduleId } = req.body;
        if (!scheduleId) return res.status(400).json({ message: 'ID расписания не предоставлен' });
        const success = dbService.setActiveSchedule(req.user!.schoolId, scheduleId);
        if (!success) return res.status(404).json({ message: 'Ошибка установки активного расписания' });
        res.status(200).json({ message: `Активное расписание изменено на ${scheduleId}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
};
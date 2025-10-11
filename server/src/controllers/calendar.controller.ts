import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth.middleware';
import { dbService } from '../database.service';

export const getSpecialDays = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const schoolId = req.user!.schoolId;
        const specialDays = await dbService.getSpecialDaysForSchool(schoolId);
        res.status(200).json(specialDays);
    } catch (error) {
        next(error);
    }
};

export const setSpecialDay = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const schoolId = req.user!.schoolId;
        const { date, type, override_schedule_id } = req.body;
        
        await dbService.setSpecialDay({ date, school_id: schoolId, type, override_schedule_id: override_schedule_id || null });
        res.status(201).json({ message: 'Правило для особого дня успешно сохранено' });
    } catch (error) {
        next(error);
    }
};

export const deleteSpecialDay = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const schoolId = req.user!.schoolId;
        const { date } = req.params;
        
        const success = await dbService.deleteSpecialDay(schoolId, date);
        if (!success) {
            return res.status(404).json({ message: 'Правило для этой даты не найдено' });
        }
        res.status(200).json({ message: 'Правило для особого дня успешно удалено' });
    } catch (error) {
        next(error);
    }
};
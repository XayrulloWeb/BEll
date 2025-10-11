import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth.middleware';
import { dbService } from '../database.service';

export const getAllSchoolData = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const schoolId = req.user!.schoolId;
        const data = await dbService.getDataForSchool(schoolId);
        if (!data) return res.status(404).json({ message: 'Школа не найдена' });
        res.status(200).json(data);
    } catch (error) {
        next(error);
    }
};

export const createSchedule = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id, name } = req.body;
        const newSchedule = await dbService.addSchedule({ id, name, schoolId: req.user!.schoolId });
        res.status(201).json(newSchedule);
    } catch (error) {
        next(error);
    }
};

export const deleteSchedule = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const ok = await dbService.deleteSchedule(id);
        if (!ok) return res.status(404).json({ message: 'Расписание не найдено' });
        return res.status(200).json({ message: 'Расписание удалено' });
    } catch (error) {
        next(error);
    }
};

export const setActiveSchedule = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id: scheduleId } = req.body;
        const success = await dbService.setActiveSchedule(req.user!.schoolId, scheduleId);
        if (!success) return res.status(404).json({ message: 'Ошибка установки активного расписания' });
        res.status(200).json({ message: `Активное расписание изменено на ${scheduleId}` });
    } catch (error) {
        next(error);
    }
};
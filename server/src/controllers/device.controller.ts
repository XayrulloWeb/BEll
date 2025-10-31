import { Response, NextFunction } from 'express';
import { DeviceRequest } from '../apiKey.middleware';
import { dbService } from '../database.service';

export const getMySchedule = async (req: DeviceRequest, res: Response, next: NextFunction) => {
    try {
        const schoolId = req.school!.id;
        const simpleSchedule = await dbService.getScheduleForDevice(schoolId);
        res.status(200).json(simpleSchedule);
    } catch (error) {
        next(error);
    }
};
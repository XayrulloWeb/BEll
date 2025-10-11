import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth.middleware';
import { dbService } from '../database.service';
import { Bell } from '../database.service';

export const createBell = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const newBellData = req.body;
        const createdBell = await dbService.addBellToSchedule(newBellData);
        res.status(201).json(createdBell);
    } catch (error) {
        next(error);
    }
};

export const updateBell = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;
        const updatedBell = await dbService.updateBell(id, updatedData);
        if (!updatedBell) return res.status(404).json({ message: 'Звонок не найден' });
        res.status(200).json(updatedBell);
    } catch (error) {
        next(error);
    }
};

export const deleteBell = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const success = await dbService.deleteBell(id);
        if (!success) return res.status(404).json({ message: 'Звонок не найден' });
        res.status(200).json({ message: 'Звонок удален' });
    } catch (error) {
        next(error);
    }
};
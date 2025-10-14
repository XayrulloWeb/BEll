// Файл: src/controllers/settings.controller.ts (НОВЫЙ ФАЙЛ)

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth.middleware';
import { dbService } from '../database.service';
import { comparePassword, hashPassword } from '../auth.utils';

export const changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user!.id;

        // 1. Находим пользователя в базе (включая хэш пароля)
        const user = await dbService.getUserById(userId);
        if (!user) {
            return res.status(404).json({ message: "Пользователь не найден" });
        }

        // 2. Проверяем, совпадает ли старый пароль
        const isMatch = comparePassword(oldPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: "Неверный текущий пароль" });
        }

        // 3. Хешируем и обновляем пароль
        const newPasswordHash = hashPassword(newPassword);
        await dbService.updateUserPassword(userId, newPasswordHash);

        res.status(200).json({ message: "Пароль успешно изменен" });

    } catch (error) {
        next(error);
    }
};

export const updateSchoolName = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { name } = req.body;
        const schoolId = req.user!.schoolId;

        const updatedSchool = await dbService.updateSchoolName(schoolId, name);
        if (!updatedSchool) {
            return res.status(404).json({ message: "Школа не найдена" });
        }

        res.status(200).json({ message: "Название школы успешно обновлено", school: updatedSchool });
        
    } catch (error) {
        next(error);
    }
};
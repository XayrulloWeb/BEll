import { Request, Response, NextFunction } from 'express';
import { dbService } from '../database.service';
import { generateToken, hashPassword, comparePassword } from '../auth.utils';

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { username, password, schoolId, role = 'admin' } = req.body;

        const existingUser = await dbService.getUserByUsername(username);
        if (existingUser) {
            return res.status(409).json({ message: 'Пользователь с таким именем уже существует' });
        }

        const schoolData = await dbService.getDataForSchool(schoolId);
        if (!schoolData) {
            return res.status(404).json({ message: 'Школа не найдена' });
        }

        const passwordHash = hashPassword(password); // <-- Используем нашу функцию

        const newUser = await dbService.createUser({ username, passwordHash, schoolId, role });

        const token = generateToken({ userId: newUser.id, username: newUser.username, schoolId: newUser.schoolId, role: newUser.role });

        res.status(201).json({
            message: 'Пользователь успешно создан',
            token,
            user: { id: newUser.id, username: newUser.username, schoolId: newUser.schoolId, role: newUser.role }
        });
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        next(error);
    }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { username, password } = req.body;

        const user = await dbService.getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ message: 'Неверные учетные данные' });
        }

        const isValidPassword = comparePassword(password, user.passwordHash); // <-- Используем нашу функцию
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Неверные учетные данные' });
        }

        const token = generateToken({ userId: user.id, username: user.username, schoolId: user.schoolId, role: user.role });

        res.status(200).json({
            message: 'Успешный вход в систему',
            token,
            user: { id: user.id, username: user.username, schoolId: user.schoolId, role: user.role }
        });
    } catch (error) {
        console.error('Ошибка входа:', error);
        next(error);
    }
};
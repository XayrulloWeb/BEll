// Файл: src/controllers/auth.controller.ts

import { Request, Response } from 'express';
import { dbService } from '../database.service';
import { generateToken, generateUserId } from '../auth.utils';
import bcrypt from 'bcrypt';

export const registerUser = async (req: Request, res: Response) => {
    try {
        const { username, password, schoolId, role = 'admin' } = req.body;

        if (!username || !password || !schoolId) {
            return res.status(400).json({ message: 'Неполные данные для регистрации' });
        }

        const existingUser = dbService.getUserByUsername(username);
        if (existingUser) {
            return res.status(409).json({ message: 'Пользователь с таким именем уже существует' });
        }

        const schoolData = dbService.getDataForSchool(schoolId);
        if (!schoolData) {
            return res.status(404).json({ message: 'Школа не найдена' });
        }

        const passwordHash = bcrypt.hashSync(password, 10);
        const userId = generateUserId();

        const newUser = dbService.createUser({
            id: userId,
            username,
            passwordHash,
            schoolId,
            role
        });

        const token = generateToken({
            userId: newUser.id,
            username: newUser.username,
            schoolId: newUser.schoolId,
            role: newUser.role
        });

        res.status(201).json({
            message: 'Пользователь успешно создан',
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                schoolId: newUser.schoolId,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Необходимо указать имя пользователя и пароль' });
        }

        const user = dbService.getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ message: 'Неверные учетные данные' });
        }

        const isValidPassword = bcrypt.compareSync(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Неверные учетные данные' });
        }

        const token = generateToken({
            userId: user.id,
            username: user.username,
            schoolId: user.schoolId,
            role: user.role
        });

        res.status(200).json({
            message: 'Успешный вход в систему',
            token,
            user: {
                id: user.id,
                username: user.username,
                schoolId: user.schoolId,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Ошибка входа:', error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
};
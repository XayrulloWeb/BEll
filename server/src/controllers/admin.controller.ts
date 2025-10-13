// Файл: src/controllers/admin.controller.ts (НОВЫЙ ФАЙЛ)

import { Request, Response, NextFunction } from 'express';
import { dbService } from '../database.service';
import { hashPassword } from '../auth.utils';

// --- Управление Школами ---

export const getAllSchools = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const schools = await dbService.getAllSchools();
        res.status(200).json(schools);
    } catch (error) {
        next(error);
    }
};

export const createSchool = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: "Необходимо указать название школы" });
        }
        const newSchool = await dbService.createSchool({ name }); // Нам нужно будет добавить эту функцию в dbService
        res.status(201).json(newSchool);
    } catch (error) {
        next(error);
    }
};

export const deleteSchool = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const success = await dbService.deleteSchool(id); // И эту функцию
        if (!success) {
            return res.status(404).json({ message: "Школа не найдена" });
        }
        res.status(200).json({ message: "Школа успешно удалена" });
    } catch (error) {
        next(error);
    }
};


// --- Управление Пользователями ---

export const getUsersBySchool = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const schoolId = req.query.schoolId as string;
        if (!schoolId) {
            return res.status(400).json({ message: "Необходимо указать ID школы" });
        }
        const users = await dbService.getUsersBySchool(schoolId);
        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { username, password, schoolId, role } = req.body;
        // Zod сделает эту проверку, но дублирование не повредит
        if (!username || !password || !schoolId) {
            return res.status(400).json({ message: "Необходимо указать имя, пароль и ID школы" });
        }
        
        const existingUser = await dbService.getUserByUsername(username);
        if (existingUser) {
            return res.status(409).json({ message: 'Пользователь с таким именем уже существует' });
        }

        const passwordHash = hashPassword(password);
        const newUser = await dbService.createUser({ username, passwordHash, schoolId, role: role || 'admin' });
        
        // Не отправляем хэш пароля на клиент
        const { passwordHash: _, ...userWithoutPassword } = newUser;
        res.status(201).json(userWithoutPassword);

    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const success = await dbService.deleteUser(id);
        if (!success) {
            return res.status(404).json({ message: "Пользователь не найден" });
        }
        res.status(200).json({ message: "Пользователь успешно удален" });
    } catch (error) {
        next(error);
    }
};
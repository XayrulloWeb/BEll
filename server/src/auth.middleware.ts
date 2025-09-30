import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { dbService } from './database.service';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        username: string;
        schoolId: string;
        role: 'admin' | 'superadmin';
    };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Токен доступа не предоставлен' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
        if (err) {
            return res.status(403).json({ message: 'Недействительный токен' });
        }

        // Получаем актуальную информацию о пользователе из базы данных
        const user = dbService.getUserById(decoded.userId);
        if (!user) {
            return res.status(403).json({ message: 'Пользователь не найден' });
        }

        req.user = {
            id: user.id,
            username: user.username,
            schoolId: user.schoolId,
            role: user.role
        };
        next();
    });
};

export const requireRole = (roles: ('admin' | 'superadmin')[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Пользователь не аутентифицирован' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Недостаточно прав доступа' });
        }

        next();
    };
};

export const requireSchoolAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Пользователь не аутентифицирован' });
    }

    // Superadmin может получить доступ к любой школе
    if (req.user.role === 'superadmin') {
        return next();
    }

    // Admin может получить доступ только к своей школе
    const schoolId = req.params.schoolId || req.body.schoolId || req.query.schoolId;
    if (schoolId && schoolId !== req.user.schoolId) {
        return res.status(403).json({ message: 'Доступ запрещен к данной школе' });
    }

    next();
};

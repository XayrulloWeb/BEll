import { Response, NextFunction } from 'express';
import { Request } from 'express';
import { dbService } from './database.service';
import { verifyToken } from './auth.utils'; // <-- Импортируем нашу функцию

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    schoolId: string;
    role: 'admin' | 'superadmin';
  };
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.sendStatus(401);
    }

    try {
        const decoded = verifyToken(token); // <-- Используем нашу единую функцию

        if (!decoded) {
            return res.status(403).json({ message: "Невалидный токен" });
        }
        
        const user = await dbService.getUserById(decoded.userId);

        if (!user) {
            return res.sendStatus(403);
        }

        req.user = { id: user.id, username: user.username, schoolId: user.schoolId, role: user.role };
        next();
    } catch (err) {
        console.error("Authentication middleware error:", err);
        return res.status(500).json({ message: "Внутренняя ошибка сервера" });
    }
};
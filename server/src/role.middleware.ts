// Файл: src/role.middleware.ts (НОВЫЙ ФАЙЛ)

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

// Определяем возможные роли. В будущем можно будет добавить 'teacher', 'student' и т.д.
type UserRole = 'admin' | 'superadmin';

/**
 * Middleware для проверки, имеет ли пользователь хотя бы одну из разрешенных ролей.
 * @param allowedRoles Массив ролей, которым разрешен доступ.
 */
export const checkRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Получаем пользователя из объекта запроса, который был добавлен в auth.middleware
    const user = req.user;

    // Если пользователя нет или у него нет роли, отказываем в доступе
    if (!user || !user.role) {
      return res.status(403).json({ message: 'Доступ запрещен: недостаточно прав.' });
    }

    // Проверяем, есть ли роль пользователя в списке разрешенных
    if (allowedRoles.includes(user.role)) {
      // Если есть, передаем управление следующему middleware или контроллеру
      next(); 
    } else {
      // Если нет, отказываем в доступе
      return res.status(403).json({ message: 'Доступ запрещен: недостаточно прав.' });
    }
  };
};
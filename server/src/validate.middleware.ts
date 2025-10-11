// Файл: src/validate.middleware.ts (ФИНАЛЬНАЯ, САМАЯ НАДЕЖНАЯ ВЕРСИЯ)

import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodTypeAny } from 'zod'; // Импортируем ZodTypeAny

// Используем более общий тип ZodTypeAny
export const validate = (schema: ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Ошибки по-прежнему берем из .issues
        return res.status(400).json({
          message: 'Ошибка валидации входящих данных',
          errors: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }
      // Передаем дальше, если это не ошибка Zod
      next(error); 
    }
  };
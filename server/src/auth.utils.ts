import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Читаем секрет из .env ОДИН РАЗ
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("Критическая ошибка: JWT_SECRET не определен в .env файле.");
}

const JWT_EXPIRES_IN = '24h';

export interface JWTPayload {
    userId: string;
    username: string;
    schoolId: string;
    role: 'admin' | 'superadmin';
}

// ГЕНЕРАЦИЯ ТОКЕНА
export const generateToken = (payload: JWTPayload): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// ПРОВЕРКА ТОКЕНА (для middleware)
export const verifyToken = (token: string): JWTPayload | null => {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
        return null;
    }
};

// ХЕШИРОВАНИЕ ПАРОЛЯ
export const hashPassword = (password: string): string => {
    return bcrypt.hashSync(password, 10);
};

// СРАВНЕНИЕ ПАРОЛЯ
export const comparePassword = (password: string, hash: string): boolean => {
    return bcrypt.compareSync(password, hash);
};

// Prisma сама генерирует UUID, эта функция больше не нужна, но оставим на всякий случай
export const generateUserId = (): string => {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
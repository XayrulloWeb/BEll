// Файл: prisma/seed.ts (ФИНАЛЬНАЯ ВЕРСИЯ ДЛЯ ЧИСТОЙ УСТАНОВКИ)

import { PrismaClient } from '@prisma/client';
// Убедитесь, что путь к auth.utils правильный
import { hashPassword } from '../src/auth.utils';

const prisma = new PrismaClient();

async function main() {
  console.log(`Начинаем сидинг для чистой установки...`);

  // --- 1. Создаем тестовую школу ---
  const schoolId = 'school_test_001';
  await prisma.school.upsert({
    where: { id: schoolId },
    update: {}, // Если вдруг существует, ничего не меняем
    create: {
      id: schoolId,
      name: 'Тестовая Школа №1',
    },
  });
  console.log(`✅ Школа 'Тестовая Школа №1' создана/проверена.`);

  // --- 2. Создаем супер-администратора с известным паролем ---
  const superadminUsername = 'superadmin';
  const superadminPassword = 'superadmin123'; // <-- ВАШ ПАРОЛЬ
  const hashedPassword = hashPassword(superadminPassword);

  await prisma.user.upsert({
    where: { username: superadminUsername },
    update: { // Если пользователь уже есть, просто обновляем его данные на всякий случай
      passwordHash: hashedPassword,
      role: 'superadmin',
      schoolId: schoolId,
    },
    create: { // Если пользователя нет - создаем
      username: superadminUsername,
      passwordHash: hashedPassword,
      role: 'superadmin',
      schoolId: schoolId,
    }
  });

  console.log(`✅ Супер-администратор '${superadminUsername}' создан/обновлен.`);
  console.log(`   -> Пароль: ${superadminPassword}`);

  console.log(`Сидинг завершен.`);
}

main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
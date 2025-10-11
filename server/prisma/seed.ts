// Файл: prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log(`Начинаем сидинг...`);
  const schoolId = 'school_test_001';
  const existingSchool = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!existingSchool) {
    await prisma.school.create({ data: { id: schoolId, name: 'Тестовая Школа №1' } });
    console.log(`✅ Создана тестовая школа с ID: ${schoolId}`);
  } else {
    console.log(`ℹ️ Тестовая школа с ID: ${schoolId} уже существует.`);
  }
  console.log(`Сидинг завершен.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
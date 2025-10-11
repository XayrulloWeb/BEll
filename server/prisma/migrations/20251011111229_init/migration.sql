-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active_schedule_id" TEXT,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bells" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sound_id" TEXT,
    "bell_type" TEXT NOT NULL DEFAULT 'lesson',
    "break_duration" INTEGER NOT NULL DEFAULT 0,
    "auto_generated" BOOLEAN NOT NULL DEFAULT false,
    "group_id" TEXT,
    "schedule_id" TEXT NOT NULL,

    CONSTRAINT "bells_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "special_days" (
    "date" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "override_schedule_id" TEXT,

    CONSTRAINT "special_days_pkey" PRIMARY KEY ("date","school_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bells" ADD CONSTRAINT "bells_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "special_days" ADD CONSTRAINT "special_days_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "special_days" ADD CONSTRAINT "special_days_override_schedule_id_fkey" FOREIGN KEY ("override_schedule_id") REFERENCES "schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

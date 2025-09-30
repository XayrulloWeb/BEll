// Файл: src/layouts/Header.tsx

import { UserCircle2, LogOut, Settings } from "lucide-react";
import useStore from "@/store/useStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
    // Получаем данные из нашего "мозга"
    const { activeScheduleId, schedules } = useStore();
    const { user, logout } = useAuthStore();

    // Безопасно получаем активное расписание.
    // Знак '?' не даст коду сломаться, если schedules еще не загрузились.
    const activeSchedule = schedules?.[activeScheduleId];

    const handleLogout = () => {
        logout();
    };

    return (
        <header className="py-4 px-8 bg-white/70 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
            <div className="flex justify-between items-center">
                {/* Левая часть: Приветствие и статус */}
                <div>
                    <h1 className="text-xl font-bold text-slate-800">
                        Добро пожаловать, {user?.username}!
                    </h1>
                    <p className="text-sm text-slate-500">
                        Активное расписание:
                        <span className="ml-1 font-semibold text-blue-600">
                            {/* Если расписание есть - показываем имя, если нет - показываем 'None' */}
                            {activeSchedule ? activeSchedule.name : 'Не выбрано'}
                        </span>
                    </p>
                </div>

                {/* Правая часть: Меню пользователя */}
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-700 hidden sm:block">
                        {user?.role === 'superadmin' ? 'Супер-администратор' : 'Администратор'}
                    </span>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                                    <UserCircle2 className="text-slate-500" />
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user?.username}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user?.schoolId}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Настройки</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Выйти</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
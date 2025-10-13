// Файл: src/layouts/Sidebar.tsx (ИСПРАВЛЕННАЯ И ОБЪЕДИНЕННАЯ ВЕРСИЯ)

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    Bell, 
    LayoutDashboard, 
    ListTodo, 
    CalendarDays, 
    ShieldCheck 
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore'; // Импортируем authStore для получения роли

// Определяем пропсы для нашего компонента-ссылки
type NavItemProps = {
    to: string;
    icon: React.ElementType;
    label: string;
};

// Компонент NavItem, который будет использоваться для всех ссылок
const NavItem = ({ to, icon: Icon, label }: NavItemProps) => {
    const location = useLocation();
    const isActive = location.pathname.startsWith(to); // Используем startsWith для "подсвечивания" под-путей

    return (
        <Link
            to={to}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50" // Стиль для активной ссылки
                    : "text-slate-600 hover:bg-slate-100" // Стиль для неактивной ссылки
            }`}
        >
            <Icon size={20} />
            <span>{label}</span>
        </Link>
    );
};

export function Sidebar() {
    // Получаем информацию о пользователе из хранилища аутентификации
    const user = useAuthStore(state => state.user);

    return (
        <aside className="w-64 h-screen bg-white shadow-lg p-4 flex flex-col fixed top-0 left-0">
            <div className="text-2xl font-bold text-blue-600 p-4 flex items-center gap-2">
                <Bell />
                <span>School Bell</span>
            </div>
            <nav className="mt-8 space-y-2">
                {/* Основные навигационные ссылки */}
                <NavItem
                    to="/dashboard"
                    icon={LayoutDashboard}
                    label="Главная"
                />
                <NavItem
                    to="/schedule"
                    icon={ListTodo}
                    label="Расписания"
                />
                <NavItem
                    to="/calendar"
                    icon={CalendarDays}
                    label="Календарь"
                />
                
                {/* Условный рендеринг: эта ссылка появится только для супер-админа */}
                {user?.role === 'superadmin' && (
                    <NavItem
                        to="/superadmin"
                        icon={ShieldCheck}
                        label="Super Admin"
                    />
                )}
            </nav>
        </aside>
    );
}
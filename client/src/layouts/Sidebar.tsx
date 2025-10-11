// Файл: src/layouts/Sidebar.tsx (ПОЛНАЯ ЗАМЕНА)
import React from "react";
import { Bell, LayoutDashboard, CalendarClock } from "lucide-react";
import { Link, useLocation } from 'react-router-dom';

// Props NavItem изменены: теперь мы передаем `to` (адрес), а не функцию
type NavItemProps = {
    to: string;
    icon: React.ElementType;
    label: string;
};

// NavItem теперь - это ссылка, которая сама определяет свою активность
const NavItem = ({ to, icon: Icon, label }: NavItemProps) => {
    // Получаем текущий адрес страницы
    const location = useLocation();
    // Проверяем, активна ли ссылка
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
                    : "text-slate-600 hover:bg-slate-100"
            }`}
        >
            <Icon size={20} />
            <span>{label}</span>
        </Link>
    );
};

// Sidebar больше не принимает пропсы currentPage и setPage
export function Sidebar() {
    return (
        <aside className="w-64 h-screen bg-white shadow-lg p-4 flex flex-col fixed top-0 left-0">
            <div className="text-2xl font-bold text-blue-600 p-4 flex items-center gap-2">
                <Bell />
                <span>School Bell</span>
            </div>
            <nav className="mt-8 space-y-2">
                {/* Теперь это настоящие ссылки с адресами */}
                <NavItem
                    to="/dashboard"
                    icon={LayoutDashboard}
                    label="Dashboard"
                />
                <NavItem
                    to="/schedule"
                    icon={CalendarClock} // Заменил иконку для большей наглядности
                    label="Schedule"
                />
                  <NavItem
                    to="/calendar"
                    icon={CalendarClock} // Заменил иконку для большей наглядности
                    label="Calendar"
                />
            </nav>
        </aside>
    );
}
// Файл: src/layouts/Sidebar.tsx

import { Bell, LayoutDashboard } from "lucide-react";
import React from "react";


interface SidebarProps {
    currentPage: string;
    setPage: (page: string) => void;
}


type NavItemProps = {
    icon: React.ElementType; // Специальный тип для компонентов, таких как иконки
    label: string;
    isActive: boolean;
    onClick: () => void; // Функция, которая ничего не возвращает
};


const NavItem = ({ icon: Icon, label, isActive, onClick }: NavItemProps) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            isActive
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50" // Добавим тень для активного элемента
                : "text-slate-600 hover:bg-slate-100"
        }`}
    >
        <Icon size={20} />
        <span>{label}</span>
    </button>
);

// === КОНЕЦ ИСПРАВЛЕНИЙ ===

export function Sidebar({ currentPage, setPage }: SidebarProps) {
    return (
        <aside className="w-64 h-screen bg-white shadow-lg p-4 flex flex-col fixed top-0 left-0">
            <div className="text-2xl font-bold text-blue-600 p-4 flex items-center gap-2">
                <Bell />
                <span>School Bell</span>
            </div>
            <nav className="mt-8 space-y-2">
                <NavItem
                    icon={LayoutDashboard}
                    label="Dashboard"
                    isActive={currentPage === 'dashboard'}
                    onClick={() => setPage('dashboard')}
                />
                <NavItem
                    icon={Bell}
                    label="Schedule"
                    isActive={currentPage === 'schedule'}
                    onClick={() => setPage('schedule')}
                />

            </nav>
        </aside>
    );
}
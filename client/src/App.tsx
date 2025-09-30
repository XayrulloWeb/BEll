import { useEffect } from "react";
import { DashboardPage } from "./pages/Dashboard";
import { SchedulePage } from "./pages/Schedule";
import { LoginPage } from "./pages/Login"; // Убедись что путь правильный
import { Sidebar } from "./layouts/Sidebar";
import { Header } from "./layouts/Header";
import useStore from "./store/useStore";
import { useAuthStore } from "./store/useAuthStore";
import { useState } from 'react'; // Убедись что useState импортирован, если его нет

const FullscreenLoader = ({ text }: { text: string }) => (
    <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-slate-500">{text}</p>
        </div>
    </div>
);

function App() {
    const [page, setPage] = useState('dashboard');

    // Состояние аутентификации
    const { isAuthenticated, _isRestored } = useAuthStore();

    // Состояние данных
    const fetchInitialData = useStore(state => state.fetchInitialData);
    const dataLoading = useStore(state => state.isLoading);

    // Этот эффект запускается при входе/выходе пользователя, НО только после восстановления состояния
    useEffect(() => {
        if (_isRestored && isAuthenticated) {
            fetchInitialData();
        }
    }, [_isRestored, isAuthenticated, fetchInitialData]);

    // Пока Zustand не восстановил состояние из localStorage, показываем главный загрузчик
    if (!_isRestored) {
        return <FullscreenLoader text="Инициализация приложения..." />;
    }

    // Если пользователь не аутентифицирован (уже после восстановления), показываем страницу входа
    if (!isAuthenticated) {
        // isLoading здесь относится к процессу логина/регистрации
        // LoginPage сам внутри будет управлять этим состоянием из useAuthStore
        return <LoginPage />;
    }

    // Если пользователь аутентифицирован, но данные еще грузятся
    if (dataLoading) {
        return <FullscreenLoader text="Загрузка данных системы..." />;
    }

    // Все загружено, показываем основное приложение
    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            <Sidebar currentPage={page} setPage={setPage} />
            <div className="ml-64"> {/* Убедись, что ml-64 соответствует ширине Sidebar */}
                <Header />
                <main className="p-8">
                    {page === 'dashboard' && <DashboardPage />}
                    {page === 'schedule' && <SchedulePage />}
                </main>
            </div>
        </div>
    );
}

export default App;
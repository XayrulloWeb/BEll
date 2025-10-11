// Файл: src/App.tsx (ПОЛНАЯ ЗАМЕНА)
import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardPage } from "./pages/Dashboard";
import { SchedulePage } from "./pages/Schedule";
import { LoginPage } from "./pages/Login";
import { Sidebar } from "./layouts/Sidebar";
import { Header } from "./layouts/Header";
import useStore from "./store/useStore";
import { useAuthStore } from "./store/useAuthStore";
import { Toaster } from "sonner";
import { CalendarPage } from "./pages/Calendar";

const FullscreenLoader = ({ text }: { text: string }) => (
  <div className="flex items-center justify-center h-screen bg-slate-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-lg text-slate-500">{text}</p>
    </div>
  </div>
);

// Компонент-обертка для страниц, требующих входа
const ProtectedLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-slate-50 text-slate-800">
    <Sidebar />
    <div className="ml-64">
      <Header />
      <main className="p-8">{children}</main>
    </div>
  </div>
);

function App() {
  const { isAuthenticated, _isRestored } = useAuthStore();
  const fetchInitialData = useStore((state) => state.fetchInitialData);
  const dataLoading = useStore((state) => state.isLoading);

  useEffect(() => {
    if (_isRestored && isAuthenticated) {
      fetchInitialData();
    }
  }, [_isRestored, isAuthenticated, fetchInitialData]);

  // 1. Пока состояние не восстановлено, показываем главный лоадер
  if (!_isRestored) {
    return <FullscreenLoader text="Инициализация приложения..." />;
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      <Routes>
        {!isAuthenticated ? (
          // 2. Если пользователь не вошел
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : dataLoading ? (
          // 3. Если данные еще грузятся
          <Route
            path="*"
            element={<FullscreenLoader text="Загрузка данных системы..." />}
          />
        ) : (
          // 4. Если пользователь вошел и данные готовы
          <>
            <Route
              path="/dashboard"
              element={
                <ProtectedLayout>
                  <DashboardPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/schedule"
              element={
                <ProtectedLayout>
                  <SchedulePage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedLayout>
                  <CalendarPage />
                </ProtectedLayout>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        )}
      </Routes>
    </>
  );
}

export default App;

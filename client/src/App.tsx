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
import { SuperAdminPage } from './pages/SuperAdminPage';
import { initiateSocketConnection, disconnectSocket, sendStopAlert } from "./socket";
import { motion, AnimatePresence } from "framer-motion";
import { Siren, BellOff } from "lucide-react";
import { Button } from "./components/ui/button";

const FullscreenLoader = ({ text }: { text: string }) => (
  <div className="flex items-center justify-center h-screen bg-slate-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-lg text-slate-500">{text}</p>
    </div>
  </div>
);

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-slate-50 text-slate-800">
    <Sidebar />
    <div className="ml-64">
      <Header />
      <main className="p-8">{children}</main>
    </div>
  </div>
);

// Новый компонент для оверлея, который теперь содержит кнопку
const EmergencyAlertOverlay = () => {
    const isAlertActive = useStore(state => state.isAlertActive);
    const user = useAuthStore(state => state.user);

    return (
        <AnimatePresence>
            {isAlertActive && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-red-500/80 z-50 flex flex-col items-center justify-center text-white backdrop-blur-sm"
                >
                    <Siren className="h-24 w-24 animate-ping" />
                    <h1 className="mt-8 text-6xl font-bold tracking-wider uppercase">Тревога</h1>
                    
                    {/* Кнопка отключения внутри оверлея */}
                    {user?.role === 'admin' && (
                        <Button 
                            variant="secondary" 
                            size="lg"
                            onClick={() => sendStopAlert()} 
                            className="mt-12 flex items-center gap-2 text-lg"
                        >
                            <BellOff className="h-6 w-6" />
                            Отключить тревогу
                        </Button>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

function App() {
  const { isAuthenticated, _isRestored, user } = useAuthStore();
  const fetchInitialData = useStore((state) => state.fetchInitialData);
  const dataLoading = useStore((state) => state.isLoading);

  useEffect(() => {
    if (_isRestored && isAuthenticated) {
      fetchInitialData();
      initiateSocketConnection();
    }
    return () => {
      disconnectSocket();
    };
  }, [_isRestored, isAuthenticated, fetchInitialData]);

  if (!_isRestored) {
    return <FullscreenLoader text="Инициализация приложения..." />;
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      <EmergencyAlertOverlay /> {/* <-- Наш оверлей */}
      <Routes>
        {!isAuthenticated ? (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : dataLoading ? (
          <Route
            path="*"
            element={<FullscreenLoader text="Загрузка данных системы..." />}
          />
        ) : (
          <>
            <Route
              path="/dashboard"
              element={<ProtectedLayout><DashboardPage /></ProtectedLayout>}
            />
            <Route
              path="/schedule"
              element={<ProtectedLayout><SchedulePage /></ProtectedLayout>}
            />
            <Route
              path="/calendar"
              element={<ProtectedLayout><CalendarPage /></ProtectedLayout>}
            />
            {user?.role === 'superadmin' && (
              <Route
                path="/superadmin"
                element={<ProtectedLayout><SuperAdminPage /></ProtectedLayout>}
              />
            )}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        )}
      </Routes>
    </>
  );
}

export default App;
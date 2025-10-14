import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import useStore, { Bell, BellData, GeneratorParams } from '../store/useStore';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScheduleManager } from '@/components/schedule/ScheduleManager';
import { ScheduleWizard } from '@/components/schedule/ScheduleWizard';
import { BellFormDialog } from '@/components/schedule/BellFormDialog';
import { DayScheduleCard } from '@/components/schedule/DayScheduleCard';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Определяем начальное состояние для формы звонка
const initialBellFormData: BellData = { time: '', day: 'Monday', name: '', enabled: true, soundId: 'sound-1', bellType: 'lesson', breakDuration: 10 };

export function SchedulePage() {
    // --- Глобальное состояние из Zustand ---
    const { schedules, activeScheduleId, addBell, updateBell, deleteBell, isLoading, isServerError, generateDayBells } = useStore();
    const activeSchedule = activeScheduleId ? schedules[activeScheduleId] : undefined;

    // --- Локальное состояние для управления UI ---
    const [isBellDialogOpen, setIsBellDialogOpen] = useState(false);
    const [editingBell, setEditingBell] = useState<Bell | null>(null);
    const [deletingBellId, setDeletingBellId] = useState<string | null>(null);
    const [generatorParams, setGeneratorParams] = useState<Omit<GeneratorParams, 'action'> | null>(null);
    const [isGeneratorConfirmOpen, setIsGeneratorConfirmOpen] = useState(false);
    // <<< --- ДОБАВЛЕНО НЕДОСТАЮЩЕЕ СОСТОЯНИЕ ДЛЯ ФОРМЫ --- >>>
    const [bellFormData, setBellFormData] = useState<BellData>(initialBellFormData);
    
    // --- Обработчики событий ---
   
    const handleAddNewBellClick = (day: string) => {
        setEditingBell(null);

        const lastBellInDay = activeSchedule?.bells
            .filter(bell => bell.day === day)
            .sort((a, b) => b.time.localeCompare(a.time))[0];

        let nextTime = '08:30';

        if (lastBellInDay) {
            const [hours, minutes] = lastBellInDay.time.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes + 15, 0, 0);
            nextTime = date.toTimeString().slice(0, 5);
        }
        
        // Передаем данные в BellFormDialog через пропсы мы не можем,
        // так как он уже использует свое внутреннее состояние.
        // Поэтому мы обновим его пропс `editingBell`, установив его в `null`.
        // А для передачи данных при создании, нам нужно будет модифицировать BellFormDialog.
        // Но пока что, мы можем просто установить начальные данные.
        // Мы передадим `bellFormData` в `BellFormDialog` позже.
        // А пока просто откроем диалог.
        setBellFormData({
            ...initialBellFormData,
            day: day,
            time: nextTime,
        });
        setIsBellDialogOpen(true);
    };
    
    const handleEditBellClick = (bell: Bell) => {
        setEditingBell(bell);
        // При редактировании нам не нужно менять `bellFormData`, т.к. `BellFormDialog`
        // сам установит свое состояние на основе `editingBell`.
        setIsBellDialogOpen(true);
    };

    const handleBellFormSubmit = (bellData: BellData) => {
        if (editingBell) {
            updateBell(editingBell.id, bellData);
        } else if (activeScheduleId) {
            // Для создания нового звонка мы используем данные, пришедшие из формы
            addBell(activeScheduleId, bellData);
        }
        setIsBellDialogOpen(false);
    };

    const handleWizardGenerate = (params: Omit<GeneratorParams, 'action'>) => {
        const bellsOnSelectedDay = activeSchedule?.bells.filter(bell => bell.day === params.day);
        if (bellsOnSelectedDay && bellsOnSelectedDay.length > 0) {
            setGeneratorParams(params);
            setIsGeneratorConfirmOpen(true);
        } else {
            generateDayBells({ ...params, action: 'overwrite' });
        }
    };

    const executeGeneration = (action: 'append' | 'overwrite') => {
        if (generatorParams) {
            generateDayBells({ ...generatorParams, action });
        }
        setIsGeneratorConfirmOpen(false);
        setGeneratorParams(null);
    };

    // --- Отображение состояний загрузки/ошибки ---
    if (isLoading) return <div className="p-8 text-center">Загрузка расписания...</div>;
    if (isServerError) return <div className="p-8 text-center text-red-500 font-bold">Ошибка подключения к серверу.</div>;
    
    // --- Подготовка данных для отображения ---
    const groupedSchedule = useMemo(() => activeSchedule ? DAYS.reduce((acc, day) => {
        acc[day] = activeSchedule.bells.filter(b => b.day === day).sort((a, b) => a.time.localeCompare(b.time));
        return acc;
    }, {} as Record<string, Bell[]>) : {}, [activeSchedule]);

    // --- JSX РЕНДЕРИНГ ---
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center gap-3 flex-wrap">
                <ScheduleManager />
                {/* Старая кнопка закомментирована */}
            </div>

            {activeScheduleId && <ScheduleWizard scheduleId={activeScheduleId} onGenerate={handleWizardGenerate} />}

            <BellFormDialog
                isOpen={isBellDialogOpen}
                onOpenChange={setIsBellDialogOpen}
                onSubmit={handleBellFormSubmit}
                editingBell={editingBell}
                // Передаем начальные данные для нового звонка
                initialDataForCreate={editingBell ? null : bellFormData}
            />
            
            {!activeSchedule ? (
                <Alert className="mt-8">
                    <AlertTitle>Расписание не выбрано!</AlertTitle>
                    <AlertDescription>Пожалуйста, выберите расписание из выпадающего списка выше или создайте новое, чтобы начать.</AlertDescription>
                </Alert>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {DAYS.map(day => (
                        <DayScheduleCard
                            key={day}
                            day={day}
                            bells={groupedSchedule[day]}
                            onEdit={handleEditBellClick}
                            onDelete={(bellId) => setDeletingBellId(bellId)}
                            // <<< --- ПЕРЕДАЕМ НОВЫЙ ПРОПС --- >>>
                            onAdd={handleAddNewBellClick}
                        />
                    ))}
                </div>
            )}
            
            {/* Диалоги подтверждения */}
            <AlertDialog open={!!deletingBellId} onOpenChange={() => setDeletingBellId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Вы уверены?</AlertDialogTitle><AlertDialogDescription>Это действие невозможно отменить. Звонок будет удален навсегда.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => { if (deletingBellId) { deleteBell(deletingBellId); setDeletingBellId(null); } }}>Да, удалить</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={isGeneratorConfirmOpen} onOpenChange={setIsGeneratorConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>На этот день уже есть звонки</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                           <div>Выберите, что сделать с существующими звонками для <b>{generatorParams?.day}</b>. <ul className="list-disc pl-5 mt-2 space-y-1"><li><b>Заменить:</b> Полностью очистить день и создать новое расписание.</li><li><b>Добавить:</b> Сохранить старые звонки и добавить к ним новые.</li></ul></div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={() => executeGeneration('append')}>Добавить</AlertDialogAction>
                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => executeGeneration('overwrite')}>Заменить</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div>
    );
}
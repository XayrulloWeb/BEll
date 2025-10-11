// Файл: src/pages/SchedulePage.tsx (ПОЛНАЯ ЗАМЕНА)

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import useStore, { Bell, BellData, GeneratorParams } from '../store/useStore';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScheduleManager } from '@/components/schedule/ScheduleManager';
import { ScheduleWizard } from '@/components/schedule/ScheduleWizard';
import { BellFormDialog } from '@/components/schedule/BellFormDialog';
import { DayScheduleCard } from '@/components/schedule/DayScheduleCard';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
    
    // --- Обработчики событий ---
    const handleAddNewBellClick = () => {
        setEditingBell(null);
        setIsBellDialogOpen(true);
    };
    
    const handleEditBellClick = (bell: Bell) => {
        setEditingBell(bell);
        setIsBellDialogOpen(true);
    };

    const handleBellFormSubmit = (bellData: BellData) => {
        if (editingBell) {
            updateBell(editingBell.id, bellData);
        } else if (activeScheduleId) {
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
    const groupedSchedule = activeSchedule ? DAYS.reduce((acc, day) => {
        acc[day] = activeSchedule.bells.filter(b => b.day === day).sort((a, b) => a.time.localeCompare(b.time));
        return acc;
    }, {} as Record<string, Bell[]>) : {};

    // --- JSX РЕНДЕРИНГ ---
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center gap-3 flex-wrap">
                <ScheduleManager />
                <Button onClick={handleAddNewBellClick} size="lg" disabled={!activeSchedule}>
                    <Plus className="mr-2 h-4 w-4" /> Добавить звонок вручную
                </Button>
            </div>

            {activeScheduleId && <ScheduleWizard scheduleId={activeScheduleId} onGenerate={handleWizardGenerate} />}

            <BellFormDialog
                isOpen={isBellDialogOpen}
                onOpenChange={setIsBellDialogOpen}
                onSubmit={handleBellFormSubmit}
                editingBell={editingBell}
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
                        />
                    ))}
                </div>
            )}
            
            {/* Диалог подтверждения удаления звонка */}
            <AlertDialog open={!!deletingBellId} onOpenChange={() => setDeletingBellId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Вы уверены?</AlertDialogTitle><AlertDialogDescription>Это действие невозможно отменить. Звонок будет удален навсегда.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingBellId(null)}>Отмена</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => { if (deletingBellId) { deleteBell(deletingBellId); setDeletingBellId(null); } }}>Да, удалить</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Диалог подтверждения для Мастера настройки */}
            <AlertDialog open={isGeneratorConfirmOpen} onOpenChange={setIsGeneratorConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>На этот день уже есть звонки</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div>
                                Выберите, что сделать с существующими звонками для <b>{generatorParams?.day}</b>.
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li><b>Заменить:</b> Полностью очистить день и создать новое расписание.</li>
                                    <li><b>Добавить:</b> Сохранить старые звонки и добавить к ним новые.</li>
                                </ul>
                            </div>
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
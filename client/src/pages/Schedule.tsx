// Файл: src/pages/Schedule.tsx (ПОЛНАЯ ФИНАЛЬНАЯ ЗАМЕНА)
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, ChevronDown, Wand2, ArrowRight } from 'lucide-react';
import useStore, { Bell, BellData, GeneratorParams, LessonConfig } from '../store/useStore';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const initialBellFormData: BellData = { time: '', day: 'Monday', name: '', enabled: true, soundId: 'sound-1', bellType: 'lesson', breakDuration: 10 };

// Компонент для управления расписаниями
const ScheduleManager = () => {
    const { schedules, activeScheduleId, setActiveSchedule, addScheduleSet } = useStore();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newScheduleName, setNewScheduleName] = useState("");
    const handleCreateSchedule = () => { if (newScheduleName.trim()) { addScheduleSet(newScheduleName.trim()); setNewScheduleName(""); setIsCreateDialogOpen(false); } };
    return (
        <><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="lg" className="flex items-center"><span>{activeScheduleId ? schedules[activeScheduleId]?.name : 'Выберите расписание'}</span><ChevronDown className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-56"><DropdownMenuLabel>Ваши расписания</DropdownMenuLabel><DropdownMenuSeparator />{Object.values(schedules).map(schedule => (<DropdownMenuItem key={schedule.id} onSelect={() => setActiveSchedule(schedule.id)}>{schedule.name}</DropdownMenuItem>))}<DropdownMenuSeparator /><DropdownMenuItem onSelect={() => setIsCreateDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /><span>Создать новое...</span></DropdownMenuItem></DropdownMenuContent></DropdownMenu><Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}><DialogContent><DialogHeader><DialogTitle>Создать новое расписание</DialogTitle><DialogDescription>Введите название для нового набора звонков.</DialogDescription></DialogHeader><div className="py-4"><Label htmlFor="new-schedule-name">Название</Label><Input id="new-schedule-name" value={newScheduleName} onChange={e => setNewScheduleName(e.target.value)} /></div><DialogFooter><Button onClick={handleCreateSchedule}>Создать</Button></DialogFooter></DialogContent></Dialog></>
    );
};

export function SchedulePage() {
    // --- Глобальное состояние из Zustand ---
    const { schedules, activeScheduleId, addBell, updateBell, deleteBell, isLoading, isServerError, generateDayBells, addScheduleSet, setActiveSchedule } = useStore();
    const activeSchedule = activeScheduleId ? schedules[activeScheduleId] : undefined;

    // --- Локальное состояние компонента ---
    // Для диалога редактирования/создания отдельного звонка
    const [isBellDialogOpen, setIsBellDialogOpen] = useState(false);
    const [editingBell, setEditingBell] = useState<Bell | null>(null);
    const [bellFormData, setBellFormData] = useState<BellData>(initialBellFormData);
    // Для диалога подтверждения удаления
    const [deletingBellId, setDeletingBellId] = useState<string | null>(null);
    // Для нового "Мастера настройки расписания"
    const [generatorStep, setGeneratorStep] = useState(1);
    const [baseParams, setBaseParams] = useState({ day: 'Monday', startTime: '08:30', lessons: 6, lessonMinutes: 45, breakMinutes: 10 });
    const [lessonConfigs, setLessonConfigs] = useState<LessonConfig[]>([]);
    const [isGeneratorConfirmOpen, setIsGeneratorConfirmOpen] = useState(false);
    
    // --- Обработчики событий ---
    const handleEditBellClick = (bell: Bell) => { setEditingBell(bell); const { id, scheduleId, ...data } = bell; setBellFormData(data); setIsBellDialogOpen(true); };
    const handleAddNewBellClick = () => { setEditingBell(null); setBellFormData(initialBellFormData); setIsBellDialogOpen(true); };
    const handleBellSubmit = (e: React.FormEvent) => { e.preventDefault(); if (editingBell) { updateBell(editingBell.id, bellFormData); } else if (activeScheduleId) { addBell(activeScheduleId, bellFormData); } setIsBellDialogOpen(false); };

    // Обработчики для "Мастера настройки"
    const handlePrepareConfigs = () => {
        const configs: LessonConfig[] = Array.from({ length: baseParams.lessons }, () => ({ lessonDuration: baseParams.lessonMinutes, breakDuration: baseParams.breakMinutes }));
        if (configs.length > 0) { configs[configs.length - 1].breakDuration = 0; }
        setLessonConfigs(configs);
        setGeneratorStep(2);
    };

    const handleConfigChange = (index: number, field: keyof LessonConfig, value: number) => {
        const newConfigs = [...lessonConfigs];
        newConfigs[index][field] = value;
        setLessonConfigs(newConfigs);
    };
    
    const handleGenerateClick = () => {
        const bellsOnSelectedDay = activeSchedule?.bells.filter(bell => bell.day === baseParams.day);
        if (bellsOnSelectedDay && bellsOnSelectedDay.length > 0) {
            setIsGeneratorConfirmOpen(true);
        } else {
            executeGeneration('overwrite');
        }
    };
    
    const executeGeneration = async (action: 'append' | 'overwrite') => {
        if (activeScheduleId && lessonConfigs.length > 0) {
            const params: GeneratorParams = { scheduleId: activeScheduleId, day: baseParams.day, startTime: baseParams.startTime, lessonConfigs, action };
            await generateDayBells(params);
        }
        setIsGeneratorConfirmOpen(false);
        setGeneratorStep(1);
    };

    // --- Отображение состояний загрузки/ошибки ---
    if (isLoading) return <div className="p-8 text-center">Загрузка расписания...</div>;
    if (isServerError) return <div className="p-8 text-center text-red-500 font-bold">Ошибка подключения к серверу.</div>;
    
    // --- Подготовка данных для отображения ---
    const groupedSchedule = activeSchedule ? DAYS.reduce((acc, day) => { acc[day] = activeSchedule.bells.filter(b => b.day === day).sort((a, b) => a.time.localeCompare(b.time)); return acc; }, {} as Record<string, Bell[]>) : {};

    // --- JSX РЕНДЕРИНГ ---
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center gap-3 flex-wrap">
                <ScheduleManager />
                <Button onClick={handleAddNewBellClick} size="lg" disabled={!activeSchedule}>
                    <Plus className="mr-2 h-4 w-4" /> Добавить звонок вручную
                </Button>
            </div>

            {activeSchedule && (
                <Card className="shadow-lg shadow-blue-500/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Wand2 className="text-blue-500" /> Мастер настройки расписания</CardTitle>
                        <CardDescription>
                            {generatorStep === 1 ? "Шаг 1: Задайте базовые параметры для генерации." : "Шаг 2: Отредактируйте длительность каждого урока и перемены."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {generatorStep === 1 && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                    <div><Label>День</Label><Select value={baseParams.day} onValueChange={day => setBaseParams(p => ({ ...p, day }))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
                                    <div><Label>Начало</Label><Input type="time" value={baseParams.startTime} onChange={e => setBaseParams(p => ({ ...p, startTime: e.target.value }))} /></div>
                                    <div><Label>Уроков</Label><Input type="number" min={1} value={baseParams.lessons} onChange={e => setBaseParams(p => ({ ...p, lessons: Number(e.target.value) || 1 }))} /></div>
                                    <div><Label>Урок (мин)</Label><Input type="number" min={1} value={baseParams.lessonMinutes} onChange={e => setBaseParams(p => ({ ...p, lessonMinutes: Number(e.target.value) || 45 }))} /></div>
                                    <div><Label>Перемена (мин)</Label><Input type="number" min={0} value={baseParams.breakMinutes} onChange={e => setBaseParams(p => ({ ...p, breakMinutes: Number(e.target.value) || 10 }))} /></div>
                                </div>
                                <div className="mt-4"><Button onClick={handlePrepareConfigs}>Настроить детально <ArrowRight className="ml-2 h-4 w-4" /></Button></div>
                            </>
                        )}
                        {generatorStep === 2 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                                {lessonConfigs.map((config, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
                                        <div className="font-bold text-slate-600">Урок {index + 1}:</div>
                                        <div className="flex-1"><Label className="text-xs text-slate-500">Длительность</Label><Input type="number" min={1} value={config.lessonDuration} onChange={e => handleConfigChange(index, 'lessonDuration', Number(e.target.value))}/></div>
                                        <div className="flex-1"><Label className="text-xs text-slate-500">Перемена после</Label><Input type="number" min={0} value={config.breakDuration} disabled={index === lessonConfigs.length - 1} onChange={e => handleConfigChange(index, 'breakDuration', Number(e.target.value))}/></div>
                                    </div>
                                ))}
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <Button onClick={handleGenerateClick}>Сгенерировать</Button>
                                    <Button variant="outline" onClick={() => setGeneratorStep(1)}>Назад к базовым</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Диалог для ручного создания/редактирования звонка */}
            <Dialog open={isBellDialogOpen} onOpenChange={setIsBellDialogOpen}><DialogContent><DialogHeader><DialogTitle>{editingBell ? 'Редактировать звонок' : 'Новый звонок'}</DialogTitle></DialogHeader><form onSubmit={handleBellSubmit} className="space-y-4 pt-4"><div className="space-y-2"><Label htmlFor="name">Название</Label><Input id="name" value={bellFormData.name} onChange={e => setBellFormData({...bellFormData, name: e.target.value})} placeholder="Начало первого урока"/></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="time">Время</Label><Input id="time" type="time" value={bellFormData.time} onChange={e => setBellFormData({...bellFormData, time: e.target.value})}/></div><div className="space-y-2"><Label htmlFor="day">День</Label><Select value={bellFormData.day} onValueChange={day => setBellFormData({...bellFormData, day})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{DAYS.map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div></div><div className="flex items-center space-x-2 pt-2"><Switch id="enabled" checked={bellFormData.enabled} onCheckedChange={c => setBellFormData({...bellFormData, enabled: c})}/><Label htmlFor="enabled">Включить звонок</Label></div><DialogFooter><Button type="submit">Сохранить</Button></DialogFooter></form></DialogContent></Dialog>
            
            {!activeSchedule ? (<Alert className="mt-8"><AlertTitle>Расписание не выбрано!</AlertTitle><AlertDescription>Пожалуйста, выберите расписание из выпадающего списка выше или создайте новое, чтобы начать.</AlertDescription></Alert>) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {DAYS.map(day => (
                        <Card key={day} className="shadow-lg shadow-slate-200/50">
                            <CardHeader><CardTitle>{day}</CardTitle><CardDescription>{groupedSchedule[day].length} звонков запланировано</CardDescription></CardHeader>
                            <CardContent>
                                {groupedSchedule[day].length > 0 ? (
                                    <Table><TableHeader><TableRow><TableHead>Время</TableHead><TableHead>Название</TableHead><TableHead className="text-right">Действия</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {groupedSchedule[day].map(bell => (
                                                <TableRow key={bell.id} className={!bell.enabled ? 'opacity-50' : ''}>
                                                    <TableCell className="font-mono font-semibold">{bell.time}</TableCell>
                                                    <TableCell>{bell.name}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEditBellClick(bell)}><Edit className="h-4 w-4 text-slate-500" /></Button>
                                                        <Button variant="ghost" size="icon" className="hover:text-red-500" onClick={() => setDeletingBellId(bell.id)}><Trash2 className="h-4 w-4 text-slate-500" /></Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (<div className="text-center py-10 text-slate-500 text-sm">Нет звонков на {day}.</div>)}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
            
            {/* Диалог подтверждения удаления */}
            <AlertDialog open={!!deletingBellId} onOpenChange={() => setDeletingBellId(null)}>
                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Вы уверены?</AlertDialogTitle><AlertDialogDescription>Это действие невозможно отменить. Звонок будет удален навсегда.</AlertDialogDescription></AlertDialogHeader>
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
                        {/* === ИСПРАВЛЕНИЕ ЗДЕСЬ === */}
                        {/* Мы говорим Description рендериться как div, а не p */}
                        <AlertDialogDescription asChild>
                            <div>
                                Выберите, что сделать с существующими звонками для <b>{baseParams.day}</b>.
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
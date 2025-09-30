import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, ChevronDown } from 'lucide-react';
import useStore, { Bell, BellData } from '../store/useStore';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const initialBellFormData: BellData = { time: '', day: 'Monday', name: '', enabled: true, soundId: 'sound-1', bellType: 'lesson', breakDuration: 10 };

// <<< --- КОМПОНЕНТ ДЛЯ УПРАВЛЕНИЯ РАСПИСАНИЯМИ --- >>>
const ScheduleManager = () => {
    const { schedules, activeScheduleId, setActiveSchedule, addScheduleSet } = useStore();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newScheduleName, setNewScheduleName] = useState("");

    const handleCreateSchedule = () => {
        if (newScheduleName.trim()) {
            addScheduleSet(newScheduleName.trim());
            setNewScheduleName("");
            setIsCreateDialogOpen(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="lg" className="flex items-center">
                        <span>{activeScheduleId ? schedules[activeScheduleId]?.name : 'Выберите расписание'}</span>
                        <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Ваши расписания</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {Object.values(schedules).map(schedule => (
                        <DropdownMenuItem key={schedule.id} onSelect={() => setActiveSchedule(schedule.id)}>
                            {schedule.name}
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setIsCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        <span>Создать новое...</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Диалог для создания нового расписания */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Создать новое расписание</DialogTitle>
                        <DialogDescription>
                            Введите название для нового набора звонков. Например, "Сокращенные дни".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="new-schedule-name">Название</Label>
                        <Input
                            id="new-schedule-name"
                            value={newScheduleName}
                            onChange={e => setNewScheduleName(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreateSchedule}>Создать</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export function SchedulePage() {
    // Получаем все нужные данные
    const {
        schedules, activeScheduleId, addBell, updateBell, deleteBell,
        isLoading, isServerError, generateDayBells
    } = useStore();

    const activeSchedule = activeScheduleId ? schedules[activeScheduleId] : undefined;

    const [isBellDialogOpen, setIsBellDialogOpen] = useState(false);
    const [editingBell, setEditingBell] = useState<Bell | null>(null);
    const [bellFormData, setBellFormData] = useState<BellData>(initialBellFormData);

    // Функции для управления диалогом звонков
    const handleEditBellClick = (bell: Bell) => {
        setEditingBell(bell);
        const { id, scheduleId, ...data } = bell;
        setBellFormData(data);
        setIsBellDialogOpen(true);
    };
    const handleAddNewBellClick = () => {
        setEditingBell(null);
        setBellFormData(initialBellFormData);
        setIsBellDialogOpen(true);
    };
    const handleBellSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingBell) { updateBell(editingBell.id, bellFormData); }
        else if (activeScheduleId) { addBell(activeScheduleId, bellFormData); }
        setIsBellDialogOpen(false);
    };

    // Рендер состояний загрузки и ошибок
    if (isLoading) return <div className="p-8 text-center">Загрузка расписания...</div>;
    if (isServerError) return <div className="p-8 text-center text-red-500 font-bold">Ошибка подключения к серверу.</div>;

    // Группировка звонков. Выполняется только если расписание выбрано
    const groupedSchedule = activeSchedule ? DAYS.reduce((acc, day) => {
        acc[day] = activeSchedule.bells.filter(b => b.day === day).sort((a, b) => a.time.localeCompare(b.time));
        return acc;
    }, {} as Record<string, Bell[]>) : {};


    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4">
            <div className="flex justify-between items-center mb-6 gap-3 flex-wrap">
                <ScheduleManager />
                <Button onClick={handleAddNewBellClick} size="lg" disabled={!activeSchedule}>
                    <Plus className="mr-2 h-4 w-4" /> Добавить звонок
                </Button>
                
            </div>

            {/* Простой генератор на выбранный день */}
            {activeSchedule && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Быстрая генерация для дня</CardTitle>
                        <CardDescription>Задайте параметры и сгенерируйте последовательность уроков/перемен для текущего дня.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                            <div>
                                <Label>День</Label>
                                <Select defaultValue={'Monday'} onValueChange={val => (window as any).__genDay = val}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Начало занятий</Label>
                                <Input type="time" defaultValue="08:30" onChange={e => (window as any).__genStart = e.target.value} />
                            </div>
                            <div>
                                <Label>Кол-во уроков</Label>
                                <Input type="number" defaultValue={6} onChange={e => (window as any).__genLessons = Number(e.target.value)} />
                            </div>
                            <div>
                                <Label>Длит. урока (мин)</Label>
                                <Input type="number" defaultValue={45} onChange={e => (window as any).__genLM = Number(e.target.value)} />
                            </div>
                            <div>
                                <Label>Длит. перемены (мин)</Label>
                                <Input type="number" defaultValue={10} onChange={e => (window as any).__genBM = Number(e.target.value)} />
                            </div>
                        </div>
                        <div className="mt-4">
                            <Button onClick={async () => {
                                const day = (window as any).__genDay || 'Monday';
                                const startTime = (window as any).__genStart || '08:30';
                                const lessons = (window as any).__genLessons ?? 6;
                                const lessonMinutes = (window as any).__genLM ?? 45;
                                const breakMinutes = (window as any).__genBM ?? 10;
                                if (activeScheduleId && generateDayBells) {
                                    await generateDayBells({ scheduleId: activeScheduleId, day, startTime, lessons, lessonMinutes, breakMinutes });
                                }
                            }}>Сгенерировать</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Диалог для звонков */}
            <Dialog open={isBellDialogOpen} onOpenChange={setIsBellDialogOpen}><DialogContent><DialogHeader><DialogTitle>{editingBell ? 'Редактировать звонок' : 'Добавить новый звонок'}</DialogTitle></DialogHeader><form onSubmit={handleBellSubmit} className="space-y-4 pt-4"><div className="space-y-2"><Label htmlFor="name">Название звонка</Label><Input id="name" value={bellFormData.name} onChange={e => setBellFormData({...bellFormData, name: e.target.value})} placeholder="Начало первого урока"/></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="time">Время</Label><Input id="time" type="time" value={bellFormData.time} onChange={e => setBellFormData({...bellFormData, time: e.target.value})} /></div><div className="space-y-2"><Label htmlFor="day">День</Label><Select value={bellFormData.day} onValueChange={day => setBellFormData({...bellFormData, day})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="bellType">Тип</Label><Select value={bellFormData.bellType} onValueChange={(val) => setBellFormData({...bellFormData, bellType: val as any})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="lesson">Урок</SelectItem><SelectItem value="break">Перемена</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label htmlFor="breakDuration">Длительность перемены (мин)</Label><Input id="breakDuration" type="number" min={0} value={bellFormData.breakDuration} onChange={e => setBellFormData({...bellFormData, breakDuration: Number(e.target.value)})} disabled={bellFormData.bellType !== 'break'} /></div></div><div className="flex items-center space-x-2 pt-2"><Switch id="enabled" checked={bellFormData.enabled} onCheckedChange={c => setBellFormData({...bellFormData, enabled: c})}/><Label htmlFor="enabled">Включить этот звонок</Label></div><div className="flex justify-end pt-4"><Button type="submit">Сохранить</Button></div></form></DialogContent></Dialog>

            {/* Отображение контента в зависимости от того, выбрано ли расписание */}
            {!activeSchedule ? (
                <Alert className="mt-8">
                    <AlertTitle>Расписание не выбрано!</AlertTitle>
                    <AlertDescription>
                        Пожалуйста, выберите расписание из выпадающего списка выше или создайте новое, чтобы начать добавлять звонки.
                    </AlertDescription>
                </Alert>
            ) : (
                <>
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {DAYS.map(day => (
                        <Card key={day} className="shadow-lg shadow-slate-200/50">
                            <CardHeader><CardTitle>{day}</CardTitle><CardDescription>{groupedSchedule[day].length} звонков запланировано</CardDescription></CardHeader>
                            <CardContent>{groupedSchedule[day].length > 0 ? (<Table><TableHeader><TableRow><TableHead>Время</TableHead><TableHead>Название</TableHead><TableHead className="text-right">Действия</TableHead></TableRow></TableHeader><TableBody>{groupedSchedule[day].map(bell => (<TableRow key={bell.id} className={!bell.enabled ? 'opacity-50' : ''}><TableCell className="font-mono font-semibold">{bell.time}</TableCell><TableCell>{bell.name}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleEditBellClick(bell)}><Edit className="h-4 w-4 text-slate-500" /></Button><Button variant="ghost" size="icon" className="hover:text-red-500" onClick={() => deleteBell(bell.id)}><Trash2 className="h-4 w-4 text-slate-500" /></Button></TableCell></TableRow>))}</TableBody></Table>) : (<div className="text-center py-10 text-slate-500 text-sm">Нет звонков на {day}.</div>)}</CardContent>
                        </Card>
                    ))}
                </div>
                
                </>
            )}
        </motion.div>
    );
}
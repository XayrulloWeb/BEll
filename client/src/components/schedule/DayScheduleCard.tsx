import { useState } from 'react';
import { Edit, Trash2, Copy, Bell as BellIcon, Coffee, Plus } from 'lucide-react'; 
import { Bell } from '../../store/useStore';
import useStore from '../../store/useStore';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from '@/components/ui/badge';

// Определяем константу с днями недели
const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Определяем интерфейс пропсов
interface DayScheduleCardProps {
    day: string;
    bells: Bell[];
    onEdit: (bell: Bell) => void;
    onDelete: (bellId: string) => void;
     onAdd: (day: string) => void;
}
const calculateDuration = (time1: string, time2: string): string => {
    try {
        const [h1, m1] = time1.split(':').map(Number);
        const [h2, m2] = time2.split(':').map(Number);
        const date1 = new Date(0, 0, 0, h1, m1);
        const date2 = new Date(0, 0, 0, h2, m2);
        const diff = (date2.getTime() - date1.getTime()) / 60000; // разница в минутах
        return diff > 0 ? `${diff} мин` : '-';
    } catch {
        return '-';
    }
};
export const DayScheduleCard = ({ day, bells, onEdit, onDelete ,onAdd}: DayScheduleCardProps) => {
    // Получаем функцию из хранилища
    const { createBellsBatch } = useStore();
    // Локальное состояние для диалогового окна
    const [open, setOpen] = useState(false);
    const [selectedDays, setSelectedDays] = useState<string[]>([]);

    const handleCopy = () => {
        if (selectedDays.length === 0 || bells.length === 0) {
            toast.warning("Выберите хотя бы один день для копирования.");
            return;
        }

        // Формируем массив новых звонков для отправки на бэкенд
        const newBells = bells.flatMap(bell => 
            selectedDays.map(targetDay => {
                const { id, ...bellData } = bell; // Убираем старый ID, он будет сгенерирован заново
                return { ...bellData, day: targetDay };
            })
        );
        
        createBellsBatch(newBells);
        setOpen(false); // Закрываем диалоговое окно
        setSelectedDays([]); // Сбрасываем выбранные дни
    };

    return (
        <Card className="shadow-lg shadow-slate-200/50">
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle>{day}</CardTitle>
                    <CardDescription>{bells.length} звонков запланировано</CardDescription>
                </div>
                
                {/* Кнопка и диалог для копирования */}
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={bells.length === 0} aria-label="Копировать день">
                            <Copy className="h-4 w-4 text-slate-500" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Копировать звонки с {day}</DialogTitle>
                            <DialogDescription>Выберите дни, на которые нужно скопировать {bells.length} звонков.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 grid grid-cols-2 gap-4">
                            {ALL_DAYS.filter(d => d !== day).map(d => (
                                <div key={d} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={d} 
                                        onCheckedChange={(checked) => {
                                            setSelectedDays(prev => 
                                                checked ? [...prev, d] : prev.filter(day => day !== d)
                                            );
                                        }}
                                    />
                                    <Label htmlFor={d} className="text-sm font-medium leading-none">{d}</Label>
                                </div>
                            ))}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
                            <Button onClick={handleCopy}>Копировать</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </CardHeader>
       <CardContent className="flex-grow">
                {bells.length > 0 ? (
                    // <<< --- ОБНОВЛЕННАЯ ТАБЛИЦА --- >>>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Время</TableHead>
                                <TableHead>Событие</TableHead>
                                <TableHead>Тип</TableHead>
                                <TableHead>Длительность</TableHead>
                                <TableHead className="text-right">Действия</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bells.map((bell, index) => {
                                // Определяем иконку и метку в зависимости от типа звонка
                                const isLesson = bell.bellType === 'lesson';
                                const Icon = isLesson ? BellIcon : Coffee;
                                const nextBell = bells[index + 1];

                                return (
                                    <TableRow key={bell.id} className={!bell.enabled ? 'opacity-40' : ''}>
                                        <TableCell className="font-mono font-semibold">{bell.time}</TableCell>
                                        <TableCell className="flex items-center gap-2">
                                            <Icon className={`h-4 w-4 ${isLesson ? 'text-blue-500' : 'text-green-500'}`} />
                                            {bell.name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={isLesson ? 'default' : 'secondary'}>
                                                {isLesson ? 'Урок' : 'Перемена'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm text-slate-500">
                                            {/* Рассчитываем длительность до следующего звонка */}
                                            {nextBell ? calculateDuration(bell.time, nextBell.time) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => onEdit(bell)}><Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="hover:text-red-500" onClick={() => onDelete(bell.id)}><Trash2 className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-10 text-slate-500 text-sm">Нет звонков на {day}.</div>
                )}
            </CardContent>
            <div className="p-4 border-t mt-auto">
                <Button variant="outline" className="w-full" onClick={() => onAdd(day)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Добавить звонок на {day}
                </Button>
            </div>
        </Card>
    );
};
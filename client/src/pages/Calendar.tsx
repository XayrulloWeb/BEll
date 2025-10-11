// Файл: src/pages/Calendar.tsx (ПОЛНАЯ ЗАМЕНА)

import { useState, useEffect, useMemo } from 'react';
import useStore from '../store/useStore';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function CalendarPage() {
    // Получаем данные и действия из стора
    const { 
        specialDays, 
        schedules, 
        fetchSpecialDays, 
        setSpecialDay, 
        deleteSpecialDay,
        isCalendarLoading 
    } = useStore();
    
    // Локальное состояние для выбранной даты
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    
    // Загружаем данные при первом рендере компонента
    useEffect(() => {
        fetchSpecialDays();
    }, [fetchSpecialDays]);

    // Вычисляемое значение для правила, действующего на выбранную дату
    const selectedDayRule = useMemo(() => {
        if (!selectedDate || !specialDays) return null; // Защита от undefined
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        return specialDays.find(d => d.date === dateString) || null;
    }, [selectedDate, specialDays]);

    // Локальное состояние для полей формы
    const [type, setType] = useState<'HOLIDAY' | 'OVERRIDE'>('HOLIDAY');
    const [overrideScheduleId, setOverrideScheduleId] = useState<string>('');

    // Синхронизируем состояние формы с выбранной датой
    useEffect(() => {
        setType(selectedDayRule?.type || 'HOLIDAY');
        setOverrideScheduleId(selectedDayRule?.override_schedule_id || '');
    }, [selectedDayRule]);

    // Обработчики кнопок
    const handleSave = () => {
        if (!selectedDate) return;
        const date = format(selectedDate, 'yyyy-MM-dd');
        setSpecialDay({ 
            date, 
            type, 
            override_schedule_id: type === 'OVERRIDE' ? overrideScheduleId : null 
        });
    };

    const handleDelete = () => {
        if (!selectedDate) return;
        deleteSpecialDay(format(selectedDate, 'yyyy-MM-dd'));
    };

    // Подготовка модификаторов для подсветки дат в календаре
    const specialDayModifiers = useMemo(() => ({
        holiday: specialDays.filter(d => d.type === 'HOLIDAY').map(d => parseISO(d.date)),
        override: specialDays.filter(d => d.type === 'OVERRIDE').map(d => parseISO(d.date)),
    }), [specialDays]);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
            <div className="md:col-span-1">
                <Card>
                    <CardContent className="p-0">
                         <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            className="p-3"
                            modifiers={specialDayModifiers}
                            modifiersStyles={{
                                holiday: { backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' },
                                override: { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }
                            }}
                        />
                    </CardContent>
                </Card>
                <div className="mt-2 text-sm text-slate-500 p-2 space-y-1">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-destructive"/> Выходной день</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary"/> Особое расписание</div>
                </div>
            </div>
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Настройки для {selectedDate ? format(selectedDate, 'dd MMMM yyyy') : '...'}</CardTitle>
                        <CardDescription>Установите особое правило для выбранной даты.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 relative">
                        {isCalendarLoading && (
                            <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-b-lg">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        )}
                        <RadioGroup value={type} onValueChange={(v) => setType(v as any)}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="HOLIDAY" id="r1" />
                                <Label htmlFor="r1">Объявить выходным (звонков не будет)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="OVERRIDE" id="r2" />
                                <Label htmlFor="r2">Использовать другое расписание</Label>
                            </div>
                        </RadioGroup>

                        {type === 'OVERRIDE' && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="pl-6 space-y-2"
                            >
                                <Label>Выберите расписание</Label>
                                <Select value={overrideScheduleId} onValueChange={setOverrideScheduleId}>
                                    <SelectTrigger><SelectValue placeholder="Не выбрано" /></SelectTrigger>
                                    <SelectContent>
                                        {Object.values(schedules).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </motion.div>
                        )}
                        <div className="flex gap-2 pt-4">
                            <Button onClick={handleSave} disabled={!selectedDate || (type === 'OVERRIDE' && !overrideScheduleId)}>Сохранить правило</Button>
                            {selectedDayRule && <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleDelete}>Удалить правило</Button>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    );
}
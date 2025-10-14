import { useState } from 'react';
import { ChevronDown, Plus, Edit, Trash2 } from 'lucide-react';
import useStore from '../../store/useStore';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const ScheduleManager = () => {
    // Достаем новые функции из стора
    const { 
        schedules, 
        activeScheduleId, 
        setActiveSchedule, 
        addScheduleSet, 
        deleteScheduleSet, 
        renameScheduleSet // Эту функцию нам нужно будет добавить в useStore
    } = useStore();
    
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
    const [scheduleToRename, setScheduleToRename] = useState<{ id: string, name: string } | null>(null);
    const [newScheduleName, setNewScheduleName] = useState("");

    const handleCreateSchedule = () => {
        if (newScheduleName.trim()) {
            addScheduleSet(newScheduleName.trim());
            setNewScheduleName("");
            setIsCreateDialogOpen(false);
        }
    };
    
    const handleOpenRenameDialog = (schedule: { id: string, name: string }) => {
        setScheduleToRename(schedule);
        setNewScheduleName(schedule.name);
        setIsRenameDialogOpen(true);
    };

    const handleRenameSchedule = () => {
        if (scheduleToRename && newScheduleName.trim()) {
            // Вызываем функцию переименования
            renameScheduleSet(scheduleToRename.id, newScheduleName.trim());
            setIsRenameDialogOpen(false);
            setScheduleToRename(null);
            setNewScheduleName("");
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="lg" className="flex items-center min-w-[250px] justify-between">
                        <span className="truncate pr-2">
                            {activeScheduleId ? schedules[activeScheduleId]?.name : 'Выберите расписание'}
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>Ваши расписания</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        {Object.values(schedules).map(schedule => (
                            <div key={schedule.id} className="flex items-center justify-between pr-2">
                                <DropdownMenuItem 
                                    onSelect={() => setActiveSchedule(schedule.id)}
                                    className="flex-1 cursor-pointer"
                                >
                                    {schedule.name}
                                </DropdownMenuItem>
                                
                                {/* <<< --- КНОПКИ УПРАВЛЕНИЯ --- >>> */}
                                <div className="flex">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenRenameDialog(schedule)}>
                                        <Edit className="h-4 w-4 text-slate-500" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Вы собираетесь удалить расписание "{schedule.name}". Это действие невозможно отменить.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => deleteScheduleSet(schedule.id)} className="bg-destructive hover:bg-destructive/90">
                                                    Да, удалить
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        ))}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setIsCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        <span>Создать новое...</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Диалог для СОЗДАНИЯ */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Создать новое расписание</DialogTitle>
                        {/* <<< --- ДОБАВЛЯЕМ ОПИСАНИЕ --- >>> */}
                        <DialogDescription>
                            Введите название для нового набора звонков.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="new-schedule-name">Название</Label>
                        <Input id="new-schedule-name" value={newScheduleName} onChange={e => setNewScheduleName(e.target.value)} />
                    </div>
                    <DialogFooter><Button onClick={handleCreateSchedule}>Создать</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Диалог для ПЕРЕИМЕНОВАНИЯ */}
            <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Переименовать расписание</DialogTitle>
                        {/* <<< --- ДОБАВЛЯЕМ ОПИСАНИЕ --- >>> */}
                        <DialogDescription>
                            Введите новое название для расписания "{scheduleToRename?.name}".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="rename-schedule-name">Новое название</Label>
                        <Input id="rename-schedule-name" value={newScheduleName} onChange={e => setNewScheduleName(e.target.value)} />
                    </div>
                    <DialogFooter><Button onClick={handleRenameSchedule}>Сохранить</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
import { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import useStore from '../../store/useStore';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const ScheduleManager = () => {
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
                    <Button variant="outline" size="lg" className="flex items-center min-w-[250px] justify-between">
                        <span className="truncate pr-2">
                            {activeScheduleId ? schedules[activeScheduleId]?.name : 'Выберите расписание'}
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0" />
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

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Создать новое расписание</DialogTitle>
                        <DialogDescription>Введите название для нового набора звонков.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="new-schedule-name">Название</Label>
                        <Input
                            id="new-schedule-name"
                            value={newScheduleName}
                            onChange={e => setNewScheduleName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateSchedule()}
                        />
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreateSchedule}>Создать</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
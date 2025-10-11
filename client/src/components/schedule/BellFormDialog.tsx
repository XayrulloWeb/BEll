import { useEffect, useState } from 'react';
import { Bell, BellData } from '../../store/useStore';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const initialBellFormData: BellData = { time: '', day: 'Monday', name: '', enabled: true, soundId: 'sound-1', bellType: 'lesson', breakDuration: 10 };

interface BellFormDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: BellData) => void;
    editingBell: Bell | null;
}

export const BellFormDialog = ({ isOpen, onOpenChange, onSubmit, editingBell }: BellFormDialogProps) => {
    const [formData, setFormData] = useState<BellData>(initialBellFormData);

    useEffect(() => {
        if (isOpen) {
            if (editingBell) {
                const { id, scheduleId, ...data } = editingBell;
                setFormData(data);
            } else {
                setFormData(initialBellFormData);
            }
        }
    }, [isOpen, editingBell]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingBell ? 'Редактировать звонок' : 'Новый звонок'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Название</Label>
                        <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Начало первого урока" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="time">Время</Label>
                            <Input id="time" type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="day">День</Label>
                            <Select value={formData.day} onValueChange={day => setFormData({ ...formData, day })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                        <Switch id="enabled" checked={formData.enabled} onCheckedChange={c => setFormData({ ...formData, enabled: c })} />
                        <Label htmlFor="enabled">Включить звонок</Label>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Сохранить</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
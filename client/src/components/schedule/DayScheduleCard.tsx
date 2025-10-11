import { Edit, Trash2 } from 'lucide-react';
import { Bell } from '../../store/useStore';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DayScheduleCardProps {
    day: string;
    bells: Bell[];
    onEdit: (bell: Bell) => void;
    onDelete: (bellId: string) => void;
}

export const DayScheduleCard = ({ day, bells, onEdit, onDelete }: DayScheduleCardProps) => {
    return (
        <Card className="shadow-lg shadow-slate-200/50">
            <CardHeader>
                <CardTitle>{day}</CardTitle>
                <CardDescription>{bells.length} звонков запланировано</CardDescription>
            </CardHeader>
            <CardContent>
                {bells.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Время</TableHead>
                                <TableHead>Название</TableHead>
                                <TableHead className="text-right">Действия</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bells.map(bell => (
                                <TableRow key={bell.id} className={!bell.enabled ? 'opacity-50' : ''}>
                                    <TableCell className="font-mono font-semibold">{bell.time}</TableCell>
                                    <TableCell>{bell.name}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => onEdit(bell)}>
                                            <Edit className="h-4 w-4 text-slate-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="hover:text-red-500" onClick={() => onDelete(bell.id)}>
                                            <Trash2 className="h-4 w-4 text-slate-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-10 text-slate-500 text-sm">Нет звонков на {day}.</div>
                )}
            </CardContent>
        </Card>
    );
};
import { useState } from 'react';
import { ArrowRight, Wand2 } from 'lucide-react';
import { GeneratorParams, LessonConfig } from '../../store/useStore';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface ScheduleWizardProps {
    scheduleId: string;
    onGenerate: (params: Omit<GeneratorParams, 'action'>) => void;
}

export const ScheduleWizard = ({ scheduleId, onGenerate }: ScheduleWizardProps) => {
    const [generatorStep, setGeneratorStep] = useState(1);
    const [baseParams, setBaseParams] = useState({ day: 'Monday', startTime: '08:30', lessons: 6, lessonMinutes: 45, breakMinutes: 10 });
    const [lessonConfigs, setLessonConfigs] = useState<LessonConfig[]>([]);

    const handlePrepareConfigs = () => {
        const configs: LessonConfig[] = Array.from({ length: baseParams.lessons }, () => ({
            lessonDuration: baseParams.lessonMinutes,
            breakDuration: baseParams.breakMinutes
        }));
        if (configs.length > 0) {
            configs[configs.length - 1].breakDuration = 0;
        }
        setLessonConfigs(configs);
        setGeneratorStep(2);
    };

    const handleConfigChange = (index: number, field: keyof LessonConfig, value: number) => {
        const newConfigs = [...lessonConfigs];
        newConfigs[index][field] = value;
        setLessonConfigs(newConfigs);
    };

    const handleGenerateClick = () => {
        onGenerate({
            scheduleId,
            day: baseParams.day,
            startTime: baseParams.startTime,
            lessonConfigs,
        });
    };

    return (
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
                            <div><Label>День</Label><Select value={baseParams.day} onValueChange={day => setBaseParams(p => ({ ...p, day }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
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
                                    <div className="flex-1"><Label className="text-xs text-slate-500">Длительность</Label><Input type="number" min={1} value={config.lessonDuration} onChange={e => handleConfigChange(index, 'lessonDuration', Number(e.target.value))} /></div>
                                    <div className="flex-1"><Label className="text-xs text-slate-500">Перемена после</Label><Input type="number" min={0} value={config.breakDuration} disabled={index === lessonConfigs.length - 1} onChange={e => handleConfigChange(index, 'breakDuration', Number(e.target.value))} /></div>
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
    );
};
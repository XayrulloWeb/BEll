// Файл: src/pages/Dashboard.tsx

import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, History } from 'lucide-react';
import useStore from '../store/useStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function DashboardPage() {
    const { currentTime, schedules, activeScheduleId, activityLog, updateCurrentTime } = useStore();
    const activeSchedule = activeScheduleId ? schedules[activeScheduleId] : undefined;

    useEffect(() => { const timer = setInterval(updateCurrentTime, 1000); return () => clearInterval(timer); }, [updateCurrentTime]);
    const nextBell = useMemo(() => { if (!activeSchedule?.bells) return null; const now = new Date(); const currentTimeStr = now.toTimeString().slice(0, 5); const currentDayIndex = now.getDay(); for (let dayOffset = 0; dayOffset < 7; dayOffset++) { const targetDayIndex = (currentDayIndex + dayOffset) % 7; const targetDayName = DAYS_OF_WEEK[targetDayIndex]; const bellsForDay = activeSchedule.bells.filter(b => b.day === targetDayName && b.enabled).sort((a, b) => a.time.localeCompare(b.time)); const bellsToConsider = dayOffset === 0 ? bellsForDay.filter(b => b.time > currentTimeStr) : bellsForDay; if (bellsToConsider.length > 0) return { ...bellsToConsider[0], dayOffset }; } return null; }, [currentTime, activeSchedule]);
    const getTimeUntilNextBell = () => { if (!nextBell) return 'No upcoming bells'; if (nextBell.dayOffset > 1) return `On ${nextBell.day}`; if (nextBell.dayOffset === 1) return `Tomorrow`; const now = new Date(); const [hours, minutes] = nextBell.time.split(':').map(Number); const nextBellDate = new Date(); nextBellDate.setHours(hours, minutes, 0, 0); const diff = nextBellDate.getTime() - now.getTime(); const h = Math.floor((diff / 3600000) % 24); const m = Math.floor((diff / 60000) % 60) + 1; return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`; };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="shadow-lg shadow-slate-200/50"><CardHeader><CardTitle className="flex items-center gap-3"><Clock className="text-blue-500" /> System Status</CardTitle></CardHeader><CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="text-center p-4 bg-slate-100 rounded-xl"><div className="text-5xl font-mono font-bold text-blue-600">{currentTime.toLocaleTimeString('en-GB')}</div><div className="text-slate-500">{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div></div><div className="p-4 bg-slate-50 rounded-xl space-y-2"><div className="flex justify-between items-center"><span className="text-slate-500 text-sm">Next Bell:</span><span className="font-bold text-slate-700">{nextBell?.name || 'N/A'}</span></div><div className="flex justify-between items-center"><span className="text-slate-500 text-sm">Time:</span><span className="font-mono text-slate-700">{nextBell?.time ? `${nextBell.time} (${nextBell.day})` : '--:--'}</span></div><div className="flex justify-between items-center text-lg"><span className="text-slate-500 text-sm">Countdown:</span><span className="text-blue-600 font-bold">{getTimeUntilNextBell()}</span></div></div></CardContent></Card>
                </div>
                <Card className="lg:col-span-1 shadow-lg shadow-slate-200/50"><CardHeader><CardTitle className="flex items-center gap-3"><History className="text-blue-500" /> Activity Log</CardTitle><CardDescription>Recent system events</CardDescription></CardHeader><CardContent><ul className="space-y-4 text-sm max-h-[28rem] overflow-y-auto pr-2">{activityLog.slice().reverse().map(log => (<li key={log.timestamp} className="flex items-start gap-3"><div className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" /><div><p className="text-slate-700">{log.message}</p><p className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleString()}</p></div></li>))}</ul></CardContent></Card>
            </main>
        </motion.div>
    );
}
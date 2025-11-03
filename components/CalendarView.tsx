import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, getDay, isSameDay, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Target, FolderKanban } from 'lucide-react';
import { motion } from 'framer-motion';

const CalendarView: React.FC = () => {
    const { goals, projects, performanceHistory } = useAppStore();
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const days = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);
        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [currentMonth]);

    const eventsByDate = useMemo(() => {
        const events = new Map<string, { type: 'goal' | 'project'; text: string }[]>();
        
        const allItems = [
            ...goals.filter(g => g.deadline && !g.archived).map(g => ({ ...g, type: 'goal' as const })),
            ...projects.filter(p => p.deadline && !p.archived).map(p => ({ ...p, type: 'project' as const }))
        ];

        allItems.forEach(item => {
            const dateStr = format(parseISO(item.deadline!), 'yyyy-MM-dd');
            if (!events.has(dateStr)) {
                events.set(dateStr, []);
            }
            events.get(dateStr)?.push({ type: item.type, text: item.text });
        });
        
        return events;
    }, [goals, projects]);

    const performanceByDate = useMemo(() => {
        const performanceMap = new Map<string, number>();
        performanceHistory.forEach(record => {
            performanceMap.set(record.date, record.score);
        });
        return performanceMap;
    }, [performanceHistory]);

    const getDayBackgroundColor = (date: Date): string => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const score = performanceByDate.get(dateStr);
        if (score === undefined) return 'bg-transparent';
        if (score >= 90) return 'dark:bg-calm-green-800/40 bg-calm-green-100';
        if (score >= 70) return 'dark:bg-calm-blue-800/30 bg-calm-blue-100';
        return 'dark:bg-slate-700/20 bg-slate-100';
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-lg h-full flex flex-col">
            <header className="flex items-center justify-between mb-4">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {format(currentMonth, 'MMMM yyyy')}
                </h1>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={() => setCurrentMonth(new Date())} className="text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                        Today
                    </button>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </header>
            <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 grid-rows-6 flex-1">
                {days.map((day, index) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayEvents = eventsByDate.get(dateStr) || [];
                    return (
                        <motion.div
                            key={day.toString()}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.01 }}
                            className={`border-t border-l border-slate-200 dark:border-slate-700 p-2 flex flex-col ${!isSameMonth(day, currentMonth) ? 'text-slate-400 dark:text-slate-600' : ''} ${getDay(day) === 0 ? 'border-l-0' : ''} ${index < 7 ? 'border-t-0' : ''}`}
                        >
                            <div className={`flex justify-center items-center w-7 h-7 rounded-full text-sm font-semibold ${isToday(day) ? 'bg-calm-blue-500 text-white' : ''}`}>
                                {format(day, 'd')}
                            </div>
                            <div className={`flex-1 overflow-y-auto mt-1 space-y-1 pr-1 ${getDayBackgroundColor(day)} rounded-md`}>
                                {dayEvents.map((event, eventIndex) => (
                                    <div key={eventIndex} title={event.text} className={`flex items-center gap-1.5 text-xs p-1 rounded ${event.type === 'goal' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' : 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'}`}>
                                        {event.type === 'goal' ? <Target size={12} /> : <FolderKanban size={12} />}
                                        <span className="truncate">{event.text}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarView;
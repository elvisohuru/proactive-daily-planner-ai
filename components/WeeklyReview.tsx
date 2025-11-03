import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { X, ArrowRight, Check, Plus, Trash2, CalendarCheck, BarChart2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, addDays, startOfWeek } from 'date-fns';

const WeeklyReview: React.FC = () => {
    const { 
        weeklyReviewState,
        closeWeeklyReview,
        setWeeklyReviewStep,
        setWeeklyGoals,
        performanceHistory,
        lastWeekPlan
    } = useAppStore();

    const [newGoalInputs, setNewGoalInputs] = useState(['', '', '']);

    useEffect(() => {
        if (!weeklyReviewState.isOpen) {
            setNewGoalInputs(['', '', '']);
        }
    }, [weeklyReviewState.isOpen]);

    const lastWeekPerformance = useMemo(() => {
        if (!lastWeekPlan?.weekStartDate) return { average: 0, days: [] };
        
        const weekStart = startOfWeek(parseISO(lastWeekPlan.weekStartDate), { weekStartsOn: 0 });
        const weekDays = Array.from({ length: 7 }).map((_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd'));
        
        let totalScore = 0;
        let daysWithScores = 0;

        const dayData = weekDays.map(dateStr => {
            const record = performanceHistory.find(h => h.date === dateStr);
            if (record) {
                totalScore += record.score;
                daysWithScores++;
            }
            return {
                date: dateStr,
                dayLabel: format(parseISO(dateStr), 'E'),
                score: record ? record.score : 0,
            };
        });

        return {
            average: daysWithScores > 0 ? Math.round(totalScore / daysWithScores) : 0,
            days: dayData
        }

    }, [performanceHistory, lastWeekPlan]);

    const handleGoalInputChange = (index: number, value: string) => {
        const newInputs = [...newGoalInputs];
        newInputs[index] = value;
        setNewGoalInputs(newInputs);
    };

    const addGoalInput = () => setNewGoalInputs([...newGoalInputs, '']);

    const removeGoalInput = (index: number) => {
        const newInputs = newGoalInputs.filter((_, i) => i !== index);
        setNewGoalInputs(newInputs);
    };

    const handleSetGoalsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setWeeklyGoals(newGoalInputs.filter(g => g.trim() !== ''));
        closeWeeklyReview();
    };

    const renderContent = () => {
        const { lastWeekGoals } = weeklyReviewState;
        const completedCount = lastWeekGoals.filter(g => g.completed).length;

        switch (weeklyReviewState.step) {
            case 'review_goals':
                return (
                    <>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2"><CalendarCheck size={24}/> Last Week's Goals</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">You completed {completedCount} of {lastWeekGoals.length} goals.</p>
                        <ul className="space-y-2 max-h-60 overflow-y-auto bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg mb-6">
                            {lastWeekGoals.map(goal => (
                                <li key={goal.id} className={`text-sm flex items-center gap-2 ${goal.completed ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
                                    <Check size={16} className={goal.completed ? "text-calm-green-500" : "text-slate-300 dark:text-slate-600"} />
                                    {goal.text}
                                </li>
                            ))}
                        </ul>
                        <button onClick={() => setWeeklyReviewStep('review_performance')} className="w-full flex items-center justify-center gap-2 bg-calm-blue-500 hover:bg-calm-blue-600 text-white font-bold py-2 px-4 rounded-lg transition">
                            Review Performance <ArrowRight size={18} />
                        </button>
                    </>
                );
            case 'review_performance':
                return (
                     <>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2"><BarChart2 size={24} /> Last Week's Performance</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">Your average productivity score was <span className="font-bold text-calm-blue-500">{lastWeekPerformance.average}%</span>.</p>
                         <div className="flex justify-between items-end h-32 gap-2 pt-6 mb-6">
                            {lastWeekPerformance.days.map((day, index) => (
                            <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group">
                                <div className="relative w-full h-full flex items-end justify-center">
                                <motion.div
                                    className="w-3/4 bg-calm-blue-300 dark:bg-calm-blue-700 rounded-t-md"
                                    initial={{ height: '0%' }}
                                    animate={{ height: `${day.score}%` }}
                                    transition={{ duration: 0.5, delay: index * 0.05, ease: "easeOut" }}
                                    title={`${day.date}: ${day.score}%`}
                                />
                                </div>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{day.dayLabel}</span>
                            </div>
                            ))}
                        </div>
                        <button onClick={() => setWeeklyReviewStep('plan_next_week')} className="w-full flex items-center justify-center gap-2 bg-calm-blue-500 hover:bg-calm-blue-600 text-white font-bold py-2 px-4 rounded-lg transition">
                            Plan Next Week <ArrowRight size={18} />
                        </button>
                    </>
                );
            case 'plan_next_week':
                 return (
                    <>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Set This Week's Focus</h2>
                        <form onSubmit={handleSetGoalsSubmit} className="space-y-3">
                            {newGoalInputs.map((goal, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        value={goal}
                                        onChange={(e) => handleGoalInputChange(index, e.target.value)}
                                        placeholder={`Goal #${index + 1}...`}
                                        className="w-full bg-slate-100 dark:bg-slate-700 rounded-lg px-4 py-2"
                                    />
                                    {newGoalInputs.length > 1 && (
                                        <button type="button" onClick={() => removeGoalInput(index)} className="text-slate-400 hover:text-red-500 p-1">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" onClick={addGoalInput} className="w-full flex items-center justify-center gap-2 text-sm text-calm-blue-600 dark:text-calm-blue-400 hover:bg-calm-blue-50 dark:hover:bg-calm-blue-900/50 font-semibold py-2 px-4 rounded-lg transition">
                                <Plus size={16} /> Add Goal
                            </button>
                            <button type="submit" className="w-full flex items-center justify-center gap-2 bg-calm-green-500 hover:bg-calm-green-600 text-white font-bold py-3 px-4 rounded-lg transition">
                                <Send size={18} /> Finish Review & Set Goals
                            </button>
                        </form>
                    </>
                );
            default: return null;
        }
    }

    return (
        <AnimatePresence>
            {weeklyReviewState.isOpen && (
                <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={closeWeeklyReview}
                >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg relative flex flex-col max-h-[90vh]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button onClick={closeWeeklyReview} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition z-10">
                    <X size={24} />
                    </button>
                    <div className="p-6 overflow-y-auto">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={weeklyReviewState.step}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                            >
                                {renderContent()}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WeeklyReview;

import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Inbox, ChevronsRight } from 'lucide-react';

const CarryOverModal: React.FC = () => {
    const { tasksToCarryOver, processCarryOverTasks } = useAppStore();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (tasksToCarryOver) {
            // Pre-select all tasks by default
            setSelectedIds(new Set(tasksToCarryOver.map(t => t.id)));
        }
    }, [tasksToCarryOver]);

    if (!tasksToCarryOver) {
        return null;
    }

    const handleToggle = (taskId: string) => {
        const newSelection = new Set(selectedIds);
        if (newSelection.has(taskId)) {
            newSelection.delete(taskId);
        } else {
            newSelection.add(taskId);
        }
        setSelectedIds(newSelection);
    };

    const handleConfirm = () => {
        const tasksToCarry = tasksToCarryOver.filter(t => selectedIds.has(t.id));
        const tasksToInbox = tasksToCarryOver.filter(t => !selectedIds.has(t.id));
        processCarryOverTasks(tasksToCarry, tasksToInbox);
    };
    
    const tasksToCarryCount = selectedIds.size;
    const tasksToInboxCount = tasksToCarryOver.length - selectedIds.size;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg relative flex flex-col max-h-[90vh]"
                >
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">A New Day!</h2>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">You have {tasksToCarryOver.length} unfinished tasks from yesterday. What would you like to do?</p>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        <p className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Select tasks to carry over to today's plan:</p>
                        <ul className="space-y-2">
                            {tasksToCarryOver.map(task => (
                                <li key={task.id}>
                                    <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(task.id)}
                                            onChange={() => handleToggle(task.id)}
                                            className="w-5 h-5 rounded text-calm-blue-500 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-calm-blue-500"
                                        />
                                        <span className="flex-grow text-slate-800 dark:text-slate-200">{task.text}</span>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl">
                        <div className="flex justify-between items-center text-sm mb-4 text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                                <ChevronsRight size={16} className="text-calm-blue-500"/>
                                <span>Carry over to today: <strong>{tasksToCarryCount}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                                 <Inbox size={16} className="text-orange-500"/>
                                 <span>Move to inbox: <strong>{tasksToInboxCount}</strong></span>
                            </div>
                        </div>
                        <button
                            onClick={handleConfirm}
                            className="w-full flex items-center justify-center gap-2 bg-calm-blue-500 hover:bg-calm-blue-600 text-white font-bold py-3 px-4 rounded-lg transition"
                        >
                            <Check size={20} /> Confirm & Start Day
                        </button>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">Unselected tasks will be moved to your Unplanned Tasks inbox so you don't lose them.</p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CarryOverModal;

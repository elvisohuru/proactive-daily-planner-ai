import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Plus, Trash2, Check, Repeat, GripVertical, Play, X } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { RoutineTask } from '../types';

const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const DailyRoutine: React.FC = () => {
  const [newRoutineText, setNewRoutineText] = useState('');
  const [newGoalId, setNewGoalId] = useState<string | null>(null);
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const [timerSetupTaskId, setTimerSetupTaskId] = useState<string | null>(null);
  const [timerDuration, setTimerDuration] = useState('60');
  const { routine, goals, addRoutineTask, deleteRoutineTask, toggleRoutineTask, reorderRoutine, startTimer } = useAppStore();

  const handleAddRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRoutineText.trim()) {
      addRoutineTask(newRoutineText.trim(), newGoalId, recurringDays);
      setNewRoutineText('');
      setNewGoalId(null);
      setRecurringDays([]);
    }
  };

  const toggleRecurringDay = (dayIndex: number) => {
    setRecurringDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };
  
  const handleStartTimerSetup = (taskId: string) => {
    setTimerSetupTaskId(taskId);
    setTimerDuration('60');
  };

  const handleCancelTimerSetup = () => {
    setTimerSetupTaskId(null);
  };

  const handleConfirmStartTimer = (task: RoutineTask) => {
    const duration = parseInt(timerDuration, 10);
    if (!isNaN(duration) && duration > 0) {
      startTimer(task.id, 'routine', task.text, duration);
      setTimerSetupTaskId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
        <Repeat size={20} /> Daily Routine
      </h2>
      <form onSubmit={handleAddRoutine} className="flex flex-col gap-2 mb-4">
         <div className="flex gap-2">
            <input
              type="text"
              value={newRoutineText}
              onChange={(e) => setNewRoutineText(e.target.value)}
              placeholder="Add a new routine..."
              className="flex-grow bg-slate-100 dark:bg-slate-700 border-transparent focus:ring-2 focus:ring-calm-blue-500 focus:border-transparent rounded-lg px-4 py-2 text-slate-800 dark:text-slate-200 transition"
            />
            <button
              type="submit"
              className="bg-calm-blue-500 hover:bg-calm-blue-600 text-white font-semibold p-2 rounded-lg flex items-center justify-center aspect-square transition"
              aria-label="Add Routine Task"
            >
              <Plus size={20} />
            </button>
        </div>
         <select
            value={newGoalId || ''}
            onChange={(e) => setNewGoalId(e.target.value || null)}
            className="w-full bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-300 border-transparent focus:ring-2 focus:ring-calm-blue-500 focus:border-transparent"
        >
            <option value="">No associated goal</option>
            {goals.filter(g => !g.completed && !g.archived).map(goal => (
            <option key={goal.id} value={goal.id}>🎯 {goal.text}</option>
            ))}
        </select>
        <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-2">
          <span className="text-sm text-slate-600 dark:text-slate-300 px-2">Repeats on:</span>
          <div className="flex gap-1">
            {weekDays.map((day, index) => (
              <button
                type="button"
                key={index}
                onClick={() => toggleRecurringDay(index)}
                className={`w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                  recurringDays.includes(index)
                    ? 'bg-calm-blue-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </form>
      <Reorder.Group as="ul" axis="y" values={routine} onReorder={reorderRoutine} className="space-y-2">
        {routine.map((task: RoutineTask) => {
          const linkedGoal = task.goalId ? goals.find(g => g.id === task.goalId) : null;
          const recurringDaysText = task.recurringDays.length > 0 ? task.recurringDays.map(d => weekDays[d]).join(' ') : 'Every day';
          return (
            <Reorder.Item
              key={task.id}
              value={task}
              as="li"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-grab active:cursor-grabbing"
            >
              <GripVertical size={18} className="text-slate-400 flex-shrink-0" />
              <button
                onClick={() => toggleRoutineTask(task.id)}
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                  task.completed
                    ? 'bg-calm-green-500 border-calm-green-500'
                    : 'border-slate-300 dark:border-slate-500 hover:border-calm-blue-400'
                }`}
                aria-label={task.completed ? 'Mark routine as incomplete' : 'Mark routine as complete'}
              >
                <AnimatePresence>
                  {task.completed && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      <Check size={16} className="text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
              <div className={`flex-grow text-slate-700 dark:text-slate-300 ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                <p>{task.text}</p>
                 <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {linkedGoal && (
                    <span className="text-xs bg-calm-blue-100 text-calm-blue-800 dark:bg-calm-blue-900 dark:text-calm-blue-200 px-2 py-0.5 rounded-full">
                      🎯 {linkedGoal.text}
                    </span>
                  )}
                  <span className="text-xs text-slate-500 dark:text-slate-400">{recurringDaysText}</span>
                 </div>
              </div>

              {timerSetupTaskId === task.id ? (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleConfirmStartTimer(task);
                  }}
                  className="flex items-center gap-1"
                >
                    <input
                        type="number"
                        min="1"
                        value={timerDuration}
                        onChange={(e) => setTimerDuration(e.target.value)}
                        className="w-16 bg-slate-200 dark:bg-slate-600 rounded-md px-2 py-1 text-sm text-center focus:ring-2 focus:ring-calm-blue-500 focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                handleCancelTimerSetup();
                            }
                        }}
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400">min</span>
                    <button type="submit" className="text-calm-green-500 hover:text-calm-green-600 p-1"><Check size={18} /></button>
                    <button type="button" onClick={handleCancelTimerSetup} className="text-slate-400 hover:text-slate-600 p-1"><X size={18} /></button>
                </form>
              ) : (
                <button
                  onClick={() => handleStartTimerSetup(task.id)}
                  className="text-slate-400 hover:text-calm-blue-500 dark:hover:text-calm-blue-400 transition-colors p-1"
                  aria-label="Start Timer for this routine task"
                >
                  <Play size={18} />
                </button>
              )}

              <button
                onClick={() => deleteRoutineTask(task.id)}
                className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                aria-label="Delete Routine Task"
              >
                <Trash2 size={18} />
              </button>
            </Reorder.Item>
          )
        })}
      </Reorder.Group>
      {routine.length === 0 && (
        <p className="text-center text-slate-500 dark:text-slate-400 py-4">Build your daily routine for consistency.</p>
      )}
    </div>
  );
};

export default DailyRoutine;

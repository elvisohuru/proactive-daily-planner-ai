import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Plus, Trash2, Check, Repeat, GripVertical, Play, X } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { RoutineTask } from '../types';

const DailyRoutine: React.FC = () => {
  const [newRoutineText, setNewRoutineText] = useState('');
  const [timerSetupTaskId, setTimerSetupTaskId] = useState<string | null>(null);
  const [timerDuration, setTimerDuration] = useState('60');
  const { routine, addRoutineTask, deleteRoutineTask, toggleRoutineTask, reorderRoutine, startTimer } = useAppStore();

  const handleAddRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRoutineText.trim()) {
      addRoutineTask(newRoutineText.trim());
      setNewRoutineText('');
    }
  };
  
  const handleStartTimerSetup = (taskId: string) => {
    setTimerSetupTaskId(taskId);
    setTimerDuration('60'); // Reset to default when opening
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
      <form onSubmit={handleAddRoutine} className="flex gap-2 mb-4">
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
      </form>
      <Reorder.Group as="ul" axis="y" values={routine} onReorder={reorderRoutine} className="space-y-2">
        {routine.map((task: RoutineTask) => (
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
            <span className={`flex-grow text-slate-700 dark:text-slate-300 ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
              {task.text}
            </span>

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
                  <button 
                      type="submit"
                      className="text-calm-green-500 hover:text-calm-green-600 p-1"
                      aria-label="Confirm start timer"
                  >
                      <Check size={18} />
                  </button>
                  <button
                      type="button"
                      onClick={handleCancelTimerSetup}
                      className="text-slate-400 hover:text-slate-600 p-1"
                      aria-label="Cancel timer setup"
                  >
                      <X size={18} />
                  </button>
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
        ))}
      </Reorder.Group>
      {routine.length === 0 && (
        <p className="text-center text-slate-500 dark:text-slate-400 py-4">Build your daily routine for consistency.</p>
      )}
    </div>
  );
};

export default DailyRoutine;
import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Plus, Trash2, Play, Check, X, GripVertical } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

const TodaysPlan: React.FC = () => {
  const [newTaskText, setNewTaskText] = useState('');
  const [timerSetupTaskId, setTimerSetupTaskId] = useState<string | null>(null);
  const [timerDuration, setTimerDuration] = useState('25');
  const tasks = useAppStore((state) => state.plan.tasks);
  const { addTask, deleteTask, toggleTask, startTimer, reorderTasks } = useAppStore();

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      addTask(newTaskText.trim());
      setNewTaskText('');
    }
  };
  
  const handleStartTimerSetup = (taskId: string) => {
    setTimerSetupTaskId(taskId);
    setTimerDuration('25'); // Reset to default when opening
  };

  const handleCancelTimerSetup = () => {
    setTimerSetupTaskId(null);
  };

  const handleConfirmStartTimer = (taskText: string) => {
    const duration = parseInt(timerDuration, 10);
    if (!isNaN(duration) && duration > 0) {
      startTimer(taskText, duration);
      setTimerSetupTaskId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Plan for Today</h2>
      <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Add a new task..."
          className="flex-grow bg-slate-100 dark:bg-slate-700 border-transparent focus:ring-2 focus:ring-calm-blue-500 focus:border-transparent rounded-lg px-4 py-2 text-slate-800 dark:text-slate-200 transition"
        />
        <button
          type="submit"
          className="bg-calm-blue-500 hover:bg-calm-blue-600 text-white font-semibold p-2 rounded-lg flex items-center justify-center aspect-square transition"
          aria-label="Add Task"
        >
          <Plus size={20} />
        </button>
      </form>
      <Reorder.Group as="ul" axis="y" values={tasks} onReorder={reorderTasks} className="space-y-2">
        <AnimatePresence>
          {tasks.map((task) => (
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
                onClick={() => toggleTask(task.id)}
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                  task.completed
                    ? 'bg-calm-green-500 border-calm-green-500'
                    : 'border-slate-300 dark:border-slate-500 hover:border-calm-blue-400'
                }`}
                aria-label={task.completed ? 'Mark task as incomplete' : 'Mark task as complete'}
              >
                {task.completed && <Check size={16} className="text-white" />}
              </button>
              <span className={`flex-grow text-slate-700 dark:text-slate-300 ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                {task.text}
              </span>

              {timerSetupTaskId === task.id ? (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleConfirmStartTimer(task.text);
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
                  aria-label="Start Timer for this task"
                >
                  <Play size={18} />
                </button>
              )}
              
              <button
                onClick={() => deleteTask(task.id)}
                className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                aria-label="Delete Task"
              >
                <Trash2 size={18} />
              </button>
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>
        {tasks.length === 0 && (
          <p className="text-center text-slate-500 dark:text-slate-400 py-4">No tasks yet. Add one to get started!</p>
        )}
    </div>
  );
};

export default TodaysPlan;
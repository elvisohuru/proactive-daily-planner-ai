
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Plus, Trash2, Check, Target } from 'lucide-react';
import { getDeadlineCountdown } from '../utils/dateUtils';
import { Goal, GoalCategory } from '../types';

const GoalItem: React.FC<{ goal: Goal; onToggle: (id: string) => void; onDelete: (id: string) => void }> = ({ goal, onToggle, onDelete }) => {
  const [countdown, setCountdown] = useState(getDeadlineCountdown(goal.deadline));

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getDeadlineCountdown(goal.deadline));
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, [goal.deadline]);

  return (
    <li className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
      <button
        onClick={() => onToggle(goal.id)}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
          goal.completed ? 'bg-calm-green-500 border-calm-green-500' : 'border-slate-300 dark:border-slate-500'
        }`}
      >
        {goal.completed && <Check size={12} className="text-white" />}
      </button>
      <div className="flex-grow">
        <p className={`text-slate-700 dark:text-slate-300 ${goal.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
          {goal.text}
        </p>
        {goal.deadline && <p className="text-xs text-slate-500 dark:text-slate-400">{countdown}</p>}
      </div>
      <button onClick={() => onDelete(goal.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>
    </li>
  );
};


const MyGoals: React.FC = () => {
  const { goals, addGoal, toggleGoal, deleteGoal } = useAppStore();
  const [newGoalText, setNewGoalText] = useState('');
  const [category, setCategory] = useState<GoalCategory>('Short Term');
  const [deadline, setDeadline] = useState('');

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoalText.trim()) {
      addGoal(newGoalText.trim(), category, deadline || null);
      setNewGoalText('');
      setDeadline('');
    }
  };

  const shortTermGoals = goals.filter((g) => g.category === 'Short Term');
  const longTermGoals = goals.filter((g) => g.category === 'Long Term');

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2"><Target size={20}/> My Goals</h2>
      <form onSubmit={handleAddGoal} className="space-y-3 mb-6">
        <input
          type="text"
          value={newGoalText}
          onChange={(e) => setNewGoalText(e.target.value)}
          placeholder="Add a new goal..."
          className="w-full bg-slate-100 dark:bg-slate-700 rounded-lg px-4 py-2 text-slate-800 dark:text-slate-200"
        />
        <div className="flex gap-2 flex-wrap">
          <select value={category} onChange={(e) => setCategory(e.target.value as GoalCategory)} className="bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 text-sm">
            <option>Short Term</option>
            <option>Long Term</option>
          </select>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="flex-grow bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 text-sm"
          />
          <button type="submit" className="bg-calm-blue-500 hover:bg-calm-blue-600 text-white font-semibold p-2 rounded-lg"><Plus size={20} /></button>
        </div>
      </form>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-slate-600 dark:text-slate-400 mb-2">Short Term</h3>
          <ul className="space-y-2">
            {shortTermGoals.length > 0 ? shortTermGoals.map(g => <GoalItem key={g.id} goal={g} onToggle={toggleGoal} onDelete={deleteGoal} />) : <p className="text-sm text-slate-500">No short term goals yet.</p>}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-slate-600 dark:text-slate-400 mb-2">Long Term</h3>
           <ul className="space-y-2">
            {longTermGoals.length > 0 ? longTermGoals.map(g => <GoalItem key={g.id} goal={g} onToggle={toggleGoal} onDelete={deleteGoal} />) : <p className="text-sm text-slate-500">No long term goals yet.</p>}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MyGoals;

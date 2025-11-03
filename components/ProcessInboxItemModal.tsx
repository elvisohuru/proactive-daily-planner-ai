import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, CornerDownRight, PlusCircle, Check, FolderPlus } from 'lucide-react';
import { Goal, GoalCategory } from '../types';

const ProcessInboxItemModal: React.FC = () => {
    const { 
        processingInboxItem, 
        setProcessingInboxItem, 
        processInboxItem,
        weeklyPlan,
        goals,
        projects
    } = useAppStore();
    
    type Action = 'task' | 'subgoal' | 'subtask' | 'goal' | 'project';
    const [action, setAction] = useState<Action | null>(null);
    const [parentId, setParentId] = useState('');
    const [goalCategory, setGoalCategory] = useState<GoalCategory>('Short Term');
    const [deadline, setDeadline] = useState('');
    const [reviewFrequency, setReviewFrequency] = useState<Goal['reviewFrequency']>(null);

    const handleClose = () => {
        setProcessingInboxItem(null);
        setAction(null);
        setParentId('');
        setDeadline('');
        setReviewFrequency(null);
    };

    const handleProcess = () => {
        if (!processingInboxItem) return;
        
        switch (action) {
            case 'task':
                processInboxItem(processingInboxItem.id, 'to_task', {});
                break;
            case 'subgoal':
                if (parentId) {
                    const [type, id] = parentId.split(':');
                    processInboxItem(processingInboxItem.id, 'to_subgoal', {
                        parentId: id,
                        parentType: type === 'weekly_goal' ? 'weekly_goal' : 'goal'
                    });
                }
                break;
            case 'subtask':
                 if (parentId) {
                    const [type, id] = parentId.split(':');
                     processInboxItem(processingInboxItem.id, 'to_subtask', {
                        parentId: id,
                        parentType: 'project'
                    });
                }
                break;
            case 'goal':
                processInboxItem(processingInboxItem.id, 'to_goal', { goalCategory, deadline, reviewFrequency });
                break;
            case 'project':
                processInboxItem(processingInboxItem.id, 'to_project', { deadline, reviewFrequency });
                break;
        }
    };

    const renderActionDetails = () => {
        switch (action) {
            case 'subgoal':
                return (
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Add to which goal?
                        </label>
                        <select
                            value={parentId}
                            onChange={(e) => setParentId(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-calm-blue-500"
                        >
                            <option value="" disabled>Select a goal...</option>
                            <optgroup label="This Week's Focus">
                                {weeklyPlan.goals.filter(g => !g.completed).map(g => (
                                    <option key={g.id} value={`weekly_goal:${g.id}`}>📌 {g.text}</option>
                                ))}
                            </optgroup>
                            <optgroup label="Goals">
                                {goals.filter(g => !g.completed && !g.archived).map(g => (
                                    <option key={g.id} value={`goal:${g.id}`}>🎯 {g.text}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>
                );
            case 'subtask':
                return (
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Add to which project?
                        </label>
                        <select
                            value={parentId}
                            onChange={(e) => setParentId(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-calm-blue-500"
                        >
                            <option value="" disabled>Select a project...</option>
                            {projects.filter(p => !p.completed && !p.archived).map(p => (
                                <option key={p.id} value={`project:${p.id}`}>📁 {p.text}</option>
                            ))}
                        </select>
                    </div>
                );
            case 'goal':
                 return (
                    <div className="mt-4 space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                What type of goal is this?
                            </label>
                            <select
                                value={goalCategory}
                                onChange={(e) => setGoalCategory(e.target.value as GoalCategory)}
                                className="w-full bg-slate-100 dark:bg-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-calm-blue-500"
                            >
                                <option value="Short Term">Short Term Goal</option>
                                <option value="Long Term">Long Term Goal</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 text-sm"
                            aria-label="Deadline"
                          />
                          <select
                            value={reviewFrequency || ''}
                            onChange={(e) => setReviewFrequency(e.target.value as Goal['reviewFrequency'] || null)}
                            className="w-full bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 text-sm"
                            disabled={goalCategory === 'Short Term'}
                            title={goalCategory === 'Short Term' ? "Review frequency is for long-term items" : "Set review frequency"}
                          >
                            <option value="">No scheduled review</option>
                            <option value="weekly">Weekly Review</option>
                            <option value="monthly">Monthly Review</option>
                            <option value="quarterly">Quarterly Review</option>
                          </select>
                        </div>
                    </div>
                );
             case 'project':
                 return (
                    <div className="mt-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 text-sm"
                            aria-label="Deadline"
                          />
                          <select
                            value={reviewFrequency || ''}
                            onChange={(e) => setReviewFrequency(e.target.value as Goal['reviewFrequency'] || null)}
                            className="w-full bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 text-sm"
                          >
                            <option value="">No scheduled review</option>
                            <option value="weekly">Weekly Review</option>
                            <option value="monthly">Monthly Review</option>
                            <option value="quarterly">Quarterly Review</option>
                          </select>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };
    
    const isConfirmDisabled = !action || 
                            (action === 'subgoal' && !parentId) ||
                            (action === 'subtask' && !parentId);

    return (
        <AnimatePresence>
            {processingInboxItem && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 w-full max-w-lg relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                         <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                            aria-label="Close"
                        >
                            <X size={24} />
                        </button>
                        
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Process Idea</h2>
                        <p className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg text-slate-700 dark:text-slate-300 mb-6">
                            "{processingInboxItem.text}"
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => setAction('task')}
                                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition ${action === 'task' ? 'bg-calm-blue-100 dark:bg-calm-blue-900/50 ring-2 ring-calm-blue-500' : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            >
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">Convert to Planned Task</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Add directly to your plan for today.</p>
                                </div>
                                <ArrowRight size={18} className="text-calm-blue-500" />
                            </button>
                             <button
                                onClick={() => setAction('goal')}
                                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition ${action === 'goal' ? 'bg-calm-blue-100 dark:bg-calm-blue-900/50 ring-2 ring-calm-blue-500' : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            >
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">Create New Goal</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Make this a new standalone goal.</p>
                                </div>
                                <PlusCircle size={18} className="text-calm-blue-500" />
                            </button>
                             <button
                                onClick={() => setAction('project')}
                                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition ${action === 'project' ? 'bg-calm-blue-100 dark:bg-calm-blue-900/50 ring-2 ring-calm-blue-500' : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            >
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">Create New Project</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Start a new multi-step project.</p>
                                </div>
                                <FolderPlus size={18} className="text-calm-blue-500" />
                            </button>
                             <button
                                onClick={() => setAction('subgoal')}
                                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition ${action === 'subgoal' ? 'bg-calm-blue-100 dark:bg-calm-blue-900/50 ring-2 ring-calm-blue-500' : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            >
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">Add as Sub-goal</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Link to an existing weekly or long-term goal.</p>
                                </div>
                                <CornerDownRight size={18} className="text-calm-blue-500" />
                            </button>
                            <button
                                onClick={() => setAction('subtask')}
                                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition ${action === 'subtask' ? 'bg-calm-blue-100 dark:bg-calm-blue-900/50 ring-2 ring-calm-blue-500' : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            >
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">Add as Sub-task</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Link to an existing project.</p>
                                </div>
                                <CornerDownRight size={18} className="text-calm-blue-500" />
                            </button>
                        </div>
                        
                        <AnimatePresence>
                            {action && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="pt-4">{renderActionDetails()}</div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="mt-8">
                             <button 
                                onClick={handleProcess}
                                disabled={isConfirmDisabled}
                                className="w-full bg-calm-green-500 hover:bg-calm-green-600 text-white font-bold py-3 px-4 rounded-lg transition disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Check size={20}/>
                                Confirm & Process
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ProcessInboxItemModal;
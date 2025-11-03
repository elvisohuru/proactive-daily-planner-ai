import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const IdleReviewModal: React.FC = () => {
  const { isIdleReviewModalOpen, closeIdleReviewModal, logIdleTimeEntry, setIdleState, idleState } = useAppStore();
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState<'Productive' | 'Unproductive'>('Productive');

  // When modal opens, reset fields
  useEffect(() => {
    if (isIdleReviewModalOpen) {
      setDescription('');
      setTag('Productive');
    }
  }, [isIdleReviewModalOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const idleDuration = idleState?.status === 'review_pending' ? idleState.seconds : 0;
    
    if (description.trim() === '') {
      logIdleTimeEntry({
        description: 'Unproductive idle time',
        tag: 'Unproductive',
        duration: idleDuration,
      });
    } else {
      logIdleTimeEntry({
        description: description.trim(),
        tag,
        duration: idleDuration,
      });
    }
    
    closeIdleReviewModal();
    setIdleState(null); // Reset the tracker to start over
  };
  
  const handleClose = () => {
      // If closed without action, automatically log as unproductive
      const currentState = useAppStore.getState().idleState;
      if (currentState?.status === 'review_pending' && currentState.seconds > 0) {
        logIdleTimeEntry({
          description: 'Unproductive idle time (unattended)',
          tag: 'Unproductive',
          duration: currentState.seconds,
        });
      }
      closeIdleReviewModal();
      setIdleState(null); // Reset the tracker
  };

  return (
    <AnimatePresence>
      {isIdleReviewModalOpen && (
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
            <form onSubmit={handleSubmit}>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">You're back!</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">Log your activity for the last period to stay on track.</p>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="activity-description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        What did you do?
                        </label>
                        <textarea 
                            id="activity-description" 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            rows={3} 
                            className="w-full bg-slate-100 dark:bg-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-calm-blue-500"
                            placeholder="e.g., Took a short break, answered emails..."
                            autoFocus
                        />
                    </div>
                    <div>
                        <label htmlFor="activity-tag" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        How would you classify this?
                        </label>
                        <select 
                            id="activity-tag" 
                            value={tag}
                            onChange={(e) => setTag(e.target.value as 'Productive' | 'Unproductive')}
                            className="w-full bg-slate-100 dark:bg-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-calm-blue-500"
                        >
                            <option value="Productive">Productive</option>
                            <option value="Unproductive">Unproductive</option>
                        </select>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-8">
                    <button type="submit" className="w-full bg-calm-blue-500 hover:bg-calm-blue-600 text-white font-bold py-3 px-4 rounded-lg transition">
                        Log Activity
                    </button>
                </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IdleReviewModal;
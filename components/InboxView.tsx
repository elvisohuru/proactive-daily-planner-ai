import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Inbox, Plus, Trash2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const InboxView: React.FC = () => {
  const { inbox, addInboxItem, deleteInboxItem, setProcessingInboxItem } = useAppStore();
  const [newItemText, setNewItemText] = useState('');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemText.trim()) {
      addInboxItem(newItemText.trim());
      setNewItemText('');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Inbox size={28} className="text-calm-blue-500" />
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Idea Inbox</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">A place to capture thoughts before they become actions.</p>
        </div>
      </div>

      <form onSubmit={handleAddItem} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="Capture an idea, a link, a to-do..."
          className="flex-grow bg-slate-100 dark:bg-slate-700 border-transparent focus:ring-2 focus:ring-calm-blue-500 focus:border-transparent rounded-lg px-4 py-2 text-slate-800 dark:text-slate-200 transition"
        />
        <button
          type="submit"
          className="bg-calm-blue-500 hover:bg-calm-blue-600 text-white font-semibold p-2 rounded-lg flex items-center justify-center aspect-square transition"
          aria-label="Add Idea"
        >
          <Plus size={20} />
        </button>
      </form>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-2">
          Items to Process
        </h2>
        <ul className="space-y-2">
          <AnimatePresence>
            {inbox.length > 0 ? (
              inbox.map((item) => (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                >
                  <div className="flex-grow">
                    <p className="text-slate-800 dark:text-slate-200">{item.text}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Captured: {format(new Date(item.createdAt), "MMM d, h:mm a")}
                    </p>
                  </div>
                  <button
                    onClick={() => setProcessingInboxItem(item)}
                    className="flex items-center gap-1.5 bg-calm-green-100 dark:bg-calm-green-900/50 text-calm-green-700 dark:text-calm-green-300 hover:bg-calm-green-200 dark:hover:bg-calm-green-900 text-sm font-semibold px-3 py-1 rounded-full transition"
                  >
                    <Zap size={14} /> Process
                  </button>
                  <button
                    onClick={() => deleteInboxItem(item.id)}
                    className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-500/10 transition"
                    aria-label="Delete item"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.li>
              ))
            ) : (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                Your inbox is clear. Great job!
              </p>
            )}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
};

export default InboxView;
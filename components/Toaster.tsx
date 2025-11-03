import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info } from 'lucide-react';

const Toaster: React.FC = () => {
  const { toasts, removeToast } = useAppStore();

  const icons = {
    success: <CheckCircle className="text-calm-green-500" />,
    error: <XCircle className="text-red-500" />,
    info: <Info className="text-calm-blue-500" />,
  };

  return (
    <div className="fixed top-5 right-5 z-[100] w-80 space-y-2">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-4 flex items-start gap-3 border-l-4 border-current cursor-pointer"
            style={{ 
                borderColor: toast.type === 'success' ? '#22c55e' : toast.type === 'error' ? '#ef4444' : '#38bdf8' 
            }}
            onClick={() => removeToast(toast.id)}
          >
            <div className="flex-shrink-0">{icons[toast.type]}</div>
            <p className="flex-grow text-sm font-medium text-slate-700 dark:text-slate-200">{toast.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toaster;

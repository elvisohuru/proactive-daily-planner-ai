import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer } from 'lucide-react';
import { formatTime } from '../utils/dateUtils';

const IdleCountdown: React.FC = () => {
  const idleState = useAppStore((state) => state.idleState);

  const isVisible = idleState?.status === 'detecting' || idleState?.status === 'tracking_idle';
  const seconds = idleState?.seconds ?? 0;
  
  const text = idleState?.status === 'detecting' 
    ? 'checking inactivity in' 
    : 'inactive duration';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-5 right-5 z-40 bg-gradient-to-br from-teal-900/90 via-emerald-900/80 to-slate-900/90 text-white backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 text-sm shadow-lg"
        >
          <Timer size={16} />
          <span>{text}: {formatTime(seconds)}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IdleCountdown;
import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { formatTime } from '../utils/dateUtils';
import { Play, Pause, CheckSquare, Plus, CloudRain, Flame, Coffee, VolumeX, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ambientPlayer } from '../utils/ambientPlayer';
import { playTimerUpSound, stopTimerUpSound } from '../utils/sound';

const TaskTimer: React.FC = () => {
  const { activeTask, updateTimer, completeActiveTask, extendTimer } = useAppStore();
  const intervalRef = useRef<number | null>(null);
  const prevSecondsRef = useRef<number>();
  const [extensionMinutes, setExtensionMinutes] = useState('60');
  const [activeSound, setActiveSound] = useState<'rain' | 'fire' | 'cafe' | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (activeTask) {
      if (activeTask.remainingSeconds <= 0 && prevSecondsRef.current && prevSecondsRef.current > 0) {
        playTimerUpSound();
      }
      prevSecondsRef.current = activeTask.remainingSeconds;
    } else {
      prevSecondsRef.current = undefined;
    }
  }, [activeTask]);


  useEffect(() => {
    if (activeTask && !activeTask.isPaused) {
      if (activeTask.remainingSeconds > 0) {
        intervalRef.current = window.setInterval(() => {
          updateTimer({ remainingSeconds: activeTask.remainingSeconds - 1 });
        }, 1000);
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeTask, updateTimer]);
  
  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      ambientPlayer.stop();
      stopTimerUpSound();
    };
  }, []);
  
  const handlePauseResume = () => {
    if (activeTask) {
      updateTimer({ isPaused: !activeTask.isPaused });
    }
  };

  const handleCompleteAndLog = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    stopTimerUpSound();
    ambientPlayer.stop(); // Stop sound on complete
    completeActiveTask();
  };
  
  const handleExtend = (e: React.FormEvent) => {
    e.preventDefault();
    const minutes = parseInt(extensionMinutes, 10);
    if (!isNaN(minutes) && minutes > 0) {
      stopTimerUpSound();
      extendTimer(minutes);
      setExtensionMinutes('60'); // Reset for next time
    }
  };
  
  const toggleSound = (sound: 'rain' | 'fire' | 'cafe') => {
    if (activeSound === sound) {
      ambientPlayer.stop();
      setActiveSound(null);
    } else {
      ambientPlayer.play(sound);
      setActiveSound(sound);
    }
  };

  const handleMute = () => {
    ambientPlayer.toggleMute();
    setIsMuted(!isMuted);
  };

  const isTimeUp = activeTask && activeTask.remainingSeconds <= 0;

  return (
    <AnimatePresence>
      {activeTask && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 p-4 text-white backdrop-blur-md"
        >
           <div className="absolute top-4 right-4 flex items-center gap-2">
            <button onClick={() => toggleSound('rain')} className={`p-2 rounded-full transition-colors ${activeSound === 'rain' ? 'bg-white/30 text-white' : 'bg-white/10 text-slate-300'} hover:bg-white/20`}><CloudRain size={20} /></button>
            <button onClick={() => toggleSound('fire')} className={`p-2 rounded-full transition-colors ${activeSound === 'fire' ? 'bg-white/30 text-white' : 'bg-white/10 text-slate-300'} hover:bg-white/20`}><Flame size={20} /></button>
            <button onClick={() => toggleSound('cafe')} className={`p-2 rounded-full transition-colors ${activeSound === 'cafe' ? 'bg-white/30 text-white' : 'bg-white/10 text-slate-300'} hover:bg-white/20`}><Coffee size={20} /></button>
            <button onClick={handleMute} className="p-2 rounded-full bg-white/10 text-slate-300 hover:bg-white/20">
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: 0.1, ease: "easeOut" }}
            className="flex flex-col items-center justify-center text-center"
          >
            <p className="text-2xl md:text-4xl font-light text-slate-300 mb-4 text-center">{activeTask.task}</p>
            <div className="my-10">
              <AnimatePresence mode="wait">
                {isTimeUp ? (
                  <motion.div
                    key="timeup"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-2"
                  >
                     <motion.span
                        className="text-7xl md:text-9xl font-mono font-bold text-white tracking-wider"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                     >
                        {formatTime(activeTask.remainingSeconds)}
                     </motion.span>
                    <p className="text-xl font-semibold text-yellow-400">Time's up!</p>
                  </motion.div>
                ) : (
                  <motion.span 
                    key="timer"
                    className="text-7xl md:text-9xl font-mono font-bold text-white tracking-wider"
                  >
                    {formatTime(activeTask.remainingSeconds)}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            
            <AnimatePresence mode="wait">
              {isTimeUp ? (
                <motion.div
                  key="extend-form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex flex-col items-center gap-6 mt-10"
                >
                  <form onSubmit={handleExtend} className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={extensionMinutes}
                      onChange={(e) => setExtensionMinutes(e.target.value)}
                      className="w-24 bg-slate-700 text-white rounded-lg px-3 py-2 text-center text-lg focus:ring-2 focus:ring-calm-blue-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="flex items-center justify-center gap-2 text-lg px-6 h-12 bg-calm-blue-600 hover:bg-calm-blue-700 rounded-lg transition-colors font-semibold"
                    >
                      <Plus size={20} /> Extend
                    </button>
                  </form>
                  <button
                    onClick={handleCompleteAndLog}
                    className="flex items-center justify-center gap-3 text-lg w-64 h-16 bg-calm-green-600 hover:bg-calm-green-700 rounded-full transition-colors font-semibold"
                    aria-label="Complete and Log Task"
                  >
                    <CheckSquare size={24} />
                    <span>Complete</span>
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="controls"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex flex-col sm:flex-row items-center gap-6 mt-10"
                >
                  <button
                    onClick={handlePauseResume}
                    className="flex items-center justify-center gap-3 text-lg w-48 h-16 bg-white/10 hover:bg-white/20 rounded-full transition-colors font-semibold"
                    aria-label={activeTask.isPaused ? 'Resume Timer' : 'Pause Timer'}
                  >
                    {activeTask.isPaused ? <Play size={24} /> : <Pause size={24} />}
                    <span>{activeTask.isPaused ? 'Resume' : 'Pause'}</span>
                  </button>
                  <button
                    onClick={handleCompleteAndLog}
                    className="flex items-center justify-center gap-3 text-lg w-48 h-16 bg-calm-green-600 hover:bg-calm-green-700 rounded-full transition-colors font-semibold"
                    aria-label="Complete and Log Task"
                  >
                    <CheckSquare size={24} />
                    <span>Complete</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TaskTimer;
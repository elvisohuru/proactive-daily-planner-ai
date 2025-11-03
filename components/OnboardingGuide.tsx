import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

type Step = {
  elementId: string;
  title: string;
  content: string;
  view?: 'dashboard' | 'inbox';
  requireSidebarOpen?: boolean;
};

const onboardingSteps: Step[] = [
  {
    elementId: 'welcome',
    title: 'Welcome to Proactive Planner!',
    content: 'Let\'s take a quick tour of the core features to get you started.',
  },
  {
    elementId: 'onboarding-weekly-goals',
    title: 'Start with Your Weekly Focus',
    content: 'Begin each week by setting your main objectives. This keeps you focused on what truly matters.',
    view: 'dashboard',
  },
  {
    elementId: 'onboarding-daily-plan',
    title: 'From Goals to Actions',
    content: 'Break down your goals into actionable sub-goals, then send them to your daily plan. You can also reorder and link tasks with dependencies.',
    view: 'dashboard',
  },
  {
    elementId: 'onboarding-inbox',
    title: 'Capture Everything',
    content: 'Use the Idea Inbox to quickly capture thoughts and tasks. You can process and organize them later.',
    view: 'inbox',
    requireSidebarOpen: true,
  },
  {
    elementId: 'all-set',
    title: 'You\'re All Set!',
    content: 'You have the tools to plan with intention. Enjoy building your productive and proactive days!',
  }
];

const OnboardingGuide: React.FC = () => {
  const { hasCompletedOnboarding, completeOnboarding, setActiveView, isSidebarCollapsed, toggleSidebar } = useAppStore();
  const [step, setStep] = useState(0);
  const [highlightStyle, setHighlightStyle] = useState({});
  const [popoverStyle, setPopoverStyle] = useState({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Give the app a moment to mount before starting the tour
    const timer = setTimeout(() => {
      if (!hasCompletedOnboarding) {
        setIsReady(true);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [hasCompletedOnboarding]);

  const updatePositions = (elementId: string) => {
    if (elementId === 'welcome' || elementId === 'all-set') {
      setHighlightStyle({ display: 'none' });
      setPopoverStyle({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', position: 'fixed' });
      return true;
    }
    
    const element = document.getElementById(elementId);
    if (element) {
      const rect = element.getBoundingClientRect();
      setHighlightStyle({
        top: rect.top - 8,
        left: rect.left - 8,
        width: rect.width + 16,
        height: rect.height + 16,
        position: 'fixed',
      });
      setPopoverStyle({
        top: rect.bottom + 16,
        left: rect.left,
        position: 'fixed',
      });
      return true;
    }
    return false;
  };

  useLayoutEffect(() => {
    if (!isReady || hasCompletedOnboarding) return;

    const currentStep = onboardingSteps[step];
    
    // Handle navigation
    if (currentStep.view && useAppStore.getState().activeView !== currentStep.view) {
      setActiveView(currentStep.view);
    }
    if (currentStep.requireSidebarOpen && isSidebarCollapsed) {
      toggleSidebar();
    }
    
    // Retry mechanism to find the element after view switch
    let attempts = 0;
    const interval = setInterval(() => {
      if (updatePositions(currentStep.elementId) || attempts > 20) {
        clearInterval(interval);
      }
      attempts++;
    }, 100);

    const handleResize = () => updatePositions(currentStep.elementId);
    window.addEventListener('resize', handleResize);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };

  }, [step, isReady, hasCompletedOnboarding, setActiveView, isSidebarCollapsed, toggleSidebar]);

  const handleNext = () => {
    if (step < onboardingSteps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    completeOnboarding();
  };

  if (!isReady || hasCompletedOnboarding || step >= onboardingSteps.length) {
    return null;
  }

  const currentStep = onboardingSteps[step];

  return (
    <div className="fixed inset-0 z-50">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleComplete}
      />

      <motion.div
        className="absolute bg-white dark:bg-slate-800 rounded-lg shadow-2xl transition-all duration-300 ease-in-out"
        animate={highlightStyle}
        style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      />
      
      <AnimatePresence>
        <motion.div
          key={step}
          className="absolute w-80 max-w-[90vw] p-6 bg-white dark:bg-slate-800 rounded-lg shadow-2xl"
          initial={{ opacity: 0, y: 10 }}
          animate={popoverStyle}
          exit={{ opacity: 0, y: -10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-bold text-calm-blue-600 dark:text-calm-blue-400 flex items-center gap-2 mb-2">
            <Sparkles size={20} /> {currentStep.title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{currentStep.content}</p>
          <div className="flex justify-between items-center">
             <div className="flex gap-1.5">
                {onboardingSteps.map((_, index) => (
                    <div key={index} className={`w-2 h-2 rounded-full transition-colors ${step === index ? 'bg-calm-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                ))}
             </div>
            <button
              onClick={handleNext}
              className="flex items-center gap-2 bg-calm-blue-500 hover:bg-calm-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              {step === onboardingSteps.length - 1 ? 'Get Started' : 'Next'} <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default OnboardingGuide;
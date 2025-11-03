import React, { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { IDLE_DETECTION_SECONDS } from '../constants';

const IdleTimeTracker: React.FC = () => {
  const { 
    isDayStarted, 
    activeTask, 
    idleState, 
    setIdleState, 
    openIdleReviewModal 
  } = useAppStore();
  
  const timerRef = useRef<number | null>(null);
  
  const resetStateMachine = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (useAppStore.getState().idleState) {
      setIdleState(null);
    }
  }, [setIdleState]);

  useEffect(() => {
    const handleUserActivity = () => {
      const currentState = useAppStore.getState().idleState;
      if (!currentState) return;

      if (currentState.status === 'detecting') {
        resetStateMachine();
      } else if (currentState.status === 'tracking_idle') {
        if (currentState.seconds > 2) { // Only log if idle for more than 2 seconds
          setIdleState({ ...currentState, status: 'review_pending' });
          openIdleReviewModal();
        } else {
          resetStateMachine();
        }
      }
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, handleUserActivity, { passive: true }));

    return () => {
      events.forEach(event => window.removeEventListener(event, handleUserActivity));
    };
  }, [resetStateMachine, openIdleReviewModal, setIdleState]);


  useEffect(() => {
    const canTrack = isDayStarted && !activeTask;
    
    if (!canTrack) {
      if (idleState) resetStateMachine();
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (idleState?.status === 'review_pending') {
      // Pause all timers while the review modal is open
      return;
    }

    if (!idleState) {
      timerRef.current = window.setTimeout(() => {
        setIdleState({
          status: 'detecting',
          seconds: IDLE_DETECTION_SECONDS,
        });
      }, 100);
    } else {
      switch (idleState.status) {
        case 'detecting':
          timerRef.current = window.setTimeout(() => {
            const remaining = idleState.seconds - 1;
            if (remaining > 0) {
              setIdleState({ ...idleState, seconds: remaining });
            } else {
              setIdleState({ status: 'tracking_idle', seconds: IDLE_DETECTION_SECONDS });
            }
          }, 1000);
          break;

        case 'tracking_idle':
          timerRef.current = window.setTimeout(() => {
            setIdleState({ ...idleState, seconds: idleState.seconds + 1 });
          }, 1000);
          break;
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [idleState, isDayStarted, activeTask, setIdleState, resetStateMachine]);

  return null;
};

export default IdleTimeTracker;
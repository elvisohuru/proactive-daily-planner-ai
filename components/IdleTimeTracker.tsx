import React, { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { IDLE_DETECTION_SECONDS } from '../constants';
import { throttle } from 'lodash';

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
    setIdleState(null);
  }, [setIdleState]);

  // Effect for handling user activity
  useEffect(() => {
    const handleUserActivity = () => {
      const currentState = useAppStore.getState().idleState;
      if (!currentState) return;

      if (currentState.status === 'detecting') {
        resetStateMachine();
      } else if (currentState.status === 'tracking_idle') {
        if (currentState.seconds > 2) {
          setIdleState({ ...currentState, status: 'review_pending' });
          openIdleReviewModal();
        } else {
          resetStateMachine();
        }
      }
    };

    const throttledActivityHandler = throttle(handleUserActivity, 500);

    const events: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, throttledActivityHandler, { passive: true }));

    return () => {
      events.forEach(event => window.removeEventListener(event, throttledActivityHandler));
      throttledActivityHandler.cancel();
    };
  }, [resetStateMachine, openIdleReviewModal, setIdleState]);

  // Effect for managing the state machine transitions
  useEffect(() => {
    const canTrack = isDayStarted && !activeTask;
    
    if (!canTrack) {
      if (idleState) {
        resetStateMachine();
      }
      return;
    }
    
    // If not tracking and conditions are met, start detection.
    if (!idleState) {
       setIdleState({
          status: 'detecting',
          seconds: IDLE_DETECTION_SECONDS,
       });
    }

  }, [isDayStarted, activeTask, idleState, resetStateMachine, setIdleState]);

  // Effect for managing the timer itself
  useEffect(() => {
    if (!idleState || idleState.status === 'review_pending') {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    timerRef.current = window.setTimeout(() => {
      setIdleState({
        ...idleState,
        seconds: idleState.status === 'detecting' 
          ? idleState.seconds - 1 
          : idleState.seconds + 1,
      });

      if (idleState.status === 'detecting' && idleState.seconds - 1 <= 0) {
        setIdleState({ status: 'tracking_idle', seconds: IDLE_DETECTION_SECONDS });
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [idleState, setIdleState]);

  return null;
};

export default IdleTimeTracker;

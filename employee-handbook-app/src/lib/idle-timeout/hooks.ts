'use client'
import { useEffect, useState } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';

export const useIdleTimeout = (timeoutMinutes = 60, warningMinutes = 5) => {
  const { signOut } = useClerk();
  const { isSignedIn, user } = useUser();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(warningMinutes * 60);

  const ABSOLUTE_SESSION_LIMIT = 7 * 24 * 60; 

  useEffect(() => {
    if (!isSignedIn || !user) return;

    const sessionAgeMinutes = (Date.now() - new Date(user.lastSignInAt || 0).getTime()) / (1000 * 60);
    if (sessionAgeMinutes >= ABSOLUTE_SESSION_LIMIT) {
      signOut();
      return;
    }

    let timeoutId: NodeJS.Timeout;
    let warningTimeoutId: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    const resetTimers = () => {
      setShowWarning(false);
      clearTimeout(timeoutId);
      clearTimeout(warningTimeoutId);
      clearInterval(countdownInterval);
      setSecondsLeft(warningMinutes * 60);

      warningTimeoutId = setTimeout(() => {
        setShowWarning(true);

        countdownInterval = setInterval(() => {
          setSecondsLeft(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              signOut().then(() => window.location.reload());
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, (timeoutMinutes - warningMinutes) * 60 * 1000);

      timeoutId = setTimeout(() => signOut(), timeoutMinutes * 60 * 1000);
    };

    resetTimers();
    events.forEach(event => window.addEventListener(event, resetTimers));

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(warningTimeoutId);
      clearInterval(countdownInterval);
      events.forEach(event => window.removeEventListener(event, resetTimers));
    };
  }, [isSignedIn, signOut, timeoutMinutes, warningMinutes, user]);

  return { showWarning, secondsLeft };
};
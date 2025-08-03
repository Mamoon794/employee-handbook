'use client';

import { useEffect } from 'react';
import { useClerk } from '@clerk/nextjs';

export function ClerkSignOutListener() {
  const clerk = useClerk();

  useEffect(() => {
    const unsubscribe = clerk.addListener(() => {
      window.localStorage.removeItem('loginTimestamp');
      return undefined;
    });

    return () => {
      unsubscribe();
    };
  }, [clerk]);

  return null;
}
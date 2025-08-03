'use client'
import { useIdleTimeout } from './hooks';
import { IdleTimeoutWarning } from './components';

export const IdleTimeoutProvider = ({ children }: { children: React.ReactNode }) => {
  const { showWarning, secondsLeft } = useIdleTimeout(60, 5); // warning at 5 min

  return (
    <>
      {children}
      <IdleTimeoutWarning 
        show={showWarning}
        secondsLeft={secondsLeft}
      />
    </>
  );
};
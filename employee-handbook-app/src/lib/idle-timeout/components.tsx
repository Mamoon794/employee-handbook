'use client'
import { useEffect } from 'react';

export const IdleTimeoutWarning = ({
  show,
  secondsLeft,
}: {
  show: boolean;
  secondsLeft: number;
}) => {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
      document.body.style.pointerEvents = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    };
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        className="bg-white rounded-lg shadow-md p-8 w-[95%] max-w-md text-center"
        style={{ pointerEvents: 'auto' }}
      >
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">
          Session About to Expire
        </h2>
        <p className="text-gray-600 mb-6">
          You&apos;ll be logged out in{' '}
          <span className="font-bold">
            {minutes > 0 ? `${minutes} minute${minutes !== 1 ? 's' : ''} and ` : ''}
            {seconds} second{seconds !== 1 ? 's' : ''}
          </span>
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            const event = new Event('mousedown');
            window.dispatchEvent(event);
          }}
          className="bg-blue-800 text-white font-semibold px-6 py-2 rounded-md hover:bg-blue-700 transition-colors mx-auto"
        >
          Stay Logged In
        </button>
      </div>
    </div>
  );
};
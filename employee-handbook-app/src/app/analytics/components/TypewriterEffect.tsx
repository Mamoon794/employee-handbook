'use client';

import { useState, useEffect } from 'react';

interface TypewriterEffectProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export default function TypewriterEffect({ 
  text, 
  speed = 50, 
  className = "", 
  onComplete 
}: TypewriterEffectProps) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    setDisplayedText("");
    
    if (!text) return;

    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  const formatText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    
    return (
      <div className="space-y-2">
        {lines.map((line, index) => {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('- ')) {
            return (
              <div key={index} className="flex items-start space-x-2">
                <span className="text-blue-500 font-bold mt-1">•</span>
                <span className="text-gray-700 text-sm leading-relaxed">
                  {trimmedLine.substring(2)}
                </span>
              </div>
            );
          }
          return (
            <p key={index} className="text-gray-700 text-sm leading-relaxed">
              {trimmedLine}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`${className}`}>
      {formatText(displayedText)}
    </div>
  );
} 
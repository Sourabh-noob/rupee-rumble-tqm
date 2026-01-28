import React, { useEffect, useState, useRef } from 'react';
import { Timer as TimerIcon } from 'lucide-react';
import { playSound } from '../utils/sound';

interface TimerProps {
  duration: number;
  onTimeUp: () => void;
  isActive: boolean;
  soundEnabled: boolean;
}

const Timer: React.FC<TimerProps> = ({ duration, onTimeUp, isActive, soundEnabled }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const onTimeUpRef = useRef(onTimeUp);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(duration);
      return;
    }

    if (soundEnabled) playSound('start');

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (soundEnabled) playSound('end');
          onTimeUpRef.current();
          return 0;
        }
        const next = prev - 1;
        if (soundEnabled) {
          if (next <= 10) playSound('urgent');
          else playSound('heartbeat');
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, duration, soundEnabled]);

  const progress = (timeLeft / duration) * 100;
  const isUrgent = timeLeft <= 10;

  return (
    <div className="relative flex items-center justify-center w-24 h-24 md:w-32 md:h-32 shrink-0">
      <style>{`
        @keyframes heartbeat { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        .animate-heartbeat { animation: heartbeat 1s ease-in-out infinite; }
      `}</style>
      
      <div className={`absolute inset-0 rounded-full border-4 transition-colors ${isUrgent ? 'border-red-600 animate-heartbeat' : 'border-indigo-500'}`} />
      
      <div className="flex flex-col items-center z-10">
          <TimerIcon className={`w-4 h-4 md:w-6 md:h-6 mb-1 ${isUrgent ? 'text-red-500' : 'text-indigo-400'}`} />
          <span className={`text-2xl md:text-3xl font-bold font-mono ${isUrgent ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
              {timeLeft}
          </span>
      </div>

      <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
         <circle
           cx="50" cy="50" r="46"
           fill="none" stroke="currentColor" strokeWidth="4"
           strokeDasharray="289"
           strokeDashoffset={289 - (289 * progress) / 100}
           strokeLinecap="round"
           className={`transition-all duration-1000 ease-linear ${isUrgent ? 'text-red-600' : 'text-indigo-600'}`}
         />
      </svg>
    </div>
  );
};

export default Timer;
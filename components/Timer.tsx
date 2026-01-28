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
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    // Stop and clear any existing ticking
    if (timerRef.current) clearInterval(timerRef.current);

    if (!isActive) {
      setTimeLeft(duration);
      return;
    }

    // Timer is active: Start the clock
    console.log("Timer component: Starting countdown");
    setTimeLeft(duration);
    if (soundEnabled) playSound('start');

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (soundEnabled) playSound('end');
          onTimeUpRef.current();
          return 0;
        }
        
        const next = prev - 1;
        if (soundEnabled) {
          if (next <= 10) playSound('urgent');
          else if (next % 2 === 0) playSound('heartbeat');
        }
        return next;
      });
    }, 1000);

    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, duration, soundEnabled]);

  const progress = (timeLeft / duration) * 100;
  const isUrgent = timeLeft <= 10;

  return (
    <div className="relative flex items-center justify-center w-24 h-24 md:w-32 md:h-32 shrink-0 group">
      <div className={`absolute inset-0 rounded-full border-2 transition-all duration-300 ${isUrgent && isActive ? 'border-red-600 scale-105 shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'border-indigo-500/30'}`} />
      
      <div className="flex flex-col items-center z-10">
          <TimerIcon className={`w-4 h-4 mb-1 transition-colors ${isUrgent && isActive ? 'text-red-500 animate-pulse' : 'text-indigo-400'}`} />
          <span className={`text-3xl font-bold font-mono transition-colors ${isUrgent && isActive ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
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
           className={`transition-all duration-1000 ease-linear ${isUrgent && isActive ? 'text-red-600' : 'text-indigo-500'}`}
         />
      </svg>
    </div>
  );
};

export default Timer;
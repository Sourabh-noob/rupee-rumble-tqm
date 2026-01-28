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
  const activeRef = useRef(isActive);

  // Keep refs up to date for the interval
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
    activeRef.current = isActive;
  }, [onTimeUp, isActive]);

  // Main Timer Logic
  useEffect(() => {
    // Reset timer to full whenever it is NOT active
    if (!isActive) {
      setTimeLeft(duration);
      return;
    }

    console.log("Timer Component: Ticking Started at", duration);
    if (soundEnabled) playSound('start');

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (activeRef.current) {
            console.log("Timer Component: Time Expired");
            if (soundEnabled) playSound('end');
            onTimeUpRef.current();
          }
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

    return () => {
      console.log("Timer Component: Ticking Stopped");
      clearInterval(interval);
    };
  }, [isActive, duration, soundEnabled]);

  const isUrgent = timeLeft <= 10;
  const isCritical = timeLeft <= 5;
  const progress = (timeLeft / duration) * 100;

  const getColorClasses = () => {
    if (timeLeft > 20) return 'text-green-500 border-green-500';
    if (timeLeft > 10) return 'text-yellow-500 border-yellow-500';
    return 'text-red-600 border-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]';
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 md:p-4">
      <style>{`
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-heartbeat { animation: heartbeat 1s ease-in-out infinite; }
        
        @keyframes shake {
          0%, 100% { transform: translate(0,0); }
          25% { transform: translate(2px, 0); }
          75% { transform: translate(-2px, 0); }
        }
        .animate-critical { animation: shake 0.2s linear infinite; }
      `}</style>

      <div className={`relative flex items-center justify-center w-24 h-24 md:w-36 md:h-36 rounded-full border-4 ${getColorClasses()} transition-colors duration-300 ${isCritical ? 'animate-critical' : isUrgent ? 'animate-heartbeat' : ''}`}>
        
        <div className="flex flex-col items-center z-10">
            <TimerIcon className={`w-5 h-5 md:w-8 md:h-8 mb-0.5 ${isUrgent ? 'animate-bounce' : ''}`} />
            <span className="text-2xl md:text-4xl font-bold font-mono">
                {timeLeft}<span className="text-xs md:text-sm">s</span>
            </span>
        </div>

        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 144 144">
           <circle cx="72" cy="72" r="64" fill="none" stroke="currentColor" strokeWidth="4" className="opacity-10" />
           <circle
             cx="72"
             cy="72"
             r="64"
             fill="none"
             stroke="currentColor"
             strokeWidth="6"
             strokeDasharray="402"
             strokeDashoffset={402 - (402 * progress) / 100}
             strokeLinecap="round"
             className="transition-all duration-1000 ease-linear"
           />
        </svg>
      </div>
    </div>
  );
};

export default Timer;
import React, { useEffect, useState } from 'react';
import { Timer as TimerIcon } from 'lucide-react';
import { playSound } from '../utils/sound';

interface TimerProps {
  duration: number;
  onTimeUp: () => void;
  isActive: boolean;
}

const Timer: React.FC<TimerProps> = ({ duration, onTimeUp, isActive }) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  // Handle Start Sound
  useEffect(() => {
    if (isActive) {
      playSound('start');
    }
  }, [isActive]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newValue = prev - 1;
          
          if (newValue <= 0) {
            clearInterval(interval);
            playSound('end');
            onTimeUp();
            return 0;
          }
          
          // Play tick sound for every second
          // Optional: You could make it more urgent (different sound) in last 10s
          playSound('tick');
          
          return newValue;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, onTimeUp]);

  const getColor = () => {
    if (timeLeft > 20) return 'text-green-500 border-green-500';
    if (timeLeft > 10) return 'text-yellow-500 border-yellow-500';
    return 'text-red-500 border-red-500 animate-pulse';
  };

  const progress = (timeLeft / duration) * 100;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className={`relative flex items-center justify-center w-32 h-32 rounded-full border-4 ${getColor()} transition-colors duration-500`}>
        <div className="flex flex-col items-center">
            <TimerIcon className={`w-6 h-6 mb-1 ${getColor()}`} />
            <span className={`text-3xl font-bold font-mono ${getColor()}`}>
            {timeLeft}s
            </span>
        </div>
        <svg className="absolute top-0 left-0 w-full h-full -rotate-90 pointer-events-none transform -translate-0.5 -translate-0.5">
           <circle
             cx="60"
             cy="60"
             r="56"
             fill="none"
             stroke="currentColor"
             strokeWidth="2"
             className="text-gray-800"
           />
           <circle
             cx="60"
             cy="60"
             r="56"
             fill="none"
             stroke="currentColor"
             strokeWidth="4"
             strokeDasharray="351"
             strokeDashoffset={351 - (351 * progress) / 100}
             className={`${getColor()} transition-all duration-1000 ease-linear`}
           />
        </svg>
      </div>
    </div>
  );
};

export default Timer;
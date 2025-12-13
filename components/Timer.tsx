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
          
          // Sound logic
          if (newValue <= 10) {
            playSound('urgent'); // Distinct sound for last 10s
          } else {
            playSound('tick');
          }
          
          return newValue;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, onTimeUp]);

  // Visual urgency helpers
  const isUrgent = timeLeft <= 10;
  const isCritical = timeLeft <= 5;

  const getColorClasses = () => {
    if (timeLeft > 20) return 'text-green-500 border-green-500';
    if (timeLeft > 10) return 'text-yellow-500 border-yellow-500';
    return 'text-red-600 border-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]';
  };

  const getContainerAnimation = () => {
    if (isCritical) return 'animate-critical-shake';
    if (isUrgent) return 'animate-heartbeat';
    return '';
  };

  const progress = (timeLeft / duration) * 100;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Inject custom animations */}
      <style>{`
        @keyframes heartbeat {
          0% { transform: scale(1); }
          15% { transform: scale(1.05); }
          30% { transform: scale(1); }
          45% { transform: scale(1.05); }
          60% { transform: scale(1); }
          100% { transform: scale(1); }
        }
        .animate-heartbeat {
          animation: heartbeat 1s ease-in-out infinite;
        }
        
        @keyframes critical-shake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          10% { transform: translate(-1px, -2px) rotate(-1deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(3px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(3px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(1px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        .animate-critical-shake {
            animation: critical-shake 0.5s cubic-bezier(.36,.07,.19,.97) both infinite;
        }

        @keyframes urgent-flash {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }
        .animate-urgent-text {
            animation: urgent-flash 0.5s linear infinite;
        }
      `}</style>

      <div className={`relative flex items-center justify-center w-36 h-36 rounded-full border-4 ${getColorClasses()} transition-colors duration-300 ${getContainerAnimation()}`}>
        
        {/* Inner Content */}
        <div className="flex flex-col items-center z-10">
            <TimerIcon className={`w-8 h-8 mb-1 ${isUrgent ? 'animate-bounce' : ''} ${getColorClasses().split(' ')[0]}`} />
            <span className={`text-4xl font-bold font-mono leading-none ${getColorClasses().split(' ')[0]} ${isUrgent ? 'animate-urgent-text' : ''}`}>
            {timeLeft}
            <span className="text-sm ml-0.5">s</span>
            </span>
        </div>

        {/* Background track */}
        <svg className="absolute top-0 left-0 w-full h-full -rotate-90 pointer-events-none transform -translate-0.5 -translate-0.5 overflow-visible">
           <circle
             cx="50%"
             cy="50%"
             r="64"
             fill="none"
             stroke="currentColor"
             strokeWidth="4"
             className="text-slate-200 dark:text-slate-800 transition-colors duration-300 opacity-30"
           />
           {/* Progress Ring */}
           <circle
             cx="50%"
             cy="50%"
             r="64"
             fill="none"
             stroke="currentColor"
             strokeWidth="6"
             strokeDasharray="402" // 2 * pi * 64
             strokeDashoffset={402 - (402 * progress) / 100}
             strokeLinecap="round"
             className={`${getColorClasses().split(' ')[0]} transition-all duration-1000 ease-linear drop-shadow-md`}
           />
        </svg>

        {/* Urgency Overlay Background Pulse */}
        {isUrgent && (
            <div className="absolute inset-0 rounded-full bg-red-500 opacity-10 animate-ping pointer-events-none"></div>
        )}
      </div>
    </div>
  );
};

export default Timer;
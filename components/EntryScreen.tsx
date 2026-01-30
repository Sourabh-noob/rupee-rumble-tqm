
import React, { useState } from 'react';
import { Team } from '../types';
import { Users, Briefcase, Lock, LogIn, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { ShootingStars } from './ui/ShootingStars';

interface EntryScreenProps {
  onJoin: (team: Team) => void;
  onAdminLogin: () => void;
}

const EntryScreen: React.FC<EntryScreenProps> = ({ onJoin, onAdminLogin }) => {
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  
  // Admin Login State
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName && members && !isJoining) {
      setIsJoining(true);
      try {
        await onJoin({
          id: `team-${Date.now()}`,
          name: teamName,
          members: members,
          balance: 1000,
          history: [],
        });
      } finally {
        setIsJoining(false);
      }
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'TheQuizMasters' && password === 'TheQuizMasters') {
        onAdminLogin();
        setLoginError('');
    } else {
        setLoginError('Invalid credentials');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 w-full transition-colors duration-300 relative overflow-hidden">
      
      {/* Background Effect */}
      <ShootingStars starColor="#eab308" trailColor="#6366f1" minDelay={800} maxDelay={3000} />

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl transition-colors">
            <div className="text-center mb-8">
            <h1 className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-600 dark:from-amber-200 dark:to-yellow-500 mb-2">
                RUPEE RUMBLE
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-mono text-[10px] uppercase tracking-[0.3em]">Participants Terminal Login</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Briefcase size={12} /> Team Name
                </label>
                <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none transition-all focus-glow text-sm font-bold"
                placeholder="e.g. BG Baddies"
                required
                disabled={isJoining}
                />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Users size={12} /> Members Names
                </label>
                <textarea
                value={members}
                onChange={(e) => setMembers(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none transition-all h-20 resize-none focus-glow text-sm font-bold"
                placeholder="Comma separated names..."
                required
                disabled={isJoining}
                />
            </div>

            <button
                type="submit"
                disabled={isJoining}
                className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white font-black py-4 rounded-xl shadow-lg shadow-amber-900/20 transform hover:-translate-y-1 transition-all active:scale-95 ${isJoining ? 'opacity-70 cursor-not-allowed' : 'hover-glow'}`}
            >
                {isJoining ? <><Loader2 size={18} className="animate-spin" /> SECURING TERMINAL...</> : 'ENTER THE QUIZ'}
            </button>
            </form>
        </div>

        <div className="bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-colors">
            <button 
                onClick={() => setShowAdminLogin(!showAdminLogin)}
                className="w-full p-4 flex items-center justify-between text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-[10px] font-black uppercase tracking-widest transition-colors"
            >
                <span className="flex items-center gap-2"><Lock size={12} /> The Quizmaster's Access</span>
                {showAdminLogin ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            
            {showAdminLogin && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                    <form onSubmit={handleAdminSubmit} className="space-y-3">
                        <input
                            type="text"
                            placeholder="Director Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none font-bold"
                        />
                        <input
                            type="password"
                            placeholder="Authority Key"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none font-bold"
                        />
                        {loginError && <p className="text-red-500 text-[10px] font-bold uppercase">{loginError}</p>}
                        <button 
                            type="submit"
                            className="w-full bg-slate-900 text-white dark:bg-slate-700 hover:bg-slate-800 text-[10px] font-black py-2 rounded transition-colors flex items-center justify-center gap-2 uppercase tracking-widest"
                        >
                            Authorize Access
                        </button>
                    </form>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default EntryScreen;

import React, { useEffect, useState } from 'react';
import { Team } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RotateCcw, Award, Trophy, Users, TrendingUp } from 'lucide-react';
import { getLeaderboard, LeaderboardEntry } from '../utils/leaderboard';

interface FinalStandingsProps {
  team: Team;
  onRestart: () => void;
}

const FinalStandings: React.FC<FinalStandingsProps> = ({ team, onRestart }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'history'>('stats');

  // Load and subscribe to leaderboard updates
  useEffect(() => {
    // Initial load
    setLeaderboard(getLeaderboard());

    // Listen for storage events (updates from other tabs)
    const handleStorage = () => {
        setLeaderboard(getLeaderboard());
    };
    window.addEventListener('storage', handleStorage);

    // Poll for updates (in case storage event doesn't fire on same tab or other weirdness)
    const interval = setInterval(() => {
        setLeaderboard(getLeaderboard());
    }, 2000);

    return () => {
        window.removeEventListener('storage', handleStorage);
        clearInterval(interval);
    };
  }, []);

  const chartData = [
    { name: 'Start', balance: 1000 },
    ...team.history.map((h, i) => ({
      name: `R${i + 1}`,
      balance: h.endBalance,
    })),
  ];

  const finalBalance = team.balance;
  const roi = ((finalBalance - 1000) / 1000) * 100;

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-7xl mx-auto space-y-12">
      <div className="text-center space-y-4 pt-8">
        <div className="relative inline-block">
             <Award className="w-20 h-20 text-yellow-500 mx-auto animate-bounce" />
             <div className="absolute inset-0 bg-yellow-500 blur-2xl opacity-30 animate-pulse"></div>
        </div>
        <div>
            <h1 className="text-5xl md:text-6xl font-display font-bold text-slate-900 dark:text-white mb-2">MARKET CLOSE</h1>
            <p className="text-xl text-slate-500 dark:text-slate-400 font-mono tracking-widest">{team.name.toUpperCase()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 text-center shadow-lg transition-colors group hover:border-yellow-500/50">
            <div className="text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider font-bold">Final NAV</div>
            <div className="text-5xl font-mono font-bold text-slate-900 dark:text-white mt-4 group-hover:scale-110 transition-transform">₹{finalBalance}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 text-center shadow-lg transition-colors group hover:border-indigo-500/50">
            <div className="text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider font-bold">ROI</div>
            <div className={`text-5xl font-mono font-bold mt-4 group-hover:scale-110 transition-transform ${roi >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                {roi.toFixed(1)}%
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 text-center shadow-lg transition-colors group hover:border-purple-500/50">
            <div className="text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider font-bold">Rounds Survived</div>
            <div className="text-5xl font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-4 group-hover:scale-110 transition-transform">
                {team.history.length} / 5
            </div>
        </div>
      </div>

      {/* Main Grid: Chart & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
        
        {/* Left Column: Chart & History */}
        <div className="space-y-8">
             <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 dark:text-white">
                        <TrendingUp size={20} className="text-indigo-500"/> Performance Curve
                    </h3>
                </div>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                        <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.1} vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 12}} />
                        <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--tw-prose-invert-bg)', borderColor: '#475569', color: '#fff', borderRadius: '8px' }}
                            itemStyle={{ color: '#818cf8' }}
                        />
                        <Area type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorBal)" />
                    </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Toggle for History */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg">
                 <div className="flex border-b border-slate-200 dark:border-slate-700">
                    <button 
                        onClick={() => setActiveTab('stats')}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'stats' ? 'bg-slate-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-300' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                    >
                        Transaction Log
                    </button>
                 </div>
                 <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 uppercase font-mono text-xs sticky top-0">
                            <tr>
                                <th className="p-3">Rd</th>
                                <th className="p-3">Start</th>
                                <th className="p-3">Win</th>
                                <th className="p-3">Alloc</th>
                                <th className="p-3 text-right">End</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {team.history.map((round) => (
                                <tr key={round.roundNumber} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="p-3 font-bold">R{round.roundNumber}</td>
                                    <td className="p-3 font-mono">₹{round.startBalance}</td>
                                    <td className="p-3 font-bold text-yellow-600 dark:text-yellow-500">{round.correctAnswer}</td>
                                    <td className="p-3 font-mono text-green-600 dark:text-green-400">₹{round.allocations[round.correctAnswer]}</td>
                                    <td className="p-3 font-mono text-right font-bold">₹{round.endBalance}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>

        {/* Right Column: Global Leaderboard */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden flex flex-col h-full max-h-[600px]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2 dark:text-white">
                    <Trophy size={20} className="text-yellow-500"/> Global Leaderboard
                </h3>
                <span className="text-xs font-mono px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                    LIVE
                </span>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase font-mono text-xs sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-4 w-16 text-center">#</th>
                            <th className="p-4">Team</th>
                            <th className="p-4 text-center hidden sm:table-cell">Rounds</th>
                            <th className="p-4 text-right">NAV</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {leaderboard.map((entry, index) => {
                            const isCurrentTeam = entry.name === team.name && entry.timestamp > (Date.now() - 5000); // Simple heuristic for highlighting recent entry
                            
                            let rankIcon = null;
                            if (index === 0) rankIcon = <span className="text-2xl">🥇</span>;
                            else if (index === 1) rankIcon = <span className="text-2xl">🥈</span>;
                            else if (index === 2) rankIcon = <span className="text-2xl">🥉</span>;
                            else rankIcon = <span className="font-mono font-bold text-slate-400">#{index + 1}</span>;

                            return (
                                <tr 
                                    key={entry.id} 
                                    className={`
                                        transition-colors
                                        ${isCurrentTeam ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}
                                    `}
                                >
                                    <td className="p-4 text-center align-middle">{rankIcon}</td>
                                    <td className="p-4">
                                        <div className={`font-bold ${isCurrentTeam ? 'text-yellow-700 dark:text-yellow-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {entry.name}
                                        </div>
                                        <div className="text-xs text-slate-400 font-mono sm:hidden">
                                            {entry.roundsPlayed} Rounds
                                        </div>
                                    </td>
                                    <td className="p-4 text-center text-slate-500 dark:text-slate-400 font-mono hidden sm:table-cell">
                                        {entry.roundsPlayed}
                                    </td>
                                    <td className={`p-4 text-right font-mono font-bold ${isCurrentTeam ? 'text-yellow-700 dark:text-yellow-400' : 'text-slate-900 dark:text-white'}`}>
                                        ₹{entry.balance}
                                    </td>
                                </tr>
                            );
                        })}
                        {leaderboard.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                                    No records yet. Be the first!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

      </div>

      <button
        onClick={onRestart}
        className="flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 hover:from-slate-700 hover:to-slate-800 dark:hover:from-slate-600 dark:hover:to-slate-700 text-white font-bold rounded-xl transition-all transform hover:-translate-y-1 shadow-xl"
      >
        <RotateCcw size={20} /> Return to Entry
      </button>
    </div>
  );
};

export default FinalStandings;
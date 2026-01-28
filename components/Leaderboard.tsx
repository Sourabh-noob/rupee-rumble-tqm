
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseService';
import { Team } from '../types';
// Fix: Added missing Radio icon to the lucide-react imports
import { Trophy, TrendingUp, TrendingDown, Minus, Medal, Loader2, AlertTriangle, RefreshCw, Radio } from 'lucide-react';

interface LeaderboardProps {
  currentRound: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ currentRound }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('balance', { ascending: false });
      
      if (error) throw error;
      setTeams(data as Team[] || []);
      setError(null);
    } catch (err: any) {
      console.error("Leaderboard fetch error:", err);
      setError("Market data fetch failed. Retrying...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();

    // Listen for real-time changes to the teams table
    const channel = supabase.channel('leaderboard-room')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        fetchTeams();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading && teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 p-12">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-500 mb-6" />
        <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse">Aggregating Global Standings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 animate-fade-in flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-[10px] font-black uppercase tracking-widest">
            <Radio size={12} className="animate-pulse" /> Live Exchange Feed
          </div>
          <h2 className="text-4xl md:text-6xl font-display font-black text-slate-900 dark:text-white tracking-tighter">
            MARKET RANKINGS
          </h2>
          <p className="text-slate-400 font-mono text-xs uppercase tracking-[0.3em]">Round {currentRound} Performance Index</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center justify-between text-red-500 text-sm font-bold">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} /> {error}
            </div>
            <button onClick={() => { setLoading(true); fetchTeams(); }} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors">
              <RefreshCw size={16} />
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
          {teams.length === 0 ? (
            <div className="p-24 text-center space-y-6">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300 dark:text-slate-600">
                <Trophy size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Waiting for Entrants</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">No teams have registered on the exchange for the current session. Please wait for the floor manager.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest"># RANK</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ENTITY</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">P&L (R{currentRound})</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">NET ASSET VALUE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {teams.map((team, index) => {
                    const rank = index + 1;
                    const lastRound = team.history.find(h => h.roundNumber === currentRound);
                    const profit = lastRound ? lastRound.endBalance - lastRound.startBalance : 0;
                    
                    return (
                      <tr key={team.id} className={`group transition-all hover:bg-indigo-50 dark:hover:bg-indigo-900/10 ${rank === 1 ? 'bg-yellow-50/20 dark:bg-yellow-900/5' : ''}`}>
                        <td className="px-8 py-8">
                          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 font-mono font-black text-lg text-slate-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                          </div>
                        </td>
                        <td className="px-8 py-8">
                          <div className="flex flex-col">
                            <span className="font-black text-lg text-slate-900 dark:text-white tracking-tight leading-none mb-2">{team.name}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60 truncate max-w-[200px]">{team.members}</span>
                          </div>
                        </td>
                        <td className="px-8 py-8">
                          <div className={`flex items-center gap-2 font-mono text-sm font-black p-2 rounded-lg inline-flex ${profit > 0 ? 'bg-green-100 dark:bg-green-900/20 text-green-500' : profit < 0 ? 'bg-red-100 dark:bg-red-900/20 text-red-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                            {profit > 0 ? <TrendingUp size={16} /> : profit < 0 ? <TrendingDown size={16} /> : <Minus size={16} />}
                            ₹{Math.abs(profit)}
                          </div>
                        </td>
                        <td className="px-8 py-8 text-right">
                          <div className={`font-mono text-3xl font-black ${team.balance === 0 ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                            ₹{team.balance.toLocaleString()}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 opacity-40">
          <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Live Feed Active
          </div>
          <p className="text-[9px] font-mono text-slate-400 uppercase tracking-tighter">Verified Rupee Rumble Trading Terminal v2.1</p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;

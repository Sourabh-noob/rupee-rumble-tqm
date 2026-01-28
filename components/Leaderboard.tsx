import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseService';
import { Team } from '../types';
import { Trophy, TrendingUp, TrendingDown, Minus, Medal } from 'lucide-react';

interface LeaderboardProps {
  currentRound: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ currentRound }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('balance', { ascending: false });
      
      if (data && !error) {
        setTeams(data as Team[]);
      }
      setLoading(false);
    };

    fetchTeams();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 animate-fade-in">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-display font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
          MARKET STANDINGS
        </h2>
        <p className="text-slate-500 dark:text-slate-400 font-mono text-sm uppercase tracking-widest">
          End of Round {currentRound}
        </p>
      </div>

      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Rank</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Team</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Performance</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Net Asset Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {teams.map((team, index) => {
              const rank = index + 1;
              const lastRound = team.history.find(h => h.roundNumber === currentRound);
              const profit = lastRound ? lastRound.endBalance - lastRound.startBalance : 0;
              
              return (
                <tr key={team.id} className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30 ${rank === 1 ? 'bg-yellow-50/30 dark:bg-yellow-900/10' : ''}`}>
                  <td className="px-6 py-6">
                    <div className="flex items-center justify-center w-8 h-8">
                      {rank === 1 ? <Medal className="text-yellow-500" size={24} /> :
                       rank === 2 ? <Medal className="text-slate-400" size={24} /> :
                       rank === 3 ? <Medal className="text-amber-600" size={24} /> :
                       <span className="font-mono font-bold text-slate-400">{rank}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-white">{team.name}</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">{team.members}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className={`flex items-center gap-1 font-mono text-sm font-bold ${profit > 0 ? 'text-green-500' : profit < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                      {profit > 0 ? <TrendingUp size={14} /> : profit < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                      {profit !== 0 ? `₹${Math.abs(profit)}` : 'STABLE'}
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className={`font-mono text-xl font-black ${team.balance === 0 ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                      ₹{team.balance}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex justify-center">
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
          <Trophy size={14} className="text-yellow-500" /> Wait for the Admin to launch the next round
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;

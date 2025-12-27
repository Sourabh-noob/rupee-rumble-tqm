import React from 'react';
import { Team } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RotateCcw, Award, Users, TrendingUp, History, Skull } from 'lucide-react';

interface FinalStandingsProps {
  team: Team;
  onRestart: () => void;
}

const FinalStandings: React.FC<FinalStandingsProps> = ({ team, onRestart }) => {
  const chartData = [
    { name: 'Start', balance: 1000 },
    ...team.history.map((h, i) => ({
      name: `R${i + 1}`,
      balance: h.endBalance,
    })),
  ];

  const finalBalance = team.balance;
  const roundsPlayed = team.history.length;
  const maxRounds = 5;
  const isBankrupt = finalBalance === 0;

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-5xl mx-auto space-y-12">
      {/* Success or Failure Celebration Header */}
      <div className="text-center space-y-6 pt-12">
        <div className="relative inline-block">
             {isBankrupt ? (
               <Skull className="w-24 h-24 text-red-600 mx-auto animate-pulse" />
             ) : (
               <Award className="w-24 h-24 text-yellow-500 mx-auto animate-bounce" />
             )}
             <div className={`absolute inset-0 blur-3xl opacity-40 animate-pulse ${isBankrupt ? 'bg-red-600' : 'bg-yellow-500'}`}></div>
        </div>
        <div>
            <h1 className="text-5xl md:text-7xl font-display font-bold text-slate-900 dark:text-white mb-3 tracking-tighter">
              {isBankrupt ? 'MARKET EXIT' : 'MARKET CLOSE'}
            </h1>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${isBankrupt ? 'bg-red-100 dark:bg-red-900/40 border-red-200 dark:border-red-800' : 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800'}`}>
                <Users size={18} className={isBankrupt ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400'} />
                <span className={`text-lg font-bold uppercase tracking-widest ${isBankrupt ? 'text-red-900 dark:text-red-200' : 'text-indigo-900 dark:text-indigo-200'}`}>{team.name}</span>
            </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        <div className={`bg-white dark:bg-slate-800 p-10 rounded-3xl border text-center shadow-2xl transition-all group ${isBankrupt ? 'border-red-500/50 hover:shadow-red-500/10' : 'border-slate-200 dark:border-slate-700 hover:border-yellow-500/50 hover:shadow-yellow-500/10'}`}>
            <div className="text-slate-500 dark:text-slate-400 text-sm uppercase tracking-[0.2em] font-bold mb-2">Final Net Asset Value</div>
            <div className={`text-6xl font-mono font-black mt-4 group-hover:scale-110 transition-transform ${finalBalance > 0 ? 'text-slate-900 dark:text-white' : 'text-red-600'}`}>
                ₹{finalBalance}
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-10 rounded-3xl border border-slate-200 dark:border-slate-700 text-center shadow-2xl transition-all group hover:border-indigo-500/50 hover:shadow-indigo-500/10">
            <div className="text-slate-500 dark:text-slate-400 text-sm uppercase tracking-[0.2em] font-bold mb-2">Rounds Survived</div>
            <div className={`text-6xl font-mono font-black mt-4 group-hover:scale-110 transition-transform ${isBankrupt ? 'text-red-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                {roundsPlayed} / {maxRounds}
            </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="w-full max-w-4xl space-y-8">
        
        {/* Chart Card */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden relative">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
                    <TrendingUp size={24} className={isBankrupt ? 'text-red-500' : 'text-indigo-500'}/> Equity Curve
                </h3>
            </div>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                    <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isBankrupt ? "#ef4444" : "#6366f1"} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={isBankrupt ? "#ef4444" : "#6366f1"} stopOpacity={0}/>
                    </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.1} vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#94a3b8" 
                      tick={{fontSize: 12, fontWeight: 600}} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      tick={{fontSize: 12, fontWeight: 600}} 
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          borderColor: '#334155', 
                          color: '#fff', 
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                        itemStyle={{ color: isBankrupt ? '#f87171' : '#818cf8', fontWeight: 'bold' }}
                        formatter={(value) => [`₹${value}`, 'Balance']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="balance" 
                      stroke={isBankrupt ? "#ef4444" : "#6366f1"} 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorBal)" 
                      animationDuration={1500}
                    />
                </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Transaction History Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-3">
                <History size={20} className="text-slate-400" />
                <h3 className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest text-sm">Transaction Ledger</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px] tracking-widest">
                        <tr>
                            <th className="p-4 pl-8">Phase</th>
                            <th className="p-4">Opening</th>
                            <th className="p-4">Settlement</th>
                            <th className="p-4">Bet Outcome</th>
                            <th className="p-4 pr-8 text-right">Closing NAV</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {team.history.map((round) => (
                            <tr key={round.roundNumber} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="p-4 pl-8 font-bold text-slate-900 dark:text-slate-100">Round {round.roundNumber}</td>
                                <td className="p-4 font-mono text-slate-500 dark:text-slate-400">₹{round.startBalance}</td>
                                <td className="p-4">
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold text-xs">
                                    {round.correctAnswer}
                                  </span>
                                </td>
                                <td className={`p-4 font-mono font-bold ${round.allocations[round.correctAnswer] > 0 ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                                  {round.allocations[round.correctAnswer] > 0 ? `+₹${round.allocations[round.correctAnswer]}` : '₹0'}
                                </td>
                                <td className={`p-4 pr-8 font-mono text-right font-bold ${round.endBalance === 0 ? 'text-red-500' : 'text-slate-900 dark:text-slate-100'}`}>
                                  ₹{round.endBalance}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* Restart Footer - Hidden for bankrupt teams */}
      <div className="pt-4 pb-12">
        {!isBankrupt ? (
          <button
            onClick={onRestart}
            className="flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-slate-700 dark:to-indigo-900 hover:from-slate-800 hover:to-indigo-900 text-white font-bold rounded-2xl transition-all transform hover:-translate-y-1 shadow-2xl active:scale-95 group"
          >
            <RotateCcw size={22} className="group-hover:rotate-[-45deg] transition-transform" />
            START NEW VENTURE
          </button>
        ) : (
          <div className="bg-red-600/10 border-2 border-red-600/30 p-8 rounded-3xl text-center backdrop-blur-sm max-w-md">
            <h4 className="text-red-600 dark:text-red-400 font-display font-bold text-2xl mb-2">ACCOUNT TERMINATED</h4>
            <p className="text-red-900/60 dark:text-red-200/60 text-sm font-mono leading-relaxed">
              Insufficient capital to continue operations. Your seat in the Rupee Rumble has been forfeited. Better luck in the next market cycle.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinalStandings;
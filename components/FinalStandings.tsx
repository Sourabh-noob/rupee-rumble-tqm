import React from 'react';
import { Team } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RotateCcw, Award } from 'lucide-react';

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
  const roi = ((finalBalance - 1000) / 1000) * 100;

  return (
    <div className="min-h-screen p-8 flex flex-col items-center max-w-6xl mx-auto space-y-12">
      <div className="text-center space-y-2">
        <Award className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-5xl font-display font-bold text-slate-900 dark:text-white">MARKET CLOSE</h1>
        <p className="text-xl text-slate-500 dark:text-slate-400">{team.name} Performance Report</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 text-center shadow-lg transition-colors">
            <div className="text-slate-500 dark:text-slate-400 text-sm uppercase">Final NAV</div>
            <div className="text-4xl font-mono font-bold text-slate-900 dark:text-white mt-2">₹{finalBalance}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 text-center shadow-lg transition-colors">
            <div className="text-slate-500 dark:text-slate-400 text-sm uppercase">ROI</div>
            <div className={`text-4xl font-mono font-bold mt-2 ${roi >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                {roi.toFixed(1)}%
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 text-center shadow-lg transition-colors">
            <div className="text-slate-500 dark:text-slate-400 text-sm uppercase">Rounds Survived</div>
            <div className="text-4xl font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-2">
                {team.history.length} / 5
            </div>
        </div>
      </div>

      <div className="w-full h-96 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg transition-colors">
        <h3 className="text-slate-500 dark:text-slate-400 text-sm mb-4">Portfolio Performance</h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.3} />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
                contentStyle={{ backgroundColor: 'var(--tw-prose-invert-bg)', borderColor: '#475569', color: '#fff' }}
                itemStyle={{ color: '#818cf8' }}
            />
            <Area type="monotone" dataKey="balance" stroke="#6366f1" fillOpacity={1} fill="url(#colorBal)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full">
         <h3 className="text-xl font-display text-slate-900 dark:text-white mb-4">Transaction History</h3>
         <div className="overflow-x-auto rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
             <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
                 <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 uppercase font-mono">
                     <tr>
                         <th className="p-4 rounded-tl-lg">Round</th>
                         <th className="p-4">Start Balance</th>
                         <th className="p-4">Winner</th>
                         <th className="p-4">Allocated (Winner)</th>
                         <th className="p-4 rounded-tr-lg text-right">End Balance</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800/50">
                     {team.history.map((round) => (
                         <tr key={round.roundNumber} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                             <td className="p-4 font-bold text-slate-900 dark:text-white">Round {round.roundNumber}</td>
                             <td className="p-4 font-mono">₹{round.startBalance}</td>
                             <td className="p-4 font-bold text-yellow-600 dark:text-yellow-500">{round.correctAnswer}</td>
                             <td className="p-4 font-mono text-green-600 dark:text-green-400">₹{round.allocations[round.correctAnswer]}</td>
                             <td className="p-4 font-mono text-right text-slate-900 dark:text-white">₹{round.endBalance}</td>
                         </tr>
                     ))}
                 </tbody>
             </table>
         </div>
      </div>

      <button
        onClick={onRestart}
        className="flex items-center gap-2 px-8 py-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-xl transition-all"
      >
        <RotateCcw size={20} /> Return to Entry
      </button>
    </div>
  );
};

export default FinalStandings;
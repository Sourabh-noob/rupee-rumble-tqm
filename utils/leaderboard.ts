import { Team } from '../types';

export const LEADERBOARD_KEY = 'rupee_rumble_leaderboard_v1';

export interface LeaderboardEntry {
  id: string;
  name: string;
  balance: number;
  roundsPlayed: number;
  timestamp: number;
}

export const getLeaderboard = (): LeaderboardEntry[] => {
  try {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to parse leaderboard", e);
    return [];
  }
};

export const saveToLeaderboard = (team: Team) => {
  const entries = getLeaderboard();
  
  // Create a unique entry
  const newEntry: LeaderboardEntry = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: team.name,
    balance: team.balance,
    roundsPlayed: team.history.length,
    timestamp: Date.now()
  };
  
  entries.push(newEntry);
  
  // Sort: Balance Descending -> Rounds Played Descending -> Timestamp Descending (newer first)
  entries.sort((a, b) => {
    if (b.balance !== a.balance) return b.balance - a.balance;
    if (b.roundsPlayed !== a.roundsPlayed) return b.roundsPlayed - a.roundsPlayed;
    return b.timestamp - a.timestamp;
  });
  
  // Keep top 100 records to prevent infinite growth
  const sliced = entries.slice(0, 100);
  
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(sliced));
};

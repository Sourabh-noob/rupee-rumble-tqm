export type ImageSize = '1K' | '2K' | '4K';

export interface Team {
  id: string;
  name: string;
  members: string;
  avatarUrl?: string;
  balance: number;
  history: RoundResult[];
}

export interface Question {
  id: string;
  roundNumber: number; // 1-5
  questionNumber: number; // 1-5
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

export interface Allocations {
  A: number;
  B: number;
  C: number;
  D: number;
}

export interface RoundResult {
  roundNumber: number;
  questionNumber: number;
  startBalance: number;
  allocations: Allocations;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  endBalance: number;
}

export enum GameState {
  SETUP = 'SETUP', // Initial screen to name the 6 teams
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD', // Rounds Manager & Live Control
  PLAYING = 'PLAYING', // The Team Grid Screen
  GAME_OVER = 'GAME_OVER',
}

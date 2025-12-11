export type ImageSize = '1K' | '2K' | '4K';

export interface Team {
  name: string;
  members: string;
  avatarUrl?: string;
  balance: number;
  history: RoundResult[];
}

export interface Question {
  id: string;
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
  startBalance: number;
  allocations: Allocations;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  endBalance: number;
}

export enum GameState {
  ENTRY = 'ENTRY',
  LOADING_QUESTIONS = 'LOADING_QUESTIONS',
  PLAYING = 'PLAYING',
  ROUND_RESULT = 'ROUND_RESULT',
  GAME_OVER = 'GAME_OVER',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
}

export interface GameContextType {
  team: Team | null;
  setTeam: (team: Team) => void;
  gameState: GameState;
  setGameState: (state: GameState) => void;
  currentRoundIndex: number;
  setCurrentRoundIndex: (index: number) => void;
  questions: Question[];
  setQuestions: (questions: Question[]) => void;
}

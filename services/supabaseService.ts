import { createClient } from '@supabase/supabase-js';

// Updated credentials provided by the user to fix initialization errors.
const supabaseUrl = 'https://aobrusvteubxubtwchro.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvYnJ1c3Z0ZXVieHVidHdjaHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MTc0MjcsImV4cCI6MjA4NTE5MzQyN30.kYGNwLI2-suGj88htwgv4BhOQGi133D8mn0t47ktmGo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const GAME_STATE_ID = 1; // ID of the single row in game_state table

export interface RemoteGameState {
    current_round_index: number;
    is_timer_active: boolean;
    show_result: boolean;
    show_leaderboard: boolean;
}
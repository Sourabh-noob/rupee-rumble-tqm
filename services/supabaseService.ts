import { createClient } from '@supabase/supabase-js';

// Provided credentials to fix the "supabaseUrl is required" error.
// These allow the application to initialize the real-time backend connection.
const supabaseUrl = 'https://aobrusvteubxubtwchro.supabase.co';
const supabaseAnonKey = 'sb_publishable_YL6Fml2fjCsZcmrHymaN-g_BArS_J7I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const GAME_STATE_ID = 1; // ID of the single row in game_state table

export interface RemoteGameState {
    current_round_index: number;
    is_timer_active: boolean;
    show_result: boolean;
}
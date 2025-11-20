
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hvyaiympsugwdujqaxti.supabase.co';
const supabaseAnonKey = 'sb_publishable_EqsqlijuSJOrH6g6ScyIRg__Sb6IJY5';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

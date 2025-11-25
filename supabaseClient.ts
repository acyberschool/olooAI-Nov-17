import { createClient } from '@supabase/supabase-js';

// Hardcoded fallbacks to prevent white-screen crashes if environment variables fail to load
const FALLBACK_URL = 'https://hvyaiympsugwdujqaxti.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2eWFpeW1wc3Vnd2R1anFheHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2Mzk5OTgsImV4cCI6MjA3OTIxNTk5OH0.APGzFevx6OqM2K77vDEqnQ6N--90UN1XbuaUthd8glI';

const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key];
    }
    return undefined;
  } catch (e) {
    console.warn('Error reading env var:', key, e);
    return undefined;
  }
};

// Prioritize environment variables, but fall back to hardcoded keys to guarantee functionality
const supabaseUrl = getEnv('VITE_SUPABASE_URL') || FALLBACK_URL;
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || FALLBACK_KEY;

export const isSupabaseConfigured = true;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
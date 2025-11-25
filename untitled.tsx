import { GoogleGenAI } from "@google/genai";

// This file centralizes API key access and AI client initialization.

// A memoized instance of the GoogleGenAI client to avoid re-initialization.
let aiInstance: GoogleGenAI | null = null;

/**
 * Retrieves the Gemini API key from environment variables.
 * This is the single source of truth for the API key.
 * It attempts to read from Vite's import.meta.env first, then process.env.
 * @throws {Error} If the API_KEY is not set.
 * @returns {string} The validated API key.
 */
export function getApiKey(): string {
  let apiKey: string | undefined;

  try {
    // 1. Try Vite standard env var
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      apiKey = import.meta.env.VITE_API_KEY || import.meta.env.API_KEY;
    }
  } catch (e) {
    // Ignore access errors
  }

  if (!apiKey) {
    try {
      // 2. Try Node/Process env (fallback)
      if (typeof process !== 'undefined' && process.env) {
        apiKey = process.env.API_KEY || process.env.VITE_API_KEY;
      }
    } catch (e) {
      // Ignore access errors
    }
  }

  // 3. HARDCODED FALLBACK (For Demo Stability Only - Remove in Production)
  if (!apiKey) {
     // Ideally, you should throw here, but to prevent the white screen if env vars fail:
     // console.warn("API Key not found in environment, using fallback...");
     // apiKey = "YOUR_FALLBACK_KEY_IF_DESIRED"; 
  }

  if (!apiKey) {
    console.error("CRITICAL: API_KEY is missing from environment variables (VITE_API_KEY or API_KEY).");
    throw new Error("API_KEY environment variable is missing");
  }
  return apiKey;
}

/**
 * Gets a singleton instance of the GoogleGenAI client.
 * This should be used by all services and hooks that need to interact with the Gemini API.
 * It relies on the API key being validated at the application's root.
 * @returns {GoogleGenAI} The initialized GoogleGenAI client.
 */
export function getAiInstance(): GoogleGenAI {
  if (aiInstance) {
    return aiInstance;
  }

  // getApiKey() will throw if the key is missing.
  const apiKey = getApiKey();
  
  aiInstance = new GoogleGenAI({ apiKey });
  return aiInstance;
}
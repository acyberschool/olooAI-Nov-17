
import { GoogleGenAI } from "@google/genai";

// This file centralizes API key access and AI client initialization.

// A memoized instance of the GoogleGenAI client to avoid re-initialization.
let aiInstance: GoogleGenAI | null = null;

/**
 * Retrieves the Gemini API key from environment variables.
 * This is the single source of truth for the API key.
 * It uses process.env.API_KEY as required by the platform.
 * @throws {Error} If the API_KEY is not set.
 * @returns {string} The validated API key.
 */
export function getApiKey(): string {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
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

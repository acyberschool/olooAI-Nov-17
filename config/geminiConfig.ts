// config/geminiConfig.ts
// url: https://github.com/acyberschool/olooAI-Nov-17/blob/main/config/geminiConfig.ts
// Improved environment-variable resolution and server/client safety checks.

import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function isServerSide() {
  return typeof window === 'undefined';
}

/**
 * Resolve API key from multiple possible sources:
 * - Vite client builds: import.meta.env.VITE_API_KEY or VITE_OPENAI_API_KEY
 * - Node/server builds: process.env.API_KEY or process.env.OPENAI_API_KEY
 * This keeps a single accessor for the rest of the app and clarifies what to set on Vercel.
 */
export function getApiKey(): string {
  // Try Vite-style env (client-side builds using Vite)
  // Access import.meta.env in a type-safe way without TypeScript errors.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const importMetaEnv: any = typeof import !== 'undefined' && typeof (import as any).meta !== 'undefined' ? (import as any).meta.env : undefined;

  const viteKey = importMetaEnv?.VITE_API_KEY || importMetaEnv?.VITE_OPENAI_API_KEY;

  // Try Node-style env (server-side / process.env)
  const nodeKey = (typeof process !== 'undefined' && process.env) ? (process.env.API_KEY || process.env.OPENAI_API_KEY) : undefined;

  const key = viteKey || nodeKey || '';

  if (!key) {
    // Clear, actionable error so App.tsx can render the configuration error UI.
    throw new Error(
      'API_KEY is missing. Set VITE_API_KEY (for Vite client builds) or API_KEY/OPENAI_API_KEY for server builds as an environment variable and rebuild.'
    );
  }

  return key;
}

/**
 * Returns a singleton GoogleGenAI instance.
 * NOTE: For security, we avoid initializing the AI client in the browser because it would require
 * embedding the secret API key into the client bundle. Prefer calling AI from server-side code
 * (serverless functions / API routes) where secrets are safe.
 */
export function getAiInstance(): GoogleGenAI {
  if (aiInstance) return aiInstance;

  // Safety: ensure we're on server-side before creating the client
  if (!isServerSide()) {
    throw new Error('getAiInstance() must be called from server-side code. Do not initialize AI client in the browser.');
  }

  const apiKey = getApiKey();
  aiInstance = new GoogleGenAI({ apiKey });
  return aiInstance;
}
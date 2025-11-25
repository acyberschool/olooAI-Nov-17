# olooAI Technical Specifications & Feature Documentation

**Version:** 1.2.0
**Stack:** React (Vite), TypeScript, Tailwind CSS, Supabase (PostgreSQL), Google Gemini API (`@google/genai`).

---

## 1. System Architecture

olooAI operates as a Single Page Application (SPA) with a "thick client" architecture. Most business logic and AI orchestration happen client-side to ensure low latency, while Supabase handles persistence and authentication.

### 1.1 Frontend Layer
*   **Framework:** React 18+ with Functional Components and Hooks.
*   **Build Tool:** Vite for fast HMR and bundling.
*   **Styling:** Tailwind CSS for utility-first styling; custom `tailwind.config.js` for brand colors (`brevo-cta`, `brevo-light-gray`).
*   **Routing:** Conditional rendering based on `activeView` state (no external router library used to maintain simplicity for this specific architecture).

### 1.2 Backend & Data Layer (Supabase)
*   **Database:** PostgreSQL.
*   **Authentication:** Supabase Auth (Magic Links & Google OAuth).
*   **Client:** `@supabase/supabase-js` v2.
*   **Realtime:** Subscriptions enabled on `tasks` and `crm_entries` for collaborative updates.

### 1.3 AI Layer (Google Gemini)
*   **SDK:** `@google/genai` (v0.1.1+).
*   **Client:** Singleton instance initialized via `getAiInstance()` in `config/geminiConfig.ts`.
*   **Key Management:** `process.env.API_KEY` injected at build/runtime.

---

## 2. Core AI Engine Implementation

The AI logic is centralized in `hooks/useVoiceAssistant.ts` and `services/geminiService.ts`.

### 2.1 Voice Assistant (Live API)
*   **Model:** `gemini-2.5-flash-native-audio-preview-09-2025`.
*   **Protocol:** WebSocket via `ai.live.connect`.
*   **Audio Pipeline:**
    *   **Input:** Browser `MediaStream` -> `AudioContext` (16kHz) -> `ScriptProcessorNode` -> PCM encoding -> WebSocket.
    *   **Output:** Base64 PCM chunks from WebSocket -> `AudioBuffer` decoding -> `AudioBufferSourceNode` (24kHz) -> Playback queue (`nextStartTime` ref for gapless playback).
*   **Tool Use:**
    *   Tools are defined in `services/geminiService.ts` (`createBoardItem`, `createCrmEntry`, etc.).
    *   **Execution Flow:** User speaks -> Model triggers `toolCall` event -> Client executes JS function -> Client sends `toolResponse` back to Model -> Model generates confirmation audio.

### 2.2 The "Router Brain" (Universal Input)
*   **Service:** `services/routerBrainService.ts`.
*   **Model:** `gemini-2.5-flash`.
*   **Mechanism:**
    1.  **Context Injection:** Current view data (Client IDs, Deal names) is injected into the system prompt.
    2.  **Classification:** The prompt instructs the model to classify intent into actions: `create_task`, `create_note`, `create_deal`, etc.
    3.  **Structured Output:** Uses `responseSchema` (JSON) to force strict typing of the output.
    4.  **Execution:** The React component (`useKanban`) receives the JSON and dispatches the corresponding Supabase calls.

---

## 3. Feature Specifications

### 3.1 Task Management (Kanban & Gantt)
*   **Data Model:** `tasks` table.
    *   `id`, `title`, `status` (enum), `due_date`, `client_id` (FK), `deal_id` (FK), `business_line_id` (FK), `sub_tasks` (JSONB).
*   **AI Checklist:**
    *   **Trigger:** Task creation or opening detail modal.
    *   **Model:** `gemini-2.5-flash`.
    *   **Logic:** Generates a JSON array of strings based on the task title and context. Saved to `sub_tasks` JSONB column.
*   **Gantt View:**
    *   **Implementation:** `GanttChartView.tsx`.
    *   **Logic:** Calculates grid position `left` and `width` percentages based on `createdAt` and `dueDate` relative to a dynamic date range window.

### 3.2 CRM & Lead Intelligence
*   **Lead Scoring:**
    *   **Trigger:** "Analyze Lead" button on Client card.
    *   **Model:** `gemini-2.5-flash`.
    *   **Logic:** Analyzes `client.description` + `client.aiFocus`. Returns JSON `{ score: number, reason: string }`.
*   **Contextual Updates:**
    *   **Component:** `ContextualWalter.tsx`.
    *   **Logic:** Takes unstructured text (e.g., email paste). AI extracts semantic meaning to propose updates to `last_touch_summary`, `next_action`, and `stage`.
    *   **UI:** Displays a "Diff" view before committing to DB.

### 3.3 Search Grounding (Pulse & Competitors)
*   **Implementation:** `services/geminiService.ts` -> `generateContentWithSearch`.
*   **Tool:** `{ googleSearch: {} }`.
*   **Workflow:**
    1.  **Query Generation:** AI constructs a search query based on user intent (e.g., "News about [Client Name]").
    2.  **Search Execution:** Gemini performs the search and returns grounded text.
    3.  **Extraction:** A *second* AI call parses the unstructured search results into structured JSON (e.g., List of URLs, Titles, Snippets) for rendering.

### 3.4 Marketing Engine (Generative Media)
*   **Social Media Calendar:**
    *   **Logic:** `chat-to-calendar` pattern. User intent -> AI inference of strategy -> JSON Array of posts.
    *   **Data:** `social_posts` table.
*   **Image Generation:**
    *   **Model:** `gemini-2.5-flash-image` (Nano Banana).
    *   **Config:** `responseModalities: ['IMAGE']`.
    *   **Output:** Base64 string rendered as `data:image/png`.
*   **Video Generation:**
    *   **Model:** `veo-3.1-fast-generate-preview`.
    *   **Flow:** `generateVideos` -> Returns Operation Object -> Polling Loop (`getVideosOperation`) until `done` -> Video URI.

### 3.5 Document Automation
*   **Component:** `AiDocGenerator.tsx`.
*   **Logic:**
    1.  User prompt + Entity Context (Client Name, Deal Value).
    2.  `gemini-2.5-flash` generates text draft.
    3.  **Google Drive Integration (Mock):** In a real scenario, this would use the Google Drive API to create a file. Currently simulates a `.gdoc` creation saved to the `documents` table with a Google Docs URL format.

---

## 4. Database Schema (Supabase)

### Tables
*   **`business_lines`**: `id`, `name`, `description`, `ai_focus`, `customers`.
*   **`clients`**: `id`, `name`, `description`, `ai_focus`, `business_line_id`, `lead_score`, `contact_person_...`.
*   **`deals`**: `id`, `name`, `value`, `currency`, `stage`, `client_id`, `business_line_id`, `revenue_model`.
*   **`projects`**: `id`, `project_name`, `goal`, `stage`, `client_id`, `impact_metric`.
*   **`tasks`**: `id`, `title`, `status`, `due_date`, `priority`, `sub_tasks` (JSONB), `assignee_id`.
*   **`crm_entries`**: `id`, `summary`, `type`, `raw_content`, `client_id`, `deal_id`.
*   **`documents`**: `id`, `name`, `url`, `category`, `owner_id`, `owner_type`.
*   **`social_posts`**: `id`, `content`, `image_url`, `date`, `status`, `business_line_id`.
*   **`team_members`**: `id`, `email`, `role` (JSONB), `status`.

---

## 5. Technical Constraints & Considerations

1.  **Environment Variables:**
    *   The app relies strictly on `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
    *   `supabaseClient.ts` includes a hardcoded fallback for demo stability, but production builds must use env vars.

2.  **Audio Context:**
    *   Browser security requires user interaction (click) before `AudioContext` can start. The "Start Recording" button handles this.
    *   Sample rate conversion is handled manually in `geminiService.ts` (16kHz <-> 24kHz) to match Gemini Native Audio requirements.

3.  **Live API Reliability:**
    *   The WebSocket connection can be fragile on unstable networks. `useVoiceAssistant` includes automatic reconnection logic (`retryCountRef`).

4.  **Race Conditions:**
    *   `UniversalInputModal` handles both text and voice. When dictating, the transcript is appended to the text area in real-time via `useEffect` on the transcript state.

---

## 6. Admin & Analytics Implementation

*   **Super Admin:**
    *   Hardcoded check for specific email (e.g., `acyberorg@gmail.com`) in `App.tsx` to render the `AdminDashboard`.
    *   **Dashboard Logic:** Performs `count` queries (`{ count: 'exact', head: true }`) on major tables to avoid fetching all data rows for simple stats.

*   **Telemetry:**
    *   Google Analytics (`gtag`) wrapper function `trackEvent` is available globally for interaction tracking.

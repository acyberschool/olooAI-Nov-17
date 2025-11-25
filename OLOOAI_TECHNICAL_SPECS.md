
# olooAI Technical Specification & Engineering Reference

**Version:** 2.1.0 (Stable)
**Date:** October 26, 2023
**Audience:** Engineering Team (Frontend, Backend, AI Ops)

---

## 1. System Architecture Overview

olooAI utilizes a **Thick Client / Serverless** architecture. The React frontend handles the majority of business logic, AI orchestration, and state management, while Supabase provides Identity, Persistence, and Realtime synchronization.

### High-Level Stack
*   **Frontend:** React 18, TypeScript, Vite 5, Tailwind CSS.
*   **Backend (BaaS):** Supabase (PostgreSQL 15, GoTrue Auth, PostgREST).
*   **AI Layer:** Google Gemini API (`@google/genai` SDK) via direct client-side calls.
*   **Infrastructure:** Client-side rendering (CSR), deployed as static assets.

---

## 2. Frontend Architecture (`/src`)

### 2.1 Core Entry & Routing
The application does **not** use a traditional router (like `react-router-dom`). Instead, it uses a state-based view controller pattern to maintain context and state between views without reloading.

*   **Entry Point:** `main.tsx` -> `App.tsx`.
*   **View State:** Managed in `App.tsx` via `activeView` state (`'homepage' | 'sales' | 'hr' ...`).
*   **Sidebar:** `components/Sidebar.tsx` controls the `activeView` state.

### 2.2 State Management (`useKanban.ts`)
The `useKanban` hook serves as the **global store** for the application.
*   **Responsibility:** Fetches all data tables (`tasks`, `deals`, `clients`) upon initialization based on the authenticated user's `organization_id`.
*   **Pattern:** Monolithic Custom Hook. It exposes `state` (arrays of data) and `actions` (CRUD functions like `addTask`, `updateDeal`).
*   **Optimization:** Uses `useCallback` to memoize CRUD functions. Data fetching is triggered via `useEffect` dependent on `organization.id`.

### 2.3 Universal Input & The "Router Brain"
The core differentiator of the platform is `UniversalInputModal.tsx`.
*   **Flow:** User Input (Text/Voice) -> `services/routerBrainService.ts` -> Gemini Flash 2.5.
*   **Logic:** The AI classifies the intent into specific actions (`create_task`, `create_deal`, etc.) and returns a structured JSON object enforced by `responseSchema`.
*   **Execution:** The `useKanban` hook receives this JSON and dispatches the corresponding Supabase `insert/update` calls.

---

## 3. Artificial Intelligence Layer

### 3.1 Voice Assistant (`useVoiceAssistant.ts`)
Implements the Gemini **Live API** over WebSockets.
*   **Model:** `gemini-2.5-flash-native-audio-preview-09-2025`.
*   **Audio Pipeline:**
    *   **Input:** `AudioContext` (16kHz) -> `ScriptProcessor` -> PCM Float32 -> Base64 -> WebSocket.
    *   **Output:** WebSocket -> Base64 PCM -> `decodeAudioData` -> `AudioBufferSourceNode` (24kHz) -> Speakers.
*   **Tool Use:** The model is configured with `functionDeclarations` (e.g., `createBoardItem`). When the model predicts a tool call, the frontend executes the JS function and returns the result to the model via `session.sendToolResponse`.

### 3.2 Generative Logic
*   **Router Brain:** `gemini-2.5-flash`. Uses 1-shot prompting to map natural language to database schema.
*   **Content Generation:**
    *   **Text:** `gemini-2.5-flash` (Marketing copy, emails).
    *   **Images:** `gemini-2.5-flash-image` (Social media posts).
    *   **Video:** `veo-3.1-fast-generate-preview` (Marketing videos).

---

## 4. Database Schema & Multi-Tenancy

The database is normalized and uses **Row Level Security (RLS)** to enforce multi-tenancy.

### 4.1 Organization Model
Data is isolated by `organization_id`. Users do not own data directly; Organizations own data, and Users are members of Organizations.

*   **`organizations`**:
    *   `id` (UUID, PK)
    *   `name` (text)
    *   `owner_id` (UUID)
*   **`organization_members`**:
    *   `organization_id` (FK)
    *   `user_id` (FK to `auth.users`)
    *   `permissions` (JSONB): Stores module access (e.g., `['hr', 'sales']`).

### 4.2 Business Tables
All tables below have an `organization_id` column and an RLS policy: `auth.uid() IN (SELECT user_id FROM organization_members WHERE organization_id = current_table.organization_id)`.

1.  **`tasks`**: The central unit of work.
    *   `sub_tasks` (JSONB): Stores the AI-generated checklist.
    *   `status`: Enum ('To Do', 'Doing', 'Done').
2.  **`deals`**: Sales pipeline.
    *   `value`, `currency`, `stage`.
    *   `proposed_next_action`: Stores AI coaching advice.
3.  **`crm_entries`**: Immutable history log.
    *   `type`: 'call', 'email', 'meeting'.
    *   `raw_content`: The original transcript/note.
4.  **`clients`**, **`projects`**, **`business_lines`**, **`documents`**.
5.  **`social_posts`**: Stores generated content and prompts.
6.  **`events`**: Includes `checklist` (JSONB) for logistics.
7.  **`hr_candidates`**, **`hr_employees`**.

---

## 5. Authentication & Security

### 5.1 Auth Flow
*   **Provider:** Supabase Auth (GoTrue).
*   **Method:** OTP (One-Time Password) via Email.
*   **Logic:** `auth.signInWithOtp({ email })` -> User gets 6-digit code -> `auth.verifyOtp({ email, token, type: 'email' })`.
*   **Session:** Persisted in LocalStorage by Supabase client.

### 5.2 Invitation Logic (`hooks/useKanban.ts`)
1.  **Admin:** Invites `newuser@example.com`.
2.  **Backend:** Creates row in `organization_members` with `email='newuser@example.com'` and `user_id=NULL`.
3.  **User:** Signs up/Logs in via OTP.
4.  **Client Logic (`loadOrg`):** On mount, searches `organization_members` for `email == currentUser.email`.
    *   If found: Updates row setting `user_id = currentUser.id`.
    *   If not found: Creates a new default Organization.

---

## 6. Codebase Directory Structure

```
/src
  /components       # UI Components (Views, Modals, Cards)
  /config           # Gemini Client Initialization
  /data             # Mock data (for fallbacks)
  /hooks            # Custom Hooks (useKanban, useVoiceAssistant)
  /pages            # Page-level components (AuthPage)
  /services         # API Wrappers (geminiService, routerBrainService)
  App.tsx           # Main Controller & Routing
  supabaseClient.ts # Database Connection
  types.ts          # TypeScript Interfaces (Source of Truth)
```

---

## 7. Key Configuration & Environment

Required `.env` variables:

```bash
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[public-anon-key]
API_KEY=[google-gemini-api-key]
```

*Note: `supabaseClient.ts` contains a hardcoded fallback for demo stability. In a strict production environment, these fallbacks should be removed.*

---

## 8. Known Limitations & Future Engineering Tasks

1.  **Monolithic Hook:** `useKanban` fetches all data on load. As data grows, this should be refactored to use React Query or server-side pagination to avoid performance bottlenecks.
2.  **Audio Context Security:** Browsers require a user gesture (click) to initialize `AudioContext`. The "Mic" button handles this, but auto-start features will be blocked by the browser.
3.  **Live API Stability:** WebSocket connections can drop on mobile networks. The `useVoiceAssistant` hook implements basic reconnection (`retryCountRef`), but a more robust exponential backoff strategy is recommended for production.
4.  **Data Consistency:** Currently, frontend state is updated optimistically or after API return. Leveraging Supabase Realtime subscriptions (already partially configured) for all tables would enable true multiplayer collaboration.

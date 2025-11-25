
# olooAI Technical Specification & Engineering Reference

**Version:** 2.2.0 (Gold Master)
**Status:** Deployed
**Audience:** Engineering Team (Frontend, Backend, AI Ops)

---

## 1. System Architecture Overview

olooAI utilizes a **Thick Client / Serverless** architecture. The React frontend handles the majority of business logic, AI orchestration, and state management, while Supabase handles Identity, Persistence, and Realtime synchronization.

### High-Level Stack
*   **Frontend:** React 18, TypeScript, Vite 5, Tailwind CSS.
*   **Backend (BaaS):** Supabase (PostgreSQL 15, GoTrue Auth, PostgREST).
*   **AI Layer:** Google Gemini API (`@google/genai` SDK) via direct client-side calls.
*   **Infrastructure:** Client-side rendering (CSR).

---

## 2. Frontend Architecture (`/src`)

### 2.1 Core Entry & Routing
The application does **not** use a traditional router. It uses a state-based view controller pattern.
*   **Entry Point:** `main.tsx` -> `App.tsx`.
*   **View State:** Managed in `App.tsx` via `activeView` state ('today', 'sales', 'hr', etc.).
*   **Navigation:** `components/Sidebar.tsx` implements a dismissible drawer pattern (mobile-responsive) with a flat 12-item menu structure.

### 2.2 State Management (`useKanban.ts`)
The `useKanban` hook serves as the **global store**.
*   **Responsibility:** Fetches all data tables (`tasks`, `deals`, `clients`, `events`, `hr_candidates`, `social_posts`) upon initialization.
*   **Data Isolation:** All fetches filter by `organization_id`.
*   **Invite Logic:** On mount, `loadOrg` checks `organization_members` for any pending invites matching the user's email and links them to the current user ID.

### 2.3 Universal Input & The "Router Brain"
The core differentiator is `services/routerBrainService.ts`.
*   **ATC (Assign to Colleague):** The system prompt is instructed to extract `@Name` patterns into an `assignee_name` field.
*   **Resolution:** `useKanban` matches `assignee_name` against the loaded `teamMembers` array to resolve the UUID before database insertion.
*   **DTW (Delegate to Walter):** UI buttons trigger pre-defined prompt templates that utilize "Action Cascading" (creating multiple dependent tasks from a single intent).

---

## 3. Artificial Intelligence Layer

### 3.1 Voice Assistant (Live API)
*   **Model:** `gemini-2.5-flash-native-audio-preview-09-2025`.
*   **Audio Pipeline:** WebSocket stream (16kHz input / 24kHz output).
*   **Tooling:** Functions like `createBoardItem`, `analyzeRisk`, `createEvent` are defined in `geminiService.ts` and executed by the client.

### 3.2 Generative Logic (The "Brains")
*   **Router Brain:** `gemini-2.5-flash`. Uses "God Mode" prompting to enforce data hierarchy (Business Line > Client > Deal).
*   **Search Grounding:** `generateContentWithSearch` uses the `googleSearch` tool to fetch live web data for `Client Pulse` and `Competitor Analysis`.
*   **Media Generation:**
    *   **Images:** `imagen-3.0-generate-001` (via `generateImages`).
    *   **Video:** `veo-3.1-fast-generate-preview` (via `generateVideos`).

---

## 4. Database Schema & Multi-Tenancy

Data is isolated by `organization_id`.

### 4.1 Organization Model
*   **`organizations`**: `id`, `name`, `owner_id`.
*   **`organization_members`**: `organization_id`, `user_id`, `email`, `role`, `permissions` (JSONB).

### 4.2 Business Tables
All tables have an `organization_id` column and an RLS policy enforcing membership checks.
*   **Core:** `business_lines`, `clients`, `deals`, `projects`, `tasks`.
*   **Deep Modules:** `events` (with JSON checklist), `hr_candidates`, `hr_employees`, `social_posts`.

---

## 5. Authentication & Security

*   **Provider:** Supabase Auth.
*   **Method:** OTP (One-Time Password) via Email.
*   **Flow:** User enters email -> Receives 6-digit code -> Enters code -> Session established.
*   **Access Control:**
    *   **RBAC:** 'Owner', 'Admin', 'Member' roles stored in `organization_members`.
    *   **Delete Protection:** Only Admins can delete Clients, Deals, or Projects.

---

## 6. Key Configuration

Required `.env` variables:
```bash
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[public-anon-key]
API_KEY=[google-gemini-api-key]
```

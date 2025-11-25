
# olooAI Technical Specification & Engineering Reference

**Version:** 2.2.0 (Gold Master - Autonomous Protocol Active)
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

## 2. The "Walter" AI Architecture: Autonomous Protocol

The platform runs on the **Autonomous Protocol Reset**, defined by three core tenets:

### 2.1 The 3-Brain Synthesis
Walter (the AI) must synthesize three knowledge sources for every action:
1.  **LLM Intelligence:** Reasoning, drafting, creativity (Gemini 2.5).
2.  **Internal Data:** Full access to uploaded docs, emails, texts, and CRM history via the `knownData` context injection.
3.  **The Internet (Search Grounding):** Live web access via `googleSearch` tools for real-time context (news, prices, risks).

### 2.2 The 3 Intelligence Modes
1.  **MODE A: Omnipresent AI (Router & Voice)**
    *   **Function:** Intent Classification & Action Cascading.
    *   **Behavior:** "Onboard Client X" triggers creation of Client + Deal + multiple sub-tasks.
2.  **MODE B: Contextual AI (Data Hygienist)**
    *   **Function:** Unstructured -> Structured Data Transformation.
    *   **Behavior:** Analyzes raw notes to propose specific DB updates (Stage, Status, Summary).
3.  **MODE C: Functional AI (Deep Worker)**
    *   **Function:** High-Fidelity Job Execution.
    *   **Behavior:** Uses tools for drafting, deep analysis, and scenario design.

### 2.3 Autonomous Inference Protocol
To prevent "orphaned" records, the AI uses intelligent inference rather than blocking errors.
*   **Client -> Business Line:** Infer from industry or default to first available.
*   **Deal -> Client:** Infer from email domain.
*   **Task -> Business Line:** Infer from content or auto-tag as "Personal".

---

## 3. Frontend Architecture (`/src`)

### 3.1 Core Entry & Routing
The application does **not** use a traditional router. It uses a state-based view controller pattern.
*   **Entry Point:** `main.tsx` -> `App.tsx`.
*   **View State:** Managed in `App.tsx` via `activeView` state ('today', 'sales', 'hr', etc.).
*   **Navigation:** `components/Sidebar.tsx` implements a dismissible drawer pattern (mobile-responsive) with a flat 12-item menu structure.

### 3.2 State Management (`useKanban.ts`)
The `useKanban` hook serves as the **global store**.
*   **Responsibility:** Fetches all data tables (`tasks`, `deals`, `clients`, `events`, `hr_candidates`, `social_posts`) upon initialization.
*   **Data Isolation:** All fetches filter by `organization_id`.
*   **Invite Logic:** On mount, `loadOrg` checks `organization_members` for any pending invites matching the user's email and links them to the current user ID.

### 3.3 Universal Input & The "Router Brain"
The core differentiator is `services/routerBrainService.ts`.
*   **ATC (Assign to Colleague):** The system prompt is instructed to extract `@Name` patterns into an `assignee_name` field.
*   **Resolution:** `useKanban` matches `assignee_name` against the loaded `teamMembers` array to resolve the UUID before database insertion.
*   **DTW (Delegate to Walter):** UI buttons trigger pre-defined prompt templates that utilize "Action Cascading".

---

## 4. Artificial Intelligence Layer Details

### 4.1 Voice Assistant (Live API)
*   **Model:** `gemini-2.5-flash-native-audio-preview-09-2025`.
*   **Audio Pipeline:** WebSocket stream (16kHz input / 24kHz output).
*   **Tooling:** Functions like `createBoardItem`, `analyzeRisk`, `createEvent` are defined in `geminiService.ts`.
*   **Persona:** Acts as "Executive Strategist" or "Sales Autopilot" depending on context.

### 4.2 Generative Logic (The "Brains")
*   **Router Brain:** `gemini-2.5-flash`. Uses "God Mode" prompting to enforce data hierarchy.
*   **Search Grounding:** `generateContentWithSearch` uses the `googleSearch` tool.
*   **Media Generation:**
    *   **Images:** `imagen-3.0-generate-001`.
    *   **Video:** `veo-3.1-fast-generate-preview`.

---

## 5. Database Schema & Multi-Tenancy

Data is isolated by `organization_id`.

### 5.1 Organization Model
*   **`organizations`**: `id`, `name`, `owner_id`.
*   **`organization_members`**: `organization_id`, `user_id`, `email`, `role`, `permissions` (JSONB).

### 5.2 Business Tables
All tables have an `organization_id` column and an RLS policy.
*   **Core:** `business_lines`, `clients`, `deals`, `projects`, `tasks`.
*   **Deep Modules:** `events`, `hr_candidates`, `hr_employees`, `social_posts`.

---

## 6. Key Configuration

Required `.env` variables:
```bash
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[public-anon-key]
API_KEY=[google-gemini-api-key]
```

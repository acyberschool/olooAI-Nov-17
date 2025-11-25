
# olooAI Technical Specification & Engineering Reference

**Version:** 2.1.0 (Stable)
**Date:** October 26, 2023
**Audience:** Engineering Team (Frontend, Backend, AI Ops)

---

## 1. System Architecture Overview

olooAI utilizes a **Thick Client / Serverless** architecture. The React frontend handles the majority of business logic, AI orchestration, and state management, while Supabase handles Identity, Persistence, and Realtime synchronization.

### High-Level Stack
*   **Frontend:** React 18, TypeScript, Vite 5, Tailwind CSS.
*   **Backend (BaaS):** Supabase (PostgreSQL 15, GoTrue Auth, PostgREST).
*   **AI Layer:** Google Gemini API (`@google/genai` SDK) via direct client-side calls.
*   **Infrastructure:** Client-side rendering (CSR), deployed as static assets.

---

## 2. Frontend Architecture (`/src`)

### 2.1 Core Entry & Routing
The application does **not** use a traditional router. It uses a state-based view controller pattern.
*   **Entry Point:** `main.tsx` -> `App.tsx`.
*   **View State:** Managed in `App.tsx` via `activeView` state.
*   **Sidebar:** `components/Sidebar.tsx` controls navigation and enforces **Access Control (ACL)** logic based on user permissions.

### 2.2 State Management (`useKanban.ts`)
The `useKanban` hook serves as the **global store**.
*   **Responsibility:** Fetches all data tables (`tasks`, `deals`, `clients`, `events`, `hr_candidates`) upon initialization based on the authenticated `organization_id`.
*   **Invite Logic:** On mount, `loadOrg` checks `organization_members` for any pending invites matching the user's email and links them to the current user ID.

### 2.3 Universal Input & The "Router Brain"
The core differentiator is `services/routerBrainService.ts`.
*   **ATC (Assign to Colleague):** The system prompt is instructed to extract `@Name` patterns into an `assignee_name` field.
*   **Resolution:** `useKanban` matches `assignee_name` against the loaded `teamMembers` array to resolve the UUID before database insertion.
*   **DTW (Delegate to Walter):** Specific UI buttons trigger pre-defined prompt templates that utilize "Action Cascading" (creating multiple dependent tasks from a single intent).

---

## 3. Artificial Intelligence Layer

### 3.1 Voice Assistant (Live API)
*   **Model:** `gemini-2.5-flash-native-audio-preview-09-2025`.
*   **Audio Pipeline:** WebSocket stream (16kHz input / 24kHz output).
*   **Tooling:** Functions like `createBoardItem` automatically infer context (Client ID, Business Line) from the current view state.

### 3.2 Generative Logic
*   **Router Brain:** `gemini-2.5-flash`. Uses 1-shot prompting to map natural language to database schema.
*   **Content Generation:** `gemini-2.5-flash-image` (Social) and `veo-3.1-fast-generate-preview` (Video).

---

## 4. Database Schema & Multi-Tenancy

Data is isolated by `organization_id`.

### 4.1 Organization Model
*   **`organizations`**: `id`, `name`, `owner_id`.
*   **`organization_members`**: `organization_id`, `user_id`, `email`, `role`, `permissions` (JSONB).

### 4.2 Business Tables
All tables (`tasks`, `deals`, `events`, etc.) have an `organization_id` column and an RLS policy enforcing membership checks.

---

## 5. Authentication & Security

*   **Provider:** Supabase Auth.
*   **Method:** OTP (One-Time Password) via Email.
*   **Flow:** User enters email -> Receives 6-digit code -> Enters code -> Session established.
*   **Invite System:**
    1.  Admin invites `email`.
    2.  Row created in `organization_members` (Status: 'Invited').
    3.  User logs in via OTP.
    4.  System links User ID to Member record.

---

## 6. Key Configuration

Required `.env` variables:
```bash
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[public-anon-key]
API_KEY=[google-gemini-api-key]
```

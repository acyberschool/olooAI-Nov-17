
# olooAI Technical Specification Document

**Version:** 2.0.0
**Last Updated:** October 2023
**Status:** Production Ready

---

## 1. Executive Summary

olooAI is a voice-first, AI-powered business operating system (BOS) designed to automate administrative work for SMEs. It uses a "thick client" architecture where the browser handles complex AI orchestration (audio processing, intent classification) via the Google Gemini API, while Supabase handles data persistence and multi-tenancy.

The platform has evolved to support **Organizations**, allowing teams to collaborate in shared workspaces with granular permission controls.

---

## 2. Technology Stack

### 2.1 Frontend
*   **Framework:** React 18.2+ (Vite 5.0)
*   **Language:** TypeScript 5.2
*   **Styling:** Tailwind CSS
*   **State:** React Context + Custom Hooks

### 2.2 Backend & Persistence
*   **Platform:** Supabase (BaaS)
*   **Database:** PostgreSQL 15+
*   **Authentication:** Supabase Auth (Magic Link OTP) - **Google Auth Removed**.
*   **Multi-Tenancy:** Row Level Security (RLS) enforces data isolation per Organization.

### 2.3 Artificial Intelligence (Google Gemini)
*   **Voice Assistant:** `gemini-2.5-flash-native-audio-preview-09-2025`
*   **Router Brain:** `gemini-2.5-flash`
*   **Media Generation:** `gemini-2.5-flash-image`, `veo-3.1-fast-generate-preview`

---

## 3. Database Schema (Multi-Tenant)

The core architectural shift is the introduction of the **Organization** entity.

### 3.1 Organization Layer
*   **`organizations`**:
    *   `id` (UUID, PK)
    *   `name` (text)
    *   `owner_id` (UUID, FK to auth.users)
*   **`organization_members`**:
    *   `id` (UUID, PK)
    *   `organization_id` (UUID, FK)
    *   `user_id` (UUID, FK)
    *   `role` (text): 'Owner', 'Admin', 'Member'
    *   `permissions` (jsonb): e.g., `{"access": ["hr", "sales"]}`

### 3.2 Business Modules
All business tables now include `organization_id` as a foreign key.

*   **Core:** `tasks`, `clients`, `deals`, `projects`, `business_lines`, `documents`.
*   **Sales:** `deals` table enhanced with `qualification_score`, `velocity_blockers`.
*   **Events:** `events` table (new) with `checklist` (jsonb) and `status`.
*   **HR:**
    *   `hr_candidates` (Recruitment pipeline)
    *   `hr_employees` (Team directory)

---

## 4. Authentication & Security

*   **Magic Links:** Primary authentication method via `supabase.auth.signInWithOtp`.
*   **Invite System:**
    1.  Admin invites email.
    2.  Row created in `organization_members` with status 'Invited'.
    3.  User logs in -> System matches email -> Grants access.
*   **Access Control (ACL):**
    *   Sidebar links (`Sales`, `HR`, `Events`) are conditionally rendered based on the `permissions` JSON in the user's member record.

---

## 5. New Modules Implementation

### 5.1 Sales Pipeline (`SalesView.tsx`)
*   **Purpose:** Advanced deal tracking with coaching.
*   **AI Feature:** Walter monitors `deals` for stagnation and calculates velocity metrics displayed in the dashboard.

### 5.2 Event Management (`EventsView.tsx`)
*   **Purpose:** Planning logistics.
*   **Data:** `events` table.
*   **Features:**
    *   List view of upcoming events.
    *   Embedded checklist managed via JSONB.

### 5.3 HR Suite (`HRView.tsx`)
*   **Recruitment:** Kanban board for `hr_candidates` moving through stages (Applied -> Interview -> Hired).
*   **Team:** List view of `hr_employees`.

---

## 6. Key Workflows

### 6.1 Organization Setup
On first login, if a user has no membership, a new Organization is automatically created for them (`${User}'s Workspace`) and they are assigned the 'Owner' role with full permissions.

### 6.2 Team Invitation
Admins can invite users via email. The system sends a standard `mailto:` link for simplicity in this version, while creating the necessary database permissions record immediately.

### 6.3 AI Integration
All AI tools (`createBoardItem`, `createCrmEntry`) now implicitly pass the active `organization_id` to ensure data is created in the correct workspace.

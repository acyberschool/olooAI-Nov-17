
# olooAI: Go-To-Market Product Guide

**The AI Business Operating System that listens.**

---

## 1. Platform Overview
olooAI is the first "Voice-Native" Business Operating System (BOS) designed for SMEs and busy founders. Unlike traditional CRMs or Project Management tools that require endless clicking and typing, olooAI is built to be *talked to*. 

It unifies **Task Management**, **CRM**, **Sales**, **HR**, and **Events** into one seamless platform driven by an intelligent AI agent named **Walter**.

### Unfair Advantage (USP)
*   **Speed:** Create a deal, client, and task in 5 seconds via voice.
*   **Context:** The AI understands your business lines and pre-fills data automatically.
*   **Multi-Modal:** It generates images, videos, and documents on demand.
*   **Integration:** It lives where you work (Web, Email, Telegram).

---

## 2. End-to-End User Journey

### Phase 1: Onboarding & Workspace Setup
1.  **Sign Up:**
    *   User enters email on the Landing Page.
    *   Receives a secure 6-digit OTP (No passwords to forget).
    *   **System Action:** Automatically provisions a private, secure Workspace (Organization) for the user.
2.  **First Login:**
    *   User lands on the **Dashboard**.
    *   **Walter's Prompt:** "Welcome. Tell me about your business lines. For example, 'I run a fumigation service called BugFree'."
    *   **Result:** The AI configures the workspace, creating the first "Business Line" automatically.

### Phase 2: The "Router Brain" (Universal Input)
This is the heart of olooAI. Users don't navigate menus; they just *tell Walter what to do*.

*   **Voice Command:** "Remind me to call John from ABC Corp tomorrow about the renewal, and create a deal for 50k."
*   **AI Execution:**
    1.  **Router:** Detects intents -> `create_task`, `create_deal`.
    2.  **Client Logic:** Checks if "ABC Corp" exists. If not, it asks to create it or infers details.
    3.  **Database:** Creates the Task (linked to Client) and the Deal (linked to Client) instantly.
    4.  **Confirmation:** "Deal created and reminder set for tomorrow at 9 AM."

### Phase 3: Managing Work (The Modules)

#### 1. Task Management (Kanban & Gantt)
*   **Features:** Drag-and-drop Kanban board, Calendar view, and Gantt chart.
*   **AI Magic:**
    *   **Auto-Checklists:** Open any task, and Walter generates a sub-task checklist automatically based on the title (e.g., "Prepare Invoice" -> 1. Verify details, 2. Add VAT, 3. Export PDF).
    *   **Refine:** "Walter, add a step to email the client." -> Checklist updated.

#### 2. Sales Pipeline
*   **Features:** Revenue Kanban (Pipeline, Awaiting Payment, Paid).
*   **AI Magic:**
    *   **Deal Coaching:** Walter monitors deal age. If a deal sits in "Open" for >14 days, it flags it as "Stalled".
    *   **Upsell Ideas:** "Ask AI for ideas" button generates specific upsell strategies based on the client's industry.

#### 3. CRM & Client Intelligence
*   **Features:** Timeline view of all calls, emails, and notes.
*   **AI Magic:**
    *   **Client Pulse:** Walter scrapes the web for news/social posts about the client to find conversation starters.
    *   **Lead Scoring:** AI analyzes the client profile and assigns a score (0-100) indicating likelihood to close.

#### 4. Content & Marketing Engine
*   **Features:** Social Media Calendar.
*   **AI Magic:**
    *   **Campaign Gen:** "Plan a 2-week campaign for Diwali." -> Walter fills the calendar with 14 posts.
    *   **Media Gen:** Generates **Images** (Nano Banana model) and **Videos** (Veo model) directly within the platform for each post.

#### 5. HR & Events
*   **HR:** Recruitment pipeline (Applied -> Interview -> Hired).
*   **Events:** Logistics planner with automated checklists.

### Phase 4: Collaboration
*   **Invite Team:** Admin types an email address.
*   **Access Control:** User receives an invite. Upon login (OTP), they are automatically linked to the shared Organization.
*   **Audit Trail:** Every action is tagged with the user's ID, so you know who did what.

---

## 3. Technical Value Props (For IT/Ops Buyers)

1.  **Security:**
    *   Row Level Security (RLS) ensures data isolation.
    *   Passwordless Auth (OTP) reduces hack surface.
2.  **Reliability:**
    *   Offline-tolerant architecture.
    *   Real-time database updates via Supabase.
3.  **Scalability:**
    *   Built on PostgreSQL.
    *   Handles unlimited tasks/deals without performance degradation.

---

## 4. Launch Checklist (Go-To-Market)

- [x] **Authentication:** OTP (6-digit) verified & active.
- [x] **Database:** Multi-tenant schema deployed.
- [x] **AI Core:** Gemini 2.5 (Flash + Pro) integrated for routing and content.
- [x] **Media:** Image & Video generation pipelines active.
- [x] **Modules:** Sales, HR, Events, CRM, Tasks fully functional.
- [x] **Analytics:** Real-time Sales Velocity tracking enabled.

**Ready for Lift-off.** 🚀

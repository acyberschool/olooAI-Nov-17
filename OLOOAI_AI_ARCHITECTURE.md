
# olooAI Technical Analysis: AI Architecture & Functionality

**Target Audience:** Engineering & Technical Product Teams
**Scope:** End-to-End analysis of AI embedding, "Walter" agent behaviors, and function-level logic.

---

## 1. The "Walter" Architecture: Three Modes of Intelligence

The platform does not use a single LLM call. Instead, "Walter" is an orchestration of three distinct AI patterns embedded throughout the application.

### A. Omnipresent Walter (The Router Brain & Voice Core)
*   **Location:** Global `UniversalInputModal`, `VoiceControl`, and `useVoiceAssistant` hook.
*   **Tech Stack:**
    *   **Voice:** `gemini-2.5-flash-native-audio-preview` via WebSocket (Live API).
    *   **Text:** `gemini-2.5-flash` via HTTP (`generateContent`).
*   **Functionality:**
    *   **Intent Classification:** Determines if input is a Task, Note, Deal, Project, Event, or Query.
    *   **Entity Extraction:** Pulls Dates, Amounts ($), Names, and Assignees (`@Name`) from natural language.
    *   **Action Cascading:** A "God Mode" prompt instruction. If a user says "Onboard Client X", Walter creates the Client record **AND** automatically generates dependent sub-tasks (e.g., "Send Contract", "Setup Billing").
    *   **ATC (Assign to Colleague):** Parses `@Name` tokens, resolves them against the `organization_members` table, and injects the UUID into the `assignee_id` field.

### B. Contextual Walter (The Data Hygienist)
*   **Location:** Sidebar inside `ClientDetailView`, `DealDetailView`, `ProjectDetailView`.
*   **Component:** `ContextualWalter.tsx`.
*   **Functionality:**
    *   **Unstructured-to-Structured:** Accepts messy input (pasted emails, rough meeting notes).
    *   **State Diffing:** Analyzes current record state vs. input text.
    *   **Proposal System:** Proposes specific updates to `stage`, `status`, `next_action`, and `last_touch_summary`. The user approves changes via a UI diff before committing to Supabase.

### C. Functional Walter (The Deep Worker / DTW)
*   **Location:** Specific "Delegate to Walter" (DTW) buttons and Task Action menus.
*   **Tech Stack:** Search Grounding (`googleSearch`), Image Gen (`imagen`), Video Gen (`veo`).
*   **Functionality:** Performs specific, high-fidelity jobs (e.g., "Analyze Risk", "Draft Contract", "Generate Campaign").

---

## 2. Detailed Feature Breakdown by Module

### 2.1 System-Wide Navigation & Logic
*   **Sidebar:**
    *   **Logic:** Dynamic rendering based on `permissions` JSON in `organization_members`.
    *   **AI Role:** None directly, but serves as the visual map for Walter's routing logic.
*   **Universal Input (The Command Line):**
    *   **AI Role:** The entry point for the **Router Brain**. It accepts text/voice/files, context-injects current view data (e.g., "User is currently viewing Client ID: 123"), and executes the `processTextMessage` service.

### 2.2 Homepage (Tasks & Calendar)
*   **Task Management:**
    *   **AI Action (Creation):** Auto-tags tasks as "Personal" if no business line is inferred. Auto-extracts priority and due dates.
    *   **AI Action (Refinement):** Inside `TaskDetailModal`, user clicks "Refine with Walter". AI expands a one-line task into a detailed checklist (saved to `sub_tasks` JSONB).
    *   **AI Action (Execution):**
        *   **Research:** Uses Google Search to research a subtask.
        *   **Draft:** Generates document content based on task title.
        *   **Transcribe:** Simulates meeting transcription (placeholder for audio file processing).

### 2.3 Sales Module
*   **Pipeline View:**
    *   **AI Action (Coaching):** `SalesView` triggers a "Coach" prompt. Walter analyzes `deals` table for stagnation (time in stage) and generates strategic advice.
*   **Deal Detail View:**
    *   **Negotiation Coach:** Triggers `analyzeDealStrategy`. Walter searches the web for the Client's recent financial news/press releases to suggest leverage points for negotiation.
    *   **Log Payment:** AI extracts amount and currency from notes to update `amount_paid`.

### 2.4 CRM & Clients
*   **Client Pulse:**
    *   **AI Action:** `getClientPulse` tool. Uses Google Search Grounding to find recent news/social mentions of the client. Returns structured JSON (Source, Date, Snippet).
*   **Lead Scoring:**
    *   **AI Action:** Analyzes `client.description` and `aiFocus`. Assigns a 0-100 score and generates a text rationale (e.g., "High score due to clear budget and urgent need").

### 2.5 Projects Module
*   **Risk Radar:**
    *   **AI Action:** `analyzeProjectRisk`. Performs a "Pre-Mortem". Search logic looks for "common failure modes in [Project Type] projects" and cross-references with current project parameters. Generates a Markdown report.

### 2.6 Social Media Module
*   **Chat-to-Calendar:**
    *   **AI Action:** User gives a rough goal ("Promote Diwali sale"). Walter generates a JSON array of `SocialPost` objects (Dates, Captions, Channels) to populate the calendar.
*   **Media Generation:**
    *   **Image:** `generateSocialImage` calls Nano Banana model using the `visualPrompt`.
    *   **Video:** `generateSocialVideo` calls Veo 3.1 to generate 720p video assets.

### 2.7 Deep Modules (HR & Events)
*   **HR:**
    *   **Job Descriptions:** DTW button generates full JD markdown based on role title.
    *   **Screening:** AI compares Candidate profile (mock) vs Role requirements.
*   **Events:**
    *   **Strategy Engine:** `createEvent` tool infers logistics.
    *   **Checklist Gen:** Auto-populates `checklist` JSONB based on event type (e.g., "Wedding" vs "Corporate Webinar").

---

## 3. Technical AI Implementation Reference

### 3.1 The Router Brain Service (`routerBrainService.ts`)
*   **Pattern:** One-Shot Prompting with Schema Enforcement.
*   **Input:** User Prompt + `knownData` (List of Client Names, Deal Names, Team Members).
*   **Prompt Engineering:**
    *   "Strict Hierarchy": Enforces Business Line > Client > Deal logic.
    *   "Inference": Instructed to fuzzy-match names (e.g., "Acme" = "Acme Corp").
*   **Output:** `RouterBrainResult` (Strict JSON schema).

### 3.2 The Voice Assistant Hook (`useVoiceAssistant.ts`)
*   **Pattern:** Tool Use (Function Calling).
*   **Tools Defined:**
    *   `createBoardItem`: Tasks/Reminders.
    *   `createCrmEntry`: Logging calls/notes.
    *   `createEvent`, `createCandidate`, `analyzeRisk`, etc.
*   **Logic:**
    1.  Microphone stream -> WebSocket.
    2.  Gemini detects intent -> Sends `toolCall`.
    3.  React Hook executes local JS function (e.g., `kanbanApi.addEvent`).
    4.  Result sent back to Gemini -> Gemini speaks confirmation.

### 3.3 Search Grounding Service (`geminiService.ts`)
*   **Function:** `generateContentWithSearch`.
*   **Config:** `tools: [{ googleSearch: {} }]`.
*   **Post-Processing:** Raw text response + `groundingMetadata` (Source URLs) are parsed to create clickable citations in the UI.

---

## 4. Data Flow Diagram (AI Operations)

1.  **User Input** (Voice/Text)
    ↓
2.  **Gemini API** (Context Window contains Database Schema & Current View State)
    ↓
3.  **Intent Classification** (Is this a Create, Update, or Research request?)
    ↓
4.  **Parameter Extraction** (Dates, UUIDs via fuzzy name matching, Amounts)
    ↓
5.  **Action Logic**
    *   *If Research:* Call Search Tool -> Return Summary.
    *   *If Create:* Return JSON Payload -> `useKanban` Dispatcher.
    *   *If Analyze:* Call Reasoning Tool -> Generate Markdown Report.
    ↓
6.  **Supabase DB** (Insert/Update via RLS-protected client)
    ↓
7.  **UI Update** (React State updates immediately for perceived latency reduction)

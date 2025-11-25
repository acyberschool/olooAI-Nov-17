# olooAI End-to-End Test Plan

**Version:** 2.1
**Objective:** Verify full functionality of the "Service-as-a-Software" architecture, focusing on AI delegation (DTW), Collaboration (ATC), and Module Logic.

---

## 1. Authentication & Access (The "Front Door")

### 1.1 Sign Up & Workspace Creation
*   [ ] **Action:** Enter a *new* email address on the Auth Page.
*   [ ] **Action:** Enter the 6-digit OTP sent to your email.
*   [ ] **Verify:** Dashboard loads.
*   [ ] **Verify:** Sidebar title shows "Your Name's Workspace" (or email prefix).
*   [ ] **Verify:** `Sidebar` shows all "Core Workspace" tabs. "Advanced Modules" should be visible (if default permissions allow) or hidden (if restricted).

### 1.2 Member Invitation
*   [ ] **Action:** Navigate to **Members & Access** (Team) tab.
*   [ ] **Action:** Enter a *different* email (e.g., `colleague@test.com`). Select "Sales" and "HR" permissions. Click "Invite".
*   [ ] **Verify:** Email client opens with a `mailto` link containing the App URL.
*   [ ] **Verify:** New member appears in the table with status "Invited".

### 1.3 Invite Acceptance (The Loop)
*   [ ] **Action:** Open an incognito window.
*   [ ] **Action:** Sign in with the `colleague@test.com` email (using OTP).
*   [ ] **Verify:** User is logged in to the **Same Workspace** as the Admin.
*   [ ] **Verify:** Sidebar *only* shows "Sales" and "HR" (plus Core tabs). "Settings" or "Data" might be hidden based on your logic.

---

## 2. The "Router Brain" & DTW (Delegate to Walter)

### 2.1 Universal Input (Text)
*   [ ] **Action:** Click "Delegate Day Plan" (DTW Button) on Homepage.
*   [ ] **Verify:** Spinner appears ("Working...").
*   [ ] **Verify:** Tasks populate in the "Today" or "All Tasks" list automatically.

### 2.2 Voice Command (Microphone)
*   [ ] **Action:** Click Mic. Say: *"Create a new deal for Acme Corp worth $50,000. It's a full pay contract."*
*   [ ] **Verify:**
    *   Walter replies audio confirmation.
    *   Navigate to **Deals**.
    *   "Acme Corp" deal exists with correct value ($50k) and status "Open".

### 2.3 Action Cascading
*   [ ] **Action:** Say/Type: *"Onboard a new client called Stark Industries."*
*   [ ] **Verify:**
    *   Client "Stark Industries" is created.
    *   **AND** Tasks are created: "Send Contract", "Setup Portal", "Welcome Email" (Walter should infer these based on the "Action Cascading" prompt).

---

## 3. Collaboration (ATC - Assign to Colleague)

### 3.1 The "@" Mention
*   [ ] **Prerequisite:** Ensure `colleague@test.com` (let's call him "Steve") is in the workspace.
*   [ ] **Action:** Open Universal Input. Type: *"Create a task to 'Review Legal Docs' and assign to @Steve."*
*   [ ] **Verify:**
    *   Task "Review Legal Docs" is created.
    *   Open Task Details -> Assignee field shows "Steve".

---

## 4. Deep Modules

### 4.1 Sales Pipeline
*   [ ] **Action:** Open **Sales** tab.
*   [ ] **Action:** Click "AI Coach" (DTW Button).
*   [ ] **Verify:** A generic advice summary or specific tasks related to unblocking deals appear.
*   [ ] **Action:** Drag a deal from "Qualified" to "Negotiated" in the Revenue Board.
*   [ ] **Verify:** Deal status updates across the system.

### 4.2 Events Command Center
*   [ ] **Action:** Open **Events** tab.
*   [ ] **Action:** Click "Auto-Plan Event". Input: "Q4 Marketing Summit".
*   [ ] **Verify:** Event "Q4 Marketing Summit" is created.
*   [ ] **Verify:** Checklist items (e.g., "Book Venue", "Select Speakers") are automatically generated inside the event card.

### 4.3 HR Engine
*   [ ] **Action:** Open **HR** tab.
*   [ ] **Action:** Click "Draft Job Description".
*   [ ] **Verify:** A document draft appears or a task "Review JD" is created with the content in the description.
*   [ ] **Action:** Add Candidate "Jane Doe".
*   [ ] **Verify:** Jane appears in the "Applied" column.

---

## 5. Settings & Integrations
*   [ ] **Action:** Open **Settings**.
*   [ ] **Action:** Click "Connect" on Email.
*   [ ] **Verify:** A virtual email address is generated (e.g., `walter.xyz@oloo.ai`).
*   [ ] **Action:** Use the "Test Simulation" box to simulate an inbound email.
*   [ ] **Verify:** A new Task or CRM entry appears in the system matching the email content.

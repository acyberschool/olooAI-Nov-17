
# olooAI End-to-End Test Plan

**Version:** 2.2
**Objective:** Verify full functionality of the "Service-as-a-Software" architecture.

---

## 1. Authentication & Access
*   [ ] **Action:** Sign up with a *new* email. Enter 6-digit OTP.
*   [ ] **Verify:** Dashboard loads. Sidebar shows all 12 items.
*   [ ] **Action:** Invite a colleague via the **Access** tab.
*   [ ] **Verify:** Colleague receives email with link. Can log in via OTP.

---

## 2. The "Router Brain" & Data Hierarchy
*   [ ] **Action:** Use Universal Input (Mic): *"Create a new Deal 'Big Contract' for client 'Acme Corp'."*
*   [ ] **Verify:**
    *   If 'Acme Corp' didn't exist, did Walter create the Client? (Yes).
    *   Did Walter ask for a Business Line? (Or infer it?).
    *   Is the Deal created and linked to the Client?

---

## 3. Deep Intelligence (Search Grounding)
*   [ ] **Action:** Go to **Projects** -> Open Project -> Click **Risk Radar**.
*   [ ] **Verify:** A document is created with a risk analysis report (should contain external sources if found).
*   [ ] **Action:** Go to **Clients** -> Open Client -> **Client Pulse** tab -> Click "Search".
*   [ ] **Verify:** A list of news/social items appears.

---

## 4. Generative Media (Social)
*   [ ] **Action:** Go to **Social Media** tab.
*   [ ] **Action:** Click a day. Enter a prompt: "A futuristic robot coffee shop".
*   [ ] **Action:** Click **Nano Banana (Image)**.
*   [ ] **Verify:** An image appears in the preview box.
*   [ ] **Action:** Click **Veo 3 (Video)**.
*   [ ] **Verify:** A video placeholder/URI appears (generation takes time, check for non-null response).

---

## 5. Deep Modules Logic
*   [ ] **Sales:** Check the **Sales View**. Does the "Stalled Deals" count match open deals > 14 days old?
*   [ ] **HR:** Add a Candidate. Does the "Screening" DTW button generate a review?
*   [ ] **Events:** Click "Auto-Plan Event". Does it generate a checklist?

---

## 6. Mobile Responsiveness
*   [ ] **Action:** Resize browser to mobile width.
*   [ ] **Verify:** Sidebar disappears. Hamburger menu appears.
*   [ ] **Action:** Click Hamburger. Sidebar slides in.
*   [ ] **Action:** Click backdrop (right side). Sidebar slides out.

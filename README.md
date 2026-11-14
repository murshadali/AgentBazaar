# AgentBazaar - AI-Powered P2P Resale Marketplace with Autonomous Negotiation

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Local-brightgreen.svg)](https://www.mongodb.com/)
[![Gemini](https://img.shields.io/badge/AI-Google%20Gemini-orange.svg)](https://ai.google.dev/)
[![Socket.IO](https://img.shields.io/badge/Real--Time-Socket.IO-black.svg)](https://socket.io/)
[![Tests](https://img.shields.io/badge/Tests-39%20Passed-emerald.svg)](backend/src/tests/runTests.js)

> **Academic Project Submission**  
> **Course**: CAMS3P01 - Mini Project  
> **Degree**: Master of Computer Applications (M.C.A) Semester III  
> **Project**: AgentBazaar — Autonomous P2P Negotiation Marketplace  
> **Session**: 2026-27  

---

## 1. Project Overview

**AgentBazaar** eliminates the primary friction point in peer-to-peer resale platforms (such as OLX and Facebook Marketplace): tedious, frustrating, unstructured price haggling.

Instead of manual messaging, AgentBazaar deploys **Autonomous AI Buyer and Seller Agents** powered by the **Google Gemini API** (with a deterministic polynomial concession fallback engine). Agents negotiate round-by-round within private, confidential limits set by users (budget ceilings and minimum floor prices). Crucially, **no deal is finalized automatically**—a formal **Deal Proposal** requires explicit dual human approval before handover details are unlocked.

---

## 2. Core Architectural Pillars

1. **Autonomous Multi-Agent Negotiation Protocol (FR4, FR5, FR6)**:
   - Alternating counter-offer rounds (1 to 10 rounds, default 5).
   - Configurable agent stances: `FIRM` (Boulware curve $\beta = 2.0$), `BALANCED` ($\beta = 1.0$), `FLEXIBLE` (Conceder curve $\beta = 0.5$).
   - Context-aware reasoning grounded in product condition and market rates.

2. **Programmatic Guardrail Service (NFR2)**:
   - Mathematical enforcement in application code:
     - Buyer Agent offers are strictly clamped: $\text{Offer} \le \text{Budget Ceiling}$.
     - Seller Agent counter-offers are strictly clamped: $\text{Offer} \ge \text{Minimum Floor Price}$.
     - Monotonic non-reversing progression (buyers can't decrease offers; sellers can't increase asks).
     - Crossing check automatically accepts if an offer crosses the counterparty's standing ask.
   - Guards against LLM hallucination, prompt injection, or invalid actions.

3. **Strict Privacy & Limit Isolation (NFR1, NFR7)**:
   - Private limits (`budgetCeiling`, `sellerFloorPrice`) are **never** shared across prompts or transmitted to the counterparty client.
   - Handover contact details (pickup coordinates, phone number) are masked until **both** buyer and seller approve the deal.

4. **Dual Human Approval Workflow (FR8)**:
   - When agents converge on a price, a formal Deal Proposal is generated with status `PENDING_APPROVAL`.
   - The product is atomically marked `RESERVED` to avoid double-reservation across concurrent buyers.
   - Both buyer and seller must click **Confirm & Approve Deal** to transition to `CONFIRMED`.
   - If either rejects, the deal is cancelled and the listing returns to `ACTIVE`.

5. **In-Person Handover & Community Reputation (FR9, FR10, FR11, FR12)**:
   - Structured local pickup coordination (pickup address, time window, contact phone).
   - Direct in-person payment (Cash / UPI) outside the app, following the peer-to-peer marketplace model.
   - Post-handover star ratings (1–5) and written reviews dynamically update seller/buyer trust reputation scores.

---

## 3. Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 (Vite), Tailwind CSS (Light Theme), Lucide React, React Router 6, Socket.IO Client |
| **Backend** | Node.js, Express.js (Layered MVC: Controllers, Services, Models, Routes) |
| **Database** | MongoDB (Mongoose ODM) |
| **AI Agents** | Google Gemini API (`@google/genai`) + Mathematical Fallback Concession Engine |
| **Real-Time** | Socket.IO (room-based live negotiation arena) |
| **Authentication** | JWT (JSON Web Tokens) + Bcryptjs password hashing |
| **Testing** | Built-in test suite (39 automated unit & integration tests) |

---

## 4. Quick Start & Setup

### Prerequisites
- **Node.js** (v18 or v20+)
- **MongoDB** running locally on `127.0.0.1:27017` or a MongoDB Atlas URI

### Step 1: Configure Backend Environment
Copy `backend/.env.example` to `backend/.env`:
```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb://127.0.0.1:27017/agentbazaar

JWT_SECRET=agentbazaar_super_secret_jwt_key_2026_amu
JWT_EXPIRES_IN=7d

GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-1.5-flash

AI_MODE=gemini

CLIENT_URL=http://localhost:5173
```
*(Note: If `GEMINI_API_KEY` is not provided or invalid, the system automatically falls back to the built-in mathematical concession engine with full autonomous functionality!)*

### Step 2: Configure Frontend Environment
In `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Step 3: Run Database Seed (Pre-loads Users, Products & Agent Configs)
```bash
cd backend
npm run seed
```

### Step 4: Run the Automated Test Suite
```bash
cd backend
npm test
# Runs 39 automated tests covering concession math, guardrail clamps, prompt isolation, response parser, and schemas
```

### Step 5: Start the Application

In **Terminal 1** (Backend):
```bash
cd backend
npm run dev
# Starts on http://localhost:5000
```

In **Terminal 2** (Frontend):
```bash
cd frontend
npm run dev
# Starts on http://localhost:5173
```

---

## 5. Pre-Configured Demo Credentials

All seeded accounts use password: `password123`

| Role | Email | Password | Description |
|---|---|---|---|
| **Administrator** | `admin@agentbazaar.com` | `password123` | Platform oversight, user governance, listing moderation |
| **Alice (Seller)** | `alice@agentbazaar.com` | `password123` | Active seller with listed electronics, books & accessories |
| **Bob (Buyer)** | `bob@agentbazaar.com` | `password123` | Active buyer ready to initiate autonomous negotiations |
| **Charlie (Buyer)** | `charlie@agentbazaar.com` | `password123` | Secondary buyer testing concurrent negotiations |

---

## 6. End-to-End Walkthrough Scenario

1. **Log in as Bob (Buyer)** (`bob@agentbazaar.com`).
2. Go to **Marketplace** and select the **Apple MacBook Pro 14"** (Listed price: ₹74,000).
3. Click **"Negotiate with AI"**.
4. Configure your private strategy:
   - Target Desired Price: `₹62,000`
   - Maximum Budget Ceiling: `₹68,000`
   - Negotiation Style: `BALANCED`
   - Maximum Rounds: `5`
5. Click **"Deploy Buyer Agent & Start"**.
6. In the **Live Negotiation Arena**, watch the Buyer Agent and Seller Agent exchange counter-offers in real-time over Socket.IO.
7. Observe how the offers converge at an agreed price (e.g. ₹67,250).
8. Once converged, navigate to **Deals & Handover**:
   - Both parties review the exact agreed price confirmation alert.
   - Click **"Confirm & Approve Deal"**.
   - Notice that contact numbers and pickup address become unlocked once both approve.
9. Click **"Mark Handover Completed"** after the in-person exchange.
10. Submit a 5-star review to see the user's reputation score update instantly!

---

## 7. Automated Test Suite Summary

Run the test suite anytime:
```bash
npm --prefix backend test
```
Verified passing test suites:
- **Test Group 1**: Concession Configuration & System Limits (4 tests)
- **Test Group 2**: Mathematical Concession Engine (8 tests)
- **Test Group 3**: Programmatic Guardrail Validation (10 tests)
- **Test Group 4**: Gemini Prompt Confidentiality & Isolation (4 tests)
- **Test Group 5**: AI Response Parser & Fenced JSON Extraction (3 tests)
- **Test Group 6**: Mongoose Model Schema Verification (10 tests)
- **Total: 39 tests passing, 0 failed.**

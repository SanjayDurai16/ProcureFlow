# ProcureFlow — Regional B2B Procurement Platform for MSMEs

> A full-stack, state-driven B2B procurement workflow platform designed for Micro, Small, and Medium Enterprises (MSMEs). Rather than serving as an open-ended lead-generation directory, ProcureFlow digitizes and governs the end-to-end procurement lifecycle from initial requirement drafting to Purchase Order issuance.

---

## 1. Core Technical Value & Engineering Depth

ProcureFlow is engineered beyond basic CRUD applications with core business logic engines:

### 1. Deterministic RFQ State Machine (FSM)
The procurement lifecycle is strictly controlled by a backend finite state machine:
$$\text{DRAFT} \longrightarrow \text{OPEN} \longrightarrow \text{UNDER\_REVIEW} \longrightarrow \text{APPROVED} \longrightarrow \text{PO\_ISSUED}$$
* Arbitrary status updates or skipping states (e.g. attempting to generate a PO directly from a `DRAFT` or `OPEN` RFQ) are rejected by backend logic with `422 Unprocessable Entity`.
* Terminal states (`PO_ISSUED`, `CANCELLED`) prevent further mutation.

### 2. Tiered / Slab Pricing Engine
Vendors submit structured volume-based pricing slabs (e.g. 1–99 units @ ₹100, 100–499 units @ ₹85, 500+ units @ ₹70).
* **Validation:** Rejects overlapping tiers, invalid ranges, and inverted pricing (where higher volumes cost more per unit).
* **Dynamic Resolution:** Evaluates buyer requested quantity $Q$, resolves the applicable tier, and computes the exact unit price and total spend.
* **Comparative Matrix:** Highlights Lowest Price and Fastest Delivery across competing quotations.

### 3. Role-Based Access Control (RBAC)
* Implements multi-role RBAC: **Buyer** and **Vendor**.
* Buyers create requirements, publish RFQs, evaluate quotes, select suppliers, and issue binding Purchase Orders.
* Vendors discover matching regional opportunities and submit volume-tiered proposals.

### 4. Immutable Purchase Orders & Order FSM
* Generates an official, immutable Purchase Order record upon buyer quotation selection and approval (`PO-YYYY-XXXX`).
* Database-level uniqueness (`unique: true` index on `rfq_id`) guarantees that duplicate POs cannot be generated for the same RFQ under race conditions.
* Idempotent PO generation endpoint returns the existing PO without duplicate writes.
* Post-issuance order fulfillment follows an explicit state machine: $\text{ISSUED} \longrightarrow \text{ACKNOWLEDGED} \longrightarrow \text{FULFILLED}$.
* Print-optimized layout with formal line items, commercial terms, and delivery milestones.

### 5. Append-Only Audit Trail & Activity Timeline
* Records immutable milestone events for key lifecycle actions: `CREATE_DRAFT`, `PUBLISH`, `CANCEL`, `SUBMIT_QUOTE`, `SELECT_VENDOR`, `GENERATE_PO`, `ACKNOWLEDGE_PO`, `FULFILL_PO`.
* Stores actor references (`performed_by`), state changes (`from_state` $\rightarrow$ `to_state`), timestamp, and operational notes.
* Timeline endpoint (`GET /api/rfqs/:id/timeline`) feeds a compact visual activity log into the buyer RFQ detail view.

### 6. Regional MSME Proximity Matching
* Prioritizes and tags RFQs by local industrial hubs (e.g. Chennai, Coimbatore, Bangalore) to reduce transit lead times and transport costs for MSMEs.

---

## 2. Tech Stack & Architecture

* **Backend:** Node.js, Express (ES Modules), MongoDB with Mongoose
* **Validation & Security:** Zod, JWT (JSON Web Tokens), bcryptjs
* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
* **UI Design System:** Premium Minimalist Enterprise UI (Linear & financial ops density, `#F7F7F5` / `#FFFFFF` surfaces, `#245C46` forest green accent, tabular numerals, print-optimized PO layouts)
* **Testing:** Vitest, Supertest (20 automated unit & integration tests)
* **Architecture:** Clean Modular Monolith (`auth`, `rfqs`, `quotations`, `orders`, `audit`)

```
backend/
├── src/
│   ├── config/         # Database connection, env variables
│   ├── middleware/     # JWT authentication, RBAC, Zod validation, error handler
│   ├── modules/
│   │   ├── auth/       # User model, registration, login, JWT issuance
│   │   ├── rfqs/       # RFQ model, FSM state machine, lifecycle services
│   │   ├── quotations/ # Quotation model, tiered pricing engine, quote comparison
│   │   ├── orders/     # Purchase order model, order fulfillment FSM
│   │   └── audit/      # Append-only audit model & chronological timeline service
│   ├── app.js          # Express app & route mounting
│   ├── server.js       # Server bootstrap
│   └── seed.js         # Realistic MSME demo seed script
└── tests/
    ├── unit/
    │   ├── pricing-engine.test.js  # 11 unit tests for slab economics, boundary conditions & epsilon rounding
    │   └── state-machine.test.js   # 5 unit tests for FSM transitions & terminal states
    └── integration/
        └── rfq-workflow.test.js    # 4 integration tests (full lifecycle, cross-tenant security, PO idempotency)
```

---

## 3. Quickstart & Setup

### Prerequisites
* Node.js v18+ (tested on Node v22)
* MongoDB running locally on `localhost:27017`

### 1. Backend Setup
```bash
cd backend
npm install

# Seed demo MSME accounts and realistic RFQs
npm run seed

# Run automated tests
npm test

# Start backend dev server (port 5000)
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install

# Build & verify TypeScript
npm run build

# Start frontend dev server (port 5173)
npm run dev
```

---

## 4. Demo Accounts

For demonstration and testing, standard demo accounts are pre-seeded in the database:

| Role | Demo User | Email / Password | Hub | Key Responsibilities |
|---|---|---|---|---|
| **Buyer** | Ramesh Kumar | `buyer@abc.com` / `password123` | Chennai | Create RFQs, publish, compare quotes, select vendor, issue PO |
| **Vendor 1** | Tamil Bearings | `vendor1@tamilbearings.com` / `password123` | Chennai | Browse regional RFQs, submit volume pricing slabs |
| **Vendor 2** | Southern Steels | `vendor2@southernsteels.com` / `password123` | Coimbatore | Submit competing quotes with different lead times & slabs |

> **Note on Authentication:** The sign-in screen includes quick-fill credential shortcuts that populate the email and password fields. To switch accounts, sign out and select or enter the next persona. Arbitrary in-session account switching without signing out is disabled to maintain realistic session integrity.

---

## 5. Automated Test Suite

Run tests from the backend directory:
```bash
cd backend && npm test
```

The automated test suite runs **20 verified tests** across 3 test suites:
* **Pricing Engine Unit Tests (`tests/unit/pricing-engine.test.js` - 11 tests):**
  * First-tier, middle-tier, and open upper-bound (`null` max_qty) evaluations.
  * Exact slab boundary matching (e.g., boundaries at 100 and 500).
  * Rejection of quantities outside defined vendor slab ranges (below min or above bounded max).
  * Rejection of non-positive, zero, non-numeric, or non-finite quantities.
  * Rejection of overlapping pricing slabs (e.g., 1–100 and 90–200).
  * Detection and rejection of gaps between slabs (e.g., 1–100 and 150–500).
  * Rejection of inverted unit pricing (where higher volumes cost more per unit).
  * Rejection of negative or zero unit prices.
  * Floating-point precision and half-up rounding using `Number.EPSILON` to prevent IEEE 754 precision drift.
* **State Machine Unit Tests (`tests/unit/state-machine.test.js` - 5 tests):**
  * Valid sequential transitions (`DRAFT` $\rightarrow$ `OPEN` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `APPROVED` $\rightarrow$ `PO_ISSUED`).
  * Rejection of illegal transitions (`DRAFT` directly to `PO_ISSUED`).
  * Invariant checks on terminal states (`PO_ISSUED` and `CANCELLED`).
  * Direct approval upon vendor selection (`OPEN` / `UNDER_REVIEW` $\rightarrow$ `APPROVED`).
  * Backward mutation prevention on cancelled and terminal RFQs.
* **Full-Flow API Integration Tests (`tests/integration/rfq-workflow.test.js` - 4 tests):**
  * Role authorization enforcement (vendors cannot create RFQs).
  * End-to-end purchasing workflow from draft creation to formal PO generation.
  * Cross-tenant security isolation (Buyer B cannot view or tamper with Buyer A\'s RFQs $\rightarrow$ `403 Forbidden`).
  * Purchase order generation idempotency (duplicate PO generation requests return existing PO safely without duplicate writes).

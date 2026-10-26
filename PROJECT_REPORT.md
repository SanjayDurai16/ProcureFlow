# ProcureFlow — Regional B2B Procurement Platform for MSMEs

---

## 1. Project Title
**ProcureFlow — Regional B2B Procurement Platform for Micro, Small, and Medium Enterprises (MSMEs)**

---

## 2. Abstract
Micro, Small, and Medium Enterprises (MSMEs) form the backbone of the manufacturing and trade sectors. However, their internal procurement workflows frequently depend on fragmented channels such as email exchanges, phone calls, and manual spreadsheets. This ad-hoc approach leads to inconsistent quotation collection, lack of visibility into tiered pricing, delayed vendor selections, and unstandardized purchase documentation.

**ProcureFlow** is a full-stack, state-driven B2B procurement and quotation management platform designed to replace disorganized procurement practices with an end-to-end digital system. The platform models the entire procurement lifecycle: structured Request for Quotation (RFQ) creation, regional and category-based vendor discovery, dynamic tiered quotation submission, side-by-side comparative evaluation, direct vendor selection, and formal Purchase Order (PO) issuance. By enforcing business rules directly at the application and database tiers, ProcureFlow provides operational transparency, pricing clarity, and process efficiency for MSMEs.

---

## 3. Problem Statement
Procurement operations in typical MSMEs face several fundamental operational bottlenecks:

1. **Fragmented Communication Channels:** RFQs and quotes are distributed via telephone, instant messaging, and unstandardized email threads, creating information silos and document loss.
2. **Opaque and Inconsistent Quotation Comparison:** Vendor quotes often lack uniform quantity bases, delivery timelines, and tax structures. Manual comparison across heterogeneous spreadsheets is labor-intensive and error-prone.
3. **Lack of Volume Pricing Mechanics:** Suppliers frequently offer variable pricing based on order volume. MSMEs lack automated mechanisms to evaluate quantity-based slab pricing against their actual batch sizes.
4. **Unstandardized Purchase Documentation:** Purchase commitments are often communicated informally without structured Purchase Orders containing explicit line items, delivery milestones, and commercial terms.
5. **Geographic Inefficiency:** Small industrial units often overlook local and regional suppliers who could offer faster delivery lead times and lower freight expenses.

---

## 4. Objectives
The primary technical and operational objectives of the ProcureFlow platform are:

* **Centralize Procurement Lifecycle:** Provide a unified web platform managing requirements from draft RFQ stage through to formal Purchase Order creation.
* **Enable Regional Vendor Discovery:** Tag and filter RFQs by geographic industrial hub (e.g., Chennai, Coimbatore, Bangalore) to promote local sourcing and reduce turnaround times.
* **Automate Dynamic Tiered Pricing Evaluation:** Allow vendors to supply volume slab structures and automatically compute exact unit prices and total costs based on requested quantities.
* **Provide Objective Side-by-Side Comparison:** Present normalized quotation tables highlighting competitive pricing and lead times to support informed purchasing decisions.
* **Ensure Immutable Purchase Documentation:** Generate structured, printable Purchase Orders containing all agreed terms, specifications, and commercial details upon quotation selection.
* **Enforce Deterministic Workflow Transitions:** Govern the RFQ lifecycle via a backend Finite State Machine, preventing unauthorized or invalid state leaps.

---

## 5. Proposed System and Key Features

ProcureFlow is structured around role-based workflows and deterministic state enforcement. The system provides the following core features:

### 5.1 Role-Based Access Control (RBAC)
The application defines two distinct user personas, each restricted to authorized operations:
* **Buyer:** Drafts, edits, publishes, and cancels RFQs; inspects incoming quotations; compares bids; selects winning vendors; and generates purchase orders.
* **Vendor:** Browses regional and category-specific RFQs, views requirement specifications, submits and updates tiered quotations, and manages issued purchase orders.

### 5.2 RFQ Management and Lifecycle
Buyers configure requirement titles, detailed technical specifications, product categories, quantities, delivery units, delivery regions, and bidding deadlines. RFQs can be saved as editable drafts or published directly to regional suppliers. The lifecycle is strictly managed by a backend Finite State Machine (FSM).

### 5.3 Dynamic Tiered Quotation Engine
Suppliers provide structured volume tiers (slabs) with defined minimum quantities, maximum quantities, and unit rates. The backend validates these slabs to prevent overlapping brackets, gaps, and inverted economics (where higher volumes cost more per unit). Mathematical calculations use strict decimal rounding with epsilon compensation (Number.EPSILON) to prevent floating-point drift. When evaluated against the buyer's requested quantity, the engine determines the active slab and calculates the total quotation value.

### 5.4 Side-by-Side Quotation Comparison Matrix
Buyers review all received quotations in a standardized tabular matrix. The interface displays evaluated unit rates, total spend, delivery lead times (in days), and quote validity dates, enabling transparent commercial and operational comparisons.

### 5.5 Vendor Selection and Direct Approval
Upon reviewing competing quotes, the buyer selects the preferred vendor quotation. The system marks the selected quote as accepted, rejects competing submissions, and directly transitions the RFQ to `APPROVED` status, clearing it for immediate Purchase Order generation.

### 5.6 Immutable Purchase Order Issuance & Order Lifecycle
Upon approval, the system generates a standardized Purchase Order with a unique serial identifier (e.g., `PO-2026-XXXX`). A database-level unique constraint (`unique: true` on `rfq_id`) and idempotent controller logic guarantee that duplicate purchase orders cannot be created for the same RFQ under concurrent requests. Post-issuance order fulfillment is governed by a state machine (ISSUED → ACKNOWLEDGED → FULFILLED), with formal print-ready stylesheet support.

---

## 6. Technology Stack

The implementation of ProcureFlow relies on modern, production-grade open-source technologies verified within the codebase:

| Layer | Technology | Purpose in System | Implementation Status |
|---|---|---|---|
| **Frontend Framework** | React 19 | Component-based interactive user interface | Implemented |
| **Language (Frontend)** | TypeScript | Strict type safety, interfaces, and compile-time verification | Implemented |
| **Build Tool** | Vite 8 | Fast module bundling and local development server | Implemented |
| **Styling & Design System** | Tailwind CSS v4 | Utility-first responsive design tokens and print stylesheets | Implemented |
| **Icons** | Lucide React | Functional, restrained UI iconography | Implemented |
| **Backend Runtime** | Node.js (ES Modules) | Asynchronous server-side execution environment | Implemented |
| **Web Framework** | Express 5 | RESTful routing, middleware pipelines, and API handling | Implemented |
| **Database** | MongoDB | Document-oriented NoSQL storage for flexible schemas | Implemented |
| **ODM** | Mongoose 9 | Data modeling, validation, relations, and schema hooks | Implemented |
| **Authentication** | JWT & bcryptjs | Stateless token authentication and salted password hashing | Implemented |
| **Schema Validation** | Zod 4 | Runtime request payload validation and sanitization | Implemented |
| **Unit & Integration Testing** | Vitest 5 & Supertest 7 | Automated testing of pricing algorithms, FSM, tenant security, and PO idempotency | Implemented (20/20 tests passing) |

---

## 7. System Workflow

The end-to-end procurement process is governed by a deterministic backend state machine:

```
[DRAFT] ──> [OPEN] ──> [UNDER_REVIEW] ──> [APPROVED] ──> [PO_ISSUED]
  │           │              │                 │
  └──[CANCEL] └───[CANCEL]   └───[CANCEL]      └── (Terminal)
```

### Step-by-Step Execution:
1. **RFQ Creation & Drafting:** The Buyer creates an RFQ specifying requirement specifications, item category, target region, required quantity, and deadline. The record starts in `DRAFT` status and can be revised freely.
2. **Publication:** The Buyer publishes the RFQ. The state transitions to `OPEN`, making it visible to vendors registered in the corresponding region and industry category.
3. **Quotation Submission:** Regional vendors submit bids specifying volume slabs, validity dates, and lead times. The pricing engine validates tiers and computes the evaluated cost.
4. **Evaluation & Selection:** The buyer inspects the comparative matrix and selects the winning vendor quotation. The RFQ status transitions directly to `APPROVED`.
5. **Purchase Order Generation:** The buyer generates an official Purchase Order referencing the approved quotation. The RFQ reaches its terminal `PO_ISSUED` state.
6. **Fulfillment:** The vendor acknowledges the PO and marks it fulfilled upon product delivery.

The backend strictly prohibits illegal transitions (e.g., jumping from `DRAFT` directly to `PO_ISSUED`), returning an HTTP `422 Unprocessable Entity` error code.

---

## 8. System Modules

### 8.1 Authentication & User Management Module
* Handles secure user registration and login with encrypted password storage (`bcryptjs`).
* Generates stateless JSON Web Tokens (JWT) embedding user identity, role (`BUYER` or `VENDOR`), organization name, and assigned regional hub.
* Role-based middleware guards sensitive API routes (`authenticateToken`, `authorizeRoles`).

### 8.2 RFQ Management Module
* Provides CRUD operations for procurement requests.
* Implements the Finite State Machine (FSM) enforcing valid state progressions and blocking mutations on terminal records.
* Supports multi-parameter filtering by geographic hub, category, and lifecycle status.

### 8.3 Quotation & Dynamic Pricing Module
* Enforces volume slab validation (verifies minimum and maximum ranges and non-inverted pricing).
* Performs algorithmic price resolution: locates the applicable slab for requested quantity $Q$ and calculates unit and total pricing.
* Delivers normalized quotation comparison datasets to the buyer client.

### 8.4 Purchase Order (PO) Module
* Generates immutable purchase agreements referencing approved RFQs and selected vendor quotations.
* Enforces database-level uniqueness on RFQ references and idempotent generation logic.
* Controls post-issuance fulfillment transitions (`ISSUED` → `ACKNOWLEDGED` → `FULFILLED`).
* Provides print-optimized document layouts.

### 8.5 Append-Only Audit Trail & Activity Timeline Module
* Implements an immutable audit schema capturing milestone events: `CREATE_DRAFT`, `PUBLISH`, `CANCEL`, `SUBMIT_QUOTE`, `SELECT_VENDOR`, `GENERATE_PO`, `ACKNOWLEDGE_PO`, and `FULFILL_PO`.
* Persists actor identity (`performed_by`), state progression (`from_state` → `to_state`), timestamp, and contextual notes.
* Exposes `GET /api/rfqs/:id/timeline` to render a chronological procurement history directly in the buyer interface.

### 8.6 Role-Specific Frontend Dashboards
* **Buyer Dashboard:** Displays operational KPI strips, RFQ creation controls, RFQ tables, workflow steppers, and the quotation comparison matrix.
* **Vendor Dashboard:** Surfaces regional RFQ feeds, matching indicators, quotation builder with real-time price preview, and proposal tracking.

---

## 9. Expected Outcomes and Future Scope

### 9.1 Expected Outcomes
* **Operational Efficiency:** Eliminates repetitive email-based inquiries and manual spreadsheet consolidation.
* **Cost Savings & Price Transparency:** Volume slab evaluation ensures MSMEs secure bulk discounts and compare vendor bids on equal commercial terms.
* **Process Standardization:** Structured RFQs and formal Purchase Orders replace informal agreements with verifiable commercial documents.
* **Local Supply Chain Resilience:** Regional matching promotes shorter transit distances and lower freight costs.

### 9.2 Future Scope
While the current implementation provides a robust, fully working core procurement engine, planned enhancements include:
* **Multi-Item RFQs:** Expanding the data model to support bills of materials (BOM) with multiple line items per single RFQ.
* **Financial Governance & Approval Thresholds:** Introducing configurable multi-tier managerial approval thresholds for high-value orders.
* **Automated Notification System:** Integrating real-time WebSocket or email notifications for new bids and status changes.
* **Integrated Payment Gateways:** Integrating escrow or milestone-based B2B payment facilities directly upon PO fulfillment.

---

## 10. Conclusion
**ProcureFlow** successfully demonstrates the design and implementation of a structured, state-driven B2B procurement platform tailored to the operational realities of MSMEs. By combining role-based workflows for buyers and vendors, dynamic volume-based pricing evaluation, objective quotation comparison, and immutable purchase documentation, the platform replaces fragmented manual practices with a reliable, transparent system. The clean separation between business logic, deterministic state management, and a responsive enterprise interface makes ProcureFlow an effective, scalable foundation for digital supply chain operations.

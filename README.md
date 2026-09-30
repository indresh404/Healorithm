# Healorithm-v2: Offline-First Rural Telemedicine & Clinical Triage PWA

> **"Healthcare that keeps working offline, and remembers when it reconnects."**

An offline-first, encrypted, deterministic clinical risk triage and Jan Aushadhi generic mapping platform designed for rural healthcare workers (ASHA/ANM) and rural patients, with an independent web dashboard for district doctors and a self-hosted Dockerized backend.

---

## 🏗️ Architecture & Clean Structure

```
Healorithm-v2/
├── .gitignore
├── README.md                 # Complete setup, Docker, and developer documentation
├── docker-compose.yml        # Multi-container orchestration (Postgres/PostGIS, FastAPI, PWA, Admin, Neo4j, Ollama)
├── package.json              # Monorepo workspace scripts
├── shared/                   # Pure TypeScript single-source-of-truth
│   ├── types.ts              # Unified domain interfaces (Patient, Visit, Vitals, Referral, Jan Aushadhi)
│   ├── clinicalRiskEngine.ts # Deterministic emergency detection + 0-100 explainable score
│   ├── janAushadhiCatalog.ts # PMBJP generic catalog, savings calculator & schemes
│   ├── qrProtocol.ts         # Multi-frame animated QR zero-signal sequence protocol
│   ├── schemeRules.ts        # Ayushman Bharat (PM-JAY), PMSMA, NP-NCD, JSY scheme evaluator
│   ├── translations.ts       # Trilingual UI dictionaries & audio prompts (EN / HI / MR)
│   └── mockData.ts           # Epidemiological, demographic, and clinical seed data
├── App/                      # Offline-First PWA (Worker & Patient Portals)
│   ├── public/               # PWA icons and webmanifest
│   ├── src/
│   │   ├── auth/             # Login & Registration for Worker and Patient + Role Guards
│   │   ├── crypto/           # Web Crypto PBKDF2 key derivation & AES-GCM 256 encryption
│   │   ├── db/               # Dexie IndexedDB encrypted schema & atomic repos
│   │   ├── sync/             # Priority sync, gzip compression, backoff & network monitor
│   │   ├── risk/             # Real-time offline risk evaluation hooks
│   │   ├── referral/         # Deterministic referral facility generator
│   │   ├── components/       # 2D anatomical picker, PWA install prompt, mobile bottom navigation
│   │   └── pages/
│   │       ├── WelcomePage.tsx
│   │       ├── worker/       # Field worker triage queue, vitals entry, QR scanner, zero-signal
│   │       ├── patient/      # Patient health card, daily medicine diary, generic savings, SOS
│   │       └── AboutPage.tsx
│   ├── Dockerfile            # Multi-stage production container
│   ├── nginx.conf            # Nginx SPA & PWA service worker caching configuration
│   ├── package.json
│   ├── vite.config.ts        # Vite + VitePWA (Workbox offline service worker)
│   └── tsconfig.json
├── Admin/                    # Doctor & District Super Admin Web Dashboard
│   ├── public/               # Admin favicon & assets
│   ├── src/
│   │   ├── api/              # Axios API client and endpoint definitions
│   │   ├── auth/             # Doctor authentication and auth store
│   │   ├── components/
│   │   │   ├── body/         # Three.js 3D Interactive Human Anatomical Model
│   │   │   ├── ui/           # AI Loader orb animation component
│   │   │   └── common/       # AdminHeader with district status & real-time sync badge
│   │   └── pages/            # GIS Leaflet health map, outbreaks, trends, referrals, generic review, 3D anatomical viewer
│   ├── Dockerfile            # Multi-stage production container
│   ├── nginx.conf            # Nginx SPA configuration
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
└── backend/                  # Central FastAPI + PostgreSQL/PostGIS Backend
    ├── app/
    │   ├── core/             # JWT auth, security, and settings
    │   ├── db/               # SQLAlchemy engine & PostGIS spatial models
    │   ├── routers/          # Sync, patients, referrals, outbreaks, auth endpoints
    │   └── schemas/          # Pydantic v2 schemas
    ├── Dockerfile            # Python 3.11-slim production container
    ├── requirements.txt
    └── .env.example
```

---

## 🐳 Docker Deployment (Recommended)

Healorithm is designed to be fully self-hosted with zero mandatory third-party cloud API dependencies.

### 1. Start Core Services

Runs **PostgreSQL (with PostGIS)**, **FastAPI backend**, **App PWA**, and **Admin Dashboard**:

```bash
docker compose up --build
```

- **Patient & Worker PWA**: `http://localhost:3000`
- **Doctor & District Admin Dashboard**: `http://localhost:3001`
- **FastAPI Backend & Swagger Docs**: `http://localhost:8000/docs`
- **PostgreSQL / PostGIS**: `localhost:5432`

### 2. Start Full Stack with Phase 2 Services (Neo4j + Ollama)

```bash
docker compose --profile full up --build
```

- **Neo4j Graph Browser**: `http://localhost:7474`
- **Ollama Local LLM API**: `http://localhost:11434`

---

## 🚀 Local Development Setup (Without Docker)

### 1. Install Dependencies

```bash
npm run install:all
```

---

### 2. Run the PWA (`App/`)
Runs on `http://localhost:3000` with offline service worker, Web Crypto encryption, and mobile-first responsive layout:

```bash
npm run app
```

#### Available URLs in `App/`:
- **Portal Selection / Landing**: `http://localhost:3000/`
- **Health Worker Authentication**:
  - Worker Login (PIN-based vault unlock): `http://localhost:3000/worker/login`
  - Worker Registration: `http://localhost:3000/worker/register`
- **Health Worker Portal (Field Worker Interface)**:
  - Visit Queue & Triage: `http://localhost:3000/worker`
  - Record Vitals & Symptoms: `http://localhost:3000/worker/vitals`
  - Scan QR Health Card: `http://localhost:3000/worker/scan`
  - Register New Household Patient: `http://localhost:3000/worker/new`
  - Zero-Signal Handoff & Chunk Assembler: `http://localhost:3000/worker/zero-signal`
  - Offline Emergency Directory: `http://localhost:3000/worker/directory`
  - PIN Security Lock: `http://localhost:3000/worker/pin`
  - Sync Status & Outbox Center: `http://localhost:3000/worker/sync`
- **Patient Authentication**:
  - Patient Login (Mobile / QR): `http://localhost:3000/patient/login`
  - Patient Health Card Registration: `http://localhost:3000/patient/register`
- **Patient Portal (Digital Health Card Interface)**:
  - My QR Health Card: `http://localhost:3000/patient`
  - Daily Medicine Tracker Diary: `http://localhost:3000/patient/diary`
  - Jan Aushadhi Generic Savings Receipt: `http://localhost:3000/patient/savings`
  - Zero-Signal Animated QR Transfer to ASHA: `http://localhost:3000/patient/zero-signal`
  - Data Sharing Consent Manager: `http://localhost:3000/patient/consent`
  - Emergency SOS (108 Ambulance / ASHA): `http://localhost:3000/patient/sos`
- **About Healorithm**: `http://localhost:3000/about`

---

### 3. Run Doctor & District Admin Dashboard (`Admin/`)
Runs on `http://localhost:3001`:

```bash
npm run admin
```

- **Doctor Dashboard**: `http://localhost:3001/`
- **Epidemiological GIS Map**: `http://localhost:3001/map`
- **Outbreak Cluster Surveillance**: `http://localhost:3001/outbreaks`
- **Syndromic Trends Monitor**: `http://localhost:3001/trends`
- **Referral Priority Queue**: `http://localhost:3001/referrals`
- **Jan Aushadhi Prescription Review**: `http://localhost:3001/prescriptions`
- **Pharmacy & Stock Inventory**: `http://localhost:3001/resources`
- **ASHA Workforce Roster**: `http://localhost:3001/workers`
- **Patient Registry**: `http://localhost:3001/users`
- **Patient Dossier with 3D Anatomical Body Model & AI Voice Briefing**: `http://localhost:3001/users/u-101`
- **Care Coordination Agent Console**: `http://localhost:3001/agent`
- **Multi-Master Conflict Resolution**: `http://localhost:3001/conflicts`

---

## 🫀 Interactive 3D Anatomical Body & Clinical AI Agent

The Doctor Dashboard includes a **Three.js 3D Human Body Model** with:
- **360° Interactive Orbit & Zoom**: Rotate, inspect front/profile/dorsal views, and switch between solid and wireframe holographic modes.
- **Pulsating Organ Nodes**: Clickable hotspots for Central Nervous System, Bilateral Pulmonary & Bronchial Tree, Myocardium, Gastrointestinal organs, and Musculoskeletal column.
- **Symptom & Triage Mapping**: Directly connects physical complaints and vital sign thresholds to organ systems with Emergency / Urgent / Routine priority ratings.
- **AI Voice Narration & Animated Orb**: Integrated voice synthesizer with the custom `AILoader` orb animation explaining clinical briefs to attending doctors.

---

## 💊 Jan Aushadhi & Indian Government Schemes

Integrated generic medicine catalog (`shared/janAushadhiCatalog.ts`) comparing branded Indian pharmaceuticals with Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) equivalents:
- **Comprehensive Coverage**: Cardiovascular, Diabetes, Antibiotics, NSAIDs, Gastrointestinal, Respiratory, Maternal & Child Nutrition.
- **Automatic Savings Calculation**: Computes direct out-of-pocket savings (up to 88% reduction) with line-by-line doctor confirmation.
- **Welfare Schemes Database**: Ayushman Bharat PM-JAY, PMSMA, NP-NCD, PMBJP Kendras, and Janani Suraksha Yojana (JSY).

---

## 🔒 Security & Data Integrity

- **Local Storage Encryption**: AES-256-GCM authenticated encryption via Web Crypto API with PBKDF2 local key derivation.
- **Zero-Signal Animated QR**: Secure multi-frame chunk protocol for transferring records between patient and worker devices without internet.
- **Outbox Architecture**: Guarantees zero data loss during network drops; records are only marked synced upon backend server acknowledgement.
- **Append-Only Clinical Audit**: Vitals, observations, and prescriptions are versioned with multi-master conflict resolution rather than simple last-write-wins.

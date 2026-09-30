# Healorithm-v2: Offline-First Rural Telemedicine & Clinical Triage System

An offline-first, encrypted, deterministic clinical risk triage and Jan Aushadhi generic mapping platform designed for rural healthcare workers (ASHA/ANM), rural patients, and district doctors.

---

## 🏗️ Architecture & Clean Monorepo Structure

```
Healorithm-v2/
├── .gitignore
├── README.md                 # Complete setup and developer documentation
├── package.json              # Monorepo root scripts
├── shared/                   # Pure TypeScript engines and single-source-of-truth
│   ├── types.ts              # Unified domain interfaces (Patient, Visit, Vitals, Referral, Jan Aushadhi)
│   ├── clinicalRiskEngine.ts # Deterministic emergency detection + 0-100 explainable score
│   ├── janAushadhiCatalog.ts # PMBJP generic catalog, savings calculator & schemes
│   ├── qrProtocol.ts         # Multi-frame animated QR zero-signal sequence protocol
│   ├── schemeRules.ts        # Ayushman Bharat (PM-JAY), RBSK, State scheme evaluator
│   ├── translations.ts       # Trilingual UI dictionaries & audio prompts (EN / HI / MR)
│   └── mockData.ts           # Epidemiological, demographic, and clinical seed data
├── App/                      # Offline-First PWA (Worker + Patient Portals)
│   ├── public/               # PWA icons and favicon
│   ├── src/
│   │   ├── auth/             # Worker PIN lock, role guards, and auth stores
│   │   ├── crypto/           # Web Crypto PBKDF2 key derivation & AES-GCM 256 encryption
│   │   ├── db/               # Dexie IndexedDB encrypted schema & atomic repos
│   │   ├── sync/             # Priority sync, gzip compression, backoff & network monitor
│   │   ├── risk/             # React hooks for real-time offline risk evaluation
│   │   ├── referral/         # Deterministic referral facility generator
│   │   ├── components/       # Lightweight 2D anatomical picker, sync banners & badges
│   │   └── pages/
│   │       ├── worker/       # Solid Green theme field worker triage, vitals, scanner
│   │       ├── patient/      # Simple Blue theme patient health card, diary, savings
│   │       └── AboutPage.tsx
│   ├── package.json
│   ├── vite.config.ts        # Vite + VitePWA (Workbox offline service worker)
│   └── tsconfig.json
├── Admin/                    # Doctor & District Super Admin Web Dashboard
│   ├── public/               # Admin favicon & assets
│   ├── src/
│   │   ├── api/              # Axios API client and endpoint definitions
│   │   ├── auth/             # Doctor authentication and auth store
│   │   ├── components/       # AI Loader orb, risk badges, factor bars, headers
│   │   └── pages/            # GIS Leaflet health map, outbreaks, trends, referrals, generic review
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
└── backend/                  # FastAPI Backend (schemas, routers, services, config)
    ├── README.md
    ├── requirements.txt
    ├── .env.example
    └── app/
```

---

## 🚀 Quick Start Guide & Setup Commands

### 1. Install All Dependencies

Install dependencies across both `App/` and `Admin/` directly from root:

```bash
# Using root monorepo script:
npm run install:all

# Or manually in each directory:
cd App && npm install
cd ../Admin && npm install
```

---

### 2. Run the Applications

#### 🟢 Run Health Worker & Patient PWA (`App/`)
Runs on `http://localhost:3000` with offline PWA service worker and IndexedDB encryption:

```bash
# From root directory:
npm run app

# Or from App directory:
cd App
npm run dev
```

- **Health Worker Portal (Solid Green Theme)**: `http://localhost:3000/worker`
  - Dashboard: `/worker`
  - Register New Patient: `/worker/new`
  - Record Vitals & 2D Body Symptoms: `/worker/vitals`
  - QR Health Card Scanner: `/worker/scan`
  - Zero-Signal Animated QR Transfer: `/worker/zero-signal`
  - Offline Village Directory: `/worker/directory`
  - Sync Center: `/worker/sync`
- **Patient Portal (Simple Blue Theme)**: `http://localhost:3000/patient`
  - Health Card & QR: `/patient`
  - Daily Medicine Diary: `/patient/diary`
  - Jan Aushadhi Savings Receipt: `/patient/savings`
  - Zero-Signal Export: `/patient/zero-signal`
  - Consent Manager: `/patient/consent`
  - Emergency SOS: `/patient/sos`
- **About Healorithm**: `http://localhost:3000/about`

---

#### 🔵 Run Doctor & District Admin Dashboard (`Admin/`)
Runs on `http://localhost:3001`:

```bash
# From root directory:
npm run admin

# Or from Admin directory:
cd Admin
npm run dev
```

- **Doctor Dashboard**: `http://localhost:3001/`
- **Epidemiological GIS Map**: `http://localhost:3001/map`
- **Outbreak Cluster Surveillance**: `http://localhost:3001/outbreaks`
- **Syndromic Trends Monitor**: `http://localhost:3001/trends`
- **Jan Aushadhi Supply & Pharmacy Inventory**: `http://localhost:3001/resources`
- **ASHA Workforce Roster**: `http://localhost:3001/workers`
- **Patient Registry**: `http://localhost:3001/users`
- **Patient Clinical Dossier & AI Voice Orb**: `http://localhost:3001/users/u-101`
- **Care Coordination Human-in-the-Loop Agent**: `http://localhost:3001/agent`
- **Multi-Master Conflict Resolution**: `http://localhost:3001/conflicts`

---

### 3. Production Build & Typecheck Verification

Run full TypeScript compilation and Vite bundling:

```bash
# Build App PWA
npm run app:build

# Build Admin Dashboard
npm run admin:build
```

---

## 🔒 Security & Offline Principles

1. **Deterministic Clinical Risk First**: Immediate deterministic clinical safety rules (e.g. BP $\ge 180/120$, $\text{SpO}_2 < 90\%$, chest pain + breathlessness) immediately trigger emergency flags on-device without model latency.
2. **Local At-Rest Encryption**: All PWA records in Dexie IndexedDB are encrypted with AES-GCM 256-bit using PBKDF2 derived keys from the worker's PIN.
3. **Zero-Signal Animated QR Transfer**: Patient diaries and referral snapshots can be transferred device-to-device with multi-frame base64 encoded QR bursts without internet or cellular network connectivity.
4. **Jan Aushadhi Generic Substitution**: Automatic mapping of prescribed branded medicines to equivalent generic formulations under the Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) with savings up to 85%.

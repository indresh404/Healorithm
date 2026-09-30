# Healorithm-v2: Offline-First Rural Telemedicine & Clinical Triage PWA

An offline-first, encrypted, deterministic clinical risk triage and Jan Aushadhi generic mapping platform designed for rural healthcare workers (ASHA/ANM) and rural patients, with an independent web dashboard for district doctors.

---

## 🏗️ Architecture & Clean Structure

```
Healorithm-v2/
├── .gitignore
├── README.md                 # Complete setup and developer documentation
├── package.json              # Workspace runner scripts
├── shared/                   # Pure TypeScript engines and single-source-of-truth
│   ├── types.ts              # Unified domain interfaces (Patient, Visit, Vitals, Referral, Jan Aushadhi)
│   ├── clinicalRiskEngine.ts # Deterministic emergency detection + 0-100 explainable score
│   ├── janAushadhiCatalog.ts # PMBJP generic catalog, savings calculator & schemes
│   ├── qrProtocol.ts         # Multi-frame animated QR zero-signal sequence protocol
│   ├── schemeRules.ts        # Ayushman Bharat (PM-JAY), RBSK, State scheme evaluator
│   ├── translations.ts       # Trilingual UI dictionaries & audio prompts (EN / HI / MR)
│   └── mockData.ts           # Epidemiological, demographic, and clinical seed data
├── App/                      # Offline-First PWA (Worker & Patient Portals)
│   ├── public/               # PWA icons and favicon
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
│   ├── package.json
│   ├── vite.config.ts        # Vite + VitePWA (Workbox offline service worker)
│   └── tsconfig.json
└── Admin/                    # Doctor & District Super Admin Web Dashboard
    ├── public/               # Admin favicon & assets
    ├── src/
    │   ├── api/              # Axios API client and endpoint definitions
    │   ├── auth/             # Doctor authentication and auth store
    │   ├── components/       # AI Loader orb, risk badges, factor bars
    │   └── pages/            # GIS Leaflet health map, outbreaks, trends, referrals, generic review
    ├── package.json
    ├── vite.config.ts
    └── tsconfig.json
```

---

## 🚀 Setup & Execution Guide

### 1. Install Dependencies

Install all dependencies across both `App/` and `Admin/` with a single command from the root:

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
  - Record Vitals & 2D Body Symptoms: `http://localhost:3000/worker/vitals`
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
- **Jan Aushadhi Supply & Pharmacy Inventory**: `http://localhost:3001/resources`
- **ASHA Workforce Roster**: `http://localhost:3001/workers`
- **Patient Registry**: `http://localhost:3001/users`
- **Patient Clinical Dossier & AI Voice Orb**: `http://localhost:3001/users/u-101`
- **Care Coordination Human-in-the-Loop Agent**: `http://localhost:3001/agent`
- **Multi-Master Conflict Resolution**: `http://localhost:3001/conflicts`

---

### 4. Build Verification

```bash
# Build App PWA (Generates production Service Worker & Precache)
npm run app:build

# Build Admin Dashboard
npm run admin:build
```

---

## 📱 PWA Features & Responsive Design

- **Mobile First**: Both Worker and Patient portals feature clean, thumb-friendly bottom navigation bars on mobile devices and horizontal tabs on desktop screens.
- **Installable PWA**: Automatic installation banner prompts users to install the application locally for instant offline launches.
- **Zero-Signal Operation**: Works completely without internet connection; data is stored securely in IndexedDB with AES-GCM 256-bit encryption.
- **Trilingual Audio Guide**: Built-in voice assistance in English, Hindi, and Marathi for low-literacy field and rural patient support.

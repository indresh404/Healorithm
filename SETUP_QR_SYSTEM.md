# Healorithm QR-Based Patient Retrieval System - Setup Guide

## Overview
This guide walks you through setting up the complete QR-based patient retrieval system for Healorithm.

---

## 📋 Table of Contents
1. [Database Setup](#database-setup)
2. [Flutter User App Setup](#flutter-user-app-setup)
3. [Admin App Setup](#admin-app-setup)
4. [Testing & Verification](#testing--verification)

---

## 1. Database Setup

### Step 1a: Verify Table Structure
Ensure your Supabase database has these tables with correct columns:

```sql
-- Users Table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  phone TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  preferred_language TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  qr_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Vitals Table
CREATE TABLE public.vitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.users(id),
  recorded_by TEXT,
  systolic_bp INTEGER,
  diastolic_bp INTEGER,
  heart_rate INTEGER,
  spo2 NUMERIC,
  temperature NUMERIC,
  notes TEXT,
  is_critical BOOLEAN DEFAULT FALSE,
  recorded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Medical Records Table
CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.users(id),
  type TEXT,
  title TEXT,
  description TEXT,
  file_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Consultations Table
CREATE TABLE public.ai_consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.users(id),
  summary TEXT,
  risk_level TEXT,
  recommendations TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Prescriptions Table
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.users(id),
  medication TEXT,
  dosage TEXT,
  frequency TEXT,
  duration TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Step 1b: Add QR Code Index (Optional but Recommended)
```sql
CREATE INDEX idx_users_qr_code ON public.users(qr_code);
```

### Step 1c: Create RPC Function
Run the SQL from `Admin/scripts/create-rpc-function.sql` in your Supabase SQL editor:

```sql
-- Login to Supabase → SQL Editor
-- Paste the entire content from Admin/scripts/create-rpc-function.sql
-- Click "Run"
```

This creates the `get_patient_full_data()` function that fetches all patient data in a single call.

---

## 2. Flutter User App Setup

### Step 2a: Location Permissions
Update `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

Update `ios/Runner/Info.plist`:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to provide better health tracking</string>
```

### Step 2b: Install Dependencies
```bash
cd User
flutter pub get
```

All required packages are already in `pubspec.yaml`:
- ✅ `geolocator: ^13.0.0` - Location service
- ✅ `qr_flutter: ^4.1.0` - QR code generation
- ✅ `supabase_flutter: ^2.5.0` - Supabase integration

### Step 2c: Test User Signup
1. Run the Flutter app
2. Open **Sign Up** form
3. Fill in all details and create account
4. You should see:
   - ✅ Success animation
   - ✅ Generated QR code
   - ✅ Location coordinates (if location access granted)
5. Verify data in Supabase:
   ```
   Supabase → Database → users table
   - qr_code: QR_XXXXXXXXXXXXXXXX
   - latitude & longitude: populated
   ```

---

## 3. Admin App Setup

### Step 3a: Update Environment Variables
Ensure your `.env` or `.env.local` has:
```
EXPO_PUBLIC_SUPABASE_URL=<your-supabase-url>
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-supabase-key>
```

### Step 3b: Install Dependencies
```bash
cd Admin
npm install
# or
yarn install
```

### Step 3c: Test QR Scanner

#### Method 1: Real QR Code
1. Get a valid QR code from a user's signup screen (Flutter app)
2. Open Admin app → Scan tab
3. Scan the QR code
4. You should see:
   - ✅ Patient found
   - ✅ Name displayed
   - ✅ Risk level shown
   - ✅ Tap "View Profile" to see full data

#### Method 2: Test Scan (Mock)
1. Open Admin app → Scan tab
2. Tap "Test Scan (Mock)" button
3. This generates a random QR code
4. If no patient is found, you'll see an alert (expected for mock codes)

---

## 4. Testing & Verification

### Complete End-to-End Flow

```
Step 1: User Signup (Flutter)
├─ Open User app
├─ Sign Up with details
├─ Grant location permission
└─ See QR code displayed

    ↓

Step 2: Verify Database
├─ Check Supabase → users table
├─ Confirm qr_code field is populated
├─ Confirm latitude/longitude are set
└─ Copy the qr_code value

    ↓

Step 3: Admin Scan (Admin App)
├─ Open Admin app → Scan tab
├─ Scan the QR code from Flutter app (use phone camera)
│  OR test with a mock QR
├─ System fetches full patient data
└─ See patient profile with vitals, AI consultations, etc.

    ↓

Step 4: View Patient Data
├─ Tap "View Profile"
├─ See all patient details:
│  ├─ Name, age, gender
│  ├─ Vital signs history
│  ├─ Medical records
│  ├─ AI consultation summary
│  └─ Risk level
```

### Troubleshooting

#### QR Scan Shows "Patient Not Found"
**Cause**: QR code doesn't exist in database
**Fix**:
1. Create a real user via Flutter signup
2. Copy the exact qr_code from database
3. Generate a test QR code: https://www.qr-code-generator.com/
4. Use the test to verify scanner works

#### Location Not Captured
**Cause**: Location permission denied or service disabled
**Fix**:
1. Grant location permission when asked
2. Check phone settings → Location is ON
3. App requests high accuracy location

#### Admin App Crashes on Scan
**Cause**: RPC function not created or Supabase connection issue
**Fix**:
1. Verify RPC function exists: Supabase → SQL Editor → get_patient_full_data
2. Check Supabase credentials in Admin/.env
3. Test RPC manually in Supabase:
   ```sql
   SELECT * FROM get_patient_full_data('QR_XXXXXXXX');
   ```

---

## 📱 App Flow Summary

### User App (Flutter)
```
Login/Signup
    ↓
Signup Form (NEW)
    ├─ Get location (geolocator)
    ├─ Generate QR code (uuid)
    └─ Save to Supabase
    ↓
Success Screen Shows QR
    ├─ Display QR code image
    ├─ Show QR code text
    └─ Show location coordinates
    ↓
Home Page (UserPage)
```

### Admin App (React Native)
```
Scan Tab
    ↓
QR Scanner (expo-camera)
    ├─ Scan QR code
    └─ Extract text (QR_XXXXXX)
    ↓
Fetch Patient Data
    ├─ Call RPC: get_patient_full_data(qr_code)
    ├─ Or fallback: Multiple queries
    └─ Store in Zustand (useAppStore)
    ↓
Patient Detail Page
    ├─ Show name, age, vitals
    ├─ Display AI summary
    └─ List medical records
```

---

## 🔧 Key Implementation Details

### QR Code Generation (Flutter)
```dart
// Services/qr_service.dart
final qrCode = QRService.generateQRCode();
// Returns: QR_A1B2C3D4E5F6G7H8
```

### Location Capture (Flutter)
```dart
// Services/location_service.dart
final position = await LocationService.getCurrentLocation();
// Returns: Position(latitude, longitude, accuracy)
```

### Patient Data Fetch (Admin)
```ts
// services/supabase.service.ts
const data = await getPatientByQRCode(qrCode);
// Returns: { user, vitals[], medical_records[], ai_consultations[], prescriptions[] }
```

---

## ✅ Deployment Checklist

- [ ] Database tables created
- [ ] RPC function created
- [ ] Flutter location permissions configured
- [ ] Admin environment variables set
- [ ] User app tested with real signup
- [ ] Admin app tested with real QR scan
- [ ] Patient data displays correctly
- [ ] Risk levels calculated properly
- [ ] All vitals shown in history
- [ ] AI consultation summary visible

---

## 📞 Support

If you encounter issues:
1. Check Supabase logs
2. Verify RPC function syntax
3. Test location service on device
4. Check camera permissions
5. Verify QR code format: `QR_XXXXX...`

---

## 🎯 Next Steps

After verifying this works:
1. Add offline sync for vitals
2. Integrate AI consultation API
3. Add prescription management
4. Set up automated alerts for high risk
5. Create admin dashboard

---

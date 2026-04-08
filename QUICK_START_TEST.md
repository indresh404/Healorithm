# 🏃 Quick Start - Test the Complete QR System

## ⚡ In 5 Minutes

### Terminal 1: Start Flutter User App
```bash
cd d:\college\PROJECTS\Healorithm\User
flutter pub get
flutter run
# OR for specific device:
# flutter run -d android
# flutter run -d ios
```

### Terminal 2: Start Admin App
```bash
cd d:\college\PROJECTS\Healorithm\Admin
npm start  # (already installed: npm install completed)
```

---

## 📱 Test Flow (Step by Step)

### **Minute 1: User Signs Up**
1. Open Flutter app on phone/emulator
2. Swipe up to skip intro
3. Tap **"Sign Up"** tab
4. Fill form:
   ```
   Name:        John Doe
   Age:         45
   Gender:      Male
   Language:    English
   Phone:       +91 9876543210
   Password:    Test123
   ```
5. Click **"CREATE ACCOUNT"**
6. **ALLOW** location permission when asked

### **Minute 2: Get QR Code**
1. See success dialog with animation
2. See **QR code image** (scannable)
3. See **QR code text**: `QR_XXXXXXXXXXXXXXXX`
4. See **Location**: Latitude & Longitude displayed
5. Tap **"Continue to Home"**

### **Minute 3: Verify Database**
1. Open browser → Supabase Dashboard
2. Go to: **Database** → **users** table
3. Find your row with phone `+91 9876543210`
4. Verify columns populated:
   - ✅ name: "John Doe"
   - ✅ age: 45
   - ✅ qr_code: QR_XXXXXXXXXXXXXXXX (copy this!)
   - ✅ latitude: 28.6139 (or similar)
   - ✅ longitude: 77.2090 (or similar)

### **Minute 4: Admin Scans QR**
1. Open Admin app on another device/emulator
2. Login if needed
3. Click **"Scan"** tab
4. Allow camera permission
5. Point camera at **Flutter success screen QR code** (or print it!)
   - OR use the test button in admin app
6. System scans and fetches data

### **Minute 5: See Patient Profile**
1. Alert shows: `"✅ Scan Successful"` and patient name
2. Tap **"View Profile"**
3. See full patient page with:
   - Name, Age, Gender
   - Location
   - Risk Level
   - Vitals (if any exist)
   - Medical History
   - AI Summary
   - Prescriptions

---

## 📸 What You'll See

### Flutter App - Success Screen
```
┌─────────────────────────────┐
│  🎉 Account Created!        │
│  Welcome, John Doe!         │
│                             │
│     [QR CODE IMAGE]         │
│                             │
│  Your Unique QR Code:       │
│  QR_A1B2C3D4E5F6G7H8       │
│                             │
│  📍 Location Captured       │
│  Lat: 28.6139              │
│  Lng: 77.2090              │
│                             │
│  [Continue to Home]         │
└─────────────────────────────┘
```

### Admin App - Scan Result
```
Alert:
✅ Scan Successful
Patient: John Doe
Risk Level: LOW

[View Profile]
```

### Admin App - Patient Profile
```
┌─────────────────────────────┐
│ John Doe           🟢 LOW   │
│ 45 Yrs • Male • ID: #P-001 │
│                             │
│ Current Health Score: 20%   │
│ ┌─────────────────────────┐ │
│ │████░░░░░░░░░░░░░░░░░░│ │
│ └─────────────────────────┘ │
│                             │
│ 7-Day Adherence            │
│ M T W T F S S     100%     │
│ ✓ ✓ ✓ ✓ ✓ ✓ ✓    this week│
│                             │
│ Latest Vitals (if any)      │
│ ─────────────────────────── │
│ (No vitals recorded yet)    │
│                             │
│ [Record Vitals]             │
│ [Add Prescription]          │
└─────────────────────────────┘
```

---

## ✅ Success Indicators

**Flutter App:**
- [ ] QR code appears after signup
- [ ] QR code is displayed as image
- [ ] QR code text is visible
- [ ] Location coordinates shown
- [ ] No crash on location permission dialog

**Supabase Database:**
- [ ] User row created in `users` table
- [ ] `qr_code` field populated with `QR_XXXXX`
- [ ] `latitude` & `longitude` have values
- [ ] `password` field has hashed value
- [ ] `phone` is unique (can't create duplicate)

**Admin App:**
- [ ] Camera permission granted
- [ ] Can scan QR code
- [ ] Success alert shows patient name
- [ ] Patient profile page loads
- [ ] All patient data displays

---

## 🐛 Troubleshooting

### "Location permissions denied" but app says captured
- **Fix**: Give location permission manually in phone settings

### QR code not showing after signup
- **Fix**: Run `flutter pub get` then `flutter clean && flutter run`

### Admin app scan shows "Patient Not Found"
- **Fix**: 
  1. Verify QR code in Supabase database
  2. Make sure you're scanning the correct QR (use test button if needed)
  3. Check RPC function exists in Supabase

### Admin app crashes on scan
- **Fix**:
  1. Verify Android dependencies installed: `npm install`
  2. Restart Expo: Press `s` to rebuild

### "Unable to resolve @supabase/supabase-js"
- **Fix**: Already fixed! Run `npm install` in Admin folder (done)

---

## 📊 Data Flow Verification

```
Flutter Signup
  ↓
Location captured ✓
  ↓
QR generated ✓
  ↓
Data saved to Supabase ✓
  ↓
Success screen shows QR ✓
  ↓
Admin scans QR ✓
  ↓
RPC fetches full patient data ✓
  ↓
Patient profile displays ✓
```

---

## 🎯 Real vs Test Data

### Real Test (Recommended)
```
1. Use your actual phone number
2. Grant actual location permission
3. See real coordinates in database
4. Admin scans with real camera
→ Most realistic test
```

### Mock Test (Quick)
```
1. Use fake phone (will error if duplicate)
2. Deny location permission (will be null)
3. Use Admin test button instead of camera
→ Faster but less realistic
```

---

## 📝 Checklist for Completion

- [ ] Both apps running simultaneously
- [ ] Signed up with valid details
- [ ] Location permission granted
- [ ] QR code visible on success screen
- [ ] QR code scanned by Admin app
- [ ] Patient profile loaded
- [ ] All data visible and correct

---

## 🚀 You're Done!

Both apps are now:
- ✅ Connected to real Supabase database
- ✅ Using real QR codes (unique per user)
- ✅ Capturing real location data
- ✅ Retrieving real patient data on scan

**Next steps for production:**
1. Add more test cases
2. Test on real Android/iOS devices
3. Set up automated testing
4. Add error handling improvements
5. Deploy to Supabase (already live)
6. Create user onboarding flow
7. Add offline sync capability

---

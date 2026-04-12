#!/usr/bin/env python3
"""
Diagnostic script to check if the Admin AI pipeline is set up correctly.
Run this before starting the backend.
"""

import sys
import os
from config import SUPABASE_URL, SUPABASE_ANON_KEY
from db import supabase_client as db

def check_supabase():
    print("🔍 Checking Supabase connection...")
    try:
        ok = db.test_connection()
        if ok:
            print("✅ Supabase connection OK")
            return True
        else:
            print("❌ Supabase connection FAILED")
            print(f"   Check your credentials in config.py")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def check_workers():
    print("\n🔍 Checking workers...")
    try:
        res = db.get_client().table("worker").select("id, name, phone_no").execute()
        workers = res.data or []
        
        if not workers:
            print("❌ No workers found in database")
            print("   Run the SQL setup script: Admin/scripts/fix-worker-schema-and-sample-data.sql")
            return False
        
        print(f"✅ Found {len(workers)} worker(s):")
        for w in workers:
            print(f"   - {w['name']} ({w['phone_no']}) — ID: {w['id']}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def check_patients():
    print("\n🔍 Checking patients...")
    try:
        res = db.get_client().table("users").select("id, name").execute()
        patients = res.data or []
        
        if not patients:
            print("❌ No patients found in database")
            return False
        
        print(f"✅ Found {len(patients)} patient(s)")
        for p in patients[:3]:
            print(f"   - {p['name']} (ID: {p['id']})")
        if len(patients) > 3:
            print(f"   ... and {len(patients) - 3} more")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def check_worker_assignments():
    print("\n🔍 Checking worker_assignments table...")
    try:
        res = db.get_client().table("worker_assignments").select("*").execute()
        assignments = res.data or []
        
        if not assignments:
            print("⚠️  No worker assignments found")
            print("   This is OK — backend will use all patients as fallback")
            return True
        
        print(f"✅ Found {len(assignments)} assignment(s):")
        for a in assignments[:3]:
            assigned_count = len(a.get("assigned_patients") or [])
            print(f"   - {a['worker_name']} → {assigned_count} patient(s)")
        return True
    except Exception as e:
        print(f"⚠️  worker_assignments check error: {e}")
        print("   Table may not exist yet — that's OK")
        return True

def get_worker_id():
    """Get first worker ID for testing."""
    try:
        res = db.get_client().table("worker").select("id").limit(1).execute()
        if res.data:
            return res.data[0]["id"]
    except:
        pass
    return None

def main():
    print("=" * 70)
    print("  Healorithm Admin AI Pipeline — Diagnostic Check")
    print("=" * 70)
    
    # Check each component
    supabase_ok = check_supabase()
    workers_ok = check_workers()
    patients_ok = check_patients()
    assignments_ok = check_worker_assignments()
    
    print("\n" + "=" * 70)
    if supabase_ok and workers_ok and patients_ok:
        print("✅ All checks passed! Backend is ready to start.")
        worker_id = get_worker_id()
        if worker_id:
            print(f"\n📱 Use this worker ID to test: {worker_id}")
    else:
        print("❌ Some checks failed. Please fix the issues above.")
        sys.exit(1)
    
    print("=" * 70)

if __name__ == "__main__":
    main()

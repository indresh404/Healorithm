# Healorithm Backend API (FastAPI)

FastAPI service handling offline sync delta resolution, DBSCAN outbreak spatial clustering, and Care Coordination Agent task orchestration.

## 🚀 Setup & Running

```bash
# 1. Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run FastAPI server
python -m uvicorn app.main:app --reload --port 8000
```

API Documentation will be live at: `http://localhost:8000/docs`

## 🧠 Core Services

- **Offline Sync Receiver (`POST /api/sync`)**: Processes delta records idempotently with CRC checksum verification and append-only vitals.
- **Care Coordination Agent Engine**: Evaluates incoming patient vitals against deterministic emergency thresholds and schedules missing data follow-ups for workers.
- **DBSCAN Outbreak Clustering (`GET /api/outbreaks`)**: Evaluates spatial cluster density ($\ge 8$ cases within 15 km radius in 48–72h).

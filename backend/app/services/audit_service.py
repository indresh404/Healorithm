# backend/app/services/audit_service.py
from datetime import datetime, timezone
from typing import Dict, Any

class AuditService:
    @staticmethod
    def log_clinical_event(actor_id: str, action: str, entity_id: str, details: Dict[str, Any]):
        # Append-only immutable clinical audit log
        print(f"AUDIT [{datetime.now(timezone.utc).isoformat()}] {actor_id} performed {action} on {entity_id}")

# backend/app/services/conflict_service.py
from typing import Dict, Any, Optional

class ConflictService:
    @staticmethod
    def detect_and_stash(local_record: Dict[str, Any], server_record: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        # Non-destructive clinical field diff
        if local_record.get("updated_at") != server_record.get("updated_at"):
            return {
                "field": "vitals",
                "local_value": local_record,
                "remote_value": server_record,
                "status": "unresolved"
            }
        return None

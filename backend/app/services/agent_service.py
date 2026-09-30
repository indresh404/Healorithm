# backend/app/services/agent_service.py
from typing import Dict, Any, List

class AgentService:
    @staticmethod
    def evaluate_case_coordination(patient: Dict[str, Any], vitals: Dict[str, Any]) -> List[Dict[str, Any]]:
        tasks = []
        if vitals.get("systolic_bp", 0) >= 160:
            tasks.append({
                "type": "emergency_transport_alert",
                "priority": "High",
                "reason": "Severe systolic hypertension"
            })
        return tasks

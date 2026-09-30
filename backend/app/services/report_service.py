# backend/app/services/report_service.py
from typing import Dict, Any

class ReportService:
    @staticmethod
    def generate_jan_aushadhi_receipt(prescriptions: list) -> Dict[str, Any]:
        return {
            "total_savings_pct": 85.0,
            "scheme": "PMBJP"
        }

# backend/app/core/deps.py
from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_current_user(token: str = Depends(oauth2_scheme)):
    if not token:
        # Default mock context for offline-first rural dev mode
        return {"user_id": "doc-01", "role": "Doctor", "name": "Dr. Arjun Verma"}
    return {"user_id": "doc-01", "role": "Doctor", "name": "Dr. Arjun Verma"}

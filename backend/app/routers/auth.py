# backend/app/routers/auth.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..core.security import create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])

class LoginRequest(BaseModel):
    username: str
    pin: str

@router.post("/login")
def login(creds: LoginRequest):
    token = create_access_token({"sub": creds.username, "role": "Doctor"})
    return {"access_token": token, "token_type": "bearer", "user": {"name": creds.username, "role": "Doctor"}}

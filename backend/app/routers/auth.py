# backend/app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..db.models import UserModel, AuditLogModel
from ..core.security import verify_password, create_access_token, get_password_hash
from ..core.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

class LoginRequest(BaseModel):
    username: str
    pin: Optional[str] = None
    password: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    username: str
    name: str
    role: str
    village: Optional[str] = None
    phone: Optional[str] = None

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

@router.post("/login", response_model=LoginResponse)
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    pwd = creds.pin or creds.password or ""
    user = db.query(UserModel).filter(UserModel.username == creds.username).first()
    
    # If user doesn't exist yet, check known defaults or create
    if not user:
        if creds.username in ["doctor@phc.in", "doctor", "dr.verma"]:
            user = UserModel(
                id="usr-doc-01",
                username=creds.username,
                password_hash=get_password_hash(pwd or "1234"),
                name="Dr. Arjun Verma",
                role="Doctor",
                village="Adoni"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        elif creds.username in ["admin@healorithm.in", "admin"]:
            user = UserModel(
                id="usr-admin-01",
                username=creds.username,
                password_hash=get_password_hash(pwd or "admin123"),
                name="District Health Officer",
                role="Admin",
                village="District HQ"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        elif creds.username in ["w2", "worker", "worker@healorithm.in"]:
            user = UserModel(
                id="usr-worker-02",
                username=creds.username,
                password_hash=get_password_hash(pwd or "1234"),
                name="Lakshmi P.",
                role="Worker",
                village="Adoni"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        elif creds.username.startswith("u-"):
            user = UserModel(
                id=f"usr-{creds.username}",
                username=creds.username,
                password_hash=get_password_hash(pwd or "1234"),
                name="Ramesh Kumar",
                role="Patient",
                village="Adoni"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or passcode"
            )

    # Verify password if user exists
    if user and not verify_password(pwd, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or passcode"
        )

    token = create_access_token({
        "sub": user.username,
        "user_id": user.id,
        "role": user.role,
        "name": user.name,
        "village": user.village
    })

    # Record audit log
    audit = AuditLogModel(
        id=f"aud-login-{user.id}-{int(datetime_now_ts())}",
        actor_id=user.id,
        actor_name=user.name,
        role=user.role,
        action="login",
        target_type="auth",
        target_id=user.id,
        details={"username": user.username, "role": user.role},
        result="success"
    )
    db.add(audit)
    db.commit()

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            username=user.username,
            name=user.name,
            role=user.role,
            village=user.village,
            phone=user.phone
        )
    )

def datetime_now_ts():
    import time
    return time.time()

@router.get("/me", response_model=UserResponse)
def get_me(current_user: UserModel = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        name=current_user.name,
        role=current_user.role,
        village=current_user.village,
        phone=current_user.phone
    )

import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User
from app.models.profile import Profile
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    TokenResponse,
    MessageResponse,
)
from app.api.deps import get_current_user, security_scheme
from app.core.security import decode_access_token
from app.services.audit_service import audit_service
from app.services.notification_service import notification_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
def register(
    request: UserRegisterRequest,
    req: Request,
    db: Session = Depends(get_db),
):
    """
    Register a new user (Industry or Consumer persona).
    - Checks for email uniqueness.
    - Salts & hashes password with bcrypt.
    - Creates User and associated Profile records.
    - Returns JWT access token and user profile.
    """
    # Normalize email to lowercase
    email = request.email.lower().strip()

    # Verify email uniqueness
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    # Hash the password
    password_hash = get_password_hash(request.password)

    # Create new User
    user = User(
        name=request.name.strip(),
        email=email,
        password_hash=password_hash,
        role=request.role,
        is_active=True,
    )
    db.add(user)
    db.flush()  # Populates user.id

    # Create associated default Profile
    profile = Profile(
        user_id=user.id,
        organization=None,
        industry=None,
        designation=None,
        location=None,
        avatar_url=None,
    )
    db.add(profile)
    db.commit()
    db.refresh(user)

    # Log audit event and create welcome notification
    audit_service.log_event(
        db=db,
        user_id=user.id,
        action="REGISTER",
        entity_type="user",
        entity_id=user.id,
        description=f"User account registered ({user.email})",
        ip_address=req.client.host if req and req.client else None,
        user_agent=req.headers.get("user-agent") if req else None,
    )
    notification_service.create_notification(
        db=db,
        user_id=user.id,
        type="SYSTEM",
        title="Welcome to BharatStandards AI",
        message="Your account has been created. Start by creating a product or exploring BIS standards.",
        entity_type="user",
        entity_id=user.id,
    )

    # Generate JWT token
    access_token = create_access_token(
        subject=user.id,
        extra_claims={"email": user.email, "role": user.role},
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate user and obtain JWT token",
)
def login(
    request: UserLoginRequest,
    req: Request,
    db: Session = Depends(get_db),
):
    """
    Authenticate with email and password.
    Returns JWT access token and user information.
    """
    email = request.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active or (hasattr(user, "status") and user.status == "SUSPENDED"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated or suspended. Please contact support.",
        )


    # Log successful login
    audit_service.log_event(
        db=db,
        user_id=user.id,
        action="LOGIN",
        entity_type="user",
        entity_id=user.id,
        description=f"User logged in ({user.email})",
        ip_address=req.client.host if req and req.client else None,
        user_agent=req.headers.get("user-agent") if req else None,
    )

    # Configurable expiration based on 'remember_me'
    expires_delta = datetime.timedelta(days=30) if request.remember_me else datetime.timedelta(days=1)
    access_token = create_access_token(
        subject=user.id,
        expires_delta=expires_delta,
        extra_claims={"email": user.email, "role": user.role},
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout user session",
)
def logout(
    req: Request,
    auth=Depends(security_scheme),
    db: Session = Depends(get_db),
):
    """
    Logout client session.
    Since JWT is stateless, client destroys the stored token.
    """
    if auth and auth.credentials:
        payload = decode_access_token(auth.credentials)
        if payload and payload.get("sub"):
            try:
                user_id = int(payload["sub"])
                audit_service.log_event(
                    db=db,
                    user_id=user_id,
                    action="LOGOUT",
                    entity_type="user",
                    entity_id=user_id,
                    description="User logged out",
                    ip_address=req.client.host if req.client else None,
                    user_agent=req.headers.get("user-agent"),
                )
            except Exception:
                pass

    return MessageResponse(message="Logged out successfully.")


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user profile",
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    """
    Protected endpoint to fetch current authenticated user profile and role details.
    """
    return UserResponse.model_validate(current_user)

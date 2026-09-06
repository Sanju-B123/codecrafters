from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password
from app.core.logging import logger
from app.models.user import User
from app.models.profile import Profile
from app.api.deps import get_current_user
from app.schemas.user import (
    UserDetailResponse,
    ProfileUpdateRequest,
    PasswordChangeRequest,
    UserPreferencesUpdateRequest,
    AccountDeleteRequest,
)
from app.schemas.auth import MessageResponse
from app.services.audit_service import audit_service
from app.services.notification_service import notification_service

router = APIRouter(prefix="/users", tags=["Users & Profile"])


@router.get(
    "/me",
    response_model=UserDetailResponse,
    summary="Get current user profile and settings",
)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve current authenticated user's account details and full profile.
    Strictly restricted to the caller's JWT token identity.
    """
    # Ensure profile exists
    if current_user.profile is None:
        profile = Profile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(current_user)

    return UserDetailResponse.model_validate(current_user)


@router.put(
    "/me",
    response_model=UserDetailResponse,
    summary="Update current user personal and organization profile",
)
def update_current_user_profile(
    request: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update profile details for the authenticated user.
    """
    # Update name on User model if provided
    if request.name is not None and request.name.strip():
        current_user.name = request.name.strip()

    # Get or create profile
    profile = current_user.profile
    if profile is None:
        profile = Profile(user_id=current_user.id)
        db.add(profile)

    # Update profile fields
    if request.phone is not None:
        profile.phone = request.phone.strip() if request.phone else None
    if request.organization is not None:
        profile.organization = request.organization.strip() if request.organization else None
    if request.industry is not None:
        profile.industry = request.industry.strip() if request.industry else None
    if request.designation is not None:
        profile.designation = request.designation.strip() if request.designation else None
    if request.location is not None:
        profile.location = request.location.strip() if request.location else None
    if request.avatar_url is not None:
        profile.avatar_url = request.avatar_url.strip() if request.avatar_url else None
    if request.interests is not None:
        profile.interests = request.interests.strip() if request.interests else None

    db.commit()
    db.refresh(current_user)
    logger.info(f"User #{current_user.id} ({current_user.email}) profile updated.")
    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="PROFILE_UPDATED",
        entity_type="profile",
        entity_id=profile.id,
        description="User profile details updated",
        metadata={
            "organization": profile.organization,
            "industry": profile.industry,
            "designation": profile.designation,
        },
    )

    return UserDetailResponse.model_validate(current_user)


@router.put(
    "/me/password",
    response_model=MessageResponse,
    summary="Change user password",
)
def change_password(
    request: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Change password for the authenticated user.
    Verifies current password with bcrypt before setting new password hash.
    """
    # Verify current password
    if not verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password.",
        )

    # Hash and save new password
    current_user.password_hash = get_password_hash(request.new_password)
    db.commit()
    logger.info(f"User #{current_user.id} ({current_user.email}) password changed successfully.")

    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="PASSWORD_CHANGED",
        entity_type="user",
        entity_id=current_user.id,
        description="Account password changed successfully",
    )
    notification_service.create_notification(
        db=db,
        user_id=current_user.id,
        type="ACCOUNT_SECURITY",
        title="Security Alert: Password Changed",
        message="Your account password was recently changed. If you did not make this change, please contact support immediately.",
        entity_type="user",
        entity_id=current_user.id,
    )

    return MessageResponse(message="Password changed successfully.")


@router.put(
    "/me/preferences",
    response_model=MessageResponse,
    summary="Update notification and display preferences",
)
def update_preferences(
    request: UserPreferencesUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update notification toggles, theme, and language preferences.
    """
    profile = current_user.profile
    if profile is None:
        profile = Profile(user_id=current_user.id)
        db.add(profile)

    current_prefs = profile.preferences or {
        "email_notifications": True,
        "in_app_notifications": True,
        "compliance_notifications": True,
        "document_notifications": True,
        "product_notifications": True,
        "report_notifications": True,
        "theme": "system",
        "language": "en",
    }

    req_dict = request.model_dump(exclude_unset=True)
    for k, v in req_dict.items():
        if v is not None:
            current_prefs[k] = v

    profile.preferences = current_prefs
    db.commit()
    logger.info(f"User #{current_user.id} preferences updated: {current_prefs}")

    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="SETTINGS_UPDATED",
        entity_type="settings",
        entity_id=profile.id,
        description="User notification and platform preferences updated",
        metadata=current_prefs,
    )

    return MessageResponse(message="Settings saved.")


@router.delete(
    "/me",
    response_model=MessageResponse,
    summary="Delete user account and profile",
)
def delete_user_account(
    request: AccountDeleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Permanently delete the authenticated user's account and all associated profile data.
    """
    user_id = current_user.id
    email = current_user.email

    db.delete(current_user)
    db.commit()

    logger.warning(f"User #{user_id} ({email}) deleted account permanently.")
    return MessageResponse(message="Account deleted successfully.")

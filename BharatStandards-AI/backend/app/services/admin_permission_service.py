"""
BharatStandards AI - Admin Permission Service
Enforces strict administrative role verification and final-admin safety guards.
"""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User, UserRole, UserStatus


class AdminPermissionService:
    @staticmethod
    def is_admin(user: User) -> bool:
        """
        Check if the user has the ADMIN role.
        """
        if not user:
            return False
        return str(user.role).upper() == UserRole.ADMIN.value

    @staticmethod
    def require_admin(user: User) -> None:
        """
        Raise HTTP 403 Forbidden if user is not an administrator.
        """
        if not AdminPermissionService.is_admin(user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Administrative privileges required. Access denied.",
            )

    @staticmethod
    def can_demote_or_suspend(
        db: Session,
        target_user_id: int,
        new_role: str = None,
        new_status: str = None,
    ) -> tuple[bool, str]:
        """
        Safety check to ensure the platform always maintains at least one active administrator.
        Prevents accidental system lockouts.
        """
        target_user = db.query(User).filter(User.id == target_user_id).first()
        if not target_user:
            return False, "Target user not found."

        is_current_admin = str(target_user.role).upper() == UserRole.ADMIN.value
        is_current_active = (
            getattr(target_user, "status", UserStatus.ACTIVE.value) == UserStatus.ACTIVE.value
            and target_user.is_active
        )

        if not (is_current_admin and is_current_active):
            # Target is not currently an active admin, so changing them poses no final-admin lockout risk
            return True, ""

        will_remain_admin = (new_role is None) or (str(new_role).upper() == UserRole.ADMIN.value)
        will_remain_active = (new_status is None) or (
            str(new_status).upper() == UserStatus.ACTIVE.value
        )

        if not will_remain_admin or not will_remain_active:
            # Count other active admins
            other_active_admins = (
                db.query(User)
                .filter(
                    User.id != target_user_id,
                    User.role == UserRole.ADMIN.value,
                    User.status == UserStatus.ACTIVE.value,
                    User.is_active == True,
                )
                .count()
            )
            if other_active_admins == 0:
                return False, "Cannot modify or suspend the platform's last active administrator."

        return True, ""


admin_permission_service = AdminPermissionService()

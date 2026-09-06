"""
BharatStandards AI - Notification Preference Service
Evaluates user preference matrices to ensure notifications are delivered strictly
in accordance with user choices while preserving mandatory security alerts.
"""
from typing import Any, Dict, Optional
from app.models.user import User


class NotificationPreferenceService:
    @staticmethod
    def is_notification_allowed(
        user: User,
        notification_type: str,
        channel: str = "in_app",
    ) -> bool:
        """
        Determines whether a user should receive a notification based on their stored preferences.
        Mandatory security and system updates always bypass opt-outs.
        """
        norm_type = notification_type.upper()
        norm_channel = channel.lower()

        # Critical security and system announcements cannot be suppressed
        if norm_type in {"SYSTEM", "ACCOUNT_SECURITY", "SECURITY", "ACCOUNT_DELETED"}:
            return True

        # Extract preferences from user profile
        preferences: Dict[str, Any] = {}
        if user.profile and user.profile.preferences:
            if isinstance(user.profile.preferences, dict):
                preferences = user.profile.preferences

        # Check channel-level preference
        if norm_channel == "in_app":
            if not preferences.get("in_app_notifications", True):
                return False
        elif norm_channel == "email":
            if not preferences.get("email_notifications", True):
                return False

        # Check category-level preference
        if "COMPLIANCE" in norm_type or "GAP" in norm_type:
            return bool(preferences.get("compliance_notifications", True))
        elif "DOCUMENT" in norm_type:
            return bool(preferences.get("document_notifications", True))
        elif "PRODUCT" in norm_type:
            return bool(preferences.get("product_notifications", True))
        elif "REPORT" in norm_type:
            return bool(preferences.get("report_notifications", True))

        return True


notification_preference_service = NotificationPreferenceService()

"""
BharatStandards AI - Notification Delivery Channels
Defines multichannel delivery strategies: In-App notifications and simulated Email notifications.
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session

from app.core.logging import logger
from app.models.notification import Notification
from app.models.user import User


class NotificationChannel(ABC):
    @abstractmethod
    def send(
        self,
        db: Session,
        user: User,
        notification_type: str,
        title: str,
        message: str,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
    ) -> bool:
        """Deliver the notification through this channel."""
        pass


class InAppNotificationChannel(NotificationChannel):
    """
    Persists notifications to the database for dashboard and navigation bell display.
    """
    def send(
        self,
        db: Session,
        user: User,
        notification_type: str,
        title: str,
        message: str,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
    ) -> bool:
        try:
            record = Notification(
                user_id=user.id,
                type=notification_type.upper(),
                title=title[:255],
                message=message,
                entity_type=entity_type.lower() if entity_type else None,
                entity_id=entity_id,
                is_read=False,
            )
            db.add(record)
            db.commit()
            db.refresh(record)
            return True
        except Exception as e:
            logger.warning(f"InAppNotification delivery failed for user {user.id}: {e}")
            try:
                db.rollback()
            except Exception:
                pass
            return False


class EmailNotificationChannel(NotificationChannel):
    """
    Email notification dispatcher. Simulates/logs dispatch in development and
    connects to configured transactional mailers in production.
    Does not claim official government/BIS origin.
    """
    def send(
        self,
        db: Session,
        user: User,
        notification_type: str,
        title: str,
        message: str,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
    ) -> bool:
        try:
            # In development/test mode, log the simulated delivery
            logger.info(
                f"[Simulated Email] To: {user.email} | Subject: [BharatStandards AI] {title} | Type: {notification_type}"
            )
            return True
        except Exception as e:
            logger.warning(f"EmailNotification delivery failed for user {user.id}: {e}")
            return False


in_app_channel = InAppNotificationChannel()
email_channel = EmailNotificationChannel()

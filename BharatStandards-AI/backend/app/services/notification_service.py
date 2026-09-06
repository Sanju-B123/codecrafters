"""
BharatStandards AI - Notification Service
Manages creation, multichannel delivery, unread count tracking, and lifecycle management
for system alerts and compliance notifications.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.logging import logger
from app.models.notification import Notification
from app.models.user import User
from app.services.notification_channels import email_channel, in_app_channel
from app.services.notification_preference_service import notification_preference_service


class NotificationService:
    @staticmethod
    def create_notification(
        db: Session,
        user_id: int,
        type: str,
        title: str,
        message: str,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
        channels: Optional[List[str]] = None,
    ) -> Optional[Notification]:
        """
        Creates and dispatches a notification across specified channels, respecting user preferences.
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.warning(f"Cannot deliver notification: User {user_id} not found.")
            return None

        delivery_channels = channels or ["in_app"]
        created_record: Optional[Notification] = None

        try:
            for channel in delivery_channels:
                if not notification_preference_service.is_notification_allowed(user, type, channel):
                    continue

                if channel == "in_app":
                    in_app_channel.send(
                        db=db,
                        user=user,
                        notification_type=type,
                        title=title,
                        message=message,
                        entity_type=entity_type,
                        entity_id=entity_id,
                    )
                    # Query latest created notification
                    created_record = (
                        db.query(Notification)
                        .filter(Notification.user_id == user_id)
                        .order_by(desc(Notification.id))
                        .first()
                    )
                elif channel == "email":
                    email_channel.send(
                        db=db,
                        user=user,
                        notification_type=type,
                        title=title,
                        message=message,
                        entity_type=entity_type,
                        entity_id=entity_id,
                    )

            return created_record
        except Exception as e:
            logger.warning(f"Failed to create notification for user {user_id}: {e}")
            try:
                db.rollback()
            except Exception:
                pass
            return None

    @staticmethod
    def get_notifications(
        db: Session,
        user_id: int,
        is_read: Optional[bool] = None,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[Notification], int, int]:
        """
        Retrieves paginated notifications for the authenticated user and unread count.
        """
        base_query = db.query(Notification).filter(Notification.user_id == user_id)
        unread_count = (
            db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.is_read.is_(False))
            .count()
        )

        query = base_query
        if is_read is not None:
            query = query.filter(Notification.is_read == is_read)

        total = query.count()
        offset = max(0, (page - 1) * limit)
        items = (
            query.order_by(desc(Notification.created_at))
            .offset(offset)
            .limit(limit)
            .all()
        )

        return items, total, unread_count

    @staticmethod
    def get_unread_count(db: Session, user_id: int) -> int:
        """
        Fast lookup for unread notifications count to update navigation badges.
        """
        return (
            db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.is_read.is_(False))
            .count()
        )

    @staticmethod
    def mark_as_read(
        db: Session,
        user_id: int,
        notification_id: int,
    ) -> Optional[Notification]:
        """
        Marks a specific notification as read, ensuring tenant ownership isolation.
        """
        notification = (
            db.query(Notification)
            .filter(Notification.id == notification_id, Notification.user_id == user_id)
            .first()
        )
        if not notification:
            return None

        if not notification.is_read:
            notification.is_read = True
            notification.read_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(notification)

        return notification

    @staticmethod
    def mark_all_as_read(db: Session, user_id: int) -> int:
        """
        Marks all unread notifications belonging to the user as read.
        """
        now = datetime.now(timezone.utc)
        count = (
            db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.is_read.is_(False))
            .update({"is_read": True, "read_at": now}, synchronize_session="fetch")
        )
        db.commit()
        return count

    @staticmethod
    def delete_notification(
        db: Session,
        user_id: int,
        notification_id: int,
    ) -> bool:
        """
        Dismisses/deletes a single notification belonging to the user.
        """
        notification = (
            db.query(Notification)
            .filter(Notification.id == notification_id, Notification.user_id == user_id)
            .first()
        )
        if not notification:
            return False

        db.delete(notification)
        db.commit()
        return True


notification_service = NotificationService()

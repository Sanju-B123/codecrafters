from sqlalchemy import Column, ForeignKey, Integer, String, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Profile(Base):
    """
    Profile model extending user metadata for industry or consumer details.
    """
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    phone = Column(String(50), nullable=True)
    organization = Column(String(255), nullable=True)
    industry = Column(String(255), nullable=True)
    designation = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    interests = Column(String(500), nullable=True)  # For consumer interest categories
    preferences = Column(JSON, nullable=True)        # Notification and display preferences

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # 1-to-1 relationship with User
    user = relationship("User", back_populates="profile")

    def __repr__(self):
        return f"<Profile id={self.id} user_id={self.user_id} organization={self.organization}>"

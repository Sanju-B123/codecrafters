import enum
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class ProductStatus(str, enum.Enum):
    """
    Standard lifecycle status enumeration for registered products.
    """
    DRAFT = "DRAFT"
    ANALYZING = "ANALYZING"
    READY = "READY"
    ARCHIVED = "ARCHIVED"


class Product(Base):
    """
    Product model representing an industrial or consumer product registered
    for Indian Standards discovery and BIS compliance auditing.
    Belongs strictly to one authenticated User.
    """
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    intended_use = Column(Text, nullable=True)
    manufacturer = Column(String(255), nullable=True)
    model_number = Column(String(100), nullable=True)
    technical_details = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default=ProductStatus.DRAFT.value)
    analysis_data = Column(Text, nullable=True)  # Stores JSON serialization of mock/retrieved standards
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

    # Relationship back to User
    user = relationship("User", back_populates="products")

    # 1-to-many relationship with Document
    documents = relationship(
        "Document",
        back_populates="product",
        cascade="all, delete-orphan",
    )

    # 1-to-many relationship with ComplianceReport
    compliance_reports = relationship(
        "ComplianceReport",
        back_populates="product",
        cascade="all, delete-orphan",
    )

    # 1-to-many relationship with Conversation
    conversations = relationship(
        "Conversation",
        back_populates="product",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<Product id={self.id} name='{self.name}' status='{self.status}' user_id={self.user_id}>"


from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    Index
)
from sqlalchemy.orm import relationship

from app.database import Base


def current_utc_time():
    return datetime.now(timezone.utc)


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)

    filename = Column(String(255), nullable=False)

    file_path = Column(String(500), nullable=False)

    extracted_text = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=current_utc_time,
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=current_utc_time,
        onupdate=current_utc_time,
        nullable=False
    )

    # One document can have multiple study activities.
    activities = relationship(
        "StudyActivity",
        back_populates="document",
        cascade="all, delete-orphan"
    )


class StudyActivity(Base):
    __tablename__ = "study_activities"

    id = Column(Integer, primary_key=True, index=True)

    document_id = Column(
        Integer,
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False
    )

    activity_type = Column(
        String(100),
        nullable=False
    )

    result = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        default=current_utc_time,
        nullable=False
    )

    document = relationship(
        "Document",
        back_populates="activities"
    )


Index(
    "ix_study_activities_document_id",
    StudyActivity.document_id
)

Index(
    "ix_study_activities_activity_type",
    StudyActivity.activity_type
)

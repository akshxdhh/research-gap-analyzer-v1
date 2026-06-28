from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, JSON, String, Text, func
from sqlalchemy.orm import relationship

from database import Base

class PaperMetadataModel(Base):
    __tablename__ = "paper_metadata"

    paper_id = Column(String, primary_key=True)
    authors = Column(JSON, default=list)
    keywords = Column(JSON, default=list)
    methodologies = Column(JSON, default=list)
    datasets = Column(JSON, default=list)
    metrics = Column(JSON, default=list)
    limitations = Column(JSON, default=list)
    future_work = Column(JSON, default=list)
    publication_year = Column(Integer)
    conference = Column(String)

    __table_args__ = (
        Index("ix_paper_metadata_publication_year", "publication_year"),
        Index("ix_paper_metadata_conference", "conference"),
    )


class ProjectModel(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True)
    name = Column(String(255), nullable=False, unique=True)
    status = Column(String(64), nullable=False, default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    papers = relationship("PaperModel", back_populates="project")


class PaperModel(Base):
    __tablename__ = "papers"

    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False, index=True)
    title = Column(String(512), nullable=False)
    authors = Column(JSON, default=list)
    year = Column(Integer)
    filename = Column(String(512), nullable=False)
    cloud_url = Column(Text, nullable=True)  # Store Supabase URL here
    chunk_count = Column(Integer, nullable=False, default=0)
    upload_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    project = relationship("ProjectModel", back_populates="papers")

    __table_args__ = (
        Index("ix_papers_upload_date", "upload_date"),
    )


class ResearchGapModel(Base):
    __tablename__ = "research_gaps"

    id = Column(String, primary_key=True)
    query = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    confidence = Column(Float, nullable=False)
    evidence_citations = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("ix_research_gaps_created_at", "created_at"),
    )

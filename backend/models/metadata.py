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


class SettingsModel(Base):
    __tablename__ = "settings"

    id = Column(String, primary_key=True, default="default")
    
    # User
    user_name = Column(String, nullable=True)
    user_email = Column(String, nullable=True)
    user_avatar = Column(String, nullable=True)
    user_organization = Column(String, nullable=True)
    user_research_interests = Column(JSON, default=list)

    # Application
    app_theme = Column(String, default="system") # dark, light, system
    app_default_report_format = Column(String, default="pdf")
    app_default_citation_style = Column(String, default="apa")
    app_default_llm = Column(String, default="llama3-70b-8192")
    app_retrieval_depth = Column(Integer, default=5)
    app_search_provider_priority = Column(JSON, default=["semantic_scholar", "arxiv", "openalex"])

    # AI
    ai_preferred_model = Column(String, default="llama3-70b-8192")
    ai_temperature = Column(Float, default=0.2)
    ai_max_tokens = Column(Integer, default=4000)
    ai_context_size = Column(Integer, default=8192)

    # Notifications (booleans)
    notif_upload_completed = Column(Integer, default=1)
    notif_analysis_completed = Column(Integer, default=1)
    notif_report_generated = Column(Integer, default=1)

    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


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
    processing_status = Column(String(64), nullable=False, default="queued") # queued, extracting, embedding, ready, error
    processing_progress = Column(Float, nullable=False, default=0.0)
    error_message = Column(Text, nullable=True)
    upload_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    project = relationship("ProjectModel", back_populates="papers")

    __table_args__ = (
        Index("ix_papers_upload_date", "upload_date"),
    )


class ResearchGapModel(Base):
    __tablename__ = "research_gaps"

    id = Column(String, primary_key=True)
    query = Column(Text, nullable=False)
    
    # New requested fields
    title = Column(String(512), nullable=True)
    category = Column(String(255), nullable=True)
    novelty_score = Column(Float, nullable=True)
    supporting_papers = Column(JSON, default=list)
    future_research_direction = Column(Text, nullable=True)
    suggested_methodology = Column(Text, nullable=True)
    potential_dataset = Column(Text, nullable=True)
    related_papers = Column(JSON, default=list)

    # Existing fields
    description = Column(Text, nullable=False)
    confidence = Column(Float, nullable=False)
    evidence_citations = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("ix_research_gaps_created_at", "created_at"),
    )

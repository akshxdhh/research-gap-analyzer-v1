from sqlalchemy import Column, String, Integer, JSON
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class PaperMetadataModel(Base):
    __tablename__ = 'paper_metadata'
    
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

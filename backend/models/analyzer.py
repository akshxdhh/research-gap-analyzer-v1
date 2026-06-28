from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ExtractedInformation(BaseModel):
    methodologies: List[str] = Field(default_factory=list, description="Extracted methodologies")
    datasets: List[str] = Field(default_factory=list, description="Extracted datasets")
    metrics: List[str] = Field(default_factory=list, description="Extracted evaluation metrics")
    results: List[str] = Field(default_factory=list, description="Extracted primary results/findings")
    limitations: List[str] = Field(default_factory=list, description="Explicit limitations mentioned in papers")
    future_work: List[str] = Field(default_factory=list, description="Future work suggested by the authors")

class PaperComparison(BaseModel):
    paper_a_citation: str = Field(description="Citation or identifier for the first paper")
    paper_b_citation: str = Field(description="Citation or identifier for the second paper")
    similarities: List[str] = Field(default_factory=list)
    differences: List[str] = Field(default_factory=list)
    contradictions: List[str] = Field(default_factory=list, description="Detected contradictions between findings")

class ResearchGap(BaseModel):
    title: str = Field(description="A concise, catchy title for the research gap")
    category: str = Field(description="Category of the gap (e.g., 'Methodological', 'Empirical', 'Theoretical')")
    description: str = Field(description="Detailed description of the inferred research gap")
    confidence: float = Field(description="Confidence in this gap existing (0.0 to 1.0)")
    novelty_score: float = Field(description="Score indicating how novel this gap is (0.0 to 1.0)")
    evidence_citations: List[str] = Field(description="Citations supporting this gap")
    supporting_papers: List[str] = Field(default_factory=list, description="Titles or IDs of papers directly supporting this gap")
    future_research_direction: str = Field(description="Suggested direction for future research to address this gap")
    suggested_methodology: str = Field(description="Suggested methodology to solve or approach this gap")
    potential_dataset: str = Field(description="Potential datasets or data sources that could be used")
    related_papers: List[str] = Field(default_factory=list, description="Other related papers to read")

class AnalysisOutput(BaseModel):
    extracted_info: ExtractedInformation
    comparisons: List[PaperComparison]
    recurring_limitations: List[str] = Field(description="Limitations that appear repeatedly across multiple sources")
    inferred_gaps: List[ResearchGap] = Field(description="Novel research gaps inferred by the AI")

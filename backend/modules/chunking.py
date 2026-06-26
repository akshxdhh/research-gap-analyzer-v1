import uuid
from typing import List
from langchain_text_splitters import RecursiveCharacterTextSplitter, MarkdownHeaderTextSplitter

from models.chunk import Chunk, ChunkMetadata

class Chunker:
    """
    Chunker implements both Semantic (Markdown-based) and Recursive chunking strategies.
    It splits text into chunks with overlap, while preserving metadata like page numbers and sections.
    """
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        
        # Semantic chunking via Markdown headers
        headers_to_split_on = [
            ("#", "Header 1"),
            ("##", "Header 2"),
            ("###", "Header 3"),
        ]
        self.semantic_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)
        
        # Recursive fallback
        self.recursive_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            separators=["\n\n", "\n", " ", ""]
        )

    def chunk_text(self, text: str, base_metadata: ChunkMetadata) -> List[Chunk]:
        """
        Chunks the provided text.
        Returns a list of Chunk objects with populated metadata and unique IDs.
        """
        chunks = []
        
        # 1. Semantic split (by sections if markdown headers are present)
        semantic_docs = self.semantic_splitter.split_text(text)
        
        # 2. Recursive split on the semantic sections to respect max chunk size
        for doc in semantic_docs:
            # Determine current section based on headers, fallback to base_metadata.section
            section = base_metadata.section
            if "Header 3" in doc.metadata:
                section = doc.metadata["Header 3"]
            elif "Header 2" in doc.metadata:
                section = doc.metadata["Header 2"]
            elif "Header 1" in doc.metadata:
                section = doc.metadata["Header 1"]
                
            split_texts = self.recursive_splitter.split_text(doc.page_content)
            
            for split_text in split_texts:
                metadata = ChunkMetadata(
                    paper_id=base_metadata.paper_id,
                    page_number=base_metadata.page_number,
                    section=section,
                    extra_metadata=base_metadata.extra_metadata.copy()
                )
                chunk = Chunk(
                    id=str(uuid.uuid4()),
                    text=split_text,
                    metadata=metadata
                )
                chunks.append(chunk)
                
        return chunks

class PDFProcessor:
    def __init__(self):
        self.chunker = Chunker()
        
    def process_pdf(self, file_path: str) -> List[Chunk]:
        # Dummy implementation for tests/stub
        return []

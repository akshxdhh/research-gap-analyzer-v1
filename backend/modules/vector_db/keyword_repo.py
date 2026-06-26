import os
import json
from typing import List, Dict, Any, Optional
from whoosh import index
from whoosh.fields import Schema, TEXT, ID, STORED
from whoosh.qparser import QueryParser
from whoosh.scoring import BM25F
from modules.vector_db.base import SearchResult

class BM25KeywordRepository:
    def __init__(self, index_dir: str = "./whoosh_index"):
        self.index_dir = index_dir
        
        # Define Schema for indexing chunks and metadata
        self.schema = Schema(
            id=ID(stored=True, unique=True),
            text=TEXT(stored=True),
            project_id=ID(stored=True),
            metadata_json=STORED()
        )
        
        if not os.path.exists(index_dir):
            os.makedirs(index_dir)
            self.ix = index.create_in(index_dir, self.schema)
        else:
            try:
                self.ix = index.open_dir(index_dir)
            except index.EmptyIndexError:
                self.ix = index.create_in(index_dir, self.schema)

    def insert(self, ids: List[str], texts: List[str], metadata: List[Dict[str, Any]]) -> bool:
        writer = self.ix.writer()
        for i in range(len(ids)):
            proj_id = metadata[i].get("project_id", "") if metadata[i] else ""
            writer.update_document(
                id=ids[i],
                text=texts[i],
                project_id=proj_id,
                metadata_json=json.dumps(metadata[i]) if metadata[i] else "{}"
            )
        writer.commit()
        return True

    def delete(self, ids: List[str]) -> bool:
        writer = self.ix.writer()
        for doc_id in ids:
            writer.delete_by_term('id', doc_id)
        writer.commit()
        return True

    def search(self, query_str: str, top_k: int = 5, filter_dict: Optional[Dict[str, Any]] = None) -> List[SearchResult]:
        from whoosh.query import Term
        
        # Use BM25F scoring algorithm (default in Whoosh, explicitly declared for clarity)
        search_results = []
        with self.ix.searcher(weighting=BM25F) as searcher:
            # QueryParser handles Boolean logic (AND/OR), Phrases ("..."), and Weights (term^2) natively
            parser = QueryParser("text", self.ix.schema)
            query = parser.parse(query_str)
            
            filter_query = None
            if filter_dict and "project_id" in filter_dict:
                # Allow exact match filtering by project_id
                filter_query = Term("project_id", filter_dict["project_id"])

            results = searcher.search(query, limit=top_k, filter=filter_query)
            
            for hit in results:
                meta = json.loads(hit["metadata_json"])
                search_results.append(SearchResult(
                    id=hit["id"],
                    text=hit["text"],
                    score=hit.score,
                    metadata=meta
                ))
        return search_results

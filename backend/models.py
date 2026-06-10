
from pydantic import BaseModel
from typing import List

class SearchResult(BaseModel):
    title: str
    excerpt: str
    excerpt_subtitle: str
    location: str
    type: str
    distance: float

class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    total: int
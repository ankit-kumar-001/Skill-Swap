from pydantic import BaseModel
from typing import List, Optional

class UserEmbeddingRequest(BaseModel):
    bio: str
    teach_skills: List[str]
    learn_skills: List[str]

class UserMatchResponse(BaseModel):
    user_id: str
    name: str
    similarity: float
    # teach_learn_overlap: int
    # learn_teach_overlap: int
    avg_rating: Optional[float] = None

class MatchesResponse(BaseModel):
    matches: List[UserMatchResponse]

class UserEmbeddingResponse(BaseModel):
    message: str

class Match(BaseModel):
    user_id: str
    score: float

class FeedbackPayload(BaseModel):
    match_id: str
    user_id: str
    rating: int
from fastapi import APIRouter, HTTPException
from app.services.matcher import generate_and_store_embeddings, find_top_matches
from app.models.schemas import UserEmbeddingResponse, MatchesResponse, FeedbackPayload
from fastapi import Body
from pydantic import BaseModel
from app.services.matcher import get_db_conn
router = APIRouter()

@router.post("/embed/{user_id}", response_model=UserEmbeddingResponse)
async def embed_user(user_id: str):
    try:
        generate_and_store_embeddings(user_id)
        return {"message": "User embeddings generated and stored successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/matches/{user_id}", response_model=MatchesResponse)
async def get_matches(user_id: str, top_k: int = 5):
    try:
        matches = find_top_matches(user_id, top_k)
        return matches
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def submit_match_feedback(match_id: str, user_id: str, rating: int) -> None:
    conn = get_db_conn()
    with conn.cursor() as cur:
        cur.execute("SELECT user1_id, user2_id FROM matches WHERE id = %s", (match_id,))
        match = cur.fetchone()
        if not match:
            conn.close()
            raise ValueError("Match not found")

        user1_id, user2_id = match
        if str(user_id) == str(user1_id):
            col = "feedback_user1"
        elif str(user_id) == str(user2_id):
            col = "feedback_user2"
        else:
            conn.close()
            raise ValueError("User is not part of the match")

        cur.execute(f"UPDATE matches SET {col} = %s WHERE id = %s", (rating, match_id))
        conn.commit()
    conn.close()

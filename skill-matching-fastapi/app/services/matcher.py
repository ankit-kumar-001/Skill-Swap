from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer
import psycopg2
from pgvector.psycopg2 import register_vector
from datetime import datetime
import os


def get_db_conn():
    return psycopg2.connect(
        dbname=os.getenv("POSTGRES_DB", "postgres"),
        user=os.getenv("POSTGRES_USER", "postgres.cfuaidmnkiuvzzbjexyq"),
        password=os.getenv("POSTGRES_PASSWORD", "Ilovelolijoshi"),
        host=os.getenv("POSTGRES_HOST", "aws-0-ap-south-1.pooler.supabase.com"),
        port=os.getenv("POSTGRES_PORT", "6543")
    )


model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

def format_user_string(bio, teach_skills, learn_skills):
    teach_str = ', '.join(teach_skills or [])
    learn_str = ', '.join(learn_skills or [])
    return f"{bio or ''}. I can teach: {teach_str}. I want to learn: {learn_str}"

def fetch_user(user_id: str, conn) -> Any:
    with conn.cursor() as cur:
        cur.execute("""
            SELECT u.id, u.bio,
                array_agg(CASE WHEN us.type = 'teach' THEN s.name END) FILTER (WHERE us.type = 'teach') AS teach_skills,
                array_agg(CASE WHEN us.type = 'learn' THEN s.name END) FILTER (WHERE us.type = 'learn') AS learn_skills
            FROM users u
            LEFT JOIN user_skills us ON u.id = us.user_id
            LEFT JOIN skills s ON us.skill_id = s.id
            WHERE u.id = %s
            GROUP BY u.id, u.bio
        """, (user_id,))
        return cur.fetchone()

def generate_and_store_embeddings(user_id: str):
    """
    Generate Sentence-BERT embedding for the user and store in PostgreSQL (pgvector).
    """
    conn = get_db_conn()
    register_vector(conn)
    user = fetch_user(user_id, conn)
    if not user:
        conn.close()
        raise ValueError(f"User {user_id} not found.")
    user_id, bio, teach_skills, learn_skills = user
    user_input = format_user_string(bio, teach_skills, learn_skills)
    vector = model.encode(user_input, normalize_embeddings=True).tolist()
    with conn.cursor() as cur:
        cur.execute("SELECT embedding FROM user_embeddings WHERE user_id = %s", (user_id,))
        existing = cur.fetchone()
        if existing is None:
            cur.execute("""
                INSERT INTO user_embeddings (user_id, embedding, generated_at)
                VALUES (%s, %s, %s)
            """, (user_id, vector, datetime.utcnow()))
        else:
            cur.execute("""
                UPDATE user_embeddings
                SET embedding = %s, generated_at = %s
                WHERE user_id = %s
            """, (vector, datetime.utcnow(), user_id))
        conn.commit()
    conn.close()

def find_top_matches(user_id: str, top_k: int = 5) -> Dict[str, Any]:
    """
    Find top-k users based on embedding similarity and past feedback given by the current user.
    If no feedback exists, do not penalize the user in the score.
    """
    conn = get_db_conn()
    register_vector(conn)
    with conn.cursor() as cur:
        cur.execute("""
            WITH potential_matches AS (
                SELECT 
                    u.id AS potential_match_id,
                    u.name,
                    user_embeddings.embedding <#> target.embedding AS distance,
                    1 - (user_embeddings.embedding <#> target.embedding) AS similarity
                FROM user_embeddings
                JOIN users u ON u.id = user_embeddings.user_id,
                     (SELECT embedding FROM user_embeddings WHERE user_id = %s) AS target
                WHERE u.id != %s
            ),
            feedbacks AS (
                SELECT 
                    m.id AS match_id,
                    CASE 
                        WHEN m.user1_id = %s THEN m.user2_id
                        WHEN m.user2_id = %s THEN m.user1_id
                    END AS other_user_id,
                    CASE 
                        WHEN m.user1_id = %s THEN m.feedback_user1
                        WHEN m.user2_id = %s THEN m.feedback_user2
                    END AS user_feedback
                FROM matches m
                WHERE (m.user1_id = %s OR m.user2_id = %s)
            )
            SELECT 
                pm.potential_match_id,
                pm.name,
                pm.similarity,
                f.user_feedback,
                ROUND(
                    CASE 
                        WHEN f.user_feedback IS NULL THEN pm.similarity
                        ELSE (0.7 * pm.similarity + 0.3 * ((f.user_feedback - 1) / 4.0))
                    END::numeric,
                4) AS final_score
            FROM potential_matches pm
            LEFT JOIN feedbacks f ON f.other_user_id = pm.potential_match_id
            ORDER BY final_score DESC
            LIMIT %s;
        """, (user_id, user_id, user_id, user_id, user_id, user_id, user_id, user_id, top_k))

        rows = cur.fetchall()
        matches = [
            {
                "user_id": r[0],
                "name": r[1],
                "similarity": round(r[2], 4),
                "previous_feedback": r[3],
                "score": r[4],
            }
            for r in rows
        ]
    conn.close()
    return {"matches": matches}


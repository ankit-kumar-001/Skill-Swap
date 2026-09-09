# Skill Matching FastAPI

This project is a FastAPI microservice for a skill-matching application. It provides endpoints for generating user embeddings and finding similar users based on their skills.

## Project Structure

```
skill-matching-fastapi
├── app
│   ├── main.py                # Entry point of the FastAPI application
│   ├── api
│   │   └── endpoints.py       # API route definitions
│   ├── models
│   │   └── schemas.py         # Data models and schemas for validation
│   ├── services
│   │   └── matcher.py         # Logic for finding similar users
│   └── utils
│       └── __init__.py        # Utility functions (currently empty)
├── requirements.txt            # Project dependencies
├── README.md                   # Project documentation
└── .gitignore                  # Files and directories to ignore in version control
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd skill-matching-fastapi
   ```

2. **Create a virtual environment:**
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install the dependencies:**
   ```
   pip install -r requirements.txt
   ```

4. **Run the application:**
   ```
   uvicorn app.main:app --reload
   ```

## API Endpoints

- **POST /embed/{user_id}**
  - Description: Generates and stores user embeddings.
  - Request Body: JSON containing user information.

- **GET /matches/{user_id}?top_k=n**
  - Description: Finds the top-k similar users for the given user ID.
  - Query Parameters:
    - `top_k`: Number of similar users to return (default is 5).

## Usage Examples

- To generate embeddings for a user:
  ```
  curl -X POST "http://localhost:8000/embed/1" -H "Content-Type: application/json" -d '{"bio": "I am a software developer.", "teach_skills": ["Python", "FastAPI"], "learn_skills": ["Machine Learning"]}'
  ```

- To find similar users:
  ```
  curl -X GET "http://localhost:8000/matches/1?top_k=5"
  ```

## License

This project is licensed under the MIT License.
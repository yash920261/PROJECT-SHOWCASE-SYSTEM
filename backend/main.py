import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

load_dotenv()

app = FastAPI(title="Project Showcase System Backend API", description="API handling project review and backend logic")

# CORS — allow frontend origins (local dev + Render production)
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

# Add your Render frontend URL from the environment (set in Render dashboard)
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Placeholder for Supabase client
# from supabase import create_client, Client
# url: str = os.getenv("SUPABASE_URL")
# key: str = os.getenv("SUPABASE_ANON_KEY")
# supabase: Client = create_client(url, key)

class ProjectApproval(BaseModel):
    project_id: int
    approve: bool
    faculty_id: str

class Project(BaseModel):
    title: str
    description: str
    department: str
    group_name: str
    tech_stack: List[str]

@app.get("/")
def read_root():
    return {"status": "Backend running", "service": "Project Showcase System"}

@app.post("/projects")
def add_project(project: Project):
    """
    Endpoint to add a project to the database.
    Stores the project in Supabase with a 'pending' status for faculty review.
    """
    return {"message": "Project accepted for review", "project_title": project.title}

@app.post("/review")
def review_project(review: ProjectApproval):
    """
    Endpoint for a faculty member to accept or reject a project.
    Updates the project status in the database.
    """
    # Logic to verify faculty_id via Supabase
    is_faculty = True  # Mock
    if not is_faculty:
        raise HTTPException(status_code=403, detail="Unauthorized: Only faculty can review projects")

    status = "approved" if review.approve else "rejected"

    # Supabase update placeholder
    # supabase.table('projects').update({'status': status}).eq('id', review.project_id).execute()

    return {"message": f"Project {status} successfully", "project_id": review.project_id, "status": status}

@app.get("/projects/{project_id}/status")
def get_project_status(project_id: int):
    """
    Query the database for the current review status of a project.
    """
    # Supabase query placeholder
    # result = supabase.table('projects').select('*').eq('id', project_id).single().execute()

    # Mock return
    return {
        "project_id": project_id,
        "status": "pending"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

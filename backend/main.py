from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Project Showcase System Backend API", description="API handling project review and backend logic")

# Placeholder for Supabase client
# from supabase import create_client, Client
# url: str = "your-supabase-url"
# key: str = "your-supabase-key"
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

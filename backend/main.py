from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Project Showcase System Backend API", description="API handling Web3 integration and backend logics")

# Placeholder for Web3 logic
# from web3 import Web3
# w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545')) 

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
    Would store in Supabase and potentially initialize on blockchain if needed.
    """
    return {"message": "Project accepted for review", "project_title": project.title}

@app.post("/vote")
def cast_vote(vote: ProjectApproval):
    """
    Endpoint for a faculty member to cast a vote.
    Would interact with the Voting.sol smart contract via Web3.
    """
    # Logic to verify faculty_id via Supabase
    is_faculty = True # Mock
    if not is_faculty:
        raise HTTPException(status_code=403, detail="Unauthorized: Only faculty can vote")

    # Web3 interaction placeholder
    # contract.functions.vote(vote.project_id, vote.approve).transact({'from': faculty_address})

    return {"message": "Vote cast successfully recorded on blockchain", "project_id": vote.project_id, "approved": vote.approve}

@app.get("/projects/{project_id}/status")
def get_project_status(project_id: int):
    """
    Query the smart contract for the current voting status of a project.
    """
    # Web3 call placeholder
    # status = contract.functions.getProjectDetails(project_id).call()
    
    # Mock return
    return {
        "project_id": project_id,
        "isApproved": False,
        "isRejected": False,
        "approveVotes": 2,
        "rejectVotes": 0
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import subprocess
import tempfile
import os
import shutil
from pathlib import Path

from parser import parse_repo

app = FastAPI(title="RepoTwin API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ParseRequest(BaseModel):
    url: str


class RepoInfoRequest(BaseModel):
    url: str


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/parse")
async def parse_repository(req: ParseRequest):
    """Clone and parse a GitHub repo, return nodes/links."""
    try:
        result = parse_repo(req.url)
        return result
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/api/repo-info")
async def repo_info(url: str):
    """Return GitHub repo metadata."""
    try:
        parts = url.rstrip("/").replace("https://github.com/", "").replace("http://github.com/", "").split("/")
        if len(parts) < 2:
            raise ValueError("Invalid GitHub URL")
        owner, repo = parts[0], parts[1].replace(".git", "")

        import urllib.request
        import json
        req_api = urllib.request.Request(
            f"https://api.github.com/repos/{owner}/{repo}",
            headers={"Accept": "application/vnd.github.v3+json", "User-Agent": "RepoTwin"},
        )
        with urllib.request.urlopen(req_api, timeout=10) as resp:
            data = json.loads(resp.read())

        return {
            "name": data.get("name", repo),
            "full_name": data.get("full_name", f"{owner}/{repo}"),
            "description": data.get("description") or "",
            "stars": data.get("stargazers_count", 0),
            "language": data.get("language") or "Unknown",
            "forks": data.get("forks_count", 0),
            "owner": owner,
            "repo": repo,
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

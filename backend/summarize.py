from fastapi import HTTPException
import subprocess
import tempfile
import os
from pathlib import Path


def get_file_content(url: str, file_path: str) -> str:
    """Clone repo and return file content."""
    parts = url.rstrip("/").replace("https://github.com/", "").replace("http://github.com/", "").split("/")
    if len(parts) < 2:
        raise ValueError("Invalid GitHub URL")
    owner, repo = parts[0], parts[1].replace(".git", "")

    tmp = Path(tempfile.mkdtemp(prefix="repotwin_file_"))
    try:
        subprocess.run(
            ["git", "clone", "--depth=1", f"https://github.com/{owner}/{repo}.git", str(tmp)],
            check=True, capture_output=True, timeout=60,
        )
        full_path = tmp / file_path
        if not full_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        return full_path.read_text(errors="replace")
    finally:
        import shutil
        shutil.rmtree(tmp, ignore_errors=True)


def summarize_file(content: str, filename: str) -> str:
    """Mock summarizer — returns a one-line description based on heuristics."""
    lines = content.split("\n")
    # Strip comments and docstrings
    code_lines = [l.strip() for l in lines if l.strip() and not l.strip().startswith("#") and not l.strip().startswith("//") and not l.strip().startswith('"""') and not l.strip().startswith("'''") and not l.strip().startswith("/*")]
    imports = [l for l in code_lines if "import " in l or "from " in l][:5]
    funcs = [l for l in code_lines if l.startswith("def ") or l.startswith("async def ") or l.startswith("function ") or l.startswith("const ") or l.startswith("class ")][:5]

    parts = []
    if funcs:
        parts.append(f"定义: {', '.join(f[:60] for f in funcs[:3])}")
    if imports:
        parts.append(f"引入: {', '.join(i[:40] for i in imports[:3])}")
    if not parts:
        return f"{len(lines)} 行代码文件"
    return f"{len(lines)} 行 · " + " · ".join(parts)

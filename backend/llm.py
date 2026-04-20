import os
import json
import urllib.request
import urllib.error


def stream_chat(url: str, message: str) -> str:
    """
    Send a chat message to DeepSeek API and stream the response.
    Falls back to heuristic response if API key not set.
    """
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        return heuristic_response(url, message)

    # First get repo structure for context
    nodes = get_repo_nodes(url)
    node_list = "\n".join([f"- {n['id']} ({n['size']} lines)" for n in nodes[:20]])

    prompt = f"""你是代码分析助手。用户问: {message}
仓库文件结构:
{node_list}

请用中文回答，基于仓库文件结构回答问题。如果提到具体文件，用 markdown 格式标出文件名。"""

    try:
        req = urllib.request.Request(
            "https://api.deepseek.com/chat/completions",
            data=json.dumps({
                "model": "deepseek-chat",
                "messages": [{"role": "user", "content": prompt}],
                "stream": True,
            }).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=60) as resp:
            # Collect all chunks for a non-streaming fallback
            full = b""
            for chunk in resp:
                full += chunk
            # Return the full response (non-streaming for now)
            data = json.loads(full)
            return data["choices"][0]["message"]["content"]

    except Exception:
        return heuristic_response(url, message)


def get_repo_nodes(url: str) -> list[dict]:
    """Parse repo and return node list."""
    import tempfile
    import subprocess
    from pathlib import Path

    parts = url.rstrip("/").replace("https://github.com/", "").replace("http://github.com/", "").split("/")
    if len(parts) < 2:
        return []
    owner, repo = parts[0], parts[1].replace(".git", "")

    tmp = Path(tempfile.mkdtemp(prefix="repotwin_chat_"))
    try:
        subprocess.run(
            ["git", "clone", "--depth=1", f"https://github.com/{owner}/{repo}.git", str(tmp)],
            check=True, capture_output=True, timeout=60,
        )
        files = list(tmp.rglob("*.py")) + list(tmp.rglob("*.ts")) + list(tmp.rglob("*.tsx")) + list(tmp.rglob("*.js")) + list(tmp.rglob("*.jsx"))
        return [{"id": str(f.relative_to(tmp)), "size": max(1, f.stat().st_size // 100)} for f in files[:50]]
    except Exception:
        return []
    finally:
        import shutil
        shutil.rmtree(tmp, ignore_errors=True)


def heuristic_response(url: str, message: str) -> str:
    """Mock response when API unavailable."""
    import tempfile
    import subprocess
    from pathlib import Path

    parts = url.rstrip("/").replace("https://github.com/", "").replace("http://github.com/", "").split("/")
    if len(parts) < 2:
        return "无法解析仓库 URL。"
    owner, repo = parts[0], parts[1].replace(".git", "")

    tmp = Path(tempfile.mkdtemp(prefix="repotwin_heuristic_"))
    try:
        subprocess.run(
            ["git", "clone", "--depth=1", f"https://github.com/{owner}/{repo}.git", str(tmp)],
            check=True, capture_output=True, timeout=60,
        )
        files = list(tmp.rglob("*.py")) + list(tmp.rglob("*.ts")) + list(tmp.rglob("*.tsx")) + list(tmp.rglob("*.js")) + list(tmp.rglob("*.jsx"))
        if not files:
            return f"仓库 `{owner}/{repo}` 中未找到 Python 或 TypeScript 文件。"

        sample = files[0]
        content = sample.read_text(errors="replace")
        imports = [l.strip() for l in content.split("\n") if "import " in l or "from " in l][:5]
        funcs = [l.strip() for l in content.split("\n") if ("def " in l or "async def " in l or "function " in l or "const " in l) and not l.strip().startswith("#")][:5]

        response = f"**{sample.name}** 解析结果:\n\n"
        if funcs:
            response += "函数定义:\n" + "\n".join([f"`{f[:60]}`" for f in funcs[:3]]) + "\n\n"
        if imports:
            response += "依赖引入:\n" + "\n".join([f"`{i[:50]}`" for i in imports[:3]]) + "\n\n"
        response += f"共扫描到 {len(files)} 个代码文件。输入更具体的问题以获取详细分析。"

        return response
    except Exception as e:
        return f"抱歉，暂时无法访问仓库 `{owner}/{repo}`。错误: {str(e)[:100]}"
    finally:
        import shutil
        shutil.rmtree(tmp, ignore_errors=True)
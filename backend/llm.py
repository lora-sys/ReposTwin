import os
import json
import urllib.request


class LLMConfig:
    """LLM provider configuration from environment variables."""

    provider = os.environ.get("LLM_PROVIDER", "auto")  # auto | openai | ollama | heuristic

    # OpenAI-compatible cloud
    openai_api_key = os.environ.get("OPENAI_API_KEY", "")
    openai_base_url = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")
    openai_model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

    # Ollama local
    ollama_base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
    ollama_model = os.environ.get("OLLAMA_MODEL", "llama3.2")

    @property
    def use_cloud(self) -> bool:
        if self.provider == "openai":
            return bool(self.openai_api_key)
        if self.provider == "ollama":
            return False
        if self.provider == "heuristic":
            return False
        # auto: use cloud if key present
        return bool(self.openai_api_key)

    @property
    def use_ollama(self) -> bool:
        if self.provider == "ollama":
            return True
        if self.provider == "openai":
            return False
        # auto: use ollama if no cloud key
        return not bool(self.openai_api_key)


def call_llm(url: str, message: str) -> str:
    """
    Unified LLM call:
    - LLM_PROVIDER=openai  → OpenAI-compatible API (or DeepSeek, Groq, etc.)
    - LLM_PROVIDER=ollama  → local Ollama
    - otherwise             → heuristic (repo context, no LLM)
    """
    config = LLMConfig()

    if config.use_cloud:
        return call_openai_compatible(config, url, message)
    elif config.use_ollama:
        return call_ollama(config, url, message)
    else:
        return heuristic_response(url, message)


def call_openai_compatible(config: LLMConfig, url: str, message: str) -> str:
    """Call any OpenAI-compatible API (OpenAI, DeepSeek, Groq, etc.)."""
    api_key = config.openai_api_key
    base_url = config.openai_base_url.rstrip("/")
    model = config.openai_model

    nodes = _get_repo_nodes(url)
    node_list = "\n".join([f"- {n['id']} ({n['size']} lines)" for n in nodes[:20]])

    prompt = f"""你是代码分析助手。用户问: {message}
仓库文件结构:
{node_list}

请用中文回答，基于仓库文件结构回答。如果提到具体文件，用 **文件名** 格式。"""

    try:
        req = urllib.request.Request(
            f"{base_url}/chat/completions",
            data=json.dumps({
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
            }).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read())
            return data["choices"][0]["message"]["content"]
    except Exception:
        return heuristic_response(url, message)


def call_ollama(config: LLMConfig, url: str, message: str) -> str:
    """Call local Ollama instance."""
    base_url = config.ollama_base_url.rstrip("/")
    model = config.ollama_model

    nodes = _get_repo_nodes(url)
    node_list = "\n".join([f"- {n['id']} ({n['size']} lines)" for n in nodes[:20]])

    prompt = f"""你是代码分析助手。用户问: {message}
仓库文件结构:
{node_list}

请用中文回答，基于仓库文件结构回答。如果提到具体文件，用 **文件名** 格式。"""

    try:
        req = urllib.request.Request(
            f"{base_url}/api/chat",
            data=json.dumps({
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
            }).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read())
            return data["message"]["content"]
    except Exception:
        return heuristic_response(url, message)


def _get_repo_nodes(url: str) -> list[dict]:
    """Clone repo and return code file list."""
    import tempfile, subprocess
    from pathlib import Path

    parts = url.rstrip("/").replace("https://github.com/", "").replace("http://github.com/", "").split("/")
    if len(parts) < 2:
        return []
    owner, repo = parts[0], parts[1].replace(".git", "")

    tmp = Path(tempfile.mkdtemp(prefix="repotwin_llm_"))
    try:
        subprocess.run(
            ["git", "clone", "--depth=1", f"https://github.com/{owner}/{repo}.git", str(tmp)],
            check=True, capture_output=True, timeout=60,
        )
        files = (
            list(tmp.rglob("*.py")) +
            list(tmp.rglob("*.ts")) +
            list(tmp.rglob("*.tsx")) +
            list(tmp.rglob("*.js")) +
            list(tmp.rglob("*.jsx"))
        )
        return [{"id": str(f.relative_to(tmp)), "size": max(1, f.stat().st_size // 100)} for f in files[:50]]
    except Exception:
        return []
    finally:
        import shutil
        shutil.rmtree(tmp, ignore_errors=True)


def heuristic_response(url: str, message: str) -> str:
    """Fallback: repo context without LLM."""
    from pathlib import Path
    import tempfile, subprocess

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
        files = (
            list(tmp.rglob("*.py")) +
            list(tmp.rglob("*.ts")) +
            list(tmp.rglob("*.tsx")) +
            list(tmp.rglob("*.js")) +
            list(tmp.rglob("*.jsx"))
        )
        if not files:
            return f"仓库 `{owner}/{repo}` 中未找到 Python 或 TypeScript 文件。"

        sample = files[0]
        content = sample.read_text(errors="replace")
        imports = [l.strip() for l in content.split("\n") if "import " in l or "from " in l][:5]
        funcs = [l.strip() for l in content.split("\n")
                 if ("def " in l or "async def " in l or "function " in l or "const " in l)
                 and not l.strip().startswith("#")][:5]

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
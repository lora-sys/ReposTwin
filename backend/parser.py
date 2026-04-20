"""tree-sitter based AST parser for Python, JavaScript, TypeScript."""
import subprocess
import tempfile
import shutil
import hashlib
from pathlib import Path
from collections import defaultdict


def _clone_repo(url: str, dest: Path) -> None:
    url = url.rstrip("/")
    if url.endswith(".git"):
        pass
    else:
        url = f"{url}.git"
    subprocess.run(
        ["git", "clone", "--depth=1", url, str(dest)],
        check=True,
        capture_output=True,
        timeout=120,
    )


def _detect_lang(filename: str) -> str | None:
    ext = Path(filename).suffix.lower()
    mapping = {
        ".py": "python",
        ".js": "javascript",
        ".jsx": "javascript",
        ".ts": "typescript",
        ".tsx": "typescript",
        ".mjs": "javascript",
        ".cjs": "javascript",
        ".mts": "typescript",
        ".cts": "typescript",
    }
    return mapping.get(ext)


def _get_all_files(root: Path) -> list[Path]:
    """Get all source files, ignoring node_modules, .git, __pycache__, etc."""
    skip_dirs = {".git", "node_modules", "__pycache__", "dist", "build", ".venv", "venv", "target", "vendor"}
    skip_exts = {".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".woff", ".woff2", ".ttf", ".eot", ".mp4", ".webm", ".mp3", ".wav", ".pdf", ".zip", ".tar", ".gz"}
    files = []
    for path in root.rglob("*"):
        if path.is_file():
            rel = path.relative_to(root)
            parts = set(rel.parts)
            if parts & skip_dirs:
                continue
            if path.suffix.lower() in skip_exts:
                continue
            files.append(path)
    return files


def _group_by_dir(filepath: Path) -> int:
    """Assign a group number based on top-level directory."""
    parts = filepath.parts
    if len(parts) <= 1:
        return 5
    top = parts[0].lower()
    group_map = {
        "src": 1, "lib": 1, "core": 1, "internal": 1,
        "components": 2, "ui": 2, "views": 2, "pages": 2, "screens": 2,
        "hooks": 4, "utils": 3, "helpers": 3, "lib": 3,
        "api": 3, "services": 3, "store": 4,
        "styles": 5, "css": 5, "assets": 5, "public": 5,
    }
    return group_map.get(top, 3)


def _calc_size(filepath: Path) -> int:
    """Size factor: larger files = bigger nodes."""
    try:
        lines = filepath.read_text(errors="ignore").count("\n")
        return max(1, min(lines // 20, 15))
    except Exception:
        return 1


def parse_repo(url: str) -> dict:
    """Clone a repo, parse source files, return {nodes, links}."""
    tmp = Path(tempfile.mkdtemp(prefix="repotwin_"))
    try:
        _clone_repo(url, tmp)

        files = _get_all_files(tmp)
        nodes = []
        links = []
        file_map: dict[str, str] = {}  # normalized path -> id

        # First pass: create nodes
        for filepath in files:
            lang = _detect_lang(str(filepath))
            if lang is None:
                continue
            rel = filepath.relative_to(tmp)
            file_id = str(rel).replace("\\", "/")
            file_map[str(rel)] = file_id
            size = _calc_size(filepath)
            group = _group_by_dir(rel)
            nodes.append({
                "id": file_id,
                "group": group,
                "size": size,
            })

        # Second pass: find imports between files (naive approach per language)
        seen_links = set()
        for filepath in files:
            lang = _detect_lang(str(filepath))
            if lang is None:
                continue
            try:
                content = filepath.read_text(errors="ignore")
            except Exception:
                continue

            rel = str(filepath.relative_to(tmp))
            source_id = file_map.get(rel)
            if not source_id:
                continue

            # Find imports in the file
            imported = _find_imports(content, lang, filepath.stem)
            for imp in imported:
                # Try to resolve import to a file we have in file_map
                target_id = _resolve_import(imp, file_map, tmp)
                if target_id and target_id != source_id:
                    link_key = (source_id, target_id)
                    if link_key not in seen_links:
                        seen_links.add(link_key)
                        links.append({
                            "source": source_id,
                            "target": target_id,
                            "type": "import",
                        })

        return {"nodes": nodes, "links": links}
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def _find_imports(content: str, lang: str, _stem: str) -> list[str]:
    """Extract import/require specifiers from file content."""
    imports: list[str] = []

    if lang in ("javascript", "typescript"):
        # ES6 imports: import X from 'foo' or import 'foo'
        import re
        # named/-default imports
        for m in re.finditer(r"import\s+(?:{\s*[^}]+\s*}|\w+|\*\s+as\s+\w+)\s+from\s+['\"]([^'\"]+)['\"]", content):
            imports.append(m.group(1))
        # require
        for m in re.finditer(r"require\s*\(\s*['\"]([^'\"]+)['\"]\s*\)", content):
            imports.append(m.group(1))
        # dynamic import
        for m in re.finditer(r"import\s*\(\s*['\"]([^'\"]+)['\"]\s*\)", content):
            imports.append(m.group(1))

    elif lang == "python":
        import re
        # from X import Y / import X
        for m in re.finditer(r"^(?:from\s+([\w.]+)\s+import\s+(?:.+)|import\s+([\w.]+))", content, re.MULTILINE):
            pkg = m.group(1) or m.group(2)
            if pkg:
                imports.append(pkg.split(".")[0])
    return imports


def _resolve_import(imp: str, file_map: dict[str, str], tmp: Path) -> str | None:
    """Resolve an import specifier to a file ID in file_map."""
    imp = imp.strip()
    if not imp:
        return None

    # Direct file matches
    for path_str, fid in file_map.items():
        if path_str.endswith(imp) or path_str.endswith(f"{imp}.ts") or path_str.endswith(f"{imp}.tsx") or path_str.endswith(f"{imp}.js") or path_str.endswith(f"{imp}.jsx") or path_str.endswith(f"{imp}.py"):
            return fid

    # Index file matches (e.g. ./utils/index.js -> ./utils)
    for path_str, fid in file_map.items():
        p = Path(path_str)
        if p.stem == "index" and str(p.parent).endswith(imp):
            return fid

    return None

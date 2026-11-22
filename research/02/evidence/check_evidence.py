#!/usr/bin/env python3
"""Check the claim and source registries against each other, the pages and the game's code.

What this checks (structure only):
  - claim IDs are well formed and unique; source keys are unique
  - layer, status and access are in vocabulary
  - status fits the layer: history claims use supported ... open; game claims
    use 'labelled'; unsourced claims are 'unsupported'
  - every claim's sources exist, and every source is used by some claim
  - 'supported' needs a source read in full or with its figures checked;
    'partly_supported' needs at least an abstract or a reference work
  - an unsourced claim records what was 'searched'
  - a game assumption names the 'code' that sets it, and that code is still in
    the game file, so changing a constant forces this registry to change too
  - a game claim is stated on the game page itself (the player sees the label)
  - every page a claim names exists, and its anchor phrase is on that page
    (whitespace, case and HTML entities ignored, nothing else)
  - every claim ID mentioned in a markdown file exists

What it cannot check: whether a sentence is faithful to its source, or whether
a model number is sensible. A clean run means the registry is consistent, not
that the history is right.

Each run reports, without failing, how many history claims rest only on
sources nobody in this project has read, so a clean exit never hides that.

Usage, from anywhere:  python3 research/02/evidence/check_evidence.py [repo_root]
Exit status 1 if anything is wrong.
"""

import html
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.exit("needs pyyaml:  python -m pip install pyyaml")

HISTORY_LAYERS = {"documented", "estimate", "interpretation"}
GAME_LAYERS = {"game_assumption", "game_result"}
LAYERS = HISTORY_LAYERS | GAME_LAYERS | {"unsourced"}
HISTORY_STATUSES = {"supported", "partly_supported", "unverified", "unsupported", "open"}
# sections_read: only some pages were read (named in `locator`). It can partly support a claim, never fully:
# two pages of a paper do not show what the rest of it says (PR #1 review, finding H1).
ACCESS = ["full_text_read", "figures_checked", "sections_read", "abstract_read", "reference_work",
          "from_notes", "not_read"]
SUPPORTING_ACCESS = set(ACCESS[:2])
PARTIAL_ACCESS = set(ACCESS[:5])
GAME_FILE = "projects/02/index.html"
CLAIM_ID_RE = re.compile(r"^claim\.[a-z0-9_]+(\.[a-z0-9_]+)+$")
CLAIM_MENTION_RE = re.compile(r"\bclaim\.[a-z0-9_]+(?:\.[a-z0-9_]+)+")
SKIP_DIRS = {".git", "__pycache__", "tests"}


SCRIPT_RE = re.compile(r"(<script\b[^>]*>)(.*?)(</script>)", re.S | re.I)
BLOCK_COMMENT_RE = re.compile(r"/\*.*?\*/", re.S)
# a line comment starts at the line start or after whitespace or punctuation, so "https://" in a string survives
LINE_COMMENT_RE = re.compile(r"(^|[\s;{}(),])//[^\n]*", re.M)


def strip_js_comments(html_text):
    """The game file with comments removed from its scripts, so a claim anchored only in a comment fails.
    (PR #1 review round 2, item 11: anchors that sat only in JavaScript comments still passed.)"""
    def clean(m):
        body = LINE_COMMENT_RE.sub(lambda c: c.group(1), BLOCK_COMMENT_RE.sub("", m.group(2)))
        return m.group(1) + body + m.group(3)
    return SCRIPT_RE.sub(clean, html_text)


def norm(text):
    return re.sub(r"\s+", " ", html.unescape(text)).strip().casefold()


def load(path, errors):
    try:
        return yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    except (OSError, yaml.YAMLError) as exc:
        errors.append(f"{path.name}: cannot read: {exc}")
        return {}


def check(root):
    errors = []
    ev = root / "research" / "02" / "evidence"
    sources = load(ev / "sources.yml", errors).get("sources") or []
    claims = load(ev / "claims.yml", errors).get("claims") or []
    game_path = root / GAME_FILE
    game_code = game_path.read_text(encoding="utf-8") if game_path.is_file() else ""
    game_code_live = strip_js_comments(game_code)
    if not game_code:
        errors.append(f"{GAME_FILE} not found")

    source_by_key = {}
    for i, s in enumerate(sources):
        key = s.get("key")
        where = f"sources.yml entry {i} ({key})"
        if not key:
            errors.append(f"{where}: no key")
            continue
        if key in source_by_key:
            errors.append(f"{where}: duplicate key")
        source_by_key[key] = s
        if s.get("access") not in ACCESS:
            errors.append(f"{where}: access {s.get('access')!r} not in {ACCESS}")
        if s.get("access") == "sections_read" and not str(s.get("locator") or "").strip():
            errors.append(f"{where}: a sections_read source must name the pages read in its locator")

    used = set()
    seen_ids = set()
    page_cache = {}
    unread_history = []
    for i, c in enumerate(claims):
        cid = c.get("id")
        where = f"claims.yml entry {i} ({cid})"
        if not cid or not CLAIM_ID_RE.match(str(cid)):
            errors.append(f"{where}: id must look like claim.area.name")
        elif cid in seen_ids:
            errors.append(f"{where}: duplicate id")
        seen_ids.add(cid)

        layer, status = c.get("layer"), c.get("status")
        if layer not in LAYERS:
            errors.append(f"{where}: layer {layer!r} not in {sorted(LAYERS)}")
        if layer in HISTORY_LAYERS and status not in HISTORY_STATUSES:
            errors.append(f"{where}: status {status!r} not in {sorted(HISTORY_STATUSES)}")
        if layer in GAME_LAYERS and status != "labelled":
            errors.append(f"{where}: a game claim's status must be 'labelled', not {status!r}")
        if layer == "unsourced" and status != "unsupported":
            errors.append(f"{where}: an unsourced claim's status must be 'unsupported'")
        if not str(c.get("statement") or "").strip():
            errors.append(f"{where}: no statement")

        keys = c.get("sources") or []
        if not keys and layer != "game_result":  # a game result is the model's own output
            errors.append(f"{where}: no sources")
        for k in keys:
            if k not in source_by_key:
                errors.append(f"{where}: unknown source {k!r}")
            used.add(k)
        access = {source_by_key.get(k, {}).get("access") for k in keys}

        if status == "supported" and not access & SUPPORTING_ACCESS:
            errors.append(f"{where}: 'supported' needs a source at {sorted(SUPPORTING_ACCESS)}")
        if status == "partly_supported" and not access & PARTIAL_ACCESS:
            errors.append(f"{where}: 'partly_supported' needs a source at {sorted(PARTIAL_ACCESS)}")
        if layer in HISTORY_LAYERS and not access & PARTIAL_ACCESS:
            unread_history.append(cid)
        if layer == "unsourced" and not str(c.get("searched") or "").strip():
            errors.append(f"{where}: an unsourced claim must record what was searched")

        codes = c.get("code") or []
        if layer == "game_assumption" and not codes:
            errors.append(f"{where}: a game assumption must name the code that sets it")
        for snippet in codes:
            if str(snippet) not in game_code_live:
                errors.append(f"{where}: code not found in {GAME_FILE}: {snippet!r}")

        pages = c.get("pages") or []
        if not pages:
            errors.append(f"{where}: no pages")
        if layer in GAME_LAYERS and GAME_FILE not in {p.get("path") for p in pages}:
            errors.append(f"{where}: a game claim must be stated in {GAME_FILE}")
        for p in pages:
            path, anchor = p.get("path"), p.get("anchor")
            if not path or not anchor:
                errors.append(f"{where}: page entry needs path and anchor")
                continue
            target = root / path
            if path not in page_cache:
                raw = target.read_text(encoding="utf-8") if target.is_file() else None
                if raw is not None and path == GAME_FILE: raw = strip_js_comments(raw)
                page_cache[path] = norm(raw) if raw is not None else None
            text = page_cache[path]
            if text is None:
                errors.append(f"{where}: page {path} does not exist")
            elif norm(str(anchor)) not in text:
                errors.append(f"{where}: anchor not found in {path}: {anchor!r}")

    for k in source_by_key:
        if k not in used:
            errors.append(f"sources.yml: {k!r} is not used by any claim")

    read = []
    for md in sorted((root / "research" / "02").rglob("*.md")):
        if SKIP_DIRS & set(md.relative_to(root).parts):
            continue
        read.append(md.relative_to(root).as_posix())
        for m in CLAIM_MENTION_RE.findall(md.read_text(encoding="utf-8")):
            if m not in seen_ids:
                errors.append(f"{md.relative_to(root).as_posix()}: "
                              f"mentions unknown claim {m}")

    by_layer = {l: sum(1 for c in claims if c.get("layer") == l) for l in sorted(LAYERS)}
    by_access = {a: sum(1 for s in sources if s.get("access") == a) for a in ACCESS}
    print(f"read: research/02/evidence/claims.yml, research/02/evidence/sources.yml, {GAME_FILE}, {len(read)} markdown files")
    print(f"{len(claims)} claims, {len(sources)} sources")
    print("layers: " + ", ".join(f"{l} {n}" for l, n in by_layer.items()))
    print("access: " + ", ".join(f"{a} {n}" for a, n in by_access.items()))
    print(f"history claims resting only on unread sources (from_notes / not_read): "
          f"{len(unread_history)}")
    for e in errors:
        print("ERROR " + e)
    print("FAILED" if errors else "all checked")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")  # non-ASCII anchors on a cp949/cp1252 console
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[3]
    sys.exit(check(root))

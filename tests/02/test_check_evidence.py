"""Every rule in evidence/check_evidence.py must be able to fail.

Each case copies the repository to a temporary directory, plants one defect,
and asserts the checker exits 1 **with that rule's message**. A healthy copy
must exit 0.

Each case also names the condition in the checker that catches it. The test
disables that condition (`if False:`) in a copy of the checker and asserts the
planted defect then slips through. That shows the case exercises its own rule
and is not failing for some other reason. A case that fails either way tests
nothing. So every rule's condition in the checker fits on one line.

Run: python3 -m unittest discover -s tests/02
"""

import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CHECKER = ROOT / "research" / "02" / "evidence" / "check_evidence.py"
C = "research/02/evidence/claims.yml"
S = "research/02/evidence/sources.yml"
G = "projects/02/index.html"
D = "research/02/notes/history-and-evidence.md"

SEARCHED = ("    searched: >\n"
            "      Maddison (2003); the literature review supplied on 2026-11-17; the 23-work\n"
            "      reference collection's index notes; web searches by the review agents on\n"
            "      2026-11-17. None gives these figures.\n")

# name: (file or "DELETE", old, new, expected message, checker condition or None)
CASES = {
    "game assumption with no source": (
        C, "layer: game_assumption\n    status: labelled\n    sources: [maddison2003]",
        "layer: game_assumption\n    status: labelled\n    sources: []",
        "no sources", 'if not keys and layer != "game_result":'),
    "unknown source key": (
        C, "sources: [bolt_vanzanden2025]", "sources: [bolt_vanzanden2025, no_such_source]",
        "unknown source 'no_such_source'", "if k not in source_by_key:"),
    "layer out of vocabulary": (
        C, "layer: estimate", "layer: guess",
        "layer 'guess' not in", "if layer not in LAYERS:"),
    "history status out of vocabulary": (
        C, "status: open", "status: probable",
        "status 'probable' not in",
        "if layer in HISTORY_LAYERS and status not in HISTORY_STATUSES:"),
    "game assumption given a history status": (
        C, "layer: game_assumption\n    status: labelled\n    sources: [maddison2003]",
        "layer: game_assumption\n    status: supported\n    sources: [maddison2003]",
        "a game claim's status must be 'labelled'",
        'if layer in GAME_LAYERS and status != "labelled":'),
    "unsourced claim not marked unsupported": (
        C, "layer: unsourced\n    status: unsupported", "layer: unsourced\n    status: open",
        "an unsourced claim's status must be 'unsupported'",
        'if layer == "unsourced" and status != "unsupported":'),
    "supported on a source only seen in notes": (
        C, "status: unverified\n    sources: [bolt_vanzanden2025]",
        "status: supported\n    sources: [bolt_vanzanden2025]",
        "'supported' needs a source at",
        'if status == "supported" and not access & SUPPORTING_ACCESS:'),
    "partly supported on notes only": (
        C, "status: unverified\n    sources: [murra1972]",
        "status: partly_supported\n    sources: [murra1972]",
        "'partly_supported' needs a source at",
        'if status == "partly_supported" and not access & PARTIAL_ACCESS:'),
    "unsourced without searched": (
        C, SEARCHED, "",
        "an unsourced claim must record what was searched",
        'if layer == "unsourced" and not str(c.get("searched") or "").strip():'),
    "game assumption without code": (
        C, '    code: ["ALPHA = 0.9"]\n', "",
        "a game assumption must name the code that sets it",
        'if layer == "game_assumption" and not codes:'),
    "constant changed in the game but not the registry": (
        G, "TRIB_PP = 500", "TRIB_PP = 450",
        "code not found in projects/02/index.html: 'TRIB_PP = 500'",
        "if str(snippet) not in game_code_live:"),
    "game claim not stated in the game": (
        C, "      - path: projects/02/index.html\n        anchor: In your game the change splits into two parts.\n", "",
        "a game claim must be stated in projects/02/index.html",
        'if layer in GAME_LAYERS and GAME_FILE not in {p.get("path") for p in pages}:'),
    "anchor edited away from the game": (
        G, "mita allocations followed a different adjustment process. The game holds both totals fixed.", "nothing changed.",
        "anchor not found in projects/02/index.html",
        "elif norm(str(anchor)) not in text:"),
    "page missing": (
        "DELETE", D, None,
        "page research/02/notes/history-and-evidence.md does not exist",
        None),  # cannot be disabled: the anchor check would then read a missing file
    "duplicate claim id": (
        C, "id: claim.land.chuno_keeps\n", "id: claim.land.zone_names\n",
        "duplicate id", "elif cid in seen_ids:"),
    "malformed claim id": (
        C, "id: claim.land.chuno_keeps\n", "id: chuno_keeps\n",
        "id must look like claim.area.name",
        "if not cid or not CLAIM_ID_RE.match(str(cid)):"),
    "access out of vocabulary": (
        S, "access: not_read", "access: skimmed",
        "access 'skimmed' not in", 'if s.get("access") not in ACCESS:'),
    "unused source": (
        C, "sources: [covey_quave2017]", "sources: [robins_hagan2012]",
        "'covey_quave2017' is not used by any claim", "if k not in used:"),
    "unknown claim mentioned in prose": (
        D, "## Open questions", "## Open questions\n\nSee claim.food.no_such_claim.",
        "mentions unknown claim claim.food.no_such_claim", "if m not in seen_ids:"),
    # Review round 2, item 11: a phrase that sits only in a JavaScript comment is not stated in the game
    "anchor only in a code comment": (
        C, "        anchor: mita allocations followed a different adjustment process. The game holds both totals fixed.\n", "        anchor: same food, fewer people\n",
        "anchor not found in projects/02/index.html",
        "if raw is not None and path == GAME_FILE:"),
    "code snippet only in a code comment": (
        C, '    code: ["ALPHA = 0.9"]\n', '    code: ["same food, fewer people"]\n',
        "code not found in projects/02/index.html",
        "if str(snippet) not in game_code_live:"),
    # PR #1 review, H1: reading two pages of a paper must not unlock 'supported'
    "supported on a source read only in sections": (
        C, "status: partly_supported\n    sources: [mccall2016]",
        "status: supported\n    sources: [mccall2016]",
        "'supported' needs a source at",
        'if status == "supported" and not access & SUPPORTING_ACCESS:'),
    "sections read without saying which": (
        S, "    locator: Simulation and Gaming 47(4), pp. 517-542; supplied advance-version PDF pp. 8-20\n", "",
        "a sections_read source must name the pages read",
        'if s.get("access") == "sections_read" and not str(s.get("locator") or "").strip():'),
}


def run(root, checker=None):
    checker = checker or root / "research" / "02" / "evidence" / "check_evidence.py"
    proc = subprocess.run([sys.executable, str(checker), str(root)],
                          capture_output=True, text=True, encoding="utf-8")
    return proc.returncode, proc.stdout + proc.stderr


def fresh_copy(dst):
    if dst.exists():
        shutil.rmtree(dst)
    dst.mkdir(parents=True)
    for rel in ("research/02", "tests/02", "projects/02"):
        shutil.copytree(ROOT / rel, dst / rel, ignore=shutil.ignore_patterns(".git", "__pycache__"))


def plant(root, case):
    target, old, new = case[:3]
    if target == "DELETE":
        (root / old).unlink()
        return
    path = root / target
    text = path.read_text(encoding="utf-8")
    assert old in text, f"fixture drifted: {old!r} not in {target}"
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


class CheckerCanFail(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.root = self.tmp / "repo"

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_healthy_copy_passes(self):
        fresh_copy(self.root)
        code, out = run(self.root)
        self.assertEqual(code, 0, out)
        self.assertIn("all checked", out)

    def test_other_weeks_claims_are_not_scanned(self):
        fresh_copy(self.root)
        other = self.root / "research" / "03"
        other.mkdir(parents=True)
        (other / "unrelated.md").write_text("claim.other_week.unknown", encoding="utf-8")
        code, out = run(self.root)
        self.assertEqual(code, 0, out)

    def test_harness_propagates_failure(self):
        proc = subprocess.run([sys.executable, "-c", "import sys; sys.exit(3)"])
        self.assertEqual(proc.returncode, 3)

    def test_each_defect_fails_for_its_reason(self):
        for name, case in CASES.items():
            with self.subTest(name):
                fresh_copy(self.root)
                plant(self.root, case)
                code, out = run(self.root)
                self.assertEqual(code, 1, f"{name} passed the checker:\n{out}")
                self.assertIn(case[3], out, f"{name} failed for another reason:\n{out}")

    def test_each_case_exercises_its_rule(self):
        source = CHECKER.read_text(encoding="utf-8")
        for name, case in CASES.items():
            condition = case[4]
            if condition is None:
                continue
            with self.subTest(name):
                m = re.search(r"^( *)" + re.escape(condition), source, re.M)
                self.assertIsNotNone(m, "checker changed; update this case's condition")
                kw = "elif" if condition.startswith("elif") else "if"
                disabled = source.replace(m.group(0), f"{m.group(1)}{kw} False:", 1)
                checker = self.tmp / "disabled_check.py"
                checker.write_text(disabled, encoding="utf-8")
                fresh_copy(self.root)
                plant(self.root, case)
                code, out = run(self.root, checker)
                self.assertEqual(code, 0, f"{name}: still fails with its rule disabled, "
                                          f"so the case is not testing that rule:\n{out}")


if __name__ == "__main__":
    unittest.main()

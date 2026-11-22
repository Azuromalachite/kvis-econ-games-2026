"""Write the game's inline JavaScript to a file so `node --check` can parse it.

The game is one HTML file with no build step, so a single syntax error (an
unescaped apostrophe in a single-quoted string shipped once) stops the whole
game, and the evidence checker cannot see it. Run explicitly:

    python3 tests/02/extract_game_script.py projects/02/index.html game.js
    node --check game.js

Exits 1 if the file has no inline script, so the check cannot pass by
finding nothing.
"""

import re
import sys
from pathlib import Path

SCRIPT_RE = re.compile(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", re.S | re.I)


def main(src, dst):
    html = Path(src).read_text(encoding="utf-8")
    scripts = SCRIPT_RE.findall(html)
    if not scripts:
        print(f"no inline <script> found in {src}", file=sys.stderr)
        return 1
    Path(dst).write_text("\n;\n".join(scripts), encoding="utf-8")
    print(f"{len(scripts)} inline script(s), {sum(map(len, scripts))} characters -> {dst}")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__, file=sys.stderr)
        sys.exit(2)
    sys.exit(main(sys.argv[1], sys.argv[2]))

"""Port the source CI syntax checks into an explicit, dependency-free local check."""
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EXTRACT = Path(__file__).with_name('extract_game_script.py')
GAME = ROOT / 'projects/02/index.html'


def extract(src, dst):
    return subprocess.run([sys.executable, str(EXTRACT), str(src), str(dst)],
                          capture_output=True, text=True, encoding='utf-8')


def main():
    with tempfile.TemporaryDirectory(prefix='frost-syntax-') as tmp:
        tmp = Path(tmp)
        script = tmp / 'game.js'
        result = extract(GAME, script)
        if result.returncode:
            raise RuntimeError(result.stdout + result.stderr)
        parsed = subprocess.run(['node', '--check', str(script)], capture_output=True, text=True)
        if parsed.returncode:
            raise RuntimeError(parsed.stdout + parsed.stderr)
        html = GAME.read_text(encoding='utf-8')
        split = html.rindex('</script>')
        planted = tmp / 'planted.html'
        planted.write_text(html[:split] + "\nconst planted = 'the game's';\n" + html[split:], encoding='utf-8')
        result = extract(planted, tmp / 'planted.js')
        if result.returncode:
            raise RuntimeError('The planted script was not extracted: ' + result.stderr)
        rejected = subprocess.run(['node', '--check', str(tmp / 'planted.js')], capture_output=True, text=True)
        if rejected.returncode == 0 or 'SyntaxError' not in rejected.stderr:
            raise AssertionError('Node did not reject the planted apostrophe for a syntax error')
        plain = tmp / 'no-script.txt'
        plain.write_text('No inline JavaScript here.', encoding='utf-8')
        rejected = extract(plain, tmp / 'none.js')
        if rejected.returncode != 1 or 'no inline <script>' not in rejected.stderr:
            raise AssertionError('The extractor accepted a file without an inline script')
    print('PASS: game script parses; planted syntax defect and no-script input are rejected.')


if __name__ == '__main__':
    main()

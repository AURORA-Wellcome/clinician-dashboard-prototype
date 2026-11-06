#!/usr/bin/env python3
"""Stamps each page's references to the site's scripts with a hash of the script, as ./bear.js?v=3f9a2c71d0, so a browser
fetches a script that has changed at once, rather than keeping its cached copy for up to 10 minutes, as GitHub Pages lets
it (Cache-Control: max-age=600), and so a page and its scripts always match.

After changing a script:   python3 tools/stamp.py           (then commit the pages it changed with the script)
To check without changing:  python3 tools/stamp.py --check   (exit 1 if a stamp is out of date)
For the pre-commit hook:    python3 tools/stamp.py --staged  (the same check on what is staged)
"""
import hashlib
import re
import subprocess
import sys
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = ['bear.js', 'notes.js', 'support.js']
# A quoted reference to one of them, from any page: an optional ./ or ../ path, the name, and any old stamp
REF = re.compile(r"""(?<=['"])((?:\.{1,2}/)*)(""" + '|'.join(re.escape(s) for s in SCRIPTS) + r""")(\?v=[0-9a-f]*)?(?=['"])""")


def git(*args):
    return subprocess.run(['git', '-C', str(ROOT), *args], capture_output=True, check=True).stdout


def contents(path, staged):
    """A file as it is on disk, or as it is staged for the next commit."""
    return git('show', f':{path}') if staged else (ROOT / path).read_bytes()


def leads_to_root(page, prefix):
    """Whether a path from the page's folder through prefix ends at the site's root, as ./ does from the root and ../ from
    archive/"""
    depth = len(PurePosixPath(page).parent.parts)
    for part in prefix.split('/'):
        depth -= part == '..'
    return depth == 0


def stamped(page, text, versions):
    """The page's text with each reference to one of the root's scripts carrying that script's stamp"""
    def fix(m):
        prefix, name = m.group(1), m.group(2)
        return f'{prefix}{name}?v={versions[name]}' if leads_to_root(page, prefix) else m.group(0)

    return REF.sub(fix, text)


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else ''
    staged = mode == '--staged'
    pages = [p for p in git('ls-files', '-z', '*.html').decode().split('\0') if p]
    versions = {s: hashlib.sha256(contents(s, staged)).hexdigest()[:10] for s in SCRIPTS}
    stale = []
    for page in pages:
        # (Bytes in and out, so line endings and everything else stay exactly as they were)
        text = contents(page, staged).decode('utf-8')
        new = stamped(page, text, versions)
        if new == text:
            continue
        stale.append(page)
        if not mode:
            (ROOT / page).write_bytes(new.encode('utf-8'))
    if mode and stale:
        print('Script stamps out of date in: ' + ', '.join(stale), file=sys.stderr)
        print('Run python3 tools/stamp.py and stage the pages it changes.', file=sys.stderr)
        return 1
    if not mode:
        print('Stamped ' + (', '.join(stale) if stale else 'nothing; all up to date') + f" ({', '.join(f'{s} {v}' for s, v in versions.items())})")
    return 0


if __name__ == '__main__':
    sys.exit(main())

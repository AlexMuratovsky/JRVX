#!/usr/bin/env python3
"""Create a JRVX-branded copy of a captured ChatGPT Sites bundle.

This intentionally changes public uppercase branding only. Lowercase legacy
identifiers are preserved for compatibility with persisted data, browser
events, routes and backend contracts.
"""

from __future__ import annotations

import argparse
from pathlib import Path


def rebrand_tree(root: Path) -> tuple[int, int]:
    changed_files = 0
    replacements = 0

    for path in root.rglob("*"):
        if not path.is_file():
            continue

        try:
            raw = path.read_bytes()
            text = raw.decode("utf-8")
        except (UnicodeDecodeError, OSError):
            continue

        count = text.count("JARVIS")
        if count == 0:
            continue

        updated = text.replace("JARVIS", "JRVX")
        path.write_text(updated, encoding="utf-8")
        changed_files += 1
        replacements += count
        print(f"rebranded {path.relative_to(root)}: {count}")

    return changed_files, replacements


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path)
    args = parser.parse_args()

    changed_files, replacements = rebrand_tree(args.root)
    print(
        f"JRVX rebrand complete: {replacements} replacements "
        f"across {changed_files} files"
    )


if __name__ == "__main__":
    main()

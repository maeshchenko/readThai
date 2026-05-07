#!/usr/bin/env python3
"""
Lint curated chapter JSON files for known structural issues:
  - `thaiExample` blocks whose `translit` looks like a sentence (capital+4+ words,
    or contains sentence punctuation, or starts with a numbered list marker).
  - `paragraph` blocks that are pure page numbers.
  - chapters missing the `_curated: true` flag.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / "src" / "content"

PAGE_NUM_RE = re.compile(r'^\d{1,3}$')
SENTENCE_RE = re.compile(r'^[A-ZА-Я0-9].{20,}')
NUMBERED_LIST_RE = re.compile(r'^\d+\.\s+[A-ZА-Я]')


def issues_for(data: dict) -> list:
    msgs = []
    if not data.get("_curated"):
        msgs.append("not marked _curated")
    for i, b in enumerate(data.get("blocks", [])):
        t = b.get("type")
        if t == "paragraph":
            html = (b.get("html") or "").strip()
            if PAGE_NUM_RE.match(html):
                msgs.append(f"  block[{i}]: page-number paragraph '{html}'")
        if t == "thaiExample":
            translit = (b.get("translit") or "").strip()
            if not translit and not (b.get("meaning") or "").strip():
                msgs.append(f"  block[{i}]: thaiExample with empty translit AND meaning '{b.get('thai')}'")
            if NUMBERED_LIST_RE.match(translit):
                msgs.append(f"  block[{i}]: thaiExample translit looks like list marker: '{translit[:60]}'")
            if SENTENCE_RE.match(translit) and len(translit.split()) >= 4:
                msgs.append(f"  block[{i}]: thaiExample translit looks like a sentence: '{translit[:60]}'")
            if re.search(r'[.!?]\s+\S', translit):
                msgs.append(f"  block[{i}]: thaiExample translit contains sentence punctuation: '{translit[:60]}'")
    return msgs


def main():
    failed = 0
    files = sorted(CONTENT_DIR.glob("*.json"))
    for f in files:
        data = json.loads(f.read_text())
        msgs = issues_for(data)
        if msgs:
            failed += 1
            print(f"\n{f.name}:")
            for m in msgs:
                print(f"  {m}")
    if failed:
        print(f"\n{failed}/{len(files)} files have issues")
        sys.exit(1)
    print(f"All {len(files)} files clean.")


if __name__ == "__main__":
    main()

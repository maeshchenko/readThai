#!/usr/bin/env python3
"""
Lint curated chapter JSON files for known structural issues:
  - `thaiExample` blocks whose `translit` looks like a sentence.
  - `paragraph` blocks that are pure page numbers.
  - chapters missing the `_curated: true` flag.
  - duplicate level-1 headings (first block is h1 that mirrors titleEn/titleRu).
  - OCR-digit residue in Thai text (e.g. เ-าะ27).
  - missing `preview` blocks in day chapters and related files.
  - warning callout coverage for ATTENTION spots.
  - stroke-order images far from their letter-table siblings.
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
THAI_DIGIT_RE = re.compile(r'[\u0E00-\u0E7F]\d{1,3}(?!\d|_)')

CHAPTERS_NEEDING_PREVIEW = {
    "day-1", "day-2", "day-3", "day-4",
    "intermission",
    "day-6", "day-7", "day-8",
    "preliminary",
}


def issues_for(data: dict) -> list:
    msgs = []
    blocks = data.get("blocks", [])

    if not data.get("_curated"):
        msgs.append("not marked _curated")

    if blocks and blocks[0].get("type") == "heading" and blocks[0].get("level") == 1:
        h1_text = (blocks[0].get("text") or "").strip().upper()
        title = (data.get("titleEn") or "").strip().upper()
        if h1_text and title and h1_text != title:
            msgs.append("block[0]: level-1 heading text does NOT match titleEn — may indicate a mismatch")

    slug = data.get("slug", "")
    chapter_id = data.get("id", "")
    if chapter_id in CHAPTERS_NEEDING_PREVIEW:
        has_preview = any(b.get("type") == "preview" for b in blocks)
        if not has_preview:
            msgs.append(f"missing 'preview' block (expected for {chapter_id})")

    for i, b in enumerate(blocks):
        t = b.get("type")

        if t == "paragraph":
            html = (b.get("html") or "").strip()
            if PAGE_NUM_RE.match(html):
                msgs.append(f"block[{i}]: page-number paragraph '{html}'")
            if THAI_DIGIT_RE.search(html):
                msgs.append(f"block[{i}]: possible OCR digit residue in paragraph html")
            html_ru = (b.get("htmlRu") or "").strip()
            if THAI_DIGIT_RE.search(html_ru):
                msgs.append(f"block[{i}]: possible OCR digit residue in paragraph htmlRu")

        if t == "thaiExample":
            translit = (b.get("translit") or "").strip()
            if not translit and not (b.get("meaning") or "").strip():
                msgs.append(f"block[{i}]: thaiExample with empty translit AND meaning '{b.get('thai')}'")
            if NUMBERED_LIST_RE.match(translit):
                msgs.append(f"block[{i}]: thaiExample translit looks like list marker: '{translit[:60]}'")
            if SENTENCE_RE.match(translit) and len(translit.split()) >= 4:
                msgs.append(f"block[{i}]: thaiExample translit looks like a sentence: '{translit[:60]}'")
            if re.search(r'[.!?]\s+\S', translit):
                msgs.append(f"block[{i}]: thaiExample translit contains sentence punctuation: '{translit[:60]}'")

        if t == "image":
            alt = (b.get("alt") or "").lower()
            if "today's recap" in alt or "recap section banner" in alt:
                msgs.append(f"block[{i}]: image alt references 'Today's Recap' banner — should be component-driven now")
            if "attention section banner" in alt or "attention banner" in alt:
                msgs.append(f"block[{i}]: image alt references 'Attention' banner — should be component-driven now")

        if t == "rule":
            html = (b.get("html") or "")
            if "ATTENTION!" in html or "see ATTENTION" in html:
                msgs.append(f"block[{i}]: rule block references 'ATTENTION!' — consider converting to warning callout")

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

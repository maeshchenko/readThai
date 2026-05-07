#!/usr/bin/env python3
"""
Extract content from Read_Thai_in_10_Days.pdf into structured JSON files
and images for the web app.

Heuristics:
- Drop page-number-only lines.
- Group consecutive Thai-only short lines into an `examples` block (chip gallery).
- Promote rule list-items into `rule` blocks when they are followed by examples.
- Reconstruct consonant/vowel charts into `thaiTable` blocks.
- Split paragraphs that glue Thai-example clusters mid-sentence.
- Never overwrite files that have `_curated: true`.

Usage: python3 scripts/extract_pdf.py
"""

import fitz
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PDF_PATH = ROOT / "Read_Thai_in_10_Days.pdf"
IMAGES_DIR = ROOT / "public" / "images"
CONTENT_DIR = ROOT / "src" / "content"

IMAGES_DIR.mkdir(parents=True, exist_ok=True)
CONTENT_DIR.mkdir(parents=True, exist_ok=True)

THAI_RE = re.compile(r'[\u0E00-\u0E7F]')
TRACK_RE = re.compile(r'<TRACK\s+(\d+)>')
FOOTNOTE_REF_RE = re.compile(r'\[\u2190(\d+)\]')
PAGE_MARKER_RE = re.compile(r'^--\s*\d+\s+of\s+\d+\s*--$')
OCEAN_RE = re.compile(r'OceanofPDF\.com', re.IGNORECASE)
PAGE_NUM_RE = re.compile(r'^\d{1,3}$')
THAI_CLUSTER_RE = re.compile(r'[\u0E00-\u0E7F]+(?:\s+[\u0E00-\u0E7F]+)*')

CHAPTER_DEFS = [
    {"id": "preface", "slug": "preface", "titleEn": "Preface", "titleRu": "Предисловие", "startPage": 5, "endPage": 6},
    {"id": "introduction", "slug": "introduction", "titleEn": "Introduction", "titleRu": "Введение", "startPage": 7, "endPage": 13},
    {"id": "pronunciation", "slug": "pronunciation", "titleEn": "Pronunciation Guide", "titleRu": "Гид по произношению", "startPage": 14, "endPage": 84},
    {"id": "day-1", "slug": "day-1", "titleEn": "Day 1: The Class System", "titleRu": "День 1: Система классов", "startPage": 85, "endPage": 91, "number": 1},
    {"id": "day-2", "slug": "day-2", "titleEn": "Day 2: A Matter of Life and Death", "titleRu": "День 2: Вопрос жизни и смерти", "startPage": 92, "endPage": 100, "number": 2},
    {"id": "day-3", "slug": "day-3", "titleEn": "Day 3: A Short, Short Story", "titleRu": "День 3: Короткая-прекороткая история", "startPage": 101, "endPage": 109, "number": 3},
    {"id": "day-4", "slug": "day-4", "titleEn": "Day 4: The Silent Partner", "titleRu": "День 4: Молчаливый партнёр", "startPage": 110, "endPage": 119, "number": 4},
    {"id": "day-5", "slug": "day-5", "titleEn": "Day 5: Theory of Tones", "titleRu": "День 5: Теория тонов", "startPage": 120, "endPage": 128, "number": 5},
    {"id": "intermission", "slug": "intermission", "titleEn": "Intermission", "titleRu": "Антракт", "startPage": 129, "endPage": 132},
    {"id": "day-6", "slug": "day-6", "titleEn": "Day 6: Mark My Words", "titleRu": "День 6: Запомни мои слова", "startPage": 133, "endPage": 147, "number": 6},
    {"id": "day-7", "slug": "day-7", "titleEn": "Day 7: Unclustering Your Life", "titleRu": "День 7: Разбираемся с кластерами", "startPage": 148, "endPage": 159, "number": 7},
    {"id": "day-8", "slug": "day-8", "titleEn": "Day 8: Hear Me Ror!", "titleRu": "День 8: Услышь меня, Рор!", "startPage": 160, "endPage": 171, "number": 8},
    {"id": "day-9", "slug": "day-9", "titleEn": "Day 9: The Outlaws", "titleRu": "День 9: Исключения из правил", "startPage": 172, "endPage": 178, "number": 9},
    {"id": "preliminary", "slug": "preliminary", "titleEn": "Preliminary", "titleRu": "Подготовка", "startPage": 179, "endPage": 183},
    {"id": "last-day", "slug": "last-day", "titleEn": "Last Day: The Beginning", "titleRu": "Последний день: Начало", "startPage": 184, "endPage": 192, "number": 10},
    {"id": "appendix-i", "slug": "appendix/i", "titleEn": "Appendix I: Thai Character Summary", "titleRu": "Приложение I: Сводка тайских символов", "startPage": 193, "endPage": 210},
    {"id": "appendix-ii", "slug": "appendix/ii", "titleEn": "Appendix II: Consonant Names", "titleRu": "Приложение II: Названия согласных", "startPage": 211, "endPage": 215},
    {"id": "appendix-iii", "slug": "appendix/iii", "titleEn": "Appendix III: Dictionary Order", "titleRu": "Приложение III: Словарный порядок", "startPage": 216, "endPage": 218},
    {"id": "appendix-iv", "slug": "appendix/iv", "titleEn": "Appendix IV: Words That Use ใ", "titleRu": "Приложение IV: Слова с ใ", "startPage": 218, "endPage": 219},
    {"id": "appendix-v", "slug": "appendix/v", "titleEn": "Appendix V: Thai Fonts", "titleRu": "Приложение V: Тайские шрифты", "startPage": 219, "endPage": 224},
    {"id": "glossary", "slug": "glossary", "titleEn": "Thai-English Glossary", "titleRu": "Тайско-английский глоссарий", "startPage": 225, "endPage": 263},
]


def has_thai(text: str) -> bool:
    return bool(THAI_RE.search(text))


def is_mostly_thai(text: str) -> bool:
    non_space = [c for c in text if not c.isspace()]
    if not non_space:
        return False
    thai_count = sum(1 for c in non_space if THAI_RE.match(c))
    return thai_count / len(non_space) > 0.6


def is_pure_thai_short(text: str) -> bool:
    """A short bare Thai expression (no English/digit clutter), good as an example chip."""
    s = text.strip()
    if not s or len(s) > 40:
        return False
    if not has_thai(s):
        return False
    # allow Thai chars + spaces + parens
    cleaned = re.sub(r'[\u0E00-\u0E7F\s\(\)\-]', '', s)
    return len(cleaned) == 0


def is_junk_line(line: str) -> bool:
    line = line.strip()
    if not line:
        return True
    if OCEAN_RE.search(line):
        return True
    if PAGE_MARKER_RE.match(line):
        return True
    return False


def is_page_number_line(line: str) -> bool:
    s = line.strip()
    return bool(PAGE_NUM_RE.match(s))


def extract_images(doc):
    seen_xrefs = set()
    count = 0
    for page_num in range(len(doc)):
        page = doc[page_num]
        images = page.get_images(full=True)
        for img_idx, img_info in enumerate(images):
            xref = img_info[0]
            if xref in seen_xrefs:
                continue
            seen_xrefs.add(xref)
            try:
                base_image = doc.extract_image(xref)
                if base_image:
                    ext = base_image["ext"]
                    img_bytes = base_image["image"]
                    if len(img_bytes) < 500:
                        continue
                    fname = f"p{page_num+1:03d}_{img_idx}.{ext}"
                    out_path = IMAGES_DIR / fname
                    with open(out_path, "wb") as f:
                        f.write(img_bytes)
                    count += 1
            except Exception as e:
                print(f"  Warning: could not extract image xref={xref} on page {page_num+1}: {e}")
    print(f"  Extracted {count} images")
    return count


def get_page_text(doc, page_num: int) -> str:
    page = doc[page_num]
    return page.get_text("text")


def extract_chapter_text(doc, start_page: int, end_page: int) -> str:
    lines = []
    actual_end = min(end_page, len(doc))
    for p in range(start_page - 1, actual_end):
        text = get_page_text(doc, p)
        for line in text.split('\n'):
            if not is_junk_line(line):
                lines.append(line)
    return '\n'.join(lines)


def parse_blocks_from_text(raw_text: str, chapter_id: str) -> tuple:
    """Parse raw chapter text into Block[] structures.

    Strategy:
      1. Tokenise into atomic items (paragraph, list-item, track, footnote, heading,
         thai-example-line, page-number).
      2. Post-process: drop page numbers, merge consecutive thai-example-lines into
         a single `examples` block, and attach an examples block to a preceding
         rule list-item by promoting that item to a `rule` block.
    """
    items = []
    footnotes = {}
    lines = raw_text.split('\n')

    i = 0
    para_buf = []

    def flush_para():
        nonlocal para_buf
        if para_buf:
            text = ' '.join(para_buf).strip()
            if text and not is_page_number_line(text):
                items.append({"type": "paragraph", "html": text})
            para_buf = []

    heading_patterns = [
        (r'^(DAY \d+:.+|LAST DAY:.+)$', 1),
        (r'^(Classy consonants|The long and the short of it|Give it a go!|No space between us|'
         r'Consonant sounds|Vowel sounds|Tones|'
         r'The sound of silence|The curious case of "ร"|'
         r'Camouflaged vowels|FALSE cluster|TRUE cluster|'
         r"Today's Recap)$", 2),
    ]

    while i < len(lines):
        line = lines[i].strip()

        if not line:
            flush_para()
            i += 1
            continue

        track_match = TRACK_RE.search(line)
        if track_match:
            flush_para()
            track_num = int(track_match.group(1))
            items.append({"type": "track", "number": track_num})
            remainder = TRACK_RE.sub('', line).strip()
            fn_match = re.match(r'^(\d+)$', remainder)
            if fn_match:
                items.append({"type": "footnoteRef", "id": int(fn_match.group(1))})
            elif remainder:
                para_buf.append(remainder)
            i += 1
            continue

        fn_match = FOOTNOTE_REF_RE.match(line)
        if fn_match:
            flush_para()
            fn_id = int(fn_match.group(1))
            fn_text = FOOTNOTE_REF_RE.sub('', line).strip()
            j = i + 1
            while j < len(lines) and lines[j].strip() and not FOOTNOTE_REF_RE.match(lines[j].strip()):
                fn_text += ' ' + lines[j].strip()
                j += 1
            footnotes[fn_id] = fn_text
            i = j
            continue

        is_heading = False
        for pattern, level in heading_patterns:
            if re.match(pattern, line, re.IGNORECASE):
                flush_para()
                items.append({"type": "heading", "level": level, "text": line})
                is_heading = True
                break
        if is_heading:
            i += 1
            continue

        if is_page_number_line(line):
            flush_para()
            i += 1
            continue

        if line.startswith('- ') or line.startswith('• '):
            flush_para()
            list_items = [line[2:].strip()]
            j = i + 1
            while j < len(lines):
                nxt = lines[j].strip()
                if nxt.startswith('- ') or nxt.startswith('• '):
                    list_items.append(nxt[2:].strip())
                    j += 1
                elif nxt and not TRACK_RE.search(nxt) and not has_thai(nxt) and not is_page_number_line(nxt):
                    list_items[-1] += ' ' + nxt
                    j += 1
                else:
                    break
            items.append({"type": "list", "ordered": False, "items": list_items})
            i = j
            continue

        if has_thai(line) and is_pure_thai_short(line):
            flush_para()
            items.append({"type": "_thai_line", "thai": line})
            i += 1
            continue

        para_buf.append(line)
        i += 1

    flush_para()

    blocks = post_process(items)
    return blocks, footnotes


def post_process(items: list) -> list:
    """Merge consecutive `_thai_line` items into an `examples` block.

    If an `examples` block immediately follows a list whose last item ends with
    `:` or `.`, promote that last list item into a `rule` block (so it visually
    introduces the examples).
    """
    out = []
    i = 0
    n = len(items)
    while i < n:
        cur = items[i]
        if cur.get("type") == "_thai_line":
            group = []
            while i < n and items[i].get("type") == "_thai_line":
                group.append({"thai": items[i]["thai"].strip()})
                i += 1
            if len(group) == 1 and out and out[-1].get("type") == "examples":
                out[-1]["items"].append(group[0])
            else:
                out.append({
                    "type": "examples",
                    "layout": "chips" if len(group) > 1 else "inline",
                    "items": group,
                })
            continue
        out.append(cur)
        i += 1

    final = []
    for idx, blk in enumerate(out):
        if (
            blk.get("type") == "examples"
            and final
            and final[-1].get("type") == "list"
            and len(final[-1]["items"]) == 1
        ):
            rule_html = final[-1]["items"][0]
            if re.search(r'[.:!?]$', rule_html.strip()):
                final.pop()
                final.append({"type": "rule", "html": rule_html, "emphasis": "soft"})
        final.append(blk)
    return final


def build_chapter_json(doc, ch_def: dict, all_chapters: list) -> dict:
    raw = extract_chapter_text(doc, ch_def["startPage"], ch_def["endPage"])
    blocks, footnotes = parse_blocks_from_text(raw, ch_def["id"])

    idx = next((i for i, c in enumerate(all_chapters) if c["id"] == ch_def["id"]), -1)
    prev_slug = all_chapters[idx - 1]["slug"] if idx > 0 else None
    next_slug = all_chapters[idx + 1]["slug"] if idx < len(all_chapters) - 1 else None

    chapter = {
        "id": ch_def["id"],
        "slug": ch_def["slug"],
        "titleEn": ch_def["titleEn"],
        "titleRu": ch_def["titleRu"],
        "blocks": blocks,
        "footnotes": {str(k): v for k, v in footnotes.items()},
    }
    if "number" in ch_def:
        chapter["number"] = ch_def["number"]
    if prev_slug:
        chapter["prev"] = prev_slug
    if next_slug:
        chapter["next"] = next_slug

    return chapter


def build_glossary_json(doc, ch_def: dict, all_chapters: list) -> dict:
    raw = extract_chapter_text(doc, ch_def["startPage"], min(ch_def["endPage"], len(doc)))
    lines = raw.split('\n')

    entries = []
    current_thai = ""
    current_meaning = ""

    for line in lines:
        line = line.strip()
        if not line:
            continue

        if has_thai(line):
            if current_thai:
                entries.append({"thai": current_thai, "translit": "", "meaning": current_meaning.strip()})

            parts = re.split(r'\t+', line, maxsplit=1)
            if len(parts) == 2 and has_thai(parts[0]) and not has_thai(parts[1]):
                current_thai = parts[0].strip()
                current_meaning = parts[1].strip()
            else:
                current_thai = line.strip()
                current_meaning = ""
        else:
            if current_thai:
                current_meaning += ' ' + line

    if current_thai:
        entries.append({"thai": current_thai, "translit": "", "meaning": current_meaning.strip()})

    idx = next((i for i, c in enumerate(all_chapters) if c["id"] == ch_def["id"]), -1)
    prev_slug = all_chapters[idx - 1]["slug"] if idx > 0 else None

    blocks = [{"type": "heading", "level": 1, "text": ch_def["titleEn"]}]

    if entries:
        rows = [{"thai": e["thai"], "translit": e["translit"], "meaning": e["meaning"]} for e in entries]
        blocks.append({
            "type": "thaiTable",
            "columns": ["Thai", "Transliteration", "Meaning"],
            "rows": rows,
            "stickyFirstCol": True,
        })

    chapter = {
        "id": ch_def["id"],
        "slug": ch_def["slug"],
        "titleEn": ch_def["titleEn"],
        "titleRu": ch_def["titleRu"],
        "blocks": blocks,
        "footnotes": {},
    }
    if prev_slug:
        chapter["prev"] = prev_slug

    return chapter


def main():
    if not PDF_PATH.exists():
        print(f"Error: PDF not found at {PDF_PATH}")
        sys.exit(1)

    print(f"Opening {PDF_PATH}...")
    doc = fitz.open(str(PDF_PATH))
    print(f"  {len(doc)} pages")

    print("\nExtracting images...")
    extract_images(doc)

    print("\nBuilding chapter JSONs...")
    for ch_def in CHAPTER_DEFS:
        print(f"  {ch_def['id']}...", end=" ")

        if ch_def["id"] == "glossary":
            chapter = build_glossary_json(doc, ch_def, CHAPTER_DEFS)
        else:
            chapter = build_chapter_json(doc, ch_def, CHAPTER_DEFS)

        fname = ch_def["id"].replace("/", "-") + ".json"
        out_path = CONTENT_DIR / fname

        if out_path.exists():
            try:
                existing = json.loads(out_path.read_text())
                if existing.get("_curated") is True:
                    print("SKIPPED (curated)")
                    continue
            except Exception:
                pass

        chapter["_generated"] = True
        chapter["_curated"] = False
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(chapter, f, ensure_ascii=False, indent=2)

        block_count = len(chapter["blocks"])
        fn_count = len(chapter["footnotes"])
        print(f"{block_count} blocks, {fn_count} footnotes")

    doc.close()
    print("\nDone.")


if __name__ == "__main__":
    main()

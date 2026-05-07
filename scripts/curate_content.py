#!/usr/bin/env python3
"""
Curate already-extracted chapter JSON files.

Operates only on the existing src/content/*.json files (no PDF re-extraction):
  1. Drop paragraphs that are pure page numbers ("28", "5", ...).
  2. Drop standalone short ASCII fragments that look like junk (e.g. single letters).
  3. Re-classify broken `thaiExample` blocks: when `translit` looks like prose
     (capitalised sentence, multiple words with sentence punctuation, or starts
     with a numbered list marker), split it into:
       - an `examples` chip with the Thai
       - a regular `paragraph` carrying the prose continuation
  4. Merge consecutive bare-Thai `paragraph` blocks (and `examples` chips with
     a single item) into a single `examples` chip-grid block.
  5. When a list with one item ending in `:` / `.` is immediately followed by
     an `examples` block, promote the list to a `rule` block.
  6. Mark each chapter with `_curated: true`.

Usage: python3 scripts/curate_content.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / "src" / "content"

THAI_RE = re.compile(r'[\u0E00-\u0E7F]')
PAGE_NUM_RE = re.compile(r'^\d{1,3}$')
PURE_THAI_RE = re.compile(r'^[\u0E00-\u0E7F\s\(\)\-]+$')
THAI_BULLET_RE = re.compile(r'^[-\u2022]?\s*[\u0E00-\u0E7F\s\(\)\-,]+$')
SENTENCE_RE = re.compile(r'^[A-ZА-Я0-9].{20,}')
NUMBERED_LIST_RE = re.compile(r'^\d+\.\s+[A-ZА-Я]')
PHONETIC_RE = re.compile(r'^[/\(]?\s*[a-zA-Zàâäãáảạăắặằằẳắéèẹẻếệềểễíìịỉĩóòọỏốồộổỗơớờợởỡúùụủũứừựửữýỳỷỹỵăâđêôơưčëğşıíúâ\u00C0-\u024F\.\,\-\s\'\"]+[/\)]?$')
TRANSLIT_LIKELY_RE = re.compile(r'^[\(/\[]?\s*[a-zA-ZÀ-ÿ\u02B0-\u02FF\u0300-\u036F\.\,\-\s\'"\u2019]+\s*(?:[/\)\]]|\s\"[^\"]+\")?\s*$')


def is_pure_thai_short(text: str) -> bool:
    s = text.strip()
    if not s or len(s) > 50:
        return False
    if not THAI_RE.search(s):
        return False
    return bool(PURE_THAI_RE.match(s))


def split_thai_bullet_list(text: str) -> list:
    """If a paragraph looks like `- ก, ข, ค` (a comma-separated Thai bullet list),
    return the individual Thai items. Otherwise return [].
    """
    s = text.strip()
    if not s:
        return []
    if not THAI_RE.search(s):
        return []
    s = re.sub(r'^[-\u2022]\s*', '', s)
    if not THAI_BULLET_RE.match('-' + s):
        return []
    if len(s) > 120:
        return []
    parts = [p.strip() for p in s.split(',')]
    parts = [p for p in parts if p and THAI_RE.search(p)]
    if len(parts) < 2:
        return []
    for p in parts:
        if len(p) > 30:
            return []
        if not PURE_THAI_RE.match(p):
            return []
    return parts


def is_page_number(text: str) -> bool:
    return bool(PAGE_NUM_RE.match(text.strip()))


def is_junk_paragraph(text: str) -> bool:
    s = text.strip()
    if not s:
        return True
    if is_page_number(s):
        return True
    return False


def looks_like_real_translit(s: str) -> bool:
    """A real transliteration is short, low-case, mostly letters with diacritics
    or slash-bracketed phonetic notation. It does NOT start with a capital
    sentence opener and a long string of words.
    """
    s = (s or "").strip()
    if not s:
        return False
    if len(s) > 60:
        return False
    if NUMBERED_LIST_RE.match(s):
        return False
    if SENTENCE_RE.match(s):
        words = s.split()
        if len(words) >= 4:
            return False
    if re.search(r'[.!?]\s+\S', s):
        return False
    return True


def normalise_blocks(blocks: list) -> list:
    out = []
    for b in blocks:
        t = b.get("type")
        if t == "paragraph":
            html = b.get("html", "").strip()
            if is_junk_paragraph(html):
                continue
            bullet_items = split_thai_bullet_list(html)
            if bullet_items:
                out.append({
                    "type": "examples",
                    "layout": "chips",
                    "items": [{"thai": p} for p in bullet_items],
                })
                continue
            out.append({"type": "paragraph", "html": html})
            continue

        if t == "thaiExample":
            thai = (b.get("thai") or "").strip()
            translit = (b.get("translit") or "").strip()
            meaning = (b.get("meaning") or "").strip()
            tone = (b.get("tone") or "").strip()
            if looks_like_real_translit(translit) or meaning:
                kept = {"type": "thaiExample", "thai": thai, "translit": translit}
                if meaning:
                    kept["meaning"] = meaning
                if tone:
                    kept["tone"] = tone
                out.append(kept)
            else:
                out.append({
                    "type": "examples",
                    "layout": "chips",
                    "items": [{"thai": thai}],
                })
                if translit:
                    out.append({"type": "paragraph", "html": translit})
            continue

        if t == "list":
            items = [it for it in b.get("items", []) if it and it.strip()]
            cleaned_items = []
            for it in items:
                if is_junk_paragraph(it):
                    continue
                cleaned_items.append(it)
            if cleaned_items:
                out.append({
                    "type": "list",
                    "ordered": bool(b.get("ordered")),
                    "items": cleaned_items,
                })
            continue

        out.append(b)
    return out


def merge_examples(blocks: list) -> list:
    out = []
    buffer = []

    def flush():
        nonlocal buffer
        if not buffer:
            return
        if len(buffer) == 1:
            out.append({
                "type": "examples",
                "layout": "inline",
                "items": [{"thai": buffer[0]}],
            })
        else:
            out.append({
                "type": "examples",
                "layout": "chips",
                "items": [{"thai": w} for w in buffer],
            })
        buffer = []

    for b in blocks:
        t = b.get("type")
        if t == "paragraph" and is_pure_thai_short(b.get("html", "")):
            buffer.append(b["html"].strip())
            continue
        if t == "examples" and b.get("layout") in (None, "chips", "inline") and len(b.get("items", [])) == 1:
            it = b["items"][0]
            if not it.get("translit") and not it.get("meaning") and is_pure_thai_short(it.get("thai", "")):
                buffer.append(it["thai"].strip())
                continue
        flush()
        out.append(b)
    flush()
    return out


def promote_rules(blocks: list) -> list:
    """When a list with exactly one item ending in . : ! ? is followed by an
    `examples` block, lift that item to a `rule` block.
    """
    out = []
    i = 0
    n = len(blocks)
    while i < n:
        cur = blocks[i]
        nxt = blocks[i + 1] if i + 1 < n else None
        if (
            nxt
            and nxt.get("type") == "examples"
            and cur.get("type") == "list"
            and len(cur.get("items", [])) == 1
            and re.search(r'[.:!?]\s*$', cur["items"][0].strip())
        ):
            out.append({"type": "rule", "html": cur["items"][0].strip(), "emphasis": "soft"})
            i += 1
            continue
        if (
            nxt
            and nxt.get("type") == "examples"
            and cur.get("type") == "paragraph"
            and 8 < len(cur.get("html", "").strip()) < 200
            and re.search(r'[.:!?]\s*$', cur["html"].strip())
            and re.search(r'\b(if|when|whenever|but|note that)\b', cur["html"], re.I)
        ):
            out.append({"type": "rule", "html": cur["html"].strip(), "emphasis": "soft"})
            i += 1
            continue
        out.append(cur)
        i += 1
    return out


def curate_chapter(data: dict) -> dict:
    blocks = data.get("blocks", [])
    blocks = normalise_blocks(blocks)
    blocks = merge_examples(blocks)
    blocks = promote_rules(blocks)
    data["blocks"] = blocks
    data["_curated"] = True
    return data


def main():
    files = sorted(CONTENT_DIR.glob("*.json"))
    for f in files:
        try:
            data = json.loads(f.read_text())
        except Exception as e:
            print(f"  {f.name}: parse error {e}")
            continue
        if data.get("_curated") is True and "--force" not in __import__("sys").argv:
            print(f"  {f.name}: already curated, skipping")
            continue
        before = len(data.get("blocks", []))
        data = curate_chapter(data)
        after = len(data["blocks"])
        f.write_text(json.dumps(data, ensure_ascii=False, indent=2))
        print(f"  {f.name}: {before} -> {after} blocks")


if __name__ == "__main__":
    main()

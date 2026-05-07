#!/usr/bin/env python3
"""
Insert image blocks into chapter JSON content files.

Analyzes the PDF layout to determine where each already-extracted image
belongs in the content flow, then adds { type: "image" } blocks to the
chapter JSONs at the correct positions.

Usage:
    python3 scripts/insert_images.py            # modify JSON files
    python3 scripts/insert_images.py --dry-run   # preview only
"""

import fitz
import json
import re
import sys
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
PDF_PATH = ROOT / "Read_Thai_in_10_Days.pdf"
IMAGES_DIR = ROOT / "public" / "images"
CONTENT_DIR = ROOT / "src" / "content"

CHAPTER_DEFS = [
    {"id": "preface", "startPage": 5, "endPage": 6},
    {"id": "introduction", "startPage": 7, "endPage": 13},
    {"id": "pronunciation", "startPage": 14, "endPage": 84},
    {"id": "day-1", "startPage": 85, "endPage": 91},
    {"id": "day-2", "startPage": 92, "endPage": 100},
    {"id": "day-3", "startPage": 101, "endPage": 109},
    {"id": "day-4", "startPage": 110, "endPage": 119},
    {"id": "day-5", "startPage": 120, "endPage": 128},
    {"id": "intermission", "startPage": 129, "endPage": 132},
    {"id": "day-6", "startPage": 133, "endPage": 147},
    {"id": "day-7", "startPage": 148, "endPage": 159},
    {"id": "day-8", "startPage": 160, "endPage": 171},
    {"id": "day-9", "startPage": 172, "endPage": 178},
    {"id": "preliminary", "startPage": 179, "endPage": 183},
    {"id": "last-day", "startPage": 184, "endPage": 192},
    {"id": "appendix-i", "startPage": 193, "endPage": 210},
    {"id": "appendix-ii", "startPage": 211, "endPage": 215},
    {"id": "appendix-iii", "startPage": 216, "endPage": 218},
    {"id": "appendix-iv", "startPage": 218, "endPage": 219},
    {"id": "appendix-v", "startPage": 219, "endPage": 224},
    {"id": "glossary", "startPage": 225, "endPage": 263},
]

SKIP_IMAGES = {
    "p001_0.jpeg",   # book cover
    "p002_0.jpeg",   # publisher logo (Bingo Lingo)
    "p084_0.jpeg",   # Day 1 title card
    "p091_0.jpeg",   # Day 2 title card
    "p100_0.jpeg",   # Day 3 title card
    "p109_0.jpeg",   # Day 4 title card
    "p119_0.jpeg",   # Day 5 title card
    "p132_0.jpeg",   # Day 6 title card
    "p147_0.jpeg",   # Day 7 title card
    "p159_0.jpeg",   # Day 8 title card
    "p171_0.jpeg",   # Day 9 title card
    "p183_0.jpeg",   # Last Day title card
}

# Override chapter assignment for images on overlapping boundary pages
IMAGE_CHAPTER_OVERRIDE = {
    "p218_0.jpeg": "appendix-iv",
    "p225_0.jpeg": "appendix-v",
    "p225_1.jpeg": "appendix-v",
}

ALT_TEXT = {
    # Introduction (pp 7-13)
    "p008_0.jpeg": "Thai vowel positions: front (ไก), back (กะ), above (กี), underneath (กุ), and enclosing (เกีย)",
    "p008_1.jpeg": "How consonant and vowel combine: ก /g/ + ไ- /-ai/ = ไก /gai/",
    "p008_2.jpeg": "Anatomy of Thai word บ้าน (bâan): initial consonant บ, tone mark ้, vowel า, final consonant น",

    # Pronunciation Guide (pp 14-84)
    "p075_0.jpeg": "Diagram of the five Thai tones: mid (gray), low (yellow), falling (green), high (red), rising (blue)",

    # Day 1 (pp 85-91)
    "p085_0.jpeg": "Low Class Consonants Group 1: น ม ง ร ล ย ว in regular, stylised, and cursive handwriting",
    "p086_0.jpeg": "Stroke order for Low Class Group 1 consonants: ง ม น ร ล ย ว",
    "p087_0.jpeg": "Long vowels: -า -ี -ู เ- แ- โ- -อ in regular, stylised, and cursive handwriting",
    "p088_0.jpeg": "Stroke order for writing long vowels",
    "p088_1.jpeg": "Incorrect syllable segmentation of รอนายมา — wrong way to split the word",
    "p088_2.jpeg": "Another incorrect syllable segmentation of รอนายมา",
    "p089_0.jpeg": "Thai reading example: รอนายมา with syllable separation guide",
    "p090_0.jpeg": "Today's Recap section banner",

    # Day 2 (pp 92-100)
    "p092_0.jpeg": "Low Class Consonants Group 2: ค ท ช ซ พ ฟ ฮ in regular, stylised, and cursive handwriting",
    "p093_0.jpeg": "Attention section banner",
    "p094_0.jpeg": "Stroke order for writing ค ท ช ซ พ ฟ ฮ",
    "p094_1.jpeg": "Long vowels: -ำ ไ- ใ- เ-า เ-ย in regular, stylised, and cursive handwriting",
    "p095_0.jpeg": "Stroke order for writing vowels",
    "p097_1.jpeg": "Illustration: dead syllable final sounds -k, -t, -p shown as tombstones",

    # Day 3 (pp 101-109)
    "p101_0.jpeg": "Mid Class Consonants: ก จ ด ต บ ป อ in regular, stylised, and cursive handwriting",
    "p102_0.jpeg": "Illustration: vowel เ-อ characters clinging to a consonant — 'Don't leave us alone!'",
    "p102_2.jpeg": "How the vowel -อ wraps around consonants: diagram showing ออม",
    "p103_0.jpeg": "Stroke order for writing ก จ ด ต บ ป อ",
    "p103_1.jpeg": "Short vowels: -ะ -ุ- -ิ -ึ -ู in regular, stylised, and cursive handwriting",
    "p105_0.jpeg": "Stroke order for writing additional vowels",

    # Day 4 (pp 110-119)
    "p110_0.jpeg": "High Class Consonants: ข ถ ฉ ส ผ ฝ ห in regular, stylised, and cursive handwriting",
    "p112_0.jpeg": "Stroke order for High Class consonants: ข ถ ฉ ส ผ ฝ ห",
    "p113_0.jpeg": "Illustration: consonant ฆ with leading ห saying 'I was born high class!'",
    "p115_0.jpeg": "Thumbs up illustration — live syllable concept",
    "p115_1.jpeg": "Lemur illustration — live syllable mnemonic",
    "p116_0.jpeg": "Dead fish illustration — dead syllable mnemonic",

    # Day 5 (pp 120-128)
    "p120_1.jpeg": "Long vowels -ือ เ-อ -ัว in regular, stylised, and cursive handwriting",
    "p121_0.jpeg": "Vowel -ัว examples with transliterations: สัว/สวย, ปัว/ปวด, ทัว/ทวง",
    "p121_1.jpeg": "Thai reading practice: words using vowels -ือ เ-อ -ัว",
    "p122_0.jpeg": "Stroke order for compound vowels",
    "p123_0.jpeg": "Tone diagram for live syllables: 3 possible tones by consonant class",
    "p124_0.jpeg": "Comparison of syllables across High Class, Mid Class, and Low Class consonants",
    "p124_1.jpeg": "Tone diagram for dead syllables: tones vary by consonant class",
    "p125_0.jpeg": "Tone comparison for dead syllables: short vowel (left) vs long vowel (right)",
    "p126_0.jpeg": "Day 5 summary: complete tone rules chart",

    # Day 6 (pp 133-147)
    "p133_0.jpeg": "Compound vowels เ-าะ เ-ีย เ-ือ in regular, stylised, and cursive handwriting",
    "p134_0.jpeg": "Illustration: how to read words starting with เ — find the key consonant first",
    "p134_1.jpeg": "Step 2: check above the consonant for tone marks",
    "p135_0.jpeg": "Step 3: if nothing above, check end of syllable for the vowel",
    "p136_0.jpeg": "Step 4: if nothing above or at end, the vowel is เ- (long -ay)",
    "p137_0.jpeg": "Tone marks: ่ ้ ๊ ๋ in regular, stylised, and cursive handwriting",
    "p137_1.jpeg": "The four Thai tone marks: ่ ้ ๊ ๋ shown as numbers 1-4",
    "p138_0.jpeg": "Tone diagram showing tones with tone marks applied",
    "p139_0.jpeg": "Tone diagram showing how tone mark ่ shifts tones across consonant classes",
    "p139_1.jpeg": "Tone mark ่ examples: words across HC, MC, LC with transliterations",
    "p140_0.jpeg": "Reading examples with tone marks: ก๋วยเตี่ยว, โป๊, ก๊าซ, จ่า and more",
    "p141_0.jpeg": "Illustration: the four tone marks explain their roles — ่ low/falling, ้ falling/high, ๊ high, ๋ rising",
    "p142_0.jpeg": "Tone mark comparison: same syllable with different tone marks",
    "p143_0.jpeg": "Compound vowels เ-าะ เ-ีย เ-ือ with stroke orders",
    "p145_0.jpeg": "Thai reading practice: sentences in standard font",

    # Day 7 (pp 148-159)
    "p148_0.jpeg": "Less Common Consonants: ญ ณ ฆ ธ ภ ศ ษ in regular, stylised, and cursive handwriting",
    "p150_0.jpeg": "Stroke order for less common consonants ญ ณ ฆ ธ ภ ศ ษ",
    "p151_0.jpeg": "Illustration: the word 'strengths' showing consonant clusters (cluttered consonants)",
    "p153_0.jpeg": "True consonant cluster examples",
    "p154_0.jpeg": "False consonant cluster examples",
    "p155_0.jpeg": "Consonant cluster reading practice: words with true and false clusters",
    "p156_0.jpeg": "False cluster pronunciation: อโศก, นนทบุรี, ขนม with highlighted sounds",
    "p156_1.jpeg": "Cluster pronunciation: สุขภาพ, ผลไม้, จักรยาน with highlighted cluster sounds",
    "p159_0.jpeg": "Day 7 summary chart",

    # Day 8 (pp 160-171)
    "p160_0.jpeg": "Less Common Consonants: ฬ ฌ ฑ ท ฎ ฏ ฐ in regular, stylised, and cursive handwriting",
    "p162_0.jpeg": "Stroke order for less common consonants",
    "p162_1.jpeg": "The silent mark (การันต์) in standard, stylised, and cursive forms",
    "p163_0.jpeg": "Words with silent marks (การันต์): อาทิตย์, กอล์ฟ, อารมณ์, แชร์",
    "p163_1.jpeg": "More words with silent marks showing which consonant is silenced",
    "p163_2.jpeg": "Additional silent mark examples",
    "p164_1.jpeg": "Long and short vowel pairs: เล»เละ, แพ»แพะ, โป»โปะ, etc.",
    "p164_2.jpeg": "Additional vowel pair examples",
    "p165_0.jpeg": "The character ร: forms and variations",
    "p165_1.jpeg": "ร writing examples",
    "p165_2.jpeg": "Additional ร character forms",
    "p168_0.jpeg": "Illustration: the four roles of ร — many sounds, disguise, vocalise, be quiet",
    "p169_0.jpeg": "Thai reading practice: text about การไหว้ (the wai greeting)",
    # Day 9 (pp 172-178)
    "p172_0.jpeg": "Thai numerals ๐-๙ in regular, stylised, and cursive handwriting",
    "p172_1.jpeg": "Thai and Arabic numeral comparison",
    "p173_0.jpeg": "Words with อย- pattern: อย่า, อยู่, อย่าง, อยาก with transliterations",
    "p175_0.jpeg": "Special syllable ฤ (/rúe'/, /rí/ or /rer/) in standard, stylised, and cursive",
    "p175_1.jpeg": "Additional special syllables and irregular spelling examples",
    "p176_0.jpeg": "The repetition mark ๆ (máí yamók) in standard, stylised, and cursive forms",
    "p177_0.jpeg": "Thai reading practice text",
    "p177_1.jpeg": "Thai reading practice: handwritten-style text about Thai food",

    # Last Day (pp 184-192)
    "p188_0.jpeg": "Thai reading practice: words with silent letters and special spellings",
    "p189_0.jpeg": "Thai word segmentation examples: ไป, ใกล้, โมง, เห็น, แล้ว with syllable boundaries",
    "p189_1.jpeg": "More word segmentation examples with syllable boundaries",
    "p189_2.jpeg": "Additional word segmentation examples",
    "p189_3.jpeg": "Complex word segmentation examples",
    "p190_0.jpeg": "Syllable boundary examples",
    "p190_1.jpeg": "Word segmentation practice",
    "p190_2.jpeg": "Additional segmentation examples",
    "p191_0.jpeg": "Thai reading practice: paragraph about respect and gratitude",

    # Appendix IV (p 218)
    "p218_0.jpeg": "Complete list of words that use the vowel ใ",
}

# Appendix V font samples (pp 219-225)
for _pg in range(219, 226):
    for _idx in range(3):
        _fn = f"p{_pg:03d}_{_idx}.jpeg"
        if _fn not in ALT_TEXT:
            _sample_num = (_pg - 219) * 3 + _idx + 1
            ALT_TEXT[_fn] = f"Thai characters shown in various typefaces — sample {_sample_num}"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def normalize(text: str) -> str:
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'&[a-z]+;', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def get_chapter_for_page(page_num: int):
    # When page ranges overlap, prefer the chapter that starts on this page
    for ch in CHAPTER_DEFS:
        if ch["startPage"] == page_num:
            return ch
    for ch in CHAPTER_DEFS:
        if ch["startPage"] <= page_num <= ch["endPage"]:
            return ch
    return None


def get_block_text(block: dict) -> str:
    t = block.get("type", "")
    if t == "paragraph":
        return normalize(block.get("html", ""))
    if t == "heading":
        return block.get("text", "")
    if t == "list":
        return " ".join(normalize(x) for x in block.get("items", []))
    if t == "rule":
        return normalize(block.get("html", ""))
    if t == "callout":
        return normalize(block.get("html", ""))
    if t == "examples":
        return " ".join(it.get("thai", "") for it in block.get("items", []))
    if t == "thaiExample":
        return block.get("thai", "")
    if t == "exercise":
        return normalize(block.get("instruction", ""))
    if t == "recap":
        return " ".join(normalize(x) for x in block.get("items", []))
    if t == "thaiTable":
        parts = []
        for row in block.get("rows", []):
            parts.append(row.get("thai", ""))
            if row.get("translit"):
                parts.append(row["translit"])
        return " ".join(parts)
    return ""


def find_block_index(blocks, anchor_text, page_fraction, min_idx=0):
    """Return the index of the block AFTER which the image should be inserted."""
    if not anchor_text or len(anchor_text.strip()) < 5:
        return max(min_idx, min(int(page_fraction * len(blocks)), len(blocks) - 1))

    anchor_norm = normalize(anchor_text)
    if len(anchor_norm) < 5:
        return max(min_idx, min(int(page_fraction * len(blocks)), len(blocks) - 1))

    for snippet_len in [120, 80, 50, 30, 18]:
        snippet = anchor_norm[-snippet_len:] if len(anchor_norm) >= snippet_len else anchor_norm
        snippet_lower = snippet.lower()
        for i in range(min_idx, len(blocks)):
            block_text = get_block_text(blocks[i]).lower()
            if len(block_text) >= 5 and snippet_lower in block_text:
                return i

    return max(min_idx, min(int(page_fraction * len(blocks)), len(blocks) - 1))


def get_page_layout(doc, page_idx):
    """Return text and image items on a page, sorted by vertical position."""
    page = doc[page_idx]
    page_num = page_idx + 1
    items = []

    td = page.get_text("dict")
    for block in td["blocks"]:
        if block["type"] == 0:
            text_parts = []
            for line in block.get("lines", []):
                line_text = "".join(span.get("text", "") for span in line.get("spans", []))
                text_parts.append(line_text)
            full_text = "\n".join(text_parts).strip()
            if full_text:
                items.append({"kind": "text", "y": block["bbox"][1], "text": full_text})

    page_images = page.get_images(full=True)
    seen_xrefs = set()

    for img_idx, img_info in enumerate(page_images):
        xref = img_info[0]
        if xref in seen_xrefs:
            continue
        seen_xrefs.add(xref)

        fname = f"p{page_num:03d}_{img_idx}.jpeg"
        if not (IMAGES_DIR / fname).exists():
            for ext in ("png", "jpg"):
                alt = f"p{page_num:03d}_{img_idx}.{ext}"
                if (IMAGES_DIR / alt).exists():
                    fname = alt
                    break
            else:
                continue

        if fname in SKIP_IMAGES:
            continue

        img_bytes = doc.extract_image(xref)
        if img_bytes and len(img_bytes.get("image", b"")) < 500:
            continue

        y = 9999.0
        try:
            rects = page.get_image_rects(img_info)
            if rects:
                y = rects[0].y0
        except Exception:
            try:
                rects = page.get_image_rects(xref)
                if rects:
                    y = rects[0].y0
            except Exception:
                pass

        if y == 9999.0:
            for blk in td["blocks"]:
                if blk["type"] == 1:
                    y = blk["bbox"][1]
                    break

        items.append({"kind": "image", "y": y, "filename": fname})

    items.sort(key=lambda x: x["y"])
    return items


def generate_alt(filename, chapter_id):
    if filename in ALT_TEXT:
        return ALT_TEXT[filename]

    titles = {ch["id"]: ch["id"].replace("-", " ").replace("/", " ").title() for ch in CHAPTER_DEFS}
    title = titles.get(chapter_id, chapter_id)
    return f"Illustration from {title}"


def remove_appendix_v_placeholder(blocks):
    for i, block in enumerate(blocks):
        if block.get("type") == "callout" and "printed edition" in block.get("html", "").lower():
            blocks.pop(i)
            return True
    return False


def relocate_early_images(blocks):
    """Move images stuck between chapter title and first paragraph to after that paragraph.

    In the PDF, large charts often sit at the top of a page *above* the
    introductory text.  The layout-based insertion mirrors that order, but the
    web reading flow is better if the explanatory text comes first.
    """
    if len(blocks) < 3 or blocks[0].get("type") != "heading":
        return blocks

    early_imgs = []
    for i in range(1, len(blocks)):
        if blocks[i].get("type") == "image":
            early_imgs.append(i)
        else:
            break

    if not early_imgs:
        return blocks

    first_para = None
    for i in range(early_imgs[-1] + 1, len(blocks)):
        if blocks[i].get("type") == "paragraph":
            first_para = i
            break

    if first_para is None:
        return blocks

    imgs = [blocks[i] for i in early_imgs]
    rest = [b for i, b in enumerate(blocks) if i not in set(early_imgs)]
    insert_at = first_para - len(early_imgs) + 1
    for img in reversed(imgs):
        rest.insert(insert_at, img)
    return rest


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    dry_run = "--dry-run" in sys.argv

    if not PDF_PATH.exists():
        print(f"Error: PDF not found at {PDF_PATH}")
        sys.exit(1)

    doc = fitz.open(str(PDF_PATH))
    print(f"Opened PDF: {len(doc)} pages")

    # Phase 1: assign each image to exactly one chapter
    # image_owner[filename] = chapter_id
    image_owner = dict(IMAGE_CHAPTER_OVERRIDE)

    for page_idx in range(len(doc)):
        page_num = page_idx + 1
        ch = get_chapter_for_page(page_num)
        if not ch:
            continue
        layout = get_page_layout(doc, page_idx)
        for item in layout:
            if item["kind"] == "image" and item["filename"] not in image_owner:
                image_owner[item["filename"]] = ch["id"]

    # Phase 2: for each chapter, collect images with layout context and insert
    total_inserted = 0

    for ch_def in CHAPTER_DEFS:
        ch_id = ch_def["id"]
        json_fname = ch_id.replace("/", "-") + ".json"
        json_path = CONTENT_DIR / json_fname

        if not json_path.exists():
            continue

        chapter = json.loads(json_path.read_text(encoding="utf-8"))
        blocks = [b for b in chapter["blocks"] if b.get("type") != "image"]

        my_images = {fn for fn, cid in image_owner.items() if cid == ch_id}
        if not my_images:
            if len(blocks) != len(chapter["blocks"]):
                chapter["blocks"] = blocks
                if not dry_run:
                    with open(json_path, "w", encoding="utf-8") as f:
                        json.dump(chapter, f, ensure_ascii=False, indent=2)
                print(f"  {ch_id}: cleaned stale images")
            continue

        start_page = ch_def["startPage"]
        end_page = ch_def["endPage"]
        # Extend range to include overridden images from adjacent pages
        for fn in my_images:
            m = re.match(r"p(\d{3})_", fn)
            if m:
                pg = int(m.group(1))
                start_page = min(start_page, pg)
                end_page = max(end_page, pg)
        end_page = min(end_page, len(doc))
        total_pages = max(1, end_page - start_page + 1)

        last_text = ""
        min_block_idx = 0
        insertions = []

        for page_idx in range(start_page - 1, end_page):
            page_num = page_idx + 1
            page_frac = (page_num - ch_def["startPage"]) / max(1, ch_def["endPage"] - ch_def["startPage"] + 1)
            page_frac = max(0.0, min(page_frac, 1.0))
            layout = get_page_layout(doc, page_idx)

            for item in layout:
                if item["kind"] == "text":
                    last_text = item["text"]
                elif item["kind"] == "image" and item["filename"] in my_images:
                    block_idx = find_block_index(blocks, last_text, page_frac, min_block_idx)
                    alt = generate_alt(item["filename"], ch_id)
                    img_block = {"type": "image", "src": f"images/{item['filename']}", "alt": alt}
                    insertions.append((block_idx, img_block))
                    min_block_idx = block_idx

        if not insertions:
            continue

        if ch_id == "appendix-v":
            remove_appendix_v_placeholder(blocks)

        groups = defaultdict(list)
        for block_idx, img_block in insertions:
            groups[block_idx].append(img_block)

        for block_idx in sorted(groups.keys(), reverse=True):
            for img_block in reversed(groups[block_idx]):
                blocks.insert(block_idx + 1, img_block)

        blocks = relocate_early_images(blocks)
        chapter["blocks"] = blocks
        total_inserted += len(insertions)

        if not dry_run:
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(chapter, f, ensure_ascii=False, indent=2)

        print(f"  {ch_id}: {len(insertions)} images")

    doc.close()
    print(f"\nTotal: {total_inserted} images inserted")
    if dry_run:
        print("(dry run — no files modified)")


if __name__ == "__main__":
    main()

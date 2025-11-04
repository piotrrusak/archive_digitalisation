from __future__ import annotations
import os
import json
from pathlib import Path
from typing import List, Dict, Any, Tuple
from PIL import Image
from lxml import etree

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, "data")
JSON_DIR = os.path.join(SCRIPT_DIR, "input")

PAGE_NS = "http://schema.primaresearch.org/PAGE/gts/pagecontent/2013-07-15"
NSMAP = {None: PAGE_NS}

def clamp_bbox(b: List[int], w: int, h: int) -> Tuple[int, int, int, int]:
    x0, y0, x1, y1 = b
    x0 = max(0, min(x0, w))
    x1 = max(0, min(x1, w))
    y0 = max(0, min(y0, h))
    y1 = max(0, min(y1, h))
    if x1 < x0: x0, x1 = x1, x0
    if y1 < y0: y0, y1 = y1, y0
    return x0, y0, x1, y1

def make_page_xml(image_path: str, img_w: int, img_h: int, lines: List[Dict[str, Any]]) -> bytes:
    root = etree.Element("PcGts", nsmap=NSMAP)
    page = etree.SubElement(root, "Page", imageFilename=image_path, imageWidth=str(img_w), imageHeight=str(img_h))
    region = etree.SubElement(page, "TextRegion", id="r1")
    for i, ln in enumerate(lines):
        x0, y0, x1, y1 = ln["bbox"]
        tl = etree.SubElement(region, "TextLine", id=f"l{i:04d}")
        etree.SubElement(tl, "Coords", points=f"{x0},{y0} {x1},{y0} {x1},{y1} {x0},{y1}")
        etree.SubElement(tl, "Baseline", points=f"{x0},{y1} {x1},{y1}")
        if "text" in ln and ln["text"] is not None:
            te = etree.SubElement(tl, "TextEquiv")
            uni = etree.SubElement(te, "Unicode")
            uni.text = ln["text"]
    return etree.tostring(root, pretty_print=True, xml_declaration=True, encoding="UTF-8")

def save_line_crops(base_out: Path, name: str, img: Image.Image, lines: List[Dict[str, Any]]):
    out_dir = base_out / name
    out_dir.mkdir(parents=True, exist_ok=True)
    for i, ln in enumerate(lines):
        x0, y0, x1, y1 = ln["bbox"]
        crop = img.crop((x0, y0, x1, y1))
        crop_path = out_dir / f"line_{i:04d}.png"
        txt_path = out_dir / f"line_{i:04d}.txt"
        crop.save(crop_path)
        txt_path.write_text(ln.get("text", ""), encoding="utf-8")

def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    json_path = os.path.join(JSON_DIR, "dataset.json")
    ds = json.loads(Path(json_path).read_text(encoding="utf-8"))
    for item in ds:
        rel_path = item["filepath"]
        img_path = (Path(DATA_DIR) / Path(rel_path).name).resolve()
        name = item.get("name") or Path(rel_path).stem
        if not img_path.exists():
            raise FileNotFoundError(f"Image not found: {img_path}")
        img = Image.open(img_path)
        w, h = img.size
        for ln in item["lines"]:
            ln["bbox"] = list(clamp_bbox(ln["bbox"], w, h))
        xml_bytes = make_page_xml(image_path=str(img_path), img_w=w, img_h=h, lines=item["lines"])
        xml_path = Path(DATA_DIR) / f"{name}.xml"
        xml_path.write_bytes(xml_bytes)
        print(f"OK: {name} -> {xml_path}")

if __name__ == "__main__":
    main()

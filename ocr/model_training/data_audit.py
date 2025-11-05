from __future__ import annotations
from pathlib import Path
import xml.etree.ElementTree as ET
from dataclasses import dataclass, asdict
from typing import List, Tuple, Optional, Dict
import numpy as np
from PIL import Image, ImageDraw
import matplotlib.pyplot as plt
import math
import csv

SCRIPT_DIR = Path(__file__).resolve().parent
DATA_DIR = Path(SCRIPT_DIR / "data")
OUT_DIR  = Path(SCRIPT_DIR / "audit_out")
IMG_EXTS = [".png", ".jpg", ".jpeg", ".tif", ".tiff"]
BASELINE_THICKNESS = 3

def parse_points(s) :
    pts = []
    if not s :
        return pts
    for p in s.strip().split() :
        if "," not in p :
            continue
        xs, ys = p.split(",", 1)
        try :
            x = float(xs); y = float(ys)
            pts.append((x, y))
        except ValueError :
            continue
    return pts

def clamp(v, lo, hi) :
    return max(lo, min(hi, v))

def get_ns(root) :
    ns = {}
    if root.tag.startswith("{") :
        ns_uri = root.tag.split("}")[0].strip("{")
        ns["pc"] = ns_uri
    return ns

def rasterize_masks(img_w, img_h, root, baseline_thickness = 3) :
    mask_img = Image.new("L", (img_w, img_h), 0)
    draw = ImageDraw.Draw(mask_img)
    ns = get_ns(root)

    oob_regions = 0
    for reg in root.findall(".//pc:TextRegion", ns) :
        coords = reg.find("pc:Coords", ns)
        if coords is None or coords.get("points") is None :
            continue
        poly = parse_points(coords.get("points"))
        if not poly :
            continue
        if any((x < 0 or x >= img_w or y < 0 or y >= img_h) for x, y in poly) :
            oob_regions += 1
        poly_i = [(int(round(clamp(x, 0, img_w - 1))),
                   int(round(clamp(y, 0, img_h - 1)))) for x, y in poly]
        if len(poly_i) >= 3 :
            draw.polygon(poly_i, fill=2)

    oob_baselines = 0
    for tl in root.findall(".//pc:TextLine", ns) :
        bl = tl.find("pc:Baseline", ns)
        if bl is None or bl.get("points") is None :
            continue
        pts = parse_points(bl.get("points"))
        if len(pts) < 2 :
            continue
        if any((x < 0 or x >= img_w or y < 0 or y >= img_h) for x, y in pts) :
            oob_baselines += 1
        pts_i = [(int(round(clamp(x, 0, img_w - 1))),
                  int(round(clamp(y, 0, img_h - 1)))) for x, y in pts]
        draw.line(pts_i, fill=1, width=baseline_thickness)

    return np.array(mask_img, dtype=np.uint8), oob_regions, oob_baselines

def compute_line_stats(root, img_w, img_h) :
    ns = get_ns(root)
    heights = []
    spacings = []
    lines = []
    for tl in root.findall(".//pc:TextLine", ns) :
        coords = tl.find("pc:Coords", ns)
        if coords is None or coords.get("points") is None :
            continue
        pts = parse_points(coords.get("points"))
        if not pts :
            continue
        xs = [clamp(p[0], 0, img_w - 1) for p in pts]
        ys = [clamp(p[1], 0, img_h - 1) for p in pts]
        x0, x1 = min(xs), max(xs)
        y0, y1 = min(ys), max(ys)
        lines.append((y0, y1, x0, x1))
    lines.sort(key=lambda t: (t[0], t[1]))

    prev_bottom = None
    for y0, y1, _, _ in lines :
        heights.append(y1 - y0)
        if prev_bottom is not None :
            spacings.append(y0 - prev_bottom)
        prev_bottom = y1
    return heights, spacings, len(lines)

def save_overlay_rgb(img, mask, out_path) :
    arr = np.asarray(img.convert("RGB")).copy()
    H, W = mask.shape
    for y in range(H) :
        for x in range(W) :
            mv = mask[y, x]
            if mv == 1 :
                for i in range(BASELINE_THICKNESS) :
                    if y+i < H :
                        if mask[y + i, x] != 1 :
                            break
                    if y-i >= 0 :
                        if mask[y - i, x] != 1 :
                            break
                    if x+i < W :
                        if mask[y, x + i] != 1 :
                            break
                    if x-i >= 0 :
                        if mask[y, x - i] != 1 :
                            break
                    
                else : continue
                arr[y, x] = [255, 0, 0]

    Image.fromarray(arr).save(out_path)

def bar_class_ratio(name, p_bg, p_bl, p_rg, out_path) :
    plt.figure()
    cats = ["background", "baseline", "region"]
    vals = [p_bg, p_bl, p_rg]
    plt.bar(cats, vals)
    plt.title(f"{name}: class pixel %")
    plt.ylabel("percent")
    plt.tight_layout()
    plt.savefig(out_path)
    plt.close()

def hist_1d(values, title, xlabel, out_path) :
    if not values :
        return
    bins = min(10, max(1, int(math.sqrt(len(values)))))
    plt.figure()
    plt.hist(values, bins=bins)
    plt.title(title)
    plt.xlabel(xlabel)
    plt.ylabel("count")
    plt.tight_layout()
    plt.savefig(out_path)
    plt.close()

@dataclass
class PairReport :
    name: str
    image_path: str
    xml_path: str
    img_W: int
    img_H: int
    xml_W: Optional[int]
    xml_H: Optional[int]
    size_match: Optional[bool]
    page_imageFilename: Optional[str]
    lines_count: int
    oob_regions: int
    oob_baselines: int
    px_background_pct: float
    px_baseline_pct: float
    px_region_pct: float
    line_height_mean: Optional[float]
    line_height_median: Optional[float]
    line_height_std: Optional[float]
    spacing_mean: Optional[float]
    spacing_median: Optional[float]
    spacing_std: Optional[float]
    overlay_path: str
    class_chart: str
    heights_chart: str
    spacings_chart: str
    status: str

def find_pairs(data_dir, img_exts) :
    pairs = []
    for xml_path in sorted(data_dir.glob("*.xml")) :
        name = xml_path.stem
        try :
            root = ET.parse(xml_path).getroot()
            page = root.find(".//{*}Page")
            candidate = None
            if page is not None and page.get("imageFilename") :
                fn = Path(page.get("imageFilename"))
                candidate = fn if fn.is_file() else (data_dir / fn.name)
                if not candidate.is_file() :
                    candidate = None
            if candidate is None :
                for ext in img_exts :
                    ip = data_dir / f"{name}{ext}"
                    if ip.is_file() :
                        candidate = ip
                        break
            if candidate and candidate.is_file() :
                pairs.append((name, candidate, xml_path))
        except Exception :
            continue
    return pairs

def audit_dataset(
    data_dir,
    out_dir,
    img_exts,
    baseline_thickness,
) :
    out_dir.mkdir(parents = True, exist_ok = True)
    pairs = find_pairs(data_dir, img_exts)
    reports = []

    for name, img_path, xml_path in pairs :
        print(f"Auditing pair: {name}")

        status = "OK"
        try :
            im = Image.open(img_path).convert("RGB")
            W, H = im.size
        except Exception as e :
            reports.append(PairReport(
                name = name,
                image_path = str(img_path),
                xml_path = str(xml_path),
                img_W = 0,
                img_H = 0,
                xml_W = None,
                xml_H = None,
                size_match = None,
                page_imageFilename = None,
                lines_count = 0,
                oob_regions = 0,
                oob_baselines = 0,
                px_background_pct = 0.0,
                px_baseline_pct = 0.0,
                px_region_pct = 0.0,
                line_height_mean = None,
                line_height_median = None,
                line_height_std = None,
                spacing_mean = None,
                spacing_median = None,
                spacing_std = None,
                overlay_path = "",
                class_chart = "",
                heights_chart = "",
                spacings_chart = "",
                status = f"Image load error: {e}"
            ))
            continue

        try :
            root = ET.parse(xml_path).getroot()
            page = root.find(".//{*}Page")
            xmlW = int(page.get("imageWidth")) if page is not None and page.get("imageWidth") else None
            xmlH = int(page.get("imageHeight")) if page is not None and page.get("imageHeight") else None
            page_fn = page.get("imageFilename") if page is not None else None
        except Exception as e :
            reports.append(PairReport(
                name = name,
                image_path = str(img_path),
                xml_path = str(xml_path),
                img_W = W,
                img_H = H,
                xml_W = None,
                xml_H = None,
                size_match = None,
                page_imageFilename = None,
                lines_count = 0,
                oob_regions = 0,
                oob_baselines = 0,
                px_background_pct = 0.0,
                px_baseline_pct = 0.0,
                px_region_pct = 0.0,
                line_height_mean = None,
                line_height_median = None,
                line_height_std = None,
                spacing_mean = None,
                spacing_median = None,
                spacing_std = None,
                overlay_path = "",
                class_chart = "",
                heights_chart = "",
                spacings_chart = "",
                status = f"XML parse error: {e}"
            ))
            continue

        size_match = (xmlW == W and xmlH == H) if (xmlW and xmlH) else None

        mask, oob_regions, oob_baselines = rasterize_masks(W, H, root, baseline_thickness)
        p_bg = float(np.mean(mask == 0)) * 100.0
        p_bl = float(np.mean(mask == 1)) * 100.0
        p_rg = float(np.mean(mask == 2)) * 100.0

        overlay_path = out_dir / f"audit_{name}_overlay.png"
        class_chart = out_dir / f"audit_{name}_class_ratio.png"
        heights_chart = out_dir / f"audit_{name}_line_heights.png"
        spacings_chart = out_dir / f"audit_{name}_line_spacings.png"

        save_overlay_rgb(im, mask, overlay_path)
        bar_class_ratio(name, p_bg, p_bl, p_rg, class_chart)

        heights, spacings, n_lines = compute_line_stats(root, W, H)
        if n_lines > 0 :
            hist_1d(heights, f"{name}: line heights (px), n={n_lines}", "height (px)", heights_chart)
        else :
            heights_chart = Path("")
        if len(spacings) > 0 :
            hist_1d(spacings, f"{name}: line spacings (px)", "spacing to next line (px)", spacings_chart)
        else :
            spacings_chart = Path("")

        def stats(vs) :
            if not vs :
                return (None, None, None)
            arr = np.asarray(vs, dtype=float)
            return float(arr.mean()), float(np.median(arr)), float(arr.std(ddof=1) if arr.size > 1 else 0.0)

        h_mean, h_med, h_std = stats(heights)
        s_mean, s_med, s_std = stats(spacings)

        reports.append(PairReport(
            name = name,
            image_path = str(img_path),
            xml_path = str(xml_path),
            img_W = W,
            img_H = H,
            xml_W = xmlW,
            xml_H = xmlH,
            size_match = size_match,
            page_imageFilename = page_fn,
            lines_count = n_lines,
            oob_regions = oob_regions,
            oob_baselines = oob_baselines,
            px_background_pct = round(p_bg, 3),
            px_baseline_pct = round(p_bl, 3),
            px_region_pct = round(p_rg, 3),
            line_height_mean = (round(h_mean, 3) if h_mean is not None else None),
            line_height_median = (round(h_med, 3) if h_med is not None else None),
            line_height_std = (round(h_std, 3) if h_std is not None else None),
            spacing_mean = (round(s_mean, 3) if s_mean is not None else None),
            spacing_median = (round(s_med, 3) if s_med is not None else None),
            spacing_std = (round(s_std, 3) if s_std is not None else None),
            overlay_path = str(overlay_path),
            class_chart = str(class_chart),
            heights_chart = str(heights_chart) if str(heights_chart) else "",
            spacings_chart = str(spacings_chart) if str(spacings_chart) else "",
            status = "OK"
        ))
    return reports

def save_csv(reports, out_csv) :
    if not reports :
        return
    fields = list(asdict(reports[0]).keys())
    out_csv.parent.mkdir(parents = True, exist_ok = True)
    with out_csv.open("w", newline="", encoding="utf-8") as f :
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in reports :
            w.writerow(asdict(r))

def print_summary(reports) :
    if not reports :
        print("No pairs (XML+image) to report.")
        return
    n = len(reports)
    ok = sum(1 for r in reports if r.status == "OK")
    size_mismatch = sum(1 for r in reports if r.size_match is False)
    any_oob = sum(1 for r in reports if (r.oob_regions > 0 or r.oob_baselines > 0))
    very_low_baseline = sum(1 for r in reports if r.px_baseline_pct < 0.1)

    print("\n=== Data Summary ===")
    print(f"Number of pairs: {n} (OK: {ok}, errors: {n-ok})")
    print(f"Size mismatch (xml vs image): {size_mismatch}")
    print(f"Out-of-bounds (region/baseline): {any_oob}")
    print(f"Very low baseline (<0.1% pixels): {very_low_baseline}")

    bl_vals = [r.px_baseline_pct for r in reports if r.status == "OK"]
    rg_vals = [r.px_region_pct for r in reports if r.status == "OK"]
    if bl_vals :
        print(f"Baseline%   min/median/max: {min(bl_vals):.4f} / {float(np.median(bl_vals)):.4f} / {max(bl_vals):.4f}")
    if rg_vals :
        print(f"Region%     min/median/max: {min(rg_vals):.4f} / {float(np.median(rg_vals)):.4f} / {max(rg_vals):.4f}")

def main() :
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    reports = audit_dataset(DATA_DIR, OUT_DIR, IMG_EXTS, BASELINE_THICKNESS)
    save_csv(reports, OUT_DIR / "audit_summary.csv")
    print_summary(reports)
    print(f"\nSaved CSV: {OUT_DIR / 'audit_summary.csv'}")
    print(f"Artifacts in: {OUT_DIR}")

if __name__ == "__main__" :
    main()

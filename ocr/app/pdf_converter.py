from pathlib import Path

import fitz
from PIL import Image

SCRIPT_DIR = Path(__file__).resolve().parent
OUT_DIR = SCRIPT_DIR / ".." / "temp" / "pdf_pages"

def _pil_to_pixmap(image) :
    if image.mode == "1" :
        image = image.convert("L")

    if image.mode == "L" :
        colorspace = fitz.csGRAY
        alpha = False
    elif image.mode in ("RGBA", "LA") :
        image = image.convert("RGBA")
        colorspace = fitz.csRGB
        alpha = True
    else :
        if image.mode != "RGB" :
            image = image.convert("RGB")
        colorspace = fitz.csRGB
        alpha = False

    samples = image.tobytes()
    width, height = image.size
    return fitz.Pixmap(colorspace, width, height, samples, alpha)

def initialize_pdf_with_image(image) :
    pdf_doc = fitz.open()
    rect = fitz.Rect(0, 0, image.width, image.height)
    page = pdf_doc.new_page(width = image.width, height = image.height)
    pix = _pil_to_pixmap(image)
    page.insert_image(rect, pixmap = pix)
    return pdf_doc

def measure_text_single_line(text, fontsize = 11, fontname = "helv"):
    font = fitz.Font(fontname)
    width = font.text_length(text, fontsize = fontsize)
    height = fontsize
    return width, height

def find_fontsize(line_height, line_width, text, fontname = "helv") :
    min_fontsize = 1
    max_fontsize = line_height

    fontsize = (min_fontsize + max_fontsize) / 2

    for _ in range(line_height) :
        width, height = measure_text_single_line(text, fontsize=fontsize, fontname = fontname)

        if width >= line_width or height >= line_height :
            max_fontsize = fontsize
        else :
            min_fontsize = fontsize
        fontsize = (min_fontsize + max_fontsize) / 2
        if max_fontsize - min_fontsize < 1 :
            break

    return (int(fontsize) - 1)


def insert_text_at_bbox(pdf_doc, text, bbox, draw_rect = False) :
    page = pdf_doc[0]
    x0, y0, x1, y1 = bbox
    rect = fitz.Rect(x0, y0, x1, y1)
    if draw_rect :
        sh = page.new_shape()
        sh.draw_rect(rect)
        sh.finish(fill = None, color = (1, 0, 0))
        sh.commit(overlay = True)

    fs = find_fontsize(line_height = y1 - y0, line_width = x1 - x0, text = text)
    


    point_down = rect.bl
    point_up = rect.tl
    point = fitz.Point(point_down.x, ((min(point_down.y, point_up.y) + max(point_down.y, point_up.y)) + fs) / 2)
    
    page.insert_text(
        point,
        text,
        fontsize=fs,
        fontname="helv",
        color=0,
        fill_opacity = 0,
        overlay=True
    )

def pdf_to_bytes(pdf_doc) :
    return pdf_doc.write()


if __name__ == "__main__" :
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    IMAGE_PATH = SCRIPT_DIR / ".." / "model_training" / "data" / "0001.png"
    im = Image.open(IMAGE_PATH)
    pdf_doc = initialize_pdf_with_image(im)

    out_path = OUT_DIR / "output.pdf"


    text = "Though they may gather same Left -wing"
    bbox = (356, 789, 2319, 938)
    insert_text_at_bbox(pdf_doc, text, bbox, True)


    text = "support, a large majority of Labour"
    bbox = (336, 962, 2209, 1103)
    insert_text_at_bbox(pdf_doc, text, bbox, True)


    text = "M Ps are likely to turn down the Foot-"
    bbox = (333, 1147, 2248, 1284)
    insert_text_at_bbox(pdf_doc, text, bbox, True)

    text = "Griffithus resolution. Mr. Foot's line will"
    bbox = (325, 1316, 2252, 1458)
    insert_text_at_bbox(pdf_doc, text, bbox, True)

    text = "bthalas Labonr M Ps opposed the"
    bbox = (336, 1493, 2244, 1647)
    insert_text_at_bbox(pdf_doc, text, bbox, True)

    text = "overnment Bill which brougut life peers"
    bbox = (321, 1674, 2366, 1820)
    insert_text_at_bbox(pdf_doc, text, bbox, True)

    text = "mto existence, they schould not no ut"
    bbox = (325, 1847, 2347, 1993)
    insert_text_at_bbox(pdf_doc, text, bbox, True)

    text = "forwad nominees. He believes that the"
    bbox = (344, 2028, 2347, 2174)
    insert_text_at_bbox(pdf_doc, text, bbox, True)

    text = "House of Lords should be aboolished and"
    bbox = (340, 2213, 2343, 2351)
    insert_text_at_bbox(pdf_doc, text, bbox, True)

    text = "that Labour should not take any steps"
    bbox = (325, 2394, 2319, 2532)
    insert_text_at_bbox(pdf_doc, text, bbox, True)

    text = "which would appear to \"prop up an out."
    bbox = (325, 2587, 2374, 2713)
    insert_text_at_bbox(pdf_doc, text, bbox, True)

    pdf_doc.save(out_path)

    print(f"Saved PDF to: {out_path.resolve()}")

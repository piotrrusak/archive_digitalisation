import io
from pathlib import Path

import fitz
from PIL import Image
import subprocess

try :
    from app.utils import get_frontline
except ImportError :
    try :
        from utils import get_frontline
    except ImportError as e:
       raise ImportError("Failed to import get_frontline") from e


SCRIPT_DIR = Path(__file__).resolve().parent
OUT_DIR = SCRIPT_DIR / ".." / "temp" / "pdf_pages"


def pil_to_pixmap(image):
    if image.mode == "1":
        image = image.convert("L")

    if image.mode == "L":
        colorspace = fitz.csGRAY
        alpha = False
    elif image.mode in ("RGBA", "LA"):
        image = image.convert("RGBA")
        colorspace = fitz.csRGB
        alpha = True
    else:
        if image.mode != "RGB":
            image = image.convert("RGB")
        colorspace = fitz.csRGB
        alpha = False

    samples = image.tobytes()
    width, height = image.size
    return fitz.Pixmap(colorspace, width, height, samples, alpha)


def initialize_pdf_with_image(image, visible_image=True):
    pdf_doc = fitz.open()
    rect = fitz.Rect(0, 0, image.width, image.height)
    page = pdf_doc.new_page(width=image.width, height=image.height)
    if visible_image:
        pix = pil_to_pixmap(image)
        page.insert_image(rect, pixmap=pix)
    return pdf_doc


def measure_text_single_line(text, fontsize=11, fontname="helv"):
    font = fitz.Font(fontname)
    width = font.text_length(text, fontsize=fontsize)
    height = fontsize
    return width, height


def find_fontsize(line_height, line_width, text, fontname="helv"):
    min_fontsize = 1
    max_fontsize = line_height

    fontsize = (min_fontsize + max_fontsize) / 2

    for _ in range(line_height):
        width, height = measure_text_single_line(text, fontsize=fontsize, fontname=fontname)

        if width >= line_width or height >= line_height:
            max_fontsize = fontsize
        else:
            min_fontsize = fontsize
        fontsize = (min_fontsize + max_fontsize) / 2
        if max_fontsize - min_fontsize < 1:
            break

    return int(fontsize) - 1


def insert_text_at_bbox(pdf_doc, text, bbox, visible_image=True, draw_rect=False):
    page = pdf_doc[0]
    x0, y0, x1, y1 = bbox
    rect = fitz.Rect(x0, y0, x1, y1)
    if draw_rect:
        sh = page.new_shape()
        sh.draw_rect(rect)
        sh.finish(fill=None, color=(1, 0, 0))
        sh.commit(overlay=True)

    fs = find_fontsize(line_height=y1 - y0, line_width=x1 - x0, text=text)

    point_down = rect.bl
    point_up = rect.tl
    point = fitz.Point(point_down.x, ((min(point_down.y, point_up.y) + max(point_down.y, point_up.y)) + fs) / 2)

    page.insert_text(point, text, fontsize=fs, fontname="helv", color=0, fill_opacity=1, overlay=True)


def pdf_to_bytes(pdf_doc):
    return pdf_doc.write()


def pdf_to_docx_bytes(pdf_doc) :
    pdf_bytes = pdf_to_bytes(pdf_doc)

    p1 = subprocess.run(
        ["pdftotext", "-layout", "-", "-"],
        input = pdf_bytes,
        stdout = subprocess.PIPE,
        check = True,
    )

    p2 = subprocess.run(
        [
            "pandoc",
            "--wrap=none",
            "-f",
            "markdown+hard_line_breaks",
            "-t",
            "docx",
            "-o",
            "-",
        ],
        input = p1.stdout,
        stdout = subprocess.PIPE,
        check = True,
    )

    return p2.stdout

def convert_to_png_bytes(input_bytes, input_format, debug=False, debug_indent=0):
    
    if debug:
        print(get_frontline(debug_indent) + f"Converting input format '{input_format}' to PNG bytes")

    if input_format["name"] == "png":
        if debug:
            print(get_frontline(debug_indent) + "Input is already PNG format, no conversion needed")
        return input_bytes

    elif input_format["name"] == "pdf":
        if debug:
            print(get_frontline(debug_indent) + "Converting PDF to PNG using fitz")
        pdf_doc = fitz.open(stream=input_bytes, filetype="pdf")
        page = pdf_doc.load_page(0)
        pix = page.get_pixmap()
        png_bytes = pix.tobytes("png")
        if debug:
            print(get_frontline(debug_indent) + f"Converted PDF to PNG bytes: {len(png_bytes)} bytes")
        return png_bytes
    
    elif input_format["name"] in ["jpeg", "jpg", "tiff", "bmp", "gif"]:
        if debug:
            print(get_frontline(debug_indent) + f"Converting image format '{input_format['name']}' to PNG using PIL")
        im = Image.open(io.BytesIO(input_bytes))
        with io.BytesIO() as output:
            im.save(output, format="PNG")
            png_bytes = output.getvalue()
        if debug:
            print(get_frontline(debug_indent) + f"Converted image to PNG bytes: {len(png_bytes)} bytes")
        return png_bytes

    else:
        raise ValueError(f"Unsupported input format for conversion to PNG: {input_format}")

if __name__ == "__main__":
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    IMAGE_PATH = SCRIPT_DIR / ".." / "model_training" / "data" / "0001.png"
    VISIBLE_IMAGE = False
    VISIBLE_RECTS = False
    im = Image.open(IMAGE_PATH)
    pdf_doc = initialize_pdf_with_image(im, VISIBLE_IMAGE)

    out_path = OUT_DIR / "output.pdf"

    text = "Though they may gather same Left -wing"
    bbox = (356, 789, 2319, 938)
    insert_text_at_bbox(pdf_doc, text, bbox, VISIBLE_IMAGE, VISIBLE_RECTS)

    text = "support, a large majority of Labour"
    bbox = (336, 962, 2209, 1103)
    insert_text_at_bbox(pdf_doc, text, bbox, VISIBLE_IMAGE, VISIBLE_RECTS)

    text = "M Ps are likely to turn down the Foot-"
    bbox = (333, 1147, 2248, 1284)
    insert_text_at_bbox(pdf_doc, text, bbox, VISIBLE_IMAGE, VISIBLE_RECTS)

    text = "Griffithus resolution. Mr. Foot's line will"
    bbox = (325, 1316, 2252, 1458)
    insert_text_at_bbox(pdf_doc, text, bbox, VISIBLE_IMAGE, VISIBLE_RECTS)

    text = "bthalas Labonr M Ps opposed the"
    bbox = (336, 1493, 2244, 1647)
    insert_text_at_bbox(pdf_doc, text, bbox, VISIBLE_IMAGE, VISIBLE_RECTS)

    text = "overnment Bill which brougut life peers"
    bbox = (321, 1674, 2366, 1820)
    insert_text_at_bbox(pdf_doc, text, bbox, VISIBLE_IMAGE, VISIBLE_RECTS)

    text = "mto existence, they schould not no ut"
    bbox = (325, 1847, 2347, 1993)
    insert_text_at_bbox(pdf_doc, text, bbox, VISIBLE_IMAGE, VISIBLE_RECTS)

    text = "forwad nominees. He believes that the"
    bbox = (344, 2028, 2347, 2174)
    insert_text_at_bbox(pdf_doc, text, bbox, VISIBLE_IMAGE, VISIBLE_RECTS)

    text = "House of Lords should be aboolished and"
    bbox = (340, 2213, 2343, 2351)
    insert_text_at_bbox(pdf_doc, text, bbox, VISIBLE_IMAGE, VISIBLE_RECTS)

    text = "that Labour should not take any steps"
    bbox = (325, 2394, 2319, 2532)
    insert_text_at_bbox(pdf_doc, text, bbox, VISIBLE_IMAGE, VISIBLE_RECTS)

    text = 'which would appear to "prop up an out.'
    bbox = (325, 2587, 2374, 2713)
    insert_text_at_bbox(pdf_doc, text, bbox, VISIBLE_IMAGE, VISIBLE_RECTS)

    pdf_doc.save(out_path)

    print(f"Saved PDF to: {out_path.resolve()}")

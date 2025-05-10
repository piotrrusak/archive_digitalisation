import os
from PIL import Image
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
import torch
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter


processor = TrOCRProcessor.from_pretrained('microsoft/trocr-base-handwritten')
model = VisionEncoderDecoderModel.from_pretrained(
    'microsoft/trocr-base-handwritten')


data_dir = '../dataset'
output_texts = []


image_files = sorted([f for f in os.listdir(data_dir) if f.endswith('.jpg')])

for filename in image_files:
    path = os.path.join(data_dir, filename)
    image = Image.open(path).convert('RGB')

    pixel_values = processor(images=image, return_tensors="pt").pixel_values

    generated_ids = model.generate(pixel_values)
    generated_text = processor.batch_decode(
        generated_ids, skip_special_tokens=True)[0]

    print(f"{filename}: {generated_text}")
    output_texts.append((filename, generated_text))

pdf_path = "ocr_output.pdf"
c = canvas.Canvas(pdf_path, pagesize=letter)

for idx, (filename, text) in enumerate(output_texts):
    c.drawString(100, 750, f"Image: {filename}")
    c.drawString(100, 730, f"Text: {text}")
    c.showPage()

c.save()

print(f"Saved OCR output to {pdf_path}")

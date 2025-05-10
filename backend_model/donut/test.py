import os
from PIL import Image
from transformers import DonutProcessor, VisionEncoderDecoderModel
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

# Load Donut processor and model
processor = DonutProcessor.from_pretrained("naver-clova-ix/donut-base")
model = VisionEncoderDecoderModel.from_pretrained("naver-clova-ix/donut-base")
model.eval()

# Your dataset folder
data_dir = '../dataset'  # e.g., './dataset'
output_texts = []

# Sort files numerically
image_files = sorted([f for f in os.listdir(data_dir) if f.endswith('.jpg')])

for filename in image_files:
    path = os.path.join(data_dir, filename)
    image = Image.open(path).convert('RGB')

    # Prepare inputs
    pixel_values = processor(images=image, return_tensors="pt").pixel_values

    # Generate structured text (without manually passing decoder_input_ids)
    outputs = model.generate(pixel_values, max_length=512)

    # Decode structured text
    generated_text = processor.batch_decode(
        outputs, skip_special_tokens=True)[0]

    print(f"{filename}: {generated_text}\n")
    output_texts.append((filename, generated_text))

# Save to PDF
pdf_path = "donut_structured_output.pdf"
c = canvas.Canvas(pdf_path, pagesize=letter)

for idx, (filename, text) in enumerate(output_texts):
    c.drawString(50, 750, f"Image: {filename}")
    text_lines = text.split("\n")
    y = 730
    for line in text_lines:
        c.drawString(50, y, line[:100])  # trim line to fit
        y -= 15
        if y < 50:  # new page if too low
            c.showPage()
            y = 750
    c.showPage()

c.save()

print(f"Saved structured OCR output to {pdf_path}")

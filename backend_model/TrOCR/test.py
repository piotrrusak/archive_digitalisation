from transformers import TrOCRProcessor, VisionEncoderDecoderModel
from PIL import Image, ImageOps
import matplotlib.pyplot as plt
import os


processor = TrOCRProcessor.from_pretrained('microsoft/trocr-large-handwritten')
model = VisionEncoderDecoderModel.from_pretrained(
    'microsoft/trocr-large-handwritten')


data_dir = '../dataset2'
output_texts = []


image_files = sorted(
    [f for f in os.listdir(data_dir) if f.endswith('.png')])[:5]


def read_image(image_path):
    image = Image.open(image_path).convert('RGB')
    image = ImageOps.autocontrast(image)
    image = image.resize((384, 384))
    return image


def ocr(image, processor, model):
    pixel_values = processor(image, return_tensors='pt').pixel_values
    generated_ids = model.generate(
        pixel_values,
        max_length=512,
        num_beams=4,
        early_stopping=True
    )
    generated_text = processor.batch_decode(
        generated_ids, skip_special_tokens=True)[0]
    return generated_text


def eval_new_data(data_path=None, num_samples=4, model=None):
    image_files = sorted(
        [f for f in os.listdir(data_dir) if f.endswith('.png')])[:num_samples]
    for filename in image_files:
        image_path = os.path.join(data_dir, filename)
        image = read_image(image_path)
        text = ocr(image, processor, model)
        plt.figure(figsize=(7, 4))
        plt.imshow(image)
        plt.title(text)
        plt.axis('off')
        plt.show()


eval_new_data(data_dir, model=model)

'''
for filename in image_files:
    path = os.path.join(data_dir, filename)
    image = Image.open(path).convert('RGB')

    image = ImageOps.autocontrast(image)

    # image.save(f"debug_{filename}")

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
'''

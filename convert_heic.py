import os
from PIL import Image
from pillow_heif import register_heif_opener

register_heif_opener()

dataset_folder = "dataset"

for root, dirs, files in os.walk(dataset_folder):
    for filename in files:
        if filename.lower().endswith((".heic", ".heif")):
            input_path = os.path.join(root, filename)

            output_name = os.path.splitext(filename)[0] + ".jpg"
            output_path = os.path.join(root, output_name)

            try:
                image = Image.open(input_path)
                image = image.convert("RGB")
                image.save(output_path, "JPEG", quality=95)

                print("Converted:", input_path)
                print("Saved as:", output_path)

            except Exception as e:
                print("ERROR:", input_path)
                print(e)

print("\nConversion completed.")
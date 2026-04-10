import os
import subprocess
import sys

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package, "--quiet"])

try:
    from PIL import Image
except ImportError:
    print("Pillow not found, installing...")
    install("Pillow")
    from PIL import Image

folder = "."
for filename in os.listdir(folder):
    if filename.lower().endswith('.png'):
        png_path = os.path.join(folder, filename)
        webp_filename = filename[:-4] + ".webp"
        webp_path = os.path.join(folder, webp_filename)
        
        try:
            img = Image.open(png_path)
            img.save(webp_path, "webp")
            print(f"Converted {filename} to {webp_filename}")
        except Exception as e:
            print(f"Error converting {filename}: {e}")

print("Done!")

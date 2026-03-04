from PIL import Image

img = Image.open('/tmp/file_attachments/image.png').convert('RGBA')
print(f"Size: {img.size}")

from PIL import Image

img = Image.open("Gemini_Generated_Image_3tc4nk3tc4nk3tc4.png").convert("RGB")
# logo bounds: (300, 100, 2500, 950)
# text bounds: (400, 950, 2400, 1400)

logo = img.crop((300, 100, 2500, 950))
text = img.crop((400, 950, 2400, 1400))

# Find the darkest pixel in text to determine its color
min_l = 255
darkest_color = (0,0,0)
for x in range(text.width):
    for y in range(text.height):
        r, g, b = text.getpixel((x, y))
        l = (r+g+b)/3
        if l < min_l:
            min_l = l
            darkest_color = (r, g, b)

print(f"Darkest text color: {darkest_color}")

min_l_logo = 255
darkest_color_logo = (0,0,0)
for x in range(logo.width):
    for y in range(logo.height):
        r, g, b = logo.getpixel((x, y))
        l = (r+g+b)/3
        if l < min_l_logo:
            min_l_logo = l
            darkest_color_logo = (r, g, b)

print(f"Darkest logo color: {darkest_color_logo}")

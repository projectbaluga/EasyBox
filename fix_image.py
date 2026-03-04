from PIL import Image

def process_image(src, dest):
    img = Image.open(src).convert("RGBA")

    pixels = img.load()
    width, height = img.size

    # Let's remove white background
    # And make the edges anti-aliased properly.
    # The image is white background, dark blue text, green box with white inside.

    # We want to identify the green box and keep its white inside.
    # So a simple color distance from white won't work for the inside of the box.
    # We can use flood fill from the edges to make the outer white background transparent.

    stack = set()
    for x in range(width):
        stack.add((x, 0))
        stack.add((x, height - 1))
    for y in range(height):
        stack.add((0, y))
        stack.add((width - 1, y))

    visited = set(stack)
    stack = list(stack)

    def is_bg(x, y):
        r, g, b, a = pixels[x, y]
        # Allow slight anti-aliasing (light grays)
        # But if we just set it to transparent, anti-aliased text edges will have a white halo
        return r > 240 and g > 240 and b > 240

    while stack:
        x, y = stack.pop()

        if is_bg(x, y):
            pixels[x, y] = (255, 255, 255, 0)

            for dx, dy in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if (nx, ny) not in visited:
                        visited.add((nx, ny))
                        stack.append((nx, ny))

    # Fix the halo on edges
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a > 0 and (r > 200 and g > 200 and b > 200) and (x, y) in visited:
                # If it was part of the background edge, calculate a new alpha
                # assuming the true color is dark
                gray = (r + g + b) / 3
                new_alpha = int(255 - gray)
                if new_alpha < 0: new_alpha = 0
                pixels[x, y] = (r, g, b, new_alpha)

    # Crop to content
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)

    import os
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    img.save(dest)

process_image('/tmp/file_attachments/image.png', 'www/assets/logo/easybox-full-header.png')

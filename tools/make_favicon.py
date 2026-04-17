import sys
import subprocess

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

try:
    from PIL import Image, ImageDraw
except ImportError:
    install('Pillow')
    from PIL import Image, ImageDraw

def create_favicon():
    img = Image.open('logo.png').convert("RGBA")
    width, height = img.size

    # Scan for red pixels to find the bounding box of the red patch
    # The red patch is prominent, so we look for dominant red color
    red_pixels = []
    
    # Load pixel data for faster access
    pixels = img.load()
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            # Detect strong red (high R, relatively low G and B)
            if r > 160 and g < 80 and b < 80 and a > 100:
                red_pixels.append((x, y))

    if red_pixels:
        min_x = min(p[0] for p in red_pixels)
        max_x = max(p[0] for p in red_pixels)
        min_y = min(p[1] for p in red_pixels)
        max_y = max(p[1] for p in red_pixels)
        
        # We want to make a square bounding box around the red part
        cx = (min_x + max_x) // 2
        cy = (min_y + max_y) // 2
        
        # Add a little padding
        size = int(max(max_x - min_x, max_y - min_y) * 1.05)
        half = size // 2
        
        box = (cx - half, cy - half, cx + half, cy + half)
        cropped = img.crop(box)
        
        # Apply circular mask
        mask = Image.new('L', cropped.size, 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, cropped.size[0], cropped.size[1]), fill=255)
        
        # Composite the image with the circular mask
        output = Image.new("RGBA", cropped.size, (0,0,0,0))
        output.paste(cropped, (0,0), mask=mask)
        
        output.save('favicon.png')
        print("Successfully created favicon.png")
    else:
        print("Could not find red pixels, fallback to left half.")
        # Fallback: crop left square
        size = min(width // 2, height)
        box = (0, (height - size) // 2, size, (height + size) // 2)
        cropped = img.crop(box)
        
        mask = Image.new('L', cropped.size, 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, cropped.size[0], cropped.size[1]), fill=255)
        
        output = Image.new("RGBA", cropped.size, (0,0,0,0))
        output.paste(cropped, (0,0), mask=mask)
        output.save('favicon.png')
        print("Successfully created fallback favicon.png")

create_favicon()

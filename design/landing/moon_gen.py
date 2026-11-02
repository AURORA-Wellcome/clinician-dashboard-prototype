"""Landing-page banner: the moon's textures, made from NASA's CGI Moon Kit (https://svs.gsfc.nasa.gov/4720/; credit
NASA's Scientific Visualization Studio; data from the Lunar Reconnaissance Orbiter's camera and laser altimeter teams).

Usage: python design/landing/moon_gen.py lroc_color_poles_4k.tif ldem_16.tif [out folder]   (needs numpy and Pillow)
Writes moon_albedo.webp and moon_relief.webp, the near side as seen from Earth. banner_gen.py puts them in the page,
whose script lights them for the night's phase. The albedo is how bright each spot is under a high sun, so it holds the
maria, the highlands and the rays. The relief is the height of the ground, less the broad rise and fall of the land, so
that its 8 bits go to the craters and ridges that catch the light along the terminator."""
import math, os, sys
import numpy as np
from PIL import Image

S = 160              # image size, in pixels
SUB = 6              # samples per pixel along each axis, so the maps are averaged rather than aliased
TILT = 20            # the face turned this far counterclockwise, degrees, as the moon looks when it is low in the east
RELIEF_KM = 4.0      # the relief image spans plus and minus this much, km
RELIEF_BROAD = 0.09  # features broader than this fraction of the image are removed from the relief
Image.MAX_IMAGE_PIXELS = None

def bilinear(m, row, col):
    """m at fractional positions; columns wrap around the globe, rows stop at the poles."""
    h, w = m.shape[:2]
    r0 = np.clip(np.floor(row).astype(int), 0, h - 2); c0 = np.floor(col).astype(int)
    fr = np.clip(row - r0, 0, 1); fc = col - c0
    c0 %= w; c1 = (c0 + 1) % w
    return (m[r0, c0] * (1 - fr) * (1 - fc) + m[r0, c1] * (1 - fr) * fc + m[r0 + 1, c0] * fr * (1 - fc) + m[r0 + 1, c1] * fr * fc)

def near_side(m):
    """Map m (simple cylindrical, longitude 0 in the middle) onto the disk as seen from Earth, north up before the tilt."""
    h, w = m.shape[:2]
    t = (np.arange(S * SUB) + 0.5) / (S * SUB) * 2 - 1
    x, y = np.meshgrid(t, -t)
    a = math.radians(TILT)
    xr, yr = x * math.cos(a) + y * math.sin(a), -x * math.sin(a) + y * math.cos(a)  # the disk's point, before the tilt
    rr = xr ** 2 + yr ** 2
    inside = rr < 1
    z = np.sqrt(np.clip(1 - rr, 0, 1))
    lat, lon = np.arcsin(np.clip(yr, -1, 1)), np.arctan2(xr, z)
    v = bilinear(m, (0.5 - lat / math.pi) * h - 0.5, (0.5 + lon / (2 * math.pi)) * w - 0.5)
    v = np.where(inside, v, 0)
    box = lambda p: p.reshape(S, SUB, S, SUB).sum(axis=(1, 3))
    n = box(inside.astype(float))
    return box(v) / np.maximum(n, 1), n > 0

def blur(v, sigma):
    r = int(3 * sigma); k = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2); k /= k.sum()
    v = np.apply_along_axis(lambda c: np.convolve(np.pad(c, r, mode='edge'), k, mode='valid'), 0, v)
    return np.apply_along_axis(lambda c: np.convolve(np.pad(c, r, mode='edge'), k, mode='valid'), 1, v)

color_path, height_path = sys.argv[1:3]
out = sys.argv[3] if len(sys.argv) > 3 else os.path.dirname(os.path.abspath(__file__))

rgb = np.asarray(Image.open(color_path).convert('RGB'), dtype=np.float32) / 255
albedo, inside = near_side(rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722)
lo, hi = np.percentile(albedo[inside], [0.5, 99.8])
albedo = np.clip((albedo - lo) / (hi - lo), 0, 1)
albedo[~inside] = albedo[inside].mean()  # beyond the limb: flat, so compression leaves the limb clean
Image.fromarray(np.uint8(albedo * 255 + 0.5)).save(os.path.join(out, 'moon_albedo.webp'), quality=82, method=6)

height, inside = near_side(np.asarray(Image.open(height_path), dtype=np.float32))
height[~inside] = height[inside].mean()
relief = np.clip((height - blur(height, S * RELIEF_BROAD)) / (2 * RELIEF_KM) + 0.5, 0, 1)
Image.fromarray(np.uint8(relief * 255 + 0.5)).save(os.path.join(out, 'moon_relief.webp'), quality=86, method=6)

for name in ('moon_albedo.webp', 'moon_relief.webp'):
    print(name, os.path.getsize(os.path.join(out, name)), 'bytes')

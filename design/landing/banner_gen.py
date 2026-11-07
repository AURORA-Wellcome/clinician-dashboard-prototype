"""Landing-page banner: a night sky with blue-violet aurora curtains over a low, forested horizon (SVG, no animation).

Usage: python3 design/landing/banner_gen.py banner.html   then paste the output over the <div class="banner"> in index.html.
Layers (sky, with the stars and the Big Dipper; back curtain; three ray patterns, color, a surge layer and a bright edge
for the main curtain; the moon; hills) are separate SVGs inside drift and sway wrappers, so the page can move and
cross-fade them cheaply with CSS transforms and opacity, without redrawing the blur and noise filters.
Mostly blue-violet, with natural green and violet shimmer. (The dashboard itself keeps to cool hues: green means
"on track" there.)"""
import base64, math, os, random, sys
W, H = 1600, 240
rnd = random.Random(11)

def smooth(points):
    """Catmull-Rom spline through points, as SVG cubic Beziers (no leading M)."""
    d = ""
    for i in range(len(points) - 1):
        p0 = points[i - 1] if i > 0 else points[i]
        p1, p2 = points[i], points[i + 1]
        p3 = points[i + 2] if i + 2 < len(points) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f" C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}"
    return d

def curtain(y0, y1, waves, h0, h1, hwaves, x0=-80, x1=W + 80, step=32):
    """A curtain whose lower edge sweeps from y0 (left) to y1 (right), with rays rising height h0..h1."""
    xs = list(range(x0, x1 + 1, step))
    def base(x):
        t = (x - x0) / (x1 - x0)
        return y0 + (y1 - y0) * t + sum(a * math.sin(x / f + p) for a, f, p in waves)
    def height(x):
        t = (x - x0) / (x1 - x0)
        return h0 + (h1 - h0) * t + sum(a * math.sin(x / f + p) for a, f, p in hwaves)
    bottom = [(x, base(x)) for x in xs]
    top = [(x, y - height(x)) for x, y in bottom]
    rev = list(reversed(bottom))
    return f"M{top[0][0]:.1f},{top[0][1]:.1f}" + smooth(top) + f" L{rev[0][0]:.1f},{rev[0][1]:.1f}" + smooth(rev) + " Z"

def ridge(base, terms, step=16):
    pts = [(x, base + sum(a * math.sin(x / f + p) for a, f, p in terms)) for x in range(-20, W + 21, step)]
    return f"M{pts[0][0]:.1f},{pts[0][1]:.1f}" + smooth(pts) + f" L{W + 20},{H + 2} L-20,{H + 2} Z"

stars = []  # (x, y, circle), so stars that would crowd the Big Dipper can be left out
for _ in range(110):
    x, y = rnd.uniform(0, W), rnd.uniform(3, 165)
    r = rnd.choice([0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.2, 1.5])
    stars.append((x, y, f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r}" opacity="{rnd.uniform(0.25, 0.85):.2f}"/>'))

# A main curtain sweeping up to the right, a fainter violet one crossing it, and a thin bright lower edge
main = curtain(182, 104, [(14, 190, 0.6), (7, 83, 1.9)], 70, 118, [(18, 140, 2.1), (8, 51, 0.7)])
back = curtain(118, 150, [(12, 230, 2.4), (6, 97, 0.2)], 80, 60, [(14, 160, 1.3)])
edge = curtain(183, 105, [(14, 190, 0.6), (7, 83, 1.9)], 12, 16, [(3, 70, 0.5)])
FAR = (197, [(8, 150, 0.4), (5, 66, 2.0), (3, 27, 1.1), (1.5, 11, 0.3)])
NEAR = (219, [(7, 190, 2.6), (4, 74, 0.8), (2.2, 31, 1.9), (1, 13, 2.2)])

# Boreal forest on both ridges: black spruce in silhouette, as on the horizon in aurora country in northern Canada.
# Each tree is a narrow, ragged spire of short drooping branch tiers, with a small clump near the crown. The near ridge's
# trees are taller, the far ridge's small and close-packed, so the forest reads as going on for miles. Each ridge and its
# trees become one skyline (the highest point of hill or tree at each x), which keeps the path small. The trees have
# their own random generator, so the stars stay where they are when the forest changes.
trnd = random.Random(29)

def ridge_y(base, terms, x):
    return base + sum(a * math.sin(x / f + p) for a, f, p in terms)

def spruce(x, base, h, tiers_max):
    """One black spruce as a closed zigzag: up the left side tier by tier, to the tip, then down the right side."""
    tiers = max(1, min(tiers_max, round(h / 5)))
    step = h * 0.86 / tiers
    half0 = h * trnd.uniform(0.15, 0.21)
    left, right = [], []
    for i in range(tiers):
        t = i / tiers
        y = base - h * 0.08 - i * step
        half = half0 * (1 - t) ** 0.8 * (1.3 if t > 0.65 else 1)
        left += [(x - half * trnd.uniform(0.75, 1.15), y + step * 0.2), (x - half * 0.22, y - step * 0.6)]
        right += [(x + half * trnd.uniform(0.75, 1.15), y + step * 0.2), (x + half * 0.22, y - step * 0.6)]
    return [(x - 0.7, base + 3)] + left + [(x + trnd.uniform(-0.4, 0.4), base - h)] + right[::-1] + [(x + 0.7, base + 3)]

def simplify(pts, tol):
    """Ramer-Douglas-Peucker: drop points within tol of the line through their neighbors."""
    keep, stack = [0, len(pts) - 1], [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        (ax, ay), (bx, by) = pts[a], pts[b]
        dx, dy = bx - ax, by - ay
        norm = math.hypot(dx, dy) or 1
        best, idx = 0, None
        for i in range(a + 1, b):
            d = abs(dy * (pts[i][0] - ax) - dx * (pts[i][1] - ay)) / norm
            if d > best:
                best, idx = d, i
        if idx is not None and best > tol:
            keep.append(idx)
            stack += [(a, idx), (idx, b)]
    return [pts[i] for i in sorted(keep)]

def num(v):
    s = f'{v:.1f}'.rstrip('0').rstrip('.')
    return s.replace('-0.', '-.').replace('0.', '.', 1) if s.lstrip('-').startswith('0.') else (s or '0')

def skyline(ridge_def, spacing, height, clearing, tiers_max, x0=-34.0, x1=W + 34.0, keep_clear=None):
    """A ridge and its trees as one filled shape: the highest point of hill or tree at each x. keep_clear: an x range
    left without trees (each tree is still generated, so the rest of the forest doesn't change)."""
    base, terms = ridge_def
    trees, x = [], x0
    while x < x1:
        tree = spruce(x, ridge_y(base, terms, x) + 1.5, height(x), tiers_max)
        if not (keep_clear and keep_clear[0] <= x <= keep_clear[1]):
            trees.append(tree)
        x += trnd.uniform(*spacing)
        if trnd.random() < clearing:
            x += trnd.uniform(16, 60)
    xs = sorted(set([x0 + k * 0.5 for k in range(int((x1 - x0) / 0.5) + 1)] + [p[0] for t in trees for p in t if x0 <= p[0] <= x1]))
    top = {xx: ridge_y(base, terms, xx) for xx in xs}
    for t in trees:
        lo, hi = min(p[0] for p in t), max(p[0] for p in t)
        edges = list(zip(t, t[1:] + t[:1]))
        for xx in xs:
            if xx < lo or xx > hi:
                continue
            for (ax, ay), (bx, by) in edges:
                if ax != bx and min(ax, bx) <= xx <= max(ax, bx):
                    yy = ay + (by - ay) * (xx - ax) / (bx - ax)
                    if yy < top[xx]:
                        top[xx] = yy
    pts = simplify([(xx, top[xx]) for xx in xs], 0.1)
    d = f'M{num(pts[0][0])},{num(pts[0][1])}l'
    px, py = pts[0]
    out = []
    for qx, qy in pts[1:]:
        out.append(f'{num(round(qx, 1) - round(px, 1))},{num(round(qy, 1) - round(py, 1))}')
        px, py = round(qx, 1), round(qy, 1)
    return d + ' '.join(out) + f'L{num(x1)},{H + 2}L{num(x0)},{H + 2}Z'

far_forest = skyline(FAR, (1.4, 3.4), lambda x: (8 + 3 * math.sin(x / 110 + 2.1)) * trnd.uniform(0.6, 1.25), 0.03, 2)
# A log cabin in a clearing on the near ridge, off to the right (banners narrower than about 430 px don't show it)
CABIN_X = 1150
near_forest = skyline(NEAR, (2, 5), lambda x: (24 + 6 * math.sin(x / 160 + 1.3) + 3 * math.sin(x / 41 + 0.4)) * trnd.uniform(0.65, 1.2) + (10 if trnd.random() < 0.05 else 0), 0.012, 5, keep_clear=(CABIN_X - 26, CABIN_X + 26))

def hfade(id_, stops):
    return f'<linearGradient id="{id_}" x1="0" y1="0" x2="1" y2="0">' + ''.join(f'<stop offset="{o}" stop-color="#fff" stop-opacity="{a}"/>' for o, a in stops) + '</linearGradient>'

def rays_filter(id_, seed):
    return (f'<filter id="{id_}" x="-5%" y="-40%" width="110%" height="180%" color-interpolation-filters="sRGB">'
            f'<feTurbulence type="fractalNoise" baseFrequency="0.05 0.0012" numOctaves="4" seed="{seed}" result="noise"/>'
            '<feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.4 0 0 0 -0.55" result="streaks"/>'
            '<feComposite in="SourceGraphic" in2="streaks" operator="in" result="rayed"/>'
            '<feGaussianBlur in="rayed" stdDeviation="1.4 7"/></filter>')

def layer(cls, body, defs='', align='xMidYMid'):
    return (f'<svg class="bn-layer {cls}" viewBox="0 0 {W} {H}" preserveAspectRatio="{align} slice" aria-hidden="true" focusable="false">'
            + (f'<defs>{defs}</defs>' if defs else '') + body + '</svg>')

# Stars: most stay still. A few accent stars, a little larger, have a soft glow and a faint four-point sparkle,
# and twinkle (CSS animates .acc), each on its own beat. The outer <g> places the star; the inner one twinkles.
ACCENTS = [(140, 28, 1.0, 3.8, 0.0), (395, 52, 0.8, 2.6, 1.1), (610, 16, 1.1, 4.6, 2.3), (835, 40, 0.85, 3.2, 0.6),
           (1080, 22, 1.0, 5.4, 3.0), (1290, 60, 0.8, 2.9, 1.7), (1505, 30, 0.95, 4.1, 0.9)]
SPARKLE = 'M0-7L.45-.45L7 0L.45.45L0 7L-.45.45L-7 0L-.45-.45Z'
accents = ''.join(
    f'<g transform="translate({x} {y}) scale({k})"><g class="acc" style="animation-duration:{dur}s;animation-delay:-{delay}s">'
    f'<circle r="6.5" fill="url(#bn-star-glow)"/><path d="{SPARKLE}" fill="#F4F7FF" opacity=".5"/><circle r="1.5" fill="#FFFFFF"/></g></g>'
    for x, y, k, dur, delay in ACCENTS)

# The Big Dipper and the North Star, at the upper left, where the sky above the curtains is clearest. The Dipper's
# shape is true: a stereographic projection about the celestial pole, turned as the sky turns at some hour, never
# mirrored. The North Star lies on the line through the two pointer stars (Merak, then Dubhe), as in the sky, but
# nearer: 2.2 times the pointers' spacing rather than about 5.3, so the whole figure fits above the curtains. Brighter
# stars are drawn larger. Lines and names (.bn-figure, and .bn-labels in the page) show when the pointer comes near.
DIPPER = {'Dubhe': (11.0621, 61.751, 1.79), 'Merak': (11.0307, 56.383, 2.37), 'Phecda': (11.8972, 53.695, 2.44),
          'Megrez': (12.2571, 57.033, 3.31), 'Alioth': (12.9005, 55.960, 1.77), 'Mizar': (13.3988, 54.925, 2.27),
          'Alkaid': (13.7923, 49.313, 1.86)}  # right ascension (hours), declination (degrees), magnitude
NORTH_STAR_MAG, DIPPER_TURN, POINTER_GAP = 1.98, 44, 2.2
DIPPER_BOX = (250, 34, 60)  # the whole figure's left edge, top and height, in scene units

def pole_xy(ra, dec):
    r = 2 * math.degrees(math.tan(math.radians((90 - dec) / 2)))
    a = math.radians(ra * 15)
    return r * math.sin(a), -r * math.cos(a)

def dipper_layout():
    t, pts = math.radians(DIPPER_TURN), {}
    for name, (ra, dec, _) in DIPPER.items():
        x, y = pole_xy(ra, dec)
        pts[name] = (x * math.cos(t) - y * math.sin(t), x * math.sin(t) + y * math.cos(t))
    (mx, my), (dx, dy) = pts['Merak'], pts['Dubhe']
    pts['North Star'] = (dx + (dx - mx) * POINTER_GAP, dy + (dy - my) * POINTER_GAP)
    x0, y0 = min(p[0] for p in pts.values()), min(p[1] for p in pts.values())
    k = DIPPER_BOX[2] / (max(p[1] for p in pts.values()) - y0)
    return {n: (DIPPER_BOX[0] + (x - x0) * k, DIPPER_BOX[1] + (y - y0) * k) for n, (x, y) in pts.items()}

FIG = dipper_layout()
mags = {**{n: m for n, (_, _, m) in DIPPER.items()}, 'North Star': NORTH_STAR_MAG}
radius = {n: 0.9 + (3.4 - mags[n]) * 0.5 for n in FIG}
fig_stars = ''.join(f'<circle data-star="{n}" cx="{x:.1f}" cy="{y:.1f}" r="{radius[n]:.2f}" opacity=".95"/>' for n, (x, y) in FIG.items())
fig_top = min(y - radius[n] for n, (x, y) in FIG.items())

def towards(a, b, d):
    """The point d units from a toward b"""
    (ax, ay), (bx, by) = a, b
    n = math.hypot(bx - ax, by - ay)
    return ax + (bx - ax) * d / n, ay + (by - ay) * d / n

outline = 'M' + 'L'.join(f'{FIG[n][0]:.1f},{FIG[n][1]:.1f}' for n in ('Alkaid', 'Mizar', 'Alioth', 'Megrez', 'Dubhe', 'Merak', 'Phecda', 'Megrez'))
p0, p1 = towards(FIG['Dubhe'], FIG['North Star'], 4), towards(FIG['North Star'], FIG['Dubhe'], 4)
dipper = (f'<g class="bn-dipper" data-top="{fig_top:.1f}"><g class="bn-dipper-stars" fill="#F2F5FF">{fig_stars}</g>'
          '<g class="bn-figure" fill="none" stroke="#CFDBFF" stroke-opacity=".55">'
          f'<path d="{outline}" stroke-width="1" vector-effect="non-scaling-stroke"/>'
          f'<path d="M{p0[0]:.1f},{p0[1]:.1f}L{p1[0]:.1f},{p1[1]:.1f}" stroke-width="1" stroke-dasharray="2 3" vector-effect="non-scaling-stroke"/></g></g>')

# The moon, upper right, in its own layer above the curtains, since the aurora's light adds to the moon's rather than
# blocking it. The page lights the textures from moon_gen.py for today's phase and shows the result (.on), except near new
# moon. The glare lies under the moon's face, so it doesn't wash out the maria, and it covers the dark part, as in the sky.
# Both are warm, as a moon this low looks through the air.
# .bn-moon-pin lets the page keep it in view on a narrow or wide banner (data-top: its top edge; data-right: the room to
# its right), and the page hides the stars near it, wherever that puts it. It is drawn about seven times its true size for
# this wide view, as a prominent part of the sky.
MOON = (1392, 44, 24)

def data_uri(name):
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), name), 'rb') as f:
        return 'data:image/webp;base64,' + base64.b64encode(f.read()).decode()

moon = (f'<g class="bn-moon-pin" data-top="{MOON[1] - MOON[2]:g}" data-right="{W - MOON[0] - MOON[2]:g}"><g class="bn-moon" transform="translate({MOON[0]} {MOON[1]})" '
        f'data-albedo="{data_uri("moon_albedo.webp")}" data-relief="{data_uri("moon_relief.webp")}">'
        f'<circle class="bn-moon-halo" r="{MOON[2] * 4.2:g}" fill="url(#bn-moon-glow)" opacity="0"/>'
        f'<image class="bn-moon-face" x="{-MOON[2]}" y="{-MOON[2]}" width="{2 * MOON[2]}" height="{2 * MOON[2]}"/></g></g>')

def seg_dist(p, a, b):
    """Distance from p to the segment ab"""
    (px, py), (ax, ay), (bx, by) = p, a, b
    t = max(0, min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)))
    return math.hypot(px - ax - t * (bx - ax), py - ay - t * (by - ay))

FIG_LINES = [(FIG[a], FIG[b]) for a, b in [('Alkaid', 'Mizar'), ('Mizar', 'Alioth'), ('Alioth', 'Megrez'), ('Megrez', 'Dubhe'),
                                           ('Dubhe', 'Merak'), ('Merak', 'Phecda'), ('Phecda', 'Megrez'), ('Dubhe', 'North Star')]]

def clear(x, y):
    """Leave out stars crowding the Dipper's stars or lying on its lines"""
    return (all(math.hypot(x - fx, y - fy) > 6 for fx, fy in FIG.values())
            and all(seg_dist((x, y), a, b) > 3 for a, b in FIG_LINES))

sky = layer('bn-sky', f'<rect width="{W}" height="{H}" fill="url(#bn-sky)"/><g fill="#E8EEFF">{"".join(s for x, y, s in stars if clear(x, y))}</g>{accents}{dipper}',
            '<linearGradient id="bn-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060D26"/><stop offset=".6" stop-color="#0F1B4B"/><stop offset=".86" stop-color="#1B2C6A"/><stop offset="1" stop-color="#26397E"/></linearGradient>'
            '<radialGradient id="bn-star-glow"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".9"/><stop offset=".25" stop-color="#DDE7FF" stop-opacity=".45"/><stop offset="1" stop-color="#C9D8FF" stop-opacity="0"/></radialGradient>')
moon_layer = layer('bn-moonlayer', moon, '<radialGradient id="bn-moon-glow"><stop offset="0" stop-color="#E8D4AD" stop-opacity=".34"/><stop offset=".24" stop-color="#E8D4AD" stop-opacity=".34"/><stop offset=".3" stop-color="#E6D2AD" stop-opacity=".265"/><stop offset=".4" stop-color="#E2D0AD" stop-opacity=".166"/><stop offset=".5" stop-color="#DDCCAD" stop-opacity=".097"/><stop offset=".6" stop-color="#D8C8AD" stop-opacity=".05"/><stop offset=".7" stop-color="#D2C4AD" stop-opacity=".021"/><stop offset=".85" stop-color="#CCC0AD" stop-opacity=".003"/><stop offset="1" stop-color="#C9BEAD" stop-opacity="0"/></radialGradient>')
back_defs = ('<linearGradient id="bn-back" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#B7A4F1" stop-opacity=".6"/><stop offset=".45" stop-color="#9C88E8" stop-opacity=".25"/><stop offset="1" stop-color="#8873DD" stop-opacity="0"/></linearGradient>'
             + hfade('bn-hf-back', [(0, 0), (.15, .7), (.4, .35), (.6, .8), (.85, .45), (1, 0)])
             + f'<mask id="bn-m-back" maskUnits="userSpaceOnUse" x="0" y="0" width="{W}" height="{H}"><rect width="{W}" height="{H}" fill="url(#bn-hf-back)"/></mask>'
             + '<filter id="bn-glow-b" x="-10%" y="-60%" width="120%" height="220%"><feGaussianBlur stdDeviation="12"/></filter>' + rays_filter('bn-rays-b1', 9))
back_svg = layer('bn-back-art', f'<g mask="url(#bn-m-back)"><path d="{back}" fill="url(#bn-back)" filter="url(#bn-glow-b)"/><path d="{back}" fill="url(#bn-back)" filter="url(#bn-rays-b1)"/></g>', back_defs)
main_grad = ('<linearGradient id="bn-main" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#B2C9F8" stop-opacity=".95"/><stop offset=".22" stop-color="#90ABF0" stop-opacity=".62"/><stop offset=".6" stop-color="#7A8FE6" stop-opacity=".22"/><stop offset="1" stop-color="#6E7FE0" stop-opacity="0"/></linearGradient>'
             '<linearGradient id="bn-edge" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#EEF3FF" stop-opacity=".95"/><stop offset="1" stop-color="#CFDCFB" stop-opacity="0"/></linearGradient>'
             + hfade('bn-hf-main', [(0, 0), (.08, .55), (.3, .95), (.46, .5), (.62, 1), (.8, .8), (.93, .35), (1, 0)])
             + f'<mask id="bn-m-main" maskUnits="userSpaceOnUse" x="0" y="0" width="{W}" height="{H}"><rect width="{W}" height="{H}" fill="url(#bn-hf-main)"/></mask>'
             '<filter id="bn-glow" x="-10%" y="-60%" width="120%" height="220%"><feGaussianBlur stdDeviation="12"/></filter>'
             '<filter id="bn-soft" x="-5%" y="-80%" width="110%" height="260%"><feGaussianBlur stdDeviation="2.5"/></filter>'
             + rays_filter('bn-rays-1', 9) + rays_filter('bn-rays-2', 23) + rays_filter('bn-rays-3', 41))
main_a = layer('bn-rays-a', f'<g mask="url(#bn-m-main)"><path d="{main}" fill="url(#bn-main)" filter="url(#bn-glow)" opacity=".7"/><path d="{main}" fill="url(#bn-main)" filter="url(#bn-rays-1)"/></g>', main_grad)
main_b = layer('bn-rays-b', f'<g mask="url(#bn-m-main)"><path d="{main}" fill="url(#bn-main)" filter="url(#bn-rays-2)"/></g>')
main_c = layer('bn-rays-c', f'<g mask="url(#bn-m-main)"><path d="{main}" fill="url(#bn-main)" filter="url(#bn-rays-3)"/></g>')
# Natural color: oxygen green just above the bright lower edge, and a violet fringe at the edge and the tops.
# Each comes in patches along the curtain (a horizontal mask), so drifting the layer makes the color wander.
tint_defs = ('<linearGradient id="bn-green" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#9CF7A6" stop-opacity=".3"/><stop offset=".14" stop-color="#62EB86" stop-opacity=".85"/><stop offset=".42" stop-color="#3FD46A" stop-opacity=".4"/><stop offset="1" stop-color="#2FBF5E" stop-opacity="0"/></linearGradient>'
             '<linearGradient id="bn-purple" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#E0A2F2" stop-opacity=".45"/><stop offset=".12" stop-color="#C79CF5" stop-opacity=".06"/><stop offset=".5" stop-color="#B58BEF" stop-opacity=".22"/><stop offset=".85" stop-color="#A77FEA" stop-opacity=".6"/><stop offset="1" stop-color="#9A72E4" stop-opacity="0"/></linearGradient>'
             + hfade('bn-hf-green', [(0, 0), (.12, 0), (.22, .85), (.36, .2), (.5, .7), (.64, .95), (.76, .25), (.88, .6), (1, 0)])
             + hfade('bn-hf-purple', [(0, 0), (.1, .6), (.25, .15), (.42, .8), (.58, .3), (.72, .7), (.9, .2), (1, 0)])
             + f'<mask id="bn-m-green" maskUnits="userSpaceOnUse" x="0" y="0" width="{W}" height="{H}"><rect width="{W}" height="{H}" fill="url(#bn-hf-green)"/></mask>'
             + f'<mask id="bn-m-purple" maskUnits="userSpaceOnUse" x="0" y="0" width="{W}" height="{H}"><rect width="{W}" height="{H}" fill="url(#bn-hf-purple)"/></mask>'
             + rays_filter('bn-rays-g', 51) + rays_filter('bn-rays-p', 77))
tint_g = layer('bn-green', f'<g mask="url(#bn-m-green)"><path d="{main}" fill="url(#bn-green)" filter="url(#bn-glow)" opacity=".6"/><path d="{main}" fill="url(#bn-green)" filter="url(#bn-rays-g)"/></g>', tint_defs)
tint_p = layer('bn-purple', f'<g mask="url(#bn-m-purple)"><path d="{main}" fill="url(#bn-purple)" filter="url(#bn-glow)" opacity=".6"/><path d="{main}" fill="url(#bn-purple)" filter="url(#bn-rays-p)"/></g>')
# Magenta, as in strong displays: a pink border hugging the curtain's lower edge, and a faint orchid in the upper rays
# where the violet is, both in patches of their own, so the magenta wanders apart from the green and violet
mag_defs = ('<linearGradient id="bn-magenta" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#E86BE0" stop-opacity="0"/><stop offset=".45" stop-color="#DD6BE6" stop-opacity=".08"/><stop offset=".8" stop-color="#D96AE8" stop-opacity=".45"/><stop offset="1" stop-color="#D06AE6" stop-opacity="0"/></linearGradient>'
            + hfade('bn-hf-magenta', [(0, 0), (.08, .2), (.2, .75), (.34, .15), (.47, .55), (.6, .1), (.7, .8), (.84, .3), (.94, .5), (1, 0)])
            + f'<mask id="bn-m-magenta" maskUnits="userSpaceOnUse" x="0" y="0" width="{W}" height="{H}"><rect width="{W}" height="{H}" fill="url(#bn-hf-magenta)"/></mask>'
            + '<filter id="bn-border" x="-5%" y="-150%" width="110%" height="400%"><feGaussianBlur stdDeviation="2 3"/></filter>'
            + rays_filter('bn-rays-m', 63))
tint_m = layer('bn-magenta', f'<g mask="url(#bn-m-magenta)"><path d="{main}" fill="url(#bn-magenta)" filter="url(#bn-rays-m)"/>'
               f'<path d="{edge}" transform="translate(0 4)" fill="#FF5CB8" opacity=".75" filter="url(#bn-border)"/></g>', mag_defs)
edge_l = layer('bn-edge', f'<g mask="url(#bn-m-main)"><path d="{edge}" fill="url(#bn-edge)" filter="url(#bn-soft)" opacity=".75"/></g>')
# A surge, as in a substorm: bright green rays rising from the curtain's lower edge, over a pink fringe. Hidden by day;
# the page shows a little of it around midnight and brings it up now and then for a surge.
surge_defs = ('<linearGradient id="bn-surge" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#D6FFE4" stop-opacity=".55"/><stop offset=".1" stop-color="#7DF7A8" stop-opacity=".9"/><stop offset=".35" stop-color="#45DB7A" stop-opacity=".45"/><stop offset=".7" stop-color="#36C76A" stop-opacity=".12"/><stop offset="1" stop-color="#36C76A" stop-opacity="0"/></linearGradient>'
              + rays_filter('bn-rays-s', 88))
surge_l = layer('bn-surge', f'<g mask="url(#bn-m-main)"><path d="{main}" fill="url(#bn-surge)" filter="url(#bn-rays-s)"/>'
                f'<path d="{edge}" transform="translate(0 4)" fill="#FF6FCB" opacity=".8" filter="url(#bn-border)"/></g>', surge_defs)
# The cabin, seen three-quarters on: its gable end faces right, and its long side recedes to the left, toward the
# middle of the scene, with one larger window lit warm from inside, a soft halo, and a little of its light on the ground.
# The roof edges catch a faint rim of skylight. Drawn around its base at (0, 0), then placed and scaled. Its smoke and
# firelight are laid over it by the page (.bn-scene), which animates them.
CABIN_K = 1.2
cx, by = CABIN_X, round(ridge_y(*NEAR, CABIN_X) + 1, 1)
window = '-7.5,-2.45 -7.5,-6.35 -1.5,-6.6 -1.5,-2.3'
cabin_defs = ('<filter id="bn-warm" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.6"/></filter>'
              '<filter id="bn-spill" x="-30%" y="-150%" width="160%" height="400%"><feGaussianBlur stdDeviation="2.5"/></filter>')
cabin = (f'<g transform="translate({cx:g} {by:g}) scale({CABIN_K:g})">'
         '<ellipse class="bn-spill" cx="-6" cy="2.8" rx="13" ry="2.4" fill="#FFB25A" opacity=".16" filter="url(#bn-spill)"/>'
         '<path d="M-12,-.5V-8L4,-9V2H-12ZM-9.8,-12V-18.6H-7.4V-12ZM-10.2,-18.6H-7V-19.3H-10.2Z" fill="#050A1F"/>'
         '<path d="M4,2V-9L9,-15L14,-9V2Z" fill="#08102C"/>'
         '<path d="M9,-15L-8,-14.2L-12.8,-7.7L3.4,-8.8Z" fill="#060B22"/>'
         '<path d="M3.4,-8.8L9,-15.2L14.6,-8.8" fill="none" stroke="#060B22" stroke-width=".9" stroke-linejoin="round"/>'
         '<path d="M-8,-14.45L9,-15.45L14.8,-8.95" fill="none" stroke="#96AAE6" stroke-opacity=".28" stroke-width=".35"/>'
         f'<polygon class="bn-win-glow" points="{window}" fill="#FFB04D" opacity=".85" filter="url(#bn-warm)"/>'
         f'<polygon class="bn-win" points="{window}" fill="#FFD08A"/>'
         '<path d="M-4.5,-6.48V-2.37M-7.5,-4.4L-1.5,-4.45" fill="none" stroke="#3A230C" stroke-width=".4" opacity=".7"/></g>')
# The forest and cabin are anchored at the bottom of the banner, so a wide banner crops sky rather than forest
hills = layer('bn-hills', f'<path d="{far_forest}" fill="#0E1842"/><path d="{near_forest}" fill="#050A1F"/>{cabin}', cabin_defs, align='xMidYMax')
# The forest's silhouette alone, as the mask that keeps the page's starlight on the trees (design/landing/forest.svg)
forest_mask = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice">'
               f'<path d="{far_forest}"/><path d="{near_forest}"/></svg>\n')
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'forest.svg'), 'w').write(forest_mask)
# Where the page puts the smoke (the chimney top), the firelight and the warmer glow when the pointer is near the
# cabin (both on the window), and the puff and sparks when the cabin is clicked (the chimney top), in percent of the scene
chimney = (round(cx - 8.6 * CABIN_K, 2), round(by - 19.3 * CABIN_K, 2))
hearth = (cx - 4.5 * CABIN_K, by - 4.45 * CABIN_K)
at_chimney = f'left:{chimney[0] / W * 100:.3f}%;top:{chimney[1] / H * 100:.3f}%'
scene = (f'<div class="bn-scene"><div class="bn-hearth" style="left:{hearth[0] / W * 100:.3f}%;top:{hearth[1] / H * 100:.3f}%"></div>'
         f'<div class="bn-cozy" style="left:{hearth[0] / W * 100:.3f}%;top:{hearth[1] / H * 100:.3f}%"></div>'
         f'<div class="bn-smoke" data-at="{chimney[0]:g},{chimney[1]:g}" style="{at_chimney}">'
         + '<i></i>' * 8 + f'</div><div class="bn-puff" style="{at_chimney}"></div></div>')

# The curtains sit in .bn-px wrappers, which the page shifts a little with the pointer for depth. The stars and the
# forest (.bn-ground) stay put: a moving foreground can bring on motion sickness. .bn-twilight is the glow the page
# lights over the horizon at dusk and dawn, behind the curtains, and .bn-sat a satellite, which passes behind them too.
# .bn-glints holds the sparkles the page adds near the pointer, .bn-labels the Big Dipper's names, and .bn-treeglow,
# above the forest, the faint starlight the page adds to the treetops.
html = ('<div class="banner" aria-hidden="true">\n  ' + sky
        + '\n  <div class="bn-twilight"></div><div class="bn-sat"><i></i></div>'
        + '\n  <div class="bn-px bn-px-back"><div class="bn-back"><div class="bn-sway-b">\n    ' + back_svg + '\n  </div></div></div>'
        + '\n  <div class="bn-px bn-px-main"><div class="bn-main"><div class="bn-sway">\n    ' + main_a + '\n    ' + main_b + '\n    ' + main_c + '\n    ' + tint_g + '\n    ' + tint_p + '\n    ' + tint_m + '\n    ' + surge_l + '\n    ' + edge_l + '\n  </div></div></div>'
        + '\n  ' + moon_layer
        + '\n  <div class="bn-meteor bn-m1"><i></i></div><div class="bn-meteor bn-m2"><i></i></div><div class="bn-meteor bn-m3"><i></i></div>'
        + '\n  <div class="bn-plane bn-plane-a"><i></i><i class="bn-strobe"></i></div><div class="bn-plane bn-plane-b"><i></i><i class="bn-strobe"></i></div>'
        + '\n  <div class="bn-glints"></div>'
        + '\n  <div class="bn-labels"><span class="bn-label bn-label-dipper">Big Dipper</span><span class="bn-label bn-label-north">North Star</span></div>'
        + '\n  <div class="bn-ground">' + hills + '</div>'
        + '\n  <div class="bn-treeglow"></div>'
        + '\n  ' + scene + '\n</div>')
open(sys.argv[1], 'w').write(html)
print(len(html), 'bytes')

# The far-off plane's two crossings, as CSS keyframes (written when a second file is named: paste them over the
# bn-plane-a and bn-plane-b keyframes in index.html). A straight, level flight seen in this wide view traces an arc: it
# is highest, fastest, largest and brightest where it passes nearest, and sinks toward the horizon on either side. Until
# November 7 each track crossed square to the view, passing nearest near the middle, so the plane grew on the way in and
# shrank on the way out. Now each runs at an angle to the view, as a flight across the country would: the plane passes
# nearest just inside the edge where it comes in, then heads away, shrinking, slowing and sinking toward the horizon,
# until it fades out low over the trees about three quarters of the way across. The banner is treated as a panorama
# about 120 degrees wide and 18 tall, with the horizon at 84% of its height (the ridges). Each crossing is sampled at
# even times, a steady ground speed, so the changes of apparent speed come from the geometry alone. In the page's 400 s
# cycle the crossings take 90 and 100 s: about as fast as the satellite where the plane passes nearest, and slower for
# its size, though 10 to 15 times an airliner's real speed on these paths. The plane looks smaller in proportion to its
# distance, and it turns to follow its path.
FOV_X, FOV_Y, HORIZON = 120, 18, 84

def pct(v):
    return f'{v:.2f}'.rstrip('0').rstrip('.') + '%'

def plane_keyframes(name, start, end, nearest, peak, rightward=True, far=None, fade=0.25, n=32):
    """One crossing between start% and end% of the cycle. nearest: the bearing where the plane passes nearest
    (0 = the middle of the banner, positive = right), in degrees, which may be near or beyond the edge where it comes
    in; peak: its elevation there, in degrees. far: if the plane would be farther away than this, in nearest
    distances, before it reaches the far edge, the crossing ends there instead, the plane fading out over the last
    `fade` of the crossing's time. The plane waits hidden beyond the edge before its crossing."""
    k = math.tan(math.radians(peak))  # altitude over the nearest distance
    a0, a1 = -FOV_X / 2 - 7, FOV_X / 2 + 7  # beyond either edge, even for the plane at its largest on a phone
    if not rightward:
        a0, a1 = a1, a0
    s0 = math.tan(math.radians(a0 - nearest))  # along the track, in nearest distances
    # A track only reaches bearings within 90 degrees of where it passes nearest, so heading away it may never reach
    # the far edge: it closes on the horizon short of it
    s1 = math.tan(math.radians(a1 - nearest)) if abs(a1 - nearest) < 90 else math.copysign(math.inf, a1 - a0)
    fading = far is not None and abs(s1) > math.sqrt(far ** 2 - 1)
    if fading:
        s1 = math.copysign(math.sqrt(far ** 2 - 1), s1)
    assert math.isfinite(s1), f'{name} never reaches the far edge: give it a far distance'
    def spot(i):
        sd = s0 + (s1 - s0) * i / n
        r = math.hypot(1, sd)
        return (50 + (nearest + math.degrees(math.atan(sd))) / FOV_X * 100,
                HORIZON - math.degrees(math.atan(k / r)) / FOV_Y * 100, r)
    frames = []
    for i in range(n + 1):
        x, y, r = spot(i)
        o = 0.35 + 0.65 * r ** -1.5  # dimmer when farther away
        if fading:  # and gone into the distance by the end
            u = min(1, max(0, (i / n - (1 - fade)) / fade))
            o *= 1 - u * u * (3 - 2 * u)
        # Its heading on the screen, from where it was and where it's going, in the banner's usual proportions. The
        # leftward plane is the same drawing mirrored, so its turn is measured from pointing left.
        (x0, y0, _), (x1, y1, _) = spot(max(0, i - 1)), spot(min(n, i + 1))
        dx, dy = (x1 - x0) * W / 100, (y1 - y0) * H / 100
        turn = math.degrees(math.atan2(dy, dx) if rightward else math.atan2(-dy, -dx))
        at = start + (end - start) * i / n
        place = f'transform:translate({pct(x)},{pct(y)}) rotate({turn:.1f}deg) scale({1 / r:.2f})'
        if i == 0:
            frames.append(f'0%,{pct(at - 0.01)}{{{place};opacity:0}}')
        sel = f'{pct(at)},100%' if i == n else pct(at)
        frames.append(f'{sel}{{{place};opacity:{o:.2f}}}')
    return f'@keyframes {name}{{' + ''.join(frames) + '}'

if len(sys.argv) > 2:
    css = (plane_keyframes('bn-plane-a', 1, 23.5, nearest=-58, peak=11.2, far=4.5) + '\n'
           + plane_keyframes('bn-plane-b', 51, 76, nearest=45, peak=8, rightward=False, far=4.5) + '\n')
    open(sys.argv[2], 'w').write(css)
    print(len(css), 'bytes of plane keyframes')

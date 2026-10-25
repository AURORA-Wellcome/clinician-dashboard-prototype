"""Landing-page banner: a night sky with blue-violet aurora curtains over a low, forested horizon (SVG, no animation).

Usage: python3 design/landing/banner_gen.py banner.html   then paste the output over the <div class="banner"> in index.html.
Layers (sky and stars, back curtain, three ray patterns and a bright edge for the main curtain, hills) are separate
SVGs inside drift and sway wrappers, so the page can move and cross-fade them cheaply with CSS transforms and opacity,
without redrawing the blur and noise filters.
Mostly blue-violet, with natural green and violet shimmer. (The dashboard itself keeps to cool hues: green means
"on track" there.)"""
import math, random, sys
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

stars = []
for _ in range(110):
    x, y = rnd.uniform(0, W), rnd.uniform(3, 165)
    r = rnd.choice([0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.2, 1.5])
    stars.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r}" opacity="{rnd.uniform(0.25, 0.85):.2f}"/>')

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

def skyline(ridge_def, spacing, height, clearing, tiers_max, x0=-34.0, x1=W + 34.0):
    """A ridge and its trees as one filled shape: the highest point of hill or tree at each x."""
    base, terms = ridge_def
    trees, x = [], x0
    while x < x1:
        trees.append(spruce(x, ridge_y(base, terms, x) + 1.5, height(x), tiers_max))
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
near_forest = skyline(NEAR, (2, 5), lambda x: (24 + 6 * math.sin(x / 160 + 1.3) + 3 * math.sin(x / 41 + 0.4)) * trnd.uniform(0.65, 1.2) + (10 if trnd.random() < 0.05 else 0), 0.012, 5)

def hfade(id_, stops):
    return f'<linearGradient id="{id_}" x1="0" y1="0" x2="1" y2="0">' + ''.join(f'<stop offset="{o}" stop-color="#fff" stop-opacity="{a}"/>' for o, a in stops) + '</linearGradient>'

def rays_filter(id_, seed):
    return (f'<filter id="{id_}" x="-5%" y="-40%" width="110%" height="180%" color-interpolation-filters="sRGB">'
            f'<feTurbulence type="fractalNoise" baseFrequency="0.05 0.0012" numOctaves="4" seed="{seed}" result="noise"/>'
            '<feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.4 0 0 0 -0.55" result="streaks"/>'
            '<feComposite in="SourceGraphic" in2="streaks" operator="in" result="rayed"/>'
            '<feGaussianBlur in="rayed" stdDeviation="1.4 7"/></filter>')

def layer(cls, body, defs=''):
    return (f'<svg class="bn-layer {cls}" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">'
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

sky = layer('bn-sky', f'<rect width="{W}" height="{H}" fill="url(#bn-sky)"/><g fill="#E8EEFF">{"".join(stars)}</g>{accents}',
            '<linearGradient id="bn-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060D26"/><stop offset=".6" stop-color="#0F1B4B"/><stop offset=".86" stop-color="#1B2C6A"/><stop offset="1" stop-color="#26397E"/></linearGradient>'
            '<radialGradient id="bn-star-glow"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".9"/><stop offset=".25" stop-color="#DDE7FF" stop-opacity=".45"/><stop offset="1" stop-color="#C9D8FF" stop-opacity="0"/></radialGradient>')
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
edge_l = layer('bn-edge', f'<g mask="url(#bn-m-main)"><path d="{edge}" fill="url(#bn-edge)" filter="url(#bn-soft)" opacity=".75"/></g>')
hills = layer('bn-hills', f'<path d="{far_forest}" fill="#0E1842"/><path d="{near_forest}" fill="#050A1F"/>')

# Each moving layer sits in a .bn-px wrapper, which the page shifts a little with the pointer for depth (the stars
# stay put; the hills, nearest, move most). .bn-glints holds the sparkles the page adds near the pointer.
html = ('<div class="banner" aria-hidden="true">\n  ' + sky
        + '\n  <div class="bn-px bn-px-back"><div class="bn-back"><div class="bn-sway-b">\n    ' + back_svg + '\n  </div></div></div>'
        + '\n  <div class="bn-px bn-px-main"><div class="bn-main"><div class="bn-sway">\n    ' + main_a + '\n    ' + main_b + '\n    ' + main_c + '\n    ' + tint_g + '\n    ' + tint_p + '\n    ' + edge_l + '\n  </div></div></div>'
        + '\n  <div class="bn-meteor bn-m1"><i></i></div><div class="bn-meteor bn-m2"><i></i></div><div class="bn-meteor bn-m3"><i></i></div>'
        + '\n  <div class="bn-plane bn-plane-a"><i></i></div><div class="bn-plane bn-plane-b"><i></i></div>'
        + '\n  <div class="bn-glints"></div>'
        + '\n  <div class="bn-px bn-px-hills">' + hills + '</div>\n</div>')
open(sys.argv[1], 'w').write(html)
print(len(html), 'bytes')

# The far-off plane's two crossings, as CSS keyframes (written when a second file is named: paste them over the
# bn-plane-a and bn-plane-b keyframes in index.html). A straight, level flight seen in this wide view traces an arc: it
# rises from low on one side, is highest where it passes nearest, then sinks toward the horizon, looking fastest and
# brightest when nearest. The banner is treated as a panorama about 120 degrees wide and 18 tall, with the horizon at
# 84% of its height (the ridges). Each crossing is sampled at even times, a steady ground speed, so the changes of
# apparent speed come from the geometry alone.
FOV_X, FOV_Y, HORIZON = 120, 18, 84

def pct(v):
    return f'{v:.2f}'.rstrip('0').rstrip('.') + '%'

def plane_keyframes(name, start, end, nearest, peak, rightward=True, n=24):
    """One crossing between start% and end% of the cycle. nearest: the bearing where the plane passes nearest
    (0 = the middle of the banner, positive = right), in degrees; peak: its elevation there, in degrees."""
    k = math.tan(math.radians(peak))  # altitude over the nearest distance
    a0, a1 = -FOV_X / 2 - 3, FOV_X / 2 + 3  # just beyond either edge
    if not rightward:
        a0, a1 = a1, a0
    s0, s1 = (math.tan(math.radians(a - nearest)) for a in (a0, a1))  # along the track, in nearest distances
    frames = []
    for i in range(n + 1):
        sd = s0 + (s1 - s0) * i / n
        r = math.hypot(1, sd)
        x = 50 + (nearest + math.degrees(math.atan(sd))) / FOV_X * 100
        y = HORIZON - math.degrees(math.atan(k / r)) / FOV_Y * 100
        o = 0.35 + 0.65 * r ** -1.5  # dimmer when farther away
        at = start + (end - start) * i / n
        sel = f'0%,{pct(at)}' if i == 0 else f'{pct(at)},100%' if i == n else pct(at)
        frames.append(f'{sel}{{transform:translate({pct(x)},{pct(y)});opacity:{o:.2f}}}')
    return f'@keyframes {name}{{' + ''.join(frames) + '}'

if len(sys.argv) > 2:
    css = (plane_keyframes('bn-plane-a', 7, 29.5, nearest=-5, peak=11.2) + '\n'
           + plane_keyframes('bn-plane-b', 57, 82, nearest=12, peak=8, rightward=False) + '\n')
    open(sys.argv[2], 'w').write(css)
    print(len(css), 'bytes of plane keyframes')

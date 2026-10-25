"""Landing-page banner: a night sky with blue-violet aurora curtains over a low horizon (SVG, no animation).

Usage: python3 design/landing/banner_gen.py banner.html   then paste the output over the <div class="banner"> in index.html.
Layers (sky and stars, back curtain, two ray patterns for the main curtain, hills) are separate SVGs, so the page can
drift and cross-fade them cheaply with CSS transforms and opacity, without redrawing the blur and noise filters.
Cool hues only: green means "on track" in the dashboard."""
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
far = ridge(197, [(8, 150, 0.4), (5, 66, 2.0), (3, 27, 1.1), (1.5, 11, 0.3)])
near = ridge(219, [(7, 190, 2.6), (4, 74, 0.8), (2.2, 31, 1.9), (1, 13, 2.2)])

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

# Stars: a few twinkle slowly, each on its own beat (CSS animates .tw)
star_svg = []
for i, st in enumerate(stars):
    star_svg.append(st.replace('<circle ', f'<circle class="tw" style="animation-delay:-{(i * 1.7) % 9:.1f}s" ', 1) if i % 9 == 0 else st)

sky = layer('bn-sky', f'<rect width="{W}" height="{H}" fill="url(#bn-sky)"/><g fill="#E8EEFF">{"".join(star_svg)}</g>',
            '<linearGradient id="bn-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060D26"/><stop offset=".6" stop-color="#0F1B4B"/><stop offset=".86" stop-color="#1B2C6A"/><stop offset="1" stop-color="#26397E"/></linearGradient>')
back_defs = ('<linearGradient id="bn-back" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#B7A4F1" stop-opacity=".6"/><stop offset=".45" stop-color="#9C88E8" stop-opacity=".25"/><stop offset="1" stop-color="#8873DD" stop-opacity="0"/></linearGradient>'
             + hfade('bn-hf-back', [(0, 0), (.15, .7), (.4, .35), (.6, .8), (.85, .45), (1, 0)])
             + f'<mask id="bn-m-back" maskUnits="userSpaceOnUse" x="0" y="0" width="{W}" height="{H}"><rect width="{W}" height="{H}" fill="url(#bn-hf-back)"/></mask>'
             + '<filter id="bn-glow-b" x="-10%" y="-60%" width="120%" height="220%"><feGaussianBlur stdDeviation="12"/></filter>' + rays_filter('bn-rays-b1', 9))
back_svg = layer('bn-back', f'<g mask="url(#bn-m-back)"><path d="{back}" fill="url(#bn-back)" filter="url(#bn-glow-b)"/><path d="{back}" fill="url(#bn-back)" filter="url(#bn-rays-b1)"/></g>', back_defs)
main_grad = ('<linearGradient id="bn-main" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#B2C9F8" stop-opacity=".95"/><stop offset=".22" stop-color="#90ABF0" stop-opacity=".62"/><stop offset=".6" stop-color="#7A8FE6" stop-opacity=".22"/><stop offset="1" stop-color="#6E7FE0" stop-opacity="0"/></linearGradient>'
             '<linearGradient id="bn-edge" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#EEF3FF" stop-opacity=".95"/><stop offset="1" stop-color="#CFDCFB" stop-opacity="0"/></linearGradient>'
             + hfade('bn-hf-main', [(0, 0), (.08, .55), (.3, .95), (.46, .5), (.62, 1), (.82, .8), (1, .15)])
             + f'<mask id="bn-m-main" maskUnits="userSpaceOnUse" x="0" y="0" width="{W}" height="{H}"><rect width="{W}" height="{H}" fill="url(#bn-hf-main)"/></mask>'
             '<filter id="bn-glow" x="-10%" y="-60%" width="120%" height="220%"><feGaussianBlur stdDeviation="12"/></filter>'
             '<filter id="bn-soft" x="-5%" y="-80%" width="110%" height="260%"><feGaussianBlur stdDeviation="2.5"/></filter>'
             + rays_filter('bn-rays-1', 9) + rays_filter('bn-rays-2', 23))
main_a = layer('bn-rays-a', f'<g mask="url(#bn-m-main)"><path d="{main}" fill="url(#bn-main)" filter="url(#bn-glow)" opacity=".7"/><path d="{main}" fill="url(#bn-main)" filter="url(#bn-rays-1)"/><path d="{edge}" fill="url(#bn-edge)" filter="url(#bn-soft)" opacity=".75"/></g>', main_grad)
main_b = layer('bn-rays-b', f'<g mask="url(#bn-m-main)"><path d="{main}" fill="url(#bn-main)" filter="url(#bn-rays-2)"/></g>')
hills = layer('bn-hills', f'<path d="{far}" fill="#0E1842"/><path d="{near}" fill="#050A1F"/>')

html = ('<div class="banner" aria-hidden="true">\n  ' + sky + '\n  ' + back_svg
        + '\n  <div class="bn-main">\n    ' + main_a + '\n    ' + main_b + '\n  </div>\n  ' + hills + '\n</div>')
open(sys.argv[1], 'w').write(html)
print(len(html), 'bytes')

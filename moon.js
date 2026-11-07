// The moon game, the banner's third: a click on the moon sends it flying across the sky, with rocks and stars streaming at it
// from the right. Over a run it flies the second half of a month, from full moon to new, and the rocks wane with it, lit by
// the same sun. index.html loads this the first time someone starts it.
//
// The spec is Clinicians/Dashboard/Moon game spec 2026-11-06.md, in the project folder. This is its first four steps: the
// flight; the core of the game (the month's five stages and its changing light, the halo of caught stars, moondust, close
// shaves, craters and rocks of several kinds); things in the sky (constellations, comets, a meteor shower, Jupiter, Venus,
// the lunar module) and power-ups; and the eclipse, credits and high scores; with sound and music. Balance is the fifth.
(() => {
  const TAU = Math.PI * 2;
  // Comfort. A moving foreground can bring on motion sickness, so the forest, the cabin and the page stay still, and only
  // what's in the sky moves: the moon, and the rocks and stars streaming past it. Nothing scrolls or shakes the view. The
  // background stars drift slowly, in three layers, the farthest slowest, and the flight quickens only gently. FLOW scales
  // the speed of everything that streams past, and ?moonflow=0.7 on the page's address (from 0.3 to 1.5) sets it, for trying
  // it on people.
  const FLOW = (() => {
    const v = Number(new URLSearchParams(location.search).get('moonflow'));
    return v >= 0.3 && v <= 1.5 ? v : 1;
  })();
  // The scene is drawn 1600 by 240 (design/landing/banner_gen.py), and its highest treetops are at about 160. The forest is
  // anchored to the banner's bottom edge, so a wide banner crops sky rather than trees.
  const TREETOPS = 160;
  // The moon's radius, as a share of the clear sky's height above the trees, a little larger than it sits in the sky
  const MOON_R = 0.16;
  // Where it flies: from near the left edge to MOON_RIGHT of the banner's width, and from SKY_TOP of the clear sky below the
  // banner's top edge (the score line passes over it there) down until TREE_DIP of its radius is behind the tallest treetops,
  // as the real moon sinks behind trees. It starts at MOON_START of the width, halfway down.
  const MOON_RIGHT = 0.5, MOON_START = 0.2, SKY_TOP = 0.05, TREE_DIP = 0.5;
  // Steering: the moon eases toward where it's steered (EASE, in seconds), at most TOP_SPEED banner heights a second, so it
  // feels like steering something with weight. The keys move where it's going at KEY_SPEED; a drag on a touch screen moves it
  // by DRAG_GAIN times the finger's movement, from where it is, as on a trackpad, so the finger never covers it.
  const EASE = 0.09, TOP_SPEED = 2, KEY_SPEED = 1.5, DRAG_GAIN = 1.25;
  // As it moves, the moon sheds a little dust from its side away from the way it's going: up to TRAIL_RATE grains a second at
  // its top speed, and none while it holds still, with a faint haze among every TRAIL_HAZE grains. Each is thrown back at
  // TRAIL_THROW banner heights a second, within TRAIL_SPREAD radians, and drifts left at TRAIL_DRIFT of the stream's speed,
  // as if left behind in space, fading over TRAIL_LIFE seconds.
  const TRAIL_RATE = 110, TRAIL_HAZE = 3, TRAIL_THROW = [0.15, 0.4], TRAIL_SPREAD = 0.9, TRAIL_DRIFT = 0.6, TRAIL_LIFE = [0.45, 0.85];
  // Pace. Rocks and stars come at SPEED banner heights a second at first, quickening by PACE_GAIN over the month. A speed in
  // banner heights, with rocks and the moon sized by the banner's height and coming at the same rate, makes them crowd the
  // moon's path the same at any width (the shooting star game turned out far easier on a phone, aurora-mdy). The stream
  // gathers speed over START_FLOW seconds as a run begins, and slows as the moon goes home.
  const SPEED = 1.67, PACE_GAIN = 0.4, START_FLOW = 2.2;
  // The background: three layers of stars, farthest first, drifting left at speed banner heights a second. share: of the
  // stars; size: their radius; alpha: how bright. More of them show as the moon wanes, since moonlight hides the faint ones.
  const LAYERS = [
    { speed: 0.12, share: 0.45, size: 0.55, alpha: 0.45 },
    { speed: 0.28, share: 0.35, size: 0.75, alpha: 0.65 },
    { speed: 0.6, share: 0.2, size: 0.95, alpha: 0.85 },
  ];
  // A narrow banner shows a rock later, with less time to see it coming before it reaches the moon: about 1.3 s on a phone,
  // against 3.2 s at 1440 px. Slowing everything there crowds the moon's path more, so instead fewer rocks come: all of them
  // with at least LOOK seconds to see them coming, down to FEWEST as many on the narrowest banners. Stars come the same. In
  // bot tests, a phone with every rock was struck about 50% more often than 1440 px, and with 60% of them about half as
  // often, so FEWEST sits between, until longer runs settle it.
  const LOOK = 2.4, FEWEST = 0.75;
  // The month: a run flies its second half, from full moon to new, in five stages. p: the phase each starts at (0.5 is full,
  // 1 new); seconds: how long it lasts; says: its card's second line; rockEvery: a rock every so many seconds; and what it
  // brings, from then on: dust, big rocks that split, rocks that bob, walls with a gap, boulders, tumbling pairs and fast
  // meteoroids. At new moon comes the eclipse, below.
  const STAGES = [
    { name: 'Full moon', p: 0.5, seconds: 25, rockEvery: 1.4 },
    { name: 'Waning gibbous', p: 0.53, seconds: 40, rockEvery: 1.1, says: 'dust', dust: true, big: true, bob: true, shapes: true },
    { name: 'Last quarter', p: 0.73, seconds: 45, rockEvery: 0.95, says: "Ride a comet's tail", walls: true, boulders: true, comets: true },
    { name: 'Waning crescent', p: 0.79, seconds: 45, rockEvery: 0.8, says: 'The rocks go dark', pairs: true, fast: true },
    { name: 'New moon', p: 0.97, seconds: 20, rockEvery: 2.2, says: 'Cover the sun' },
  ];
  const MONTH_END = 0.995, MONTH_SECONDS = STAGES.reduce((sum, s) => sum + s.seconds, 0);
  // The eclipse (step 4). The sun comes into view at the right edge SUN_FROM of the way through the crescent and drifts in; early
  // in the new moon it comes to rest in the moon's half of the sky over SUN_SETTLES seconds, SUN_SIZE of the moon's size, and then
  // wanders slowly, so holding it takes small corrections. With the moon's middle within TOTAL of its radius of the sun's, the sun
  // is covered: totality, worth TOTAL_POINTS a second, up to TOTAL_MAX seconds (the longest real ones last about 7 1/2 minutes),
  // within an eclipse of ECLIPSE_SECONDS. As it begins, the halo's stars line the moon's edge as Baily's beads, worth BEAD_POINTS
  // each, and through the eclipse, while beads are left, a rock that reaches the moon takes beads (HALO_COST, by its size)
  // rather than a life. It ends with the diamond ring. Any
  // totality wins, worth WIN_LIFE for each life left; otherwise a partial eclipse pays PARTIAL_POINTS for each percent of the sun
  // covered. (The spec said within 5% of the moon's width; held with a mouse and a wandering sun, that's a pixel or two.)
  const SUN_FROM = 0.45, SUN_SETTLES = 5, SUN_SIZE = 0.92, TOTAL = 0.2, TOTAL_POINTS = 1000, TOTAL_MAX = 7, ECLIPSE_SECONDS = 12;
  const BEAD_POINTS = 100, WIN_LIFE = 2000, PARTIAL_POINTS = 20, RING_SECONDS = 1.6;
  // Each new stage is worth STAGE_POINTS for each stage so far, and gives back a life, up to five. The month ends in the
  // eclipse, above.
  const STAGE_POINTS = 500;
  // A star every STAR_EVERY seconds; some come near the moon. (Every 0.8 s, the halo refilled faster than rocks could empty
  // it, and a bot that reacts a quarter second late never lost a life in a month.)
  const STAR_EVERY = 1.1, NEAR_STARS = 0.3;
  // Real star colors, from the commonest and coolest to the rarest and hottest, worth 10 to 150 points, the same range as the
  // other games. share: how often each comes, out of 100.
  const STARS = [
    { color: '255,164,124', points: 10, share: 30 },
    { color: '255,202,150', points: 20, share: 25 },
    { color: '255,236,184', points: 30, share: 20 },
    { color: '242,245,255', points: 50, share: 13 },
    { color: '190,210,255', points: 80, share: 8 },
    { color: '150,180,255', points: 150, share: 4 },
  ];
  // The halo: caught stars circle the moon, up to HALO_MAX, HALO_OUT of its radius out, turning HALO_SPIN radians a second,
  // each HALO_STAR of its radius. A catch is worth its points times the stars in the halo. The halo shields by what you see:
  // a rock that hits a halo star breaks on it, taking that star, so a full halo is nearly a wall; one that slips between them
  // and reaches the moon costs a life. At first a rock reaching the moon took halo stars instead (HALO_POOL, HALO_COST of
  // them by its size), but a bot that reacts a quarter second late then never lost a life in a month: the ring stopped all
  // but about four rocks, and stars came often enough to keep it full.
  const HALO_MAX = 8, HALO_OUT = 1.6, HALO_SPIN = 1.3, HALO_STAR = 0.2, HALO_POOL = false, HALO_COST = { small: 2, medium: 3, large: 4, boulder: 4 };
  // Rocks: sizes as shares of the moon's radius, and what each is worth broken (not multiplied by the halo, so stars stay the
  // way to score). Some come at the height the moon is at (AIMED), so sitting still doesn't work.
  const SIZES = { small: [0.34, 0.44], medium: [0.46, 0.58], large: [0.64, 0.8], boulder: [0.95, 1.1] };
  const BREAK_POINTS = { small: 20, medium: 40, large: 80, boulder: 120 };
  const SPLITS_INTO = { boulder: 'large', large: 'medium', medium: 'small' };
  const AIMED = 0.35;
  // Rocks with personalities: BIG of rocks are large, BOB of them bob up and down, a wall with a gap GAP of the moon's radius
  // tall comes every WALL_EVERY seconds, BOULDER of rocks are boulders (two puffs to split), PAIR of them tumbling pairs, and
  // FAST of them fast meteoroids, FAST_SPEED times as quick, which glint at the right edge GLINT seconds before they come
  const BIG = 0.25, BOB = 0.3, GAP = 3.2, WALL_EVERY = [9, 12], BOULDER = 0.1, PAIR = 0.15, FAST = 0.2, FAST_SPEED = 2.2, GLINT = 0.6;
  // Moondust, from the second stage: a click, a tap or the space bar throws a puff straight ahead, about as tall as the moon,
  // at PUFF_SPEED banner heights a second, as far as PUFF_REACH banner heights. It breaks the first rock it meets. The moon
  // holds DUST_MAX puffs, and one comes back every DUST_BACK seconds.
  const DUST_MAX = 3, DUST_BACK = 2, PUFF_SPEED = 2.6, PUFF_REACH = 2;
  // A close shave: a rock passing within CLOSE of the moon's radius of its edge without touching it pays SHAVE_POINTS and
  // knocks loose a third of a puff
  const CLOSE = 0.35, SHAVE_POINTS = 25;
  // Five lives, as in the other games
  const LIVES = 5;
  // A run with no steering in its first IDLE seconds of flight ends without a score, so an accidental click costs little
  const IDLE = 6;
  // The moon swoops from its place to the left of the sky over OPENING seconds, and goes home over GOING_HOME
  const OPENING = 1.8, GOING_HOME = 1.8;
  // How dark the sky gets: a layer over the sky and the aurora, whose opacity alone changes, so the curtains dim but drift on
  const SPACE = 0.8;
  // Rocks are lit by the same sun as the moon, so each wears the moon's phase: every shape is shaded for ROCK_TURNS angles of
  // tumble, ROCK_N pixels across, whenever the phase has moved RELIGHT since, one shape a frame
  const ROCK_N = 56, ROCK_TURNS = 24, ROCK_SHAPES = 6, RELIGHT = 0.004;
  const BEST_KEY = 'aurora-moon-best';
  // Things in the sky (step 3). Constellations to fly, from their stars' real positions (right ascension and declination in
  // degrees, J2000), north up and never mirrored, so west is to the right, as the sky looks facing them; each star's color as
  // in STARS, by its spectral class; and which stars join. Catching every star in one draws its lines and pays SHAPE_POINTS
  // for each of its stars, times the halo. One comes every SHAPE_EVERY seconds from the second stage.
  const SHAPES = [
    { name: 'Cassiopeia', stars: [[2.29, 59.15, 3], [10.13, 56.54, 1], [14.18, 60.72, 4], [21.45, 60.24, 3], [28.6, 63.67, 4]], lines: [[0, 1], [1, 2], [2, 3], [3, 4]] },
    { name: "Orion's belt and sword", stars: [[85.19, -1.94, 5], [84.05, -1.2, 4], [83, -0.3, 5], [83.86, -4.84, 4], [83.82, -5.39, 5], [83.86, -5.91, 5]], lines: [[0, 1], [1, 2], [1, 3], [3, 4], [4, 5]] },
    { name: "The Big Dipper's bowl", stars: [[165.93, 61.75, 1], [165.46, 56.38, 3], [178.46, 53.69, 3], [183.86, 57.03, 3]], lines: [[0, 1], [1, 2], [2, 3], [3, 0]] },
    { name: 'Cygnus, the Northern Cross', stars: [[310.36, 45.28, 3], [305.56, 40.26, 2], [292.68, 27.96, 1], [311.55, 33.97, 1], [296.24, 45.13, 4]], lines: [[0, 1], [1, 2], [4, 1], [1, 3]] },
    { name: "Leo's sickle", stars: [[152.09, 11.97, 4], [151.83, 16.76, 3], [154.99, 19.84, 1], [154.17, 23.42, 3], [148.19, 26.01, 1], [146.46, 23.77, 2]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]] },
  ];
  // The Seven Sisters, the Pleiades, once in the crescent: a tight cluster of seven blue-white stars, worth SISTERS_POINTS
  // more when all seven are caught. The real moon passes in front of them now and then.
  const SISTERS = { name: 'The Seven Sisters', tight: true, stars: [[56.87, 24.105, 4], [57.29, 24.05, 4], [56.22, 24.11, 4], [56.46, 24.37, 4], [56.58, 23.95, 4], [56.3, 24.47, 4], [56.2, 24.29, 4]], lines: [] };
  const SHAPE_POINTS = 100, SISTERS_POINTS = 700, SHAPE_EVERY = [18, 26];
  // Comets, from last quarter, one every COMET_EVERY seconds: a bright head, worth COMET_POINTS, and a dust tail pointing away
  // from the sun, as real comets' tails do, so it points another way in each stage. Flying inside the tail earns TAIL_POINTS
  // every TAIL_TICK seconds, times the halo, and fills the moon's dust.
  const COMET_EVERY = [15, 22], COMET_POINTS = 300, TAIL_POINTS = 5, TAIL_TICK = 0.25;
  // Jupiter, in the last quarter: it passes behind everything over JUPITER_PASS seconds, its radius JUPITER_R of the sky's
  // height, with its four big moons, the ones Galileo found in 1610. Its pull, JUPITER_PULL banner heights a second each second
  // at its edge, bends the paths of rocks, stars and the moon. Flying close earns NEAR_JUPITER a second; each moon caught
  // GALILEAN_POINTS, and all four GALILEO_POINTS more.
  const JUPITER_PASS = 15, JUPITER_R = 0.38, JUPITER_PULL = 1.1, NEAR_JUPITER = 50, GALILEAN_POINTS = 200, GALILEO_POINTS = 800;
  const GALILEANS = [['Io', '232,200,96', -2.3], ['Europa', '236,228,210', 3], ['Ganymede', '190,176,150', 4.4], ['Callisto', '134,122,108', -5.4]];
  // A meteor shower, in the crescent: SHOWER_COUNT fast meteoroids over SHOWER_SECONDS, all slanting from one direction, named for
  // tonight's real shower if one peaks tonight, or else the next, from the shooting star game's dates. Getting through without a
  // strike pays SHOWER_POINTS.
  const SHOWER_COUNT = 14, SHOWER_SECONDS = 4.5, SHOWER_POINTS = 500;
  // Now and then Venus, a bright point that doesn't twinkle, since planets twinkle less than stars (VENUS_CHANCE of runs), and
  // very rarely Apollo 11's lunar module (LANDER_CHANCE of runs). Nothing points either out.
  const VENUS_POINTS = 500, VENUS_CHANCE = 0.5, LANDER_POINTS = 1969, LANDER_CHANCE = 0.15;
  // Power-ups: six, after real things the moon does, each changing how it plays for a few seconds. seconds: how long (0: at
  // once); color: its glow's and its timer's; title and says: its card, the first time it shows in this browser; caught: what
  // rises when it's caught. A constellation completed leaves one where its last star was, and a boulder broken sometimes does
  // (BOULDER_DROP); the blue moon comes by chance alone, in BLUE_CHANCE of runs, at most once. One works at a time.
  const POWERS = {
    supermoon: { seconds: 8, color: '255,224,150', title: 'Supermoon', says: 'Bigger and brighter: rocks shatter on it' },
    tide: { seconds: 8, color: '150,236,224', title: 'Spring tide', says: 'Stars come to you' },
    ring: { seconds: 0, color: '226,234,255', title: 'A ring around the moon', says: 'A full halo at once' },
    storm: { seconds: 6, color: '226,214,190', title: 'Dust storm', says: 'Dust without limit' },
    earth: { seconds: 10, color: '140,190,255', title: 'Earthshine', says: 'The dark rocks show' },
    blue: { seconds: 10, color: '150,180,255', title: 'Blue moon', says: 'Double points' },
  };
  const BOULDER_DROP = 0.35, BLUE_CHANCE = 0.5, SEEN_KEY = 'aurora-moon-powers';
  // A supermoon is SUPER_SIZE times as big; a spring tide draws stars within TIDE_REACH of the moon's radius at TIDE_PULL
  // banner heights a second; a dust storm throws a puff every STORM_EVERY seconds; earthshine lights the rocks EARTH_GLOW more
  const SUPER_SIZE = 1.25, TIDE_REACH = 4.5, TIDE_PULL = 2.2, STORM_EVERY = 0.28, EARTH_GLOW = 0.5;

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t);
  const between = ([a, b]) => lerp(a, b, Math.random());
  const number = (n) => Math.round(n).toLocaleString('en-US');
  const canvas = (w, h) => Object.assign(document.createElement('canvas'), { width: Math.ceil(w), height: Math.ceil(h) });
  const random = (seed) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const litShare = (p) => (1 - Math.cos(TAU * p)) / 2;
  // How much of a disc of radius b a disc of radius a covers, their middles d apart
  const overlap = (d, a, b) => {
    if (d >= a + b) return 0;
    if (d <= Math.abs(a - b)) return a >= b ? 1 : (a * a) / (b * b);
    const lens = a * a * Math.acos(clamp((d * d + a * a - b * b) / (2 * d * a), -1, 1)) + b * b * Math.acos(clamp((d * d + b * b - a * a) / (2 * d * b), -1, 1))
      - 0.5 * Math.sqrt(Math.max(0, (-d + a + b) * (d + a - b) * (d - a + b) * (d + a + b)));
    return lens / (Math.PI * b * b);
  };

  const STYLE = `
.bn-moon-layer{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.bn-moon-space{position:absolute;inset:0;pointer-events:none;opacity:0}
.bn-moon-on{cursor:default;touch-action:none}
.bn-moon-on .bn-labels,.bn-moon-after .bn-labels{z-index:2}
.bn-moon-on .bn-moonlayer,.bn-moon-on .bn-moon-live,.bn-moon-on .bn-moon-label,.bn-moon-on .bn-label-dipper,.bn-moon-on .bn-label-north,.bn-moon-on .bn-meteor,.bn-moon-on .bn-plane,.bn-moon-on .bn-sat,.bn-moon-on .bn-champ-label,.bn-moon-on .bn-animal-label{visibility:hidden}
.bn-moon-hint,.bn-moon-quit{position:absolute;font-size:.75rem;line-height:1;color:rgba(232,238,255,.9);text-shadow:0 0 4px #04071A,0 0 2px #04071A;white-space:nowrap}
.bn-moon-hint{left:50%;top:30px;transform:translateX(-50%);transition:opacity .8s}
.bn-moon-quit{right:0;top:0;padding:10px 12px 8px;cursor:pointer;pointer-events:auto}
.bn-moon-quit:hover{text-decoration:underline;text-underline-offset:2px}
.bn-moon-score{position:absolute;left:50%;top:10px;transform:translateX(-50%);font-size:.8125rem;font-weight:600;line-height:1;color:rgba(232,238,255,.95);text-shadow:0 0 4px #04071A,0 0 2px #04071A;white-space:nowrap}
.bn-wave.bn-moon-wave{top:max(26%,46px)}
.bn-moon-sound{position:absolute;right:0;bottom:0;display:flex;align-items:center;gap:5px;padding:8px 12px;font-size:.8125rem;line-height:1;color:rgba(232,238,255,.9);text-shadow:0 0 4px #04071A;cursor:pointer;pointer-events:auto}
.bn-moon-sound svg{flex:none;filter:drop-shadow(0 0 2px #04071A)}
.bn-moon-sound:hover{text-decoration:underline;text-underline-offset:2px}
.bn-moon-score.link{pointer-events:auto;cursor:pointer}
.bn-moon-score.link span{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:2px}`;
  const addStyle = () => {
    if (!document.getElementById('bn-moon-style')) document.head.append(Object.assign(document.createElement('style'), { id: 'bn-moon-style', textContent: STYLE }));
  };

  // Looks drawn once and reused: stars, the moon's glare, a strike's flash and dust
  const softDot = (size, stops) => {
    const c = canvas(size, size), g = c.getContext('2d'), m = size / 2, fill = g.createRadialGradient(m, m, 0, m, m, m);
    stops.forEach(([at, color]) => fill.addColorStop(at, color));
    g.fillStyle = fill;
    g.fillRect(0, 0, size, size);
    return c;
  };
  // A star to catch: a glow in its color around a white core, with four faint spikes. STAR_GLOW: the glow's radius, in the
  // star's own radii.
  const STAR_GLOW = 2.4;
  const starLook = (color) => {
    const N = 56, c = canvas(N, N), g = c.getContext('2d'), m = N / 2;
    const glow = g.createRadialGradient(m, m, 0, m, m, m);
    glow.addColorStop(0, `rgba(${color},.95)`);
    glow.addColorStop(0.16, `rgba(${color},.6)`);
    glow.addColorStop(0.42, `rgba(${color},.16)`);
    glow.addColorStop(1, `rgba(${color},0)`);
    g.fillStyle = glow;
    g.fillRect(0, 0, N, N);
    g.strokeStyle = `rgba(${color},.45)`;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(m, 2);
    g.lineTo(m, N - 2);
    g.moveTo(2, m);
    g.lineTo(N - 2, m);
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,.95)';
    g.beginPath();
    g.arc(m, m, N * 0.09, 0, TAU);
    g.fill();
    return c;
  };
  // A rock's shape: an irregular outline from a few waves around it, a dome over it, and craters, bowls that tilt the ground
  // in and rims that tilt it out. Kept as each point's facing (its normal) and how pale it is, to be lit for any sun. Its
  // outline's radius is about ROCK_FILL of the drawing's half width.
  const ROCK_FILL = 0.84;
  const rockShape = (seed) => {
    const rand = random(seed), N = ROCK_N, n = N * N;
    const nx = new Float32Array(n), ny = new Float32Array(n), nz = new Float32Array(n), pale = new Float32Array(n), edge = new Float32Array(n);
    const waves = [1, 2, 3, 5].map((k) => ({ k, a: (0.05 + rand() * 0.07) / Math.sqrt(k), ph: rand() * TAU }));
    const outline = (phi) => ROCK_FILL * (0.88 + waves.reduce((sum, w) => sum + w.a * Math.sin(w.k * phi + w.ph), 0));
    const craters = Array.from({ length: 3 + Math.floor(rand() * 3) }, () => {
      const d = rand() * 0.6, a = rand() * TAU;
      return { x: Math.cos(a) * d, y: Math.sin(a) * d, r: 0.12 + rand() * 0.16 };
    });
    for (let j = 0, k = 0; j < N; j++) {
      for (let i = 0; i < N; i++, k++) {
        const x = (2 * i + 1) / N - 1, y = (2 * j + 1) / N - 1, rho = Math.hypot(x, y), R = outline(Math.atan2(y, x));
        edge[k] = clamp((R - rho) * N / 2 + 0.5, 0, 1);
        if (!edge[k]) continue;
        const q = Math.min(0.995, rho / R);
        let ax = x / R, ay = y / R, az = Math.sqrt(1 - q * q) * 0.9, p = 0.88 + rand() * 0.12;
        for (const c of craters) {
          const dx = x - c.x, dy = y - c.y, d = Math.hypot(dx, dy) / c.r;
          if (d < 1) { ax -= dx / c.r * 0.9; ay -= dy / c.r * 0.9; p *= 0.86; } else if (d < 1.35) { ax += dx / c.r * 0.45; ay += dy / c.r * 0.45; p *= 1.06; }
        }
        const len = Math.hypot(ax, ay, az) || 1;
        nx[k] = ax / len;
        ny[k] = ay / len;
        nz[k] = az / len;
        pale[k] = p;
      }
    }
    return { nx, ny, nz, pale, edge, turns: Array.from({ length: ROCK_TURNS }, () => canvas(N, N)) };
  };
  // Lights a shape for each angle of tumble. sun: toward the sun, x right, y down and z toward us; earth: how much earthshine,
  // light from our side, which grows as the moon wanes, so a dark rock still shows faintly. Rocks are lit as the moon is, flat
  // when full (the Lommel-Seeliger law for dusty ground), with a little shading toward the edge so they look round.
  let shadeImage = null;
  const lightRock = (shape, sun, earth) => {
    const N = ROCK_N, img = shadeImage || (shadeImage = new ImageData(N, N)), px = img.data;
    for (let turn = 0; turn < ROCK_TURNS; turn++) {
      // The sun as seen from the rock turned this far: turned back the other way
      const a = turn / ROCK_TURNS * TAU, c = Math.cos(a), s = Math.sin(a), sx = sun.x * c + sun.y * s, sy = -sun.x * s + sun.y * c, sz = sun.z;
      for (let k = 0, q = 0; k < N * N; k++, q += 4) {
        const e = shape.edge[k];
        if (!e) { px[q + 3] = 0; continue; }
        const z = shape.nz[k], toSun = shape.nx[k] * sx + shape.ny[k] * sy + z * sz;
        const lit = toSun > 0 ? 0.55 * Math.min(1.2, 2 * toSun / (toSun + Math.max(0.05, z))) + 0.45 * toSun : 0, glow = earth * z, p = shape.pale[k];
        px[q] = p * (176 * lit + 70 * glow);
        px[q + 1] = p * (168 * lit + 84 * glow);
        px[q + 2] = p * (156 * lit + 112 * glow);
        px[q + 3] = 255 * e;
      }
      shape.turns[turn].getContext('2d').putImageData(img, 0, 0);
    }
  };
  // Jupiter: pale zones and darker belts, wavy streaks along them, the Great Red Spot south of the equator, and darker toward the
  // edge, as a ball is. Seen from Earth it's always nearly full, so it isn't lit for the moon's phase.
  const jupiterLook = () => {
    const N = 240, c = canvas(N, N), g = c.getContext('2d'), m = N / 2, R = m - 2, rand = random(1610);
    g.save();
    g.beginPath();
    g.arc(m, m, R, 0, TAU);
    g.clip();
    const bands = g.createLinearGradient(0, m - R, 0, m + R);
    [[0, '#CDB894'], [0.1, '#BE9A73'], [0.17, '#E9DCC0'], [0.29, '#E6D6B6'], [0.33, '#A97C58'], [0.41, '#B48863'], [0.45, '#F1E5CC'], [0.55, '#EDDFC3'], [0.59, '#B98D67'], [0.67, '#AA7E5B'], [0.71, '#E8D9BB'], [0.82, '#E1CFAE'], [0.86, '#B6906E'], [1, '#C8B08C']].forEach(([at, col]) => bands.addColorStop(at, col));
    g.fillStyle = bands;
    g.fillRect(0, 0, N, N);
    for (let n = 0; n < 22; n++) {
      const y = m - R + rand() * 2 * R, amp = 1 + rand() * 2.5, len = 30 + rand() * 50;
      g.strokeStyle = `rgba(${rand() < 0.5 ? '120,84,58' : '250,240,220'},${(0.15 + rand() * 0.2).toFixed(2)})`;
      g.lineWidth = 1 + rand() * 2;
      g.beginPath();
      for (let x = 0; x <= N; x += 4) { const yy = y + Math.sin(x / len * TAU) * amp; if (x) g.lineTo(x, yy); else g.moveTo(x, yy); }
      g.stroke();
    }
    g.fillStyle = 'rgba(182,90,58,.85)';
    g.beginPath();
    g.ellipse(m + R * 0.3, m + R * 0.36, R * 0.17, R * 0.09, 0, 0, TAU);
    g.fill();
    const limb = g.createRadialGradient(m, m, R * 0.5, m, m, R);
    limb.addColorStop(0, 'rgba(8,6,18,0)');
    limb.addColorStop(1, 'rgba(8,6,18,.6)');
    g.fillStyle = limb;
    g.fillRect(0, 0, N, N);
    g.restore();
    return c;
  };
  // Apollo 11's lunar module, the Eagle: a descent stage in gold foil on four splayed legs, under the gray ascent stage with
  // its window and dish
  const landerLook = () => {
    const N = 64, c = canvas(N, N), g = c.getContext('2d');
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(190,196,206,.65)';
    g.lineWidth = 1.6;
    [[26, 46, 22, 55], [38, 46, 42, 55]].forEach(([a, b, x, y]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(x, y); g.stroke(); });
    g.strokeStyle = '#CDD2DA';
    g.lineWidth = 2.2;
    [[20, 43, 9, 56], [44, 43, 55, 56]].forEach(([a, b, x, y]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(x, y); g.stroke(); });
    g.fillStyle = '#CDD2DA';
    [[9, 57], [55, 57], [22, 56], [42, 56]].forEach(([x, y], i) => { g.beginPath(); g.ellipse(x, y, i < 2 ? 3.5 : 2.5, 1.3, 0, 0, TAU); g.fill(); });
    g.fillStyle = '#D9B24A';
    g.beginPath();
    [[22, 33], [42, 33], [46, 37], [46, 43], [42, 47], [22, 47], [18, 43], [18, 37]].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.fill();
    g.fillStyle = 'rgba(150,112,36,.6)';
    [[23, 34, 4, 12], [31, 34, 3, 12], [39, 34, 4, 12]].forEach(([x, y, w, h]) => g.fillRect(x, y, w, h));
    g.fillStyle = '#BFC4CC';
    g.beginPath();
    [[24, 33], [26, 23], [30, 19], [38, 19], [42, 25], [42, 33]].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.fill();
    g.fillStyle = '#2A2F3A';
    g.beginPath();
    [[28, 23], [32, 23], [32, 27], [27, 27]].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.fill();
    g.strokeStyle = '#CDD2DA';
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(39, 20);
    g.lineTo(44, 14);
    g.stroke();
    g.beginPath();
    g.arc(45, 13, 2.2, 0, TAU);
    g.stroke();
    return c;
  };
  // A power-up's icon: a golden moon, a teal swirl, a pale ring of stars, a swirl of dust, a small blue Earth, a blue moon
  const powerLook = (type) => {
    const N = 48, c = canvas(N, N), g = c.getContext('2d'), m = N / 2, color = POWERS[type].color;
    if (type === 'supermoon' || type === 'blue') {
      const body = g.createRadialGradient(m - 4, m - 4, 2, m, m, 14);
      body.addColorStop(0, type === 'blue' ? '#DCE6FF' : '#FFF4D6');
      body.addColorStop(1, type === 'blue' ? '#7F98E8' : '#E2B75E');
      g.fillStyle = body;
      g.beginPath();
      g.arc(m, m, 14, 0, TAU);
      g.fill();
      g.fillStyle = 'rgba(0,0,0,.13)';
      [[m - 4, m - 2, 3], [m + 4, m + 3, 2.5], [m + 1, m - 6, 2]].forEach(([x, y, rr]) => { g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); });
    } else if (type === 'tide') {
      g.strokeStyle = `rgb(${color})`;
      g.lineWidth = 2.4;
      g.lineCap = 'round';
      g.beginPath();
      for (let a = 0; a < TAU * 1.6; a += 0.12) { const rr = 2 + a * 1.25, x = m + Math.cos(a) * rr, y = m + Math.sin(a) * rr; if (a) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke();
    } else if (type === 'ring') {
      g.strokeStyle = `rgb(${color})`;
      g.lineWidth = 2.4;
      g.beginPath();
      g.arc(m, m, 13, 0, TAU);
      g.stroke();
      g.fillStyle = '#FFFFFF';
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; g.beginPath(); g.arc(m + Math.cos(a) * 13, m + Math.sin(a) * 13, 1.8, 0, TAU); g.fill(); }
    } else if (type === 'storm') {
      g.fillStyle = `rgb(${color})`;
      for (let k = 0; k < 26; k++) { const a = k * 0.5, rr = 3 + k * 0.42; g.beginPath(); g.arc(m + Math.cos(a) * rr, m + Math.sin(a) * rr, 1.1 + (k % 3) * 0.45, 0, TAU); g.fill(); }
    } else if (type === 'earth') {
      const sea = g.createRadialGradient(m - 4, m - 4, 2, m, m, 13);
      sea.addColorStop(0, '#9CC8FF');
      sea.addColorStop(1, '#2D5FB8');
      g.fillStyle = sea;
      g.beginPath();
      g.arc(m, m, 13, 0, TAU);
      g.fill();
      g.fillStyle = 'rgba(122,170,112,.9)';
      g.beginPath();
      g.ellipse(m - 3, m + 2, 5, 3.5, 0.6, 0, TAU);
      g.fill();
      g.beginPath();
      g.ellipse(m + 5, m - 4, 3, 2, -0.4, 0, TAU);
      g.fill();
      g.strokeStyle = 'rgba(255,255,255,.85)';
      g.lineWidth = 1.4;
      g.beginPath();
      g.arc(m, m, 9, -2.4, -0.9);
      g.stroke();
      g.beginPath();
      g.arc(m + 2, m + 3, 7, 0.4, 1.6);
      g.stroke();
    }
    return c;
  };
  // The sun: white, a little warmer at its edge; and the corona around the moon at totality, pearly streamers reaching out
  const sunLook = () => softDot(128, [[0, 'rgba(255,255,252,1)'], [0.62, 'rgba(255,250,232,1)'], [0.7, 'rgba(255,240,205,.95)'], [0.74, 'rgba(255,232,190,.35)'], [1, 'rgba(255,232,190,0)']]);
  const coronaLook = () => {
    const N = 256, c = canvas(N, N), g = c.getContext('2d'), m = N / 2, inner = N * 0.17, rand = random(1919);
    const base = g.createRadialGradient(m, m, inner * 0.9, m, m, m);
    base.addColorStop(0, 'rgba(244,246,255,.85)');
    base.addColorStop(0.18, 'rgba(232,238,255,.35)');
    base.addColorStop(0.5, 'rgba(220,228,255,.08)');
    base.addColorStop(1, 'rgba(220,228,255,0)');
    g.fillStyle = base;
    g.fillRect(0, 0, N, N);
    g.lineCap = 'round';
    for (let k = 0; k < 70; k++) {
      const a = rand() * TAU, len = inner + (0.15 + rand() * (k % 7 === 0 ? 0.8 : 0.4)) * (m - inner), w = 0.6 + rand() * 2.2;
      const ray = g.createLinearGradient(m + Math.cos(a) * inner, m + Math.sin(a) * inner, m + Math.cos(a) * len, m + Math.sin(a) * len);
      ray.addColorStop(0, 'rgba(246,248,255,.5)');
      ray.addColorStop(1, 'rgba(246,248,255,0)');
      g.strokeStyle = ray;
      g.lineWidth = w;
      g.beginPath();
      g.moveTo(m + Math.cos(a) * inner, m + Math.sin(a) * inner);
      g.quadraticCurveTo(m + Math.cos(a + 0.05) * (inner + len) / 2, m + Math.sin(a + 0.05) * (inner + len) / 2, m + Math.cos(a + 0.02) * len, m + Math.sin(a + 0.02) * len);
      g.stroke();
    }
    return c;
  };
  let looks = null;
  const makeLooks = () => {
    if (looks) return looks;
    looks = {
      rocks: [3, 17, 29, 41, 58, 73].slice(0, ROCK_SHAPES).map(rockShape),
      stars: STARS.map((s) => starLook(s.color)),
      glare: softDot(96, [[0, 'rgba(232,212,173,.4)'], [0.3, 'rgba(232,212,173,.16)'], [0.6, 'rgba(232,212,173,.05)'], [1, 'rgba(232,212,173,0)']]),
      // A strike: a flash where the rock hit, and a cloud of dust spreading from there; and a puff of thrown dust
      flash: softDot(64, [[0, 'rgba(255,248,232,.95)'], [0.3, 'rgba(255,236,204,.5)'], [1, 'rgba(255,236,204,0)']]),
      puff: softDot(64, [[0, 'rgba(232,222,200,.6)'], [0.45, 'rgba(220,206,180,.22)'], [1, 'rgba(220,206,180,0)']]),
      glint: starLook('255,250,240'),
      coma: softDot(64, [[0, 'rgba(244,250,255,1)'], [0.15, 'rgba(206,234,255,.85)'], [0.45, 'rgba(150,200,255,.25)'], [1, 'rgba(150,200,255,0)']]),
      venus: softDot(64, [[0, 'rgba(255,255,250,1)'], [0.12, 'rgba(255,250,228,.95)'], [0.3, 'rgba(255,240,205,.35)'], [1, 'rgba(255,240,205,0)']]),
      jupiter: jupiterLook(),
      lander: landerLook(),
      powers: Object.fromEntries(Object.keys(POWERS).map((type) => [type, powerLook(type)])),
      sun: sunLook(),
      sunGlow: softDot(96, [[0, 'rgba(255,240,200,.5)'], [0.35, 'rgba(255,232,190,.16)'], [1, 'rgba(255,232,190,0)']]),
      corona: coronaLook(),
      powerGlows: Object.fromEntries(Object.entries(POWERS).map(([type, P]) => [type, softDot(64, [[0, `rgba(${P.color},.55)`], [0.45, `rgba(${P.color},.18)`], [1, `rgba(${P.color},0)`]])])),
    };
    return looks;
  };
  const pickStar = () => {
    let roll = Math.random() * 100;
    for (let i = 0; i < STARS.length; i++) { roll -= STARS[i].share; if (roll < 0) return i; }
    return 0;
  };

  // Sound, off unless turned on, with the same setting and the same switch as the other games: tones made here, nothing to
  // load. Every gain starts silent: a sound can start a fraction of a sample early, and its first sample would come through at
  // full strength, a click.
  const SOUND_KEY = 'aurora-banner-sound';
  let audio = null, audioOut = null, noiseData = null, soundIsOn = false;
  const readSound = () => { try { soundIsOn = localStorage.getItem(SOUND_KEY) === '1'; } catch (e) { soundIsOn = false; } return soundIsOn; };
  const wakeAudio = () => {
    if (!soundIsOn) return;
    if (!audio) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      audio = new Context();
      audioOut = audio.createGain();
      audioOut.gain.value = 0.7;
      audioOut.connect(audio.createDynamicsCompressor()).connect(audio.destination);
    }
    if (audio.state === 'suspended') audio.resume();
  };
  const midiHz = (n) => 440 * 2 ** ((n - 69) / 12);
  const tone = (freq, ms, { to = freq, type = 'triangle', level = 0.1, delay = 0 } = {}) => {
    if (!soundIsOn || !audio) return;
    const start = audio.currentTime + delay / 1000, end = start + ms / 1000, osc = audio.createOscillator(), gain = audio.createGain();
    gain.gain.value = 0;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    osc.frequency.exponentialRampToValueAtTime(to, end);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(level, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain).connect(audioOut);
    osc.start(start);
    osc.stop(end + 0.02);
  };
  const noise = (ms, level, from = 420, to = 70, delay = 0) => {
    if (!soundIsOn || !audio) return;
    if (!noiseData) {
      noiseData = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
      const samples = noiseData.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    }
    const start = audio.currentTime + delay / 1000, end = start + ms / 1000, source = audio.createBufferSource(), low = audio.createBiquadFilter(), gain = audio.createGain();
    gain.gain.value = 0;
    source.buffer = noiseData;
    low.type = 'lowpass';
    low.frequency.setValueAtTime(from, start);
    low.frequency.exponentialRampToValueAtTime(to, end);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(level, start + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    source.connect(low).connect(gain).connect(audioOut);
    source.start(start);
    source.stop(end + 0.02);
  };
  // A struck note, for the music box and the catches: a sine, with two fainter partials an octave and two octaves up that die
  // away sooner, as a music box's tine does
  const CHIME = [[1, 1, 1], [2, 0.3, 0.55], [4, 0.1, 0.3]];
  const chime = (n, at, ring, level, out) => CHIME.forEach(([ratio, share, lasts]) => {
    const osc = audio.createOscillator(), gain = audio.createGain(), end = at + ring * lasts;
    gain.gain.value = 0;
    osc.type = 'sine';
    osc.frequency.value = midiHz(n) * ratio;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level * share, at + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain).connect(out);
    osc.start(at);
    osc.stop(end + 0.02);
  });
  // A held note for the music: a soft attack, a little held, and a fade. cutoff: a low-pass filter, to soften a saw into strings.
  const swell = (n, at, dur, type, level, out, { attack = 0.01, cutoff } = {}) => {
    const osc = audio.createOscillator(), gain = audio.createGain();
    gain.gain.value = 0;
    osc.type = type;
    osc.frequency.value = midiHz(n);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level, at + attack);
    gain.gain.exponentialRampToValueAtTime(level * 0.6, at + Math.max(attack + 0.01, dur * 0.7));
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    if (cutoff) {
      const low = audio.createBiquadFilter();
      low.type = 'lowpass';
      low.frequency.value = cutoff;
      osc.connect(low).connect(gain);
    } else osc.connect(gain);
    gain.connect(out);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  };
  // The sounds of a run. A catch rings with the music (in the run, below); these ring at once.
  const sfx = {
    // A puff of dust: a soft rush of air; and with none left, a dry tick
    puff: () => noise(190, 0.05, 2600, 700),
    dry: () => noise(35, 0.015, 3200, 1600),
    // A rock breaking, deeper for a bigger one, and a boulder cracking
    crack: (size) => {
      const big = { small: 0, medium: 0.35, large: 0.7, boulder: 1 }[size] || 0;
      noise(90 + 140 * big, 0.06 + 0.07 * big, 2200 - 1200 * big, 160);
      if (big > 0.3) tone(150 - 50 * big, 160 + 120 * big, { to: 60, type: 'sine', level: 0.06 * big });
    },
    // A halo star breaking on a rock: a bright chime falling away, like glass
    shatter: () => { tone(1760, 170, { to: 1240, type: 'sine', level: 0.045 }); tone(2640, 120, { to: 1980, type: 'sine', level: 0.022, delay: 15 }); noise(110, 0.025, 7000, 2600); },
    // A strike: a soft, deep thud
    strike: () => { tone(150, 380, { to: 46, type: 'sine', level: 0.15 }); noise(260, 0.1, 320, 60); },
    // A close shave: a quick swish and a ping
    shave: () => { noise(110, 0.025, 6000, 1800); tone(1320, 70, { to: 1760, type: 'sine', level: 0.028, delay: 30 }); },
    // A meteoroid's glint, faint and high
    glint: () => tone(2800, 90, { to: 3100, type: 'sine', level: 0.012 }),
    // A new stage: its key's chord, rising, major at first and minor from last quarter
    stage: (minor) => (minor ? [59, 62, 66, 71] : [62, 66, 69, 74]).forEach((n, i) => tone(midiHz(n + 12), 360, { type: 'sine', level: 0.05, delay: i * 90 })),
    // A constellation complete: a run up its key's chord; a comet's head; inside its tail, a faint shimmer
    shape: () => [62, 66, 69, 74, 78, 81].forEach((n, i) => tone(midiHz(n + 12), 300, { type: 'sine', level: 0.05, delay: i * 70 })),
    comet: () => { tone(midiHz(93), 260, { to: midiHz(98), type: 'sine', level: 0.05 }); noise(260, 0.02, 9000, 3000); },
    tail: () => tone(midiHz(98 + Math.floor(Math.random() * 5)), 90, { type: 'sine', level: 0.012 }),
    // Jupiter coming, a low swell; one of its moons; all four; flying close to it
    jupiter: () => { tone(55, 1400, { to: 62, type: 'sine', level: 0.07 }); tone(110, 1400, { to: 124, type: 'sine', level: 0.03, delay: 200 }); },
    galilean: () => tone(midiHz(86), 220, { to: midiHz(90), type: 'sine', level: 0.05 }),
    galileo: () => [74, 78, 81, 86].forEach((n, i) => tone(midiHz(n), 340, { type: 'sine', level: 0.06, delay: i * 110 })),
    near: () => tone(midiHz(81), 70, { type: 'sine', level: 0.015 }),
    // A meteor shower coming, a rising rush; getting through it clean
    shower: () => { noise(900, 0.04, 800, 5200); tone(midiHz(69), 700, { to: midiHz(81), type: 'sine', level: 0.03 }); },
    clean: () => [62, 69, 74, 78].forEach((n, i) => tone(midiHz(n + 12), 280, { type: 'sine', level: 0.05, delay: i * 80 })),
    // Venus, bright; the lunar module, a little fanfare
    venus: () => { tone(midiHz(93), 400, { type: 'sine', level: 0.05 }); tone(midiHz(100), 300, { type: 'sine', level: 0.025, delay: 60 }); },
    lander: () => [[67, 0], [72, 140], [76, 280], [79, 420], [84, 640]].forEach(([n, d]) => tone(midiHz(n), d === 640 ? 600 : 160, { type: 'triangle', level: 0.06, delay: d })),
    // A power-up: one showing up, a soft sparkle; caught, a rising run in its own manner; running out, falling away
    powerHere: () => tone(midiHz(98), 160, { to: midiHz(103), type: 'sine', level: 0.02 }),
    power: (type) => {
      const run = { supermoon: [50, 57, 62, 69], tide: [62, 69, 74, 81, 86], ring: [74, 78, 81, 86, 90, 93], storm: [62, 64, 67, 69], earth: [69, 74, 76, 81], blue: [71, 74, 78, 83] }[type] || [62, 69, 74];
      run.forEach((n, i) => tone(midiHz(n + 12), 260, { type: 'sine', level: 0.055, delay: i * 70 }));
      if (type === 'storm') noise(700, 0.04, 900, 4000);
      if (type === 'supermoon') tone(70, 900, { to: 92, type: 'sine', level: 0.07 });
    },
    powerEnd: () => [81, 76, 69].forEach((n, i) => tone(midiHz(n), 200, { type: 'sine', level: 0.03, delay: i * 80 })),
    // The eclipse: totality, a low hush and a high shimmer; Baily's beads, twinkling; the diamond ring, bright; a partial
    // eclipse, falling softly
    totality: () => { tone(73.4, 2400, { to: 73.4, type: 'sine', level: 0.05 }); tone(midiHz(98), 1600, { type: 'sine', level: 0.012, delay: 300 }); },
    beads: () => [93, 98, 100, 105].forEach((n, i) => tone(midiHz(n), 140, { type: 'sine', level: 0.03, delay: i * 90 })),
    diamond: () => { tone(midiHz(105), 900, { to: midiHz(110), type: 'sine', level: 0.05 }); noise(500, 0.02, 9000, 4000); },
    partial: () => [78, 74, 69].forEach((n, i) => tone(midiHz(n), 320, { type: 'sine', level: 0.05, delay: i * 170 })),
    // The end: out of lives, falling; a new best, rising
    over: () => [74, 69, 66, 62].forEach((n, i) => tone(midiHz(n), 280, { type: 'sine', level: 0.07, delay: i * 160 })),
    best: () => [62, 66, 69, 74, 78].forEach((n, i) => tone(midiHz(n + 12), 260, { type: 'sine', level: 0.07, delay: i * 110 })),
  };
  // Music: an original waltz, written for the game rather than taken from another, in 3/4 at WALTZ_BPM, 32 bars, about 34 s
  // before it repeats: a music box over an oom-pah-pah, a soft bass on the first beat and a chord on the second and third. It
  // follows the light: in D major at full moon; from last quarter, the same tune over the chords of its relative minor, B
  // minor, with a soft pad; and at new moon only a hush of it, the bass, the pad and a note a bar, fading. A bit quicker each
  // stage, and slower at new moon. MUSIC_LEVEL keeps it under the effects.
  const WALTZ_BPM = 170, WALTZ_TEMPO = [1, 1.02, 1.04, 1.06, 0.92], MUSIC_LEVEL = 0.55;
  // Each chord: its bass note and its notes, as MIDI numbers; and which chord stands for each in the minor
  const CHORDS = { D: [38, [62, 66, 69]], G: [43, [59, 62, 67]], A: [45, [61, 64, 69]], A7: [45, [61, 67, 69]], Em: [40, [59, 64, 67]], Bm: [47, [59, 62, 66]], Fs: [42, [58, 61, 66]], Fs7: [42, [58, 64, 66]] };
  const IN_MINOR = { D: 'Bm', G: 'G', A: 'Fs', A7: 'Fs7', Em: 'Em', Bm: 'D' };
  // Each bar: its chord, and its melody as [note, eighths], null for a rest; a third item where the melody changes in the minor
  const WALTZ = [
    ['D', [[69, 4], [74, 2]]], ['D', [[78, 6]]], ['G', [[76, 2], [74, 2], [71, 2]]], ['D', [[69, 6]]],
    ['Em', [[67, 2], [71, 2], [76, 2]]], ['A', [[74, 4], [73, 2]]], ['D', [[74, 2], [76, 2], [78, 2]]], ['A', [[76, 6]]],
    ['D', [[69, 4], [74, 2]]], ['Bm', [[78, 4], [81, 2]]], ['G', [[79, 2], [78, 2], [76, 2]]], ['D', [[74, 4], [69, 2]]],
    ['Em', [[71, 2], [74, 2], [79, 2]]], ['A7', [[78, 2], [76, 2], [73, 2]]], ['D', [[74, 6]]], ['D', [[null, 4], [69, 2]]],
    ['D', [[74, 4], [78, 2]]], ['D', [[81, 6]]], ['G', [[83, 2], [81, 2], [79, 2]]], ['D', [[78, 6]]],
    ['Em', [[76, 2], [79, 2], [83, 2]]], ['A', [[81, 4], [79, 2]], [[82, 4], [78, 2]]], ['D', [[78, 2], [76, 2], [74, 2]]], ['A', [[76, 6]]],
    ['D', [[69, 4], [74, 2]]], ['Bm', [[78, 4], [76, 2]]], ['G', [[74, 2], [71, 2], [67, 2]]], ['D', [[66, 4], [69, 2]]],
    ['Em', [[67, 2], [71, 2], [74, 2]]], ['A7', [[73, 4], [76, 2]]], ['D', [[74, 6]]], ['D', [[null, 6]]],
  ];
  // After a win, a total eclipse, The Blue Danube: the opening of Johann Strauss II's waltz (first performed in
  // 1867, long in the public domain), the waltz 2001: A Space Odyssey plays as its shuttle flies to the moon. Its melody as soft
  // strings over the same oom-pah-pah, at DANUBE_BPM, written down from the music as remembered, so it may differ from the
  // score in its details, and resolving home after the second phrase.
  const DANUBE_BPM = 152;
  const DANUBE = [
    ['D', [[62, 2], [62, 2], [66, 2]]], ['D', [[69, 6]]], ['D', [[null, 2], [81, 2], [81, 2]]], ['D', [[null, 2], [78, 2], [78, 2]]],
    ['D', [[62, 2], [62, 2], [66, 2]]], ['D', [[69, 6]]], ['A7', [[null, 2], [81, 2], [81, 2]]], ['A7', [[null, 2], [79, 2], [79, 2]]],
    ['D', [[78, 6]]], ['D', [[74, 6]]],
  ];
  // A tune by eighth note: its chord, where in the bar, and any melody note starting there, in the major and in the minor
  const stepsOf = (tune) => tune.flatMap(([chord, line, minorLine]) => {
    const leads = Array(6).fill(null), minorLeads = Array(6).fill(null);
    [[line, leads], [minorLine || line, minorLeads]].forEach(([notes, into]) => { let at = 0; notes.forEach(([n, len]) => { if (n) into[at] = [n, len]; at += len; }); });
    return leads.map((lead, e) => ({ chord, e, lead, minorLead: minorLeads[e] }));
  });
  const WALTZ_STEPS = stepsOf(WALTZ), DANUBE_STEPS = stepsOf(DANUBE);
  // One eighth of a waltz: the bass on the first beat, the chord on the second and third, the melody, and in the minor and the
  // hush a soft pad under each bar
  const waltzStep = (s, at, eighth, mode, out) => {
    const name = mode === 'major' ? s.chord : IN_MINOR[s.chord], [root, notes] = CHORDS[name], lead = mode === 'major' ? s.lead : s.minorLead;
    if (s.e === 0) {
      swell(root, at, eighth * 2.6, 'triangle', mode === 'hush' ? 0.05 : 0.085, out);
      if (mode !== 'major') notes.forEach((n) => swell(n, at, eighth * 6.2, 'sine', mode === 'hush' ? 0.014 : 0.01, out, { attack: 0.25 }));
    }
    if ((s.e === 2 || s.e === 4) && mode !== 'hush') notes.forEach((n) => swell(n, at, eighth * 1.1, 'sine', 0.018, out, { attack: 0.006 }));
    if (lead && (mode !== 'hush' || s.e === 0)) chime(lead[0] + 12, at, Math.max(0.45, lead[1] * eighth * 1.4), mode === 'hush' ? 0.022 : mode === 'minor' ? 0.036 : 0.042, out);
    return name;
  };

  // The result and a hint stay a while after a run, until a click on the banner or a few seconds have passed
  let lingering = null;
  const linger = (els, ms = 9000, then) => {
    const banner = els[0].closest('.banner');
    const clear = () => {
      clearTimeout(timer);
      banner.removeEventListener('click', clear);
      els.forEach((el) => el.remove());
      lingering = null;
      if (then) then();
    };
    const timer = setTimeout(clear, ms);
    banner.addEventListener('click', clear);
    lingering = clear;
  };

  let current = null;
  // options: spot, where the moon sits in the sky ({ x, y, r }, in the banner); phase, tonight's (0 new, 0.5 full); size, its
  // maps' size; maps, its albedo and relief, for the game to copy and mark with craters; light and sunAt, the banner's own
  // lighting, so the game's moon is the banner's moon; restore, which puts the banner's moon back as tonight's; surge, the
  // aurora's.
  const start = (banner, onEnd, options = {}) => {
    if (current) return;
    if (lingering) lingering();
    addStyle();
    readSound();
    wakeAudio();
    const look = makeLooks();
    const box = banner.getBoundingClientRect(), W = box.width, H = box.height, dpr = Math.min(2, window.devicePixelRatio || 1);
    const touchOnly = matchMedia('(hover: none)').matches, uiFont = getComputedStyle(banner).fontFamily;
    // The clear sky above the trees, and where the moon can go in it
    const k = Math.max(W / 1600, H / 240), sky = H - (240 - TREETOPS) * k;
    const r = Math.max(11, MOON_R * sky);
    const top = r + SKY_TOP * sky, bottom = Math.max(top, sky - (1 - TREE_DIP) * r);
    const minX = r + 10, maxX = Math.max(minX, MOON_RIGHT * W);
    const rockShare = clamp((W - MOON_START * W) / (SPEED * H) / LOOK, FEWEST, 1);
    const home = options.spot || { x: W * 0.87, y: H * 0.18, r: H * 0.1 };
    const tonight = typeof options.phase === 'number' ? options.phase : 0.5;
    const sunAt = options.sunAt || ((p) => ({ x: Math.sin(TAU * p), y: 0, z: -Math.cos(TAU * p) }));
    // The moon's face, lit by the banner's own code from copies of its maps, which take this run's craters
    const S = options.size || 160, face = canvas(S, S), faceCtx = face.getContext('2d');
    const maps = options.maps ? options.maps.map((m) => m.slice()) : null;
    let litFor = -1;
    const lightFace = (p, every) => {
      if (Math.abs(p - litFor) < every) return;
      litFor = p;
      if (options.light) options.light(faceCtx, sunAt(p), maps);
    };
    // The rocks, lit for the moon's phase, one shape a frame
    let rocksLitFor = -1, rockQueue = [];
    const lightRocks = (p) => {
      if (Math.abs(p - rocksLitFor) >= RELIGHT) {
        rocksLitFor = p;
        rockQueue = look.rocks.slice();
      }
      if (!rockQueue.length) return;
      const sun = sunAt(rocksLitFor);
      lightRock(rockQueue.shift(), { x: sun.x, y: -sun.y, z: sun.z }, 0.06 + 0.22 * (1 - litShare(rocksLitFor)) + (power && power.type === 'earth' ? EARTH_GLOW : 0));
    };

    // Layers: a canvas for the flight, under the forest so everything passes behind the trees, and the dark of space over
    // the sky and the aurora
    const layer = canvas(W * dpr, H * dpr), ctx = layer.getContext('2d');
    layer.className = 'bn-moon-layer';
    banner.insertBefore(layer, banner.querySelector('.bn-meteor') || banner.querySelector('.bn-labels'));
    const space = Object.assign(document.createElement('div'), { className: 'bn-moon-space' }), aurora = banner.querySelector('.bn-px-main');
    if (aurora) aurora.after(space); else banner.insertBefore(space, layer);
    // Darkest overhead and down through most of where the moon flies, so rocks show against it rather than the aurora's
    // bright lower edge, and then fading out just above the trees, so the horizon keeps its glow and the far hills, which are
    // paler than the trees, don't stand out against a black sky
    space.style.background = `linear-gradient(180deg,#02040E 0,#02040E ${(0.55 * sky).toFixed(1)}px,rgb(2 4 14/.82) ${(0.84 * sky).toFixed(1)}px,rgb(2 4 14/.25) ${(0.97 * sky).toFixed(1)}px,rgb(2 4 14/0) ${(sky + 0.08 * H).toFixed(1)}px)`;
    space.animate([{ opacity: 0 }, { opacity: SPACE }], { duration: OPENING * 1000, easing: 'ease-in-out', fill: 'forwards' });
    banner.classList.add('bn-moon-on');

    // The words: the score line, a hint, the Quit link and the cards
    const labels = banner.querySelector('.bn-labels');
    const score = labels.appendChild(Object.assign(document.createElement('span'), { className: 'bn-moon-score' }));
    const hint = labels.appendChild(Object.assign(document.createElement('span'), { className: 'bn-moon-hint', textContent: touchOnly ? 'Drag to steer. Dodge the rocks, catch the stars' : 'The mouse or the arrow keys steer. Dodge the rocks, catch the stars' }));
    const quit = labels.appendChild(Object.assign(document.createElement('span'), { className: 'bn-moon-quit', textContent: 'Quit' }));
    // The Sound switch, at the bottom right, as in the other games: a speaker, with sound waves when on and crossed out when off
    const soundSwitch = labels.appendChild(Object.assign(document.createElement('span'), { className: 'bn-moon-sound' }));
    const showSound = () => { soundSwitch.innerHTML = `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M7.3 3.3L4 6H1.3v4H4l3.3 2.7z" fill="currentColor"/><path d="${soundIsOn ? 'M10.4 5.6a3.3 3.3 0 0 1 0 4.8M12.7 3.3a6.7 6.7 0 0 1 0 9.4' : 'M15 6l-4 4M11 6l4 4'}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>Sound: ${soundIsOn ? 'on' : 'off'}`; };
    showSound();
    // Cards show in the right half of the sky, where the moon never goes, so they never cover it
    let cards = [];
    const card = (lines, color, delay, ms = 2800) => {
      cards.forEach((el) => el.remove());
      const el = labels.appendChild(Object.assign(document.createElement('div'), { className: 'bn-wave bn-moon-wave' }));
      el.style.setProperty('--c', color);
      el.append(...lines.map((text, i) => Object.assign(document.createElement(i % 2 ? 'span' : 'b'), { textContent: text })));
      const wide = el.getBoundingClientRect().width;
      el.style.left = `${clamp(0.75 * W, Math.max(MOON_RIGHT * W + wide / 2, wide / 2 + 8), W - wide / 2 - 8).toFixed(1)}px`;
      el.animate([{ opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: ms, delay }).onfinish = () => el.remove();
      cards = [el];
    };
    // On a narrow banner the hint spans the sky where the moon flies, so it goes soon after the flight starts
    const hintTimer = setTimeout(() => { hint.style.opacity = 0; }, W < 600 ? (OPENING + 2) * 1000 : 8000);

    // The state of a run
    const me = { x: home.x, y: home.y, r: home.r, tx: 0, ty: 0, hitAt: -9, hitDir: 1, hitSize: 1 };
    // things: rocks and stars to catch; pairs: tumbling pairs of rocks; glints: meteoroids about to come; puffs: thrown dust;
    // clouds and bits: a strike's dust; flares: a catch; pops: points and words; trail: dust shed as the moon moves
    const bg = [], things = [], pairs = [], glints = [], puffs = [], clouds = [], bits = [], flares = [], pops = [], trail = [], halo = [];
    // How the moon is moving on the screen, smoothed, for the dust it sheds
    const moving = { x: home.x, y: home.y, vx: 0, vy: 0, owe: 0, count: 0 };
    let points = 0, lives = LIVES, caught = 0, hits = 0, broken = 0, shaves = 0, bestHalo = 0, haloLost = 0, absorbed = 0;
    // The power-up working now, if any, and how big the moon is for a supermoon. Points go through earn, so a blue moon doubles
    // them all.
    let power = null, superSize = 1, stormTick = 0, blueDone = false, powersTaken = 0;
    const blueAt = Math.random() < BLUE_CHANCE ? between([40, 130]) : Infinity;
    const earn = (n) => { const got = n * (power && power.type === 'blue' ? 2 : 1); points += got; return got; };
    let phase = 'in', phaseTime = 0, time = 0, flying = 0, pace = 0, fieldAlpha = 0, moonPhase = tonight;
    let stage = 0, stageTime = 0, nextRock = 1.2, nextStar = 0.5, nextWall = 0, quietUntil = 0, haloTurn = 0;
    let dustOn = false, dust = DUST_MAX, usedKeys = false;
    // Things in the sky: constellations on their way, Jupiter, a meteor shower, and when this run's rare ones come
    const groups = [];
    let jupiter = null, shower = null, nextShape = 0, nextComet = 0, shapeOrder = [], tailTick = 0, tailGain = 0, nearTick = 0, galileo = 0;
    let jupiterDone = false, showerDone = false, sistersDone = false, venusDone = false, landerDone = false;
    // The eclipse: the sun, once it shows, where it came from at new moon, how much of it the moon covers, totality so far, the
    // points of totality not yet paid in whole hundreds, and when the diamond ring shone
    let sun = null, sunFrom = null, cover = 0, mostCover = 0, totality = 0, totalityBank = 0, inTotality = false, beadsPaid = false, ringAt = 0, ringSide = 0;
    // For the credits
    const counts = { comets: 0, shapes: [], sisters: false, venus: false, lander: false };
    const venusAt = Math.random() < VENUS_CHANCE ? between([30, 150]) : Infinity, landerAt = Math.random() < LANDER_CHANCE ? between([30, 160]) : Infinity;
    let steered = false, keys = {}, drag = null;
    let ending = null, result = false, running = true, last = performance.now(), from = null, danubeFor = 0, danubeEnds = 0, newBestRun = false;
    const best = (() => { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch (e) { return 0; } })();
    const showScore = () => {
      const lifeWord = `${lives} ${lives === 1 ? 'life' : 'lives'}`, n = halo.length;
      const total = totality > 0 ? `, totality ${totality.toFixed(1)} s` : '';
      score.textContent = W < 600 ? `${number(points)}, ${lifeWord}${n ? `, ×${n}` : ''}${total}` : `${STAGES[stage].name}: ${number(points)} points, ${lifeWord}${n ? `, halo ×${n}` : ''}${total}`;
    };
    // Words rise from where they happened, except those set below the moon, which stay put rather than cross it
    const pop = (x, y, text, color, life, rise = 22) => pops.push({ x, y, text, color, rise, age: 0, life: life || Math.max(0.9, 0.055 * text.length) });
    // The music, scheduled a little ahead, so a busy frame doesn't make it late, keeping a grid of its next eighths so a catch can
    // ring on one. It fades in, which is gentler, and keeps its first notes from coming through louder while the compressor
    // settles.
    let music = null, danube = null;
    const startMusic = () => {
      if (music || !soundIsOn || !audio) return;
      const out = audio.createGain();
      out.gain.setValueAtTime(0, audio.currentTime);
      out.gain.linearRampToValueAtTime(stage >= 4 ? MUSIC_LEVEL * 0.45 : MUSIC_LEVEL, audio.currentTime + 2.5);
      out.connect(audioOut);
      music = { out, step: 0, at: audio.currentTime + 0.1, timer: 0, grid: [] };
      const plan = () => {
        if (!music || music.out !== out) return;
        if (music.at < audio.currentTime) music.at = audio.currentTime + 0.05;
        while (music.at < audio.currentTime + 0.3) {
          const mode = stage >= 4 ? 'hush' : stage >= 2 ? 'minor' : 'major', eighth = 60 / WALTZ_BPM / 2 / WALTZ_TEMPO[stage];
          const chord = waltzStep(WALTZ_STEPS[music.step], music.at, eighth, mode, out);
          music.grid.push({ at: music.at, chord });
          if (music.grid.length > 8) music.grid.shift();
          music.at += eighth;
          music.step = (music.step + 1) % WALTZ_STEPS.length;
        }
      };
      music.timer = setInterval(plan, 80);
      plan();
    };
    const stopMusic = (fade) => {
      if (!music) return;
      const { out, timer } = music, now = audio.currentTime;
      clearInterval(timer);
      music = null;
      out.gain.cancelScheduledValues(now);
      out.gain.setValueAtTime(out.gain.value, now);
      out.gain.linearRampToValueAtTime(0, now + fade);
      setTimeout(() => out.disconnect(), fade * 1000 + 400);
    };
    // A catch rings a note of the music's chord on its next eighth, higher for bluer stars, so catches play along with the tune
    const ringCatch = (which) => {
      if (!soundIsOn || !audio) return;
      const now = audio.currentTime, slot = music ? music.grid.find((g) => g.at >= now + 0.004) : null;
      const [, notes] = CHORDS[slot ? slot.chord : 'D'], ladder = [...notes.map((n) => n + 12), ...notes.map((n) => n + 24)];
      chime(ladder[Math.min(ladder.length - 1, which)], slot ? slot.at : now + 0.01, 0.55, 0.055, audioOut);
    };
    // The Blue Danube, after a total eclipse: its notes all scheduled at once, on a gain of their own, so a
    // click can stop them. Returns how long it lasts, in seconds.
    const playDanube = () => {
      if (!soundIsOn || !audio) return 0;
      const out = audio.createGain(), eighth = 60 / DANUBE_BPM / 2, from = audio.currentTime + 0.7;
      out.gain.setValueAtTime(MUSIC_LEVEL, audio.currentTime);
      out.connect(audioOut);
      DANUBE_STEPS.forEach((s, i) => {
        const at = from + i * eighth, [root, notes] = CHORDS[s.chord];
        if (s.e === 0) swell(root, at, eighth * 2.6, 'triangle', 0.08, out);
        if (s.e === 2 || s.e === 4) notes.forEach((n) => swell(n, at, eighth * 1.1, 'sine', 0.016, out, { attack: 0.006 }));
        if (s.lead) swell(s.lead[0], at, Math.max(0.3, s.lead[1] * eighth * 1.05), 'sawtooth', 0.03, out, { attack: 0.05, cutoff: 1900 });
      });
      danube = { out };
      return from + DANUBE_STEPS.length * eighth + 1.2 - audio.currentTime;
    };
    const stopDanube = () => {
      if (!danube) return;
      const { out } = danube, now = audio.currentTime;
      danube = null;
      out.gain.cancelScheduledValues(now);
      out.gain.setValueAtTime(out.gain.value, now);
      out.gain.linearRampToValueAtTime(0, now + 0.6);
      setTimeout(() => out.disconnect(), 1100);
    };
    // A stage begins: its card, and from the second on, points and a life back
    const startStage = (i) => {
      stage = i;
      stageTime = 0;
      const st = STAGES[i];
      if (st.dust) dustOn = true;
      if (st.walls) nextWall = between([3, 5]);
      if (st.shapes) nextShape = between([8, 12]);
      if (st.comets) nextComet = between([4, 7]);
      if (i > 0) {
        const bonus = earn(STAGE_POINTS * i), back = lives < LIVES;
        if (back) lives += 1;
        pop(me.x, me.y - me.r - 14, `+${number(bonus)}${back ? ' and a life back' : ''}`, 'rgb(232,214,173)', 2);
        sfx.stage(i >= 2);
        if (i >= 4 && music) {
          const now = audio.currentTime;
          music.out.gain.cancelScheduledValues(now);
          music.out.gain.setValueAtTime(music.out.gain.value, now);
          music.out.gain.linearRampToValueAtTime(MUSIC_LEVEL * 0.45, now + 6);
        }
      }
      const says = st.says === 'dust' ? `${touchOnly ? 'Tap' : usedKeys ? 'Space' : 'Click'} to throw dust` : st.says || (touchOnly ? 'Drag to steer' : 'Steer with the mouse');
      card([st.name, says], '232 214 173', i ? 0 : 700);
      showScore();
    };
    startStage(0);
    startMusic();
    soundSwitch.addEventListener('click', (e) => {
      e.stopPropagation();
      soundIsOn = !soundIsOn;
      try { localStorage.setItem(SOUND_KEY, soundIsOn ? '1' : '0'); } catch (x) { /* blocked */ }
      wakeAudio();
      showSound();
      if (!soundIsOn) { stopMusic(0.2); stopDanube(); return; }
      if (!ending) startMusic();
      chime(86, audio.currentTime + 0.01, 0.4, 0.05, audioOut);
    });

    // Background stars, across the sky above the trees, in three layers
    const bgCount = Math.round(clamp(10 * W / H, 24, 80));
    for (let i = 0; i < bgCount; i++) {
      let roll = Math.random(), layerIndex = 0;
      while (layerIndex < LAYERS.length - 1 && roll > LAYERS[layerIndex].share) { roll -= LAYERS[layerIndex].share; layerIndex += 1; }
      bg.push({ x: Math.random() * W, y: Math.random() * (sky + 0.05 * H), layer: LAYERS[layerIndex], twinkle: Math.random() * TAU });
    }

    // Rocks and stars to catch come in from the right, just out of sight
    const has = (what) => STAGES.slice(0, stage + 1).some((st) => st[what]);
    const crossSpeed = () => SPEED * H * (1 + PACE_GAIN * Math.min(1, flying / MONTH_SECONDS));
    const anyHeight = (above = 0.6, below = 0.4) => lerp(top - above * r, bottom + below * r, Math.random());
    const aimedHeight = () => clamp(me.y + (Math.random() - 0.5) * 0.8 * r, top - 0.4 * r, bottom + 0.3 * r);
    const rock = (size, x, y, extra) => {
      const rr = r * between(SIZES[size]);
      const o = { kind: 'rock', size, x: x === undefined ? W + rr + 4 : x, y, r: rr, speed: between([0.85, 1.15]), drift: (Math.random() - 0.5) * 0.08 * sky, vy: 0, shape: look.rocks[Math.floor(Math.random() * look.rocks.length)], turn: Math.random() * TAU, spin: (Math.random() - 0.5) * 2.4, hp: size === 'boulder' ? 2 : 1, closest: Infinity, ...extra };
      things.push(o);
      return o;
    };
    const spawnRock = () => {
      const roll = Math.random(), y = Math.random() < AIMED ? aimedHeight() : anyHeight();
      // Fast meteoroids glint at the right edge first, so they're never a surprise
      if (has('fast') && roll < FAST) { glints.push({ y: anyHeight(0.3, 0.2), at: time }); sfx.glint(); return; }
      if (has('pairs') && roll < FAST + PAIR) {
        const pair = { x: W + 1.6 * r, y: clamp(y, top, bottom), a: Math.random() * TAU, spin: (Math.random() < 0.5 ? -1 : 1) * between([1.8, 2.6]), reach: 0.75 * r, speed: between([0.85, 1.05]), members: [] };
        pair.members = [rock('medium', pair.x, pair.y, { pair }), rock('medium', pair.x, pair.y, { pair })];
        pairs.push(pair);
        return;
      }
      if (has('boulders') && Math.random() < BOULDER) { rock('boulder', undefined, y, { speed: between([0.6, 0.72]), spin: (Math.random() - 0.5) * 0.8 }); return; }
      const size = has('big') && Math.random() < BIG ? 'large' : Math.random() < 0.3 ? 'medium' : 'small';
      const bob = has('bob') && Math.random() < BOB ? { base: y, reach: between([0.1, 0.2]) * sky, rate: between([1.8, 2.8]), at: Math.random() * TAU } : null;
      rock(size, undefined, y, { bob });
    };
    // A wall: a column of rocks across the sky, with one gap a little over one and a half times the moon's height
    const spawnWall = () => {
      const from = top - r, to = bottom + r, gapHeight = GAP * r, gapAt = lerp(from + gapHeight / 2 + 0.2 * r, to - gapHeight / 2 - 0.2 * r, Math.random());
      const speed = between([0.8, 0.9]), x = W + 0.6 * r;
      for (let y = from; y <= to; y += 0.8 * r) {
        if (Math.abs(y - gapAt) < gapHeight / 2) continue;
        rock(Math.random() < 0.6 ? 'small' : 'medium', x + (Math.random() - 0.5) * 0.3 * r, y, { speed, drift: 0 });
      }
      quietUntil = time + 1.4;
    };
    const spawnStar = () => {
      const near = Math.random() < NEAR_STARS, which = pickStar(), size = r * 0.22;
      const y = near ? clamp(me.y + (Math.random() < 0.5 ? -1 : 1) * r * between([1, 2.4]), top - 0.2 * r, bottom + 0.2 * r) : anyHeight(0.3, 0.2);
      things.push({ kind: 'star', x: W + 3 * size, y, r: size, speed: between([0.8, 1]), drift: 0, vy: 0, which, seed: Math.random() * TAU });
    };

    // A constellation: its stars from their real positions, scaled to fit where the moon flies, coming in from the right as one
    const spawnShape = (shape) => {
      const n = shape.stars.length, ra0 = shape.stars.reduce((sum, s) => sum + s[0], 0) / n, dec0 = shape.stars.reduce((sum, s) => sum + s[1], 0) / n, cosd = Math.cos(dec0 * Math.PI / 180);
      const pts = shape.stars.map(([ra, dec]) => ({ x: -(ra - ra0) * cosd, y: -(dec - dec0) }));
      const xs = pts.map((q) => q.x), ys = pts.map((q) => q.y), spanX = Math.max(...xs) - Math.min(...xs) || 1, spanY = Math.max(...ys) - Math.min(...ys) || 1;
      const scale = Math.min((shape.tight ? 2.6 * r : bottom - top + 0.4 * r) / spanY, (shape.tight ? 3.4 * r : 2.4 * H) / spanX);
      const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2, half = (Math.max(...xs) - cx) * scale;
      const group = { shape, anchor: { x: W + half + 2 * r, y: shape.tight ? clamp(me.y, top + 1.4 * r, bottom - 1.4 * r) : (top + bottom) / 2 }, speed: 0.8, caught: [], done: false, failed: false, flash: 0, offsets: pts.map((q) => ({ x: (q.x - cx) * scale, y: (q.y - cy) * scale })) };
      group.stars = shape.stars.map(([, , which], i) => { const o = { kind: 'star', x: 0, y: 0, r: r * 0.22, speed: group.speed, drift: 0, vy: 0, which, seed: Math.random() * TAU, group, index: i }; things.push(o); return o; });
      groups.push(group);
    };
    const nextShapeOf = () => {
      if (!shapeOrder.length) shapeOrder = SHAPES.slice().sort(() => Math.random() - 0.5);
      return shapeOrder.shift();
    };
    // A comet: a bright head, and its tail, which points away from the sun of the moment
    const spawnComet = () => things.push({ kind: 'comet', x: W + 3 * r, y: anyHeight(0.1, 0), r: r * 0.32, speed: between([0.7, 0.85]), drift: (Math.random() - 0.5) * 0.06 * sky, vy: 0, seed: Math.random() * TAU });
    const tailOf = () => {
      const s = sunAt(moonPhase), sx = s.x, sy = -s.y, across = Math.hypot(sx, sy) || 1;
      return { dx: -sx / across, dy: -sy / across, length: 2.6 * H * Math.max(0.25, Math.min(1, across)) };
    };
    // Jupiter, with its four big moons along its equator
    const startJupiter = () => {
      const R = JUPITER_R * sky;
      jupiter = { x: W + 1.3 * R, y: (top + bottom) / 2, R, speed: (W + 2.6 * R) / JUPITER_PASS };
      jupiter.moons = GALILEANS.map(([name, color, off], i) => {
        const o = { kind: 'galilean', name, color, off: off * 0.55 * R, rise: (i % 2 ? 1 : -1) * 0.05 * R, x: jupiter.x + off * 0.55 * R, y: jupiter.y, r: r * 0.2, speed: 0, drift: 0, vy: 0, seed: Math.random() * TAU };
        things.push(o);
        return o;
      });
      card(['Jupiter', 'Catch its four moons'], '232 214 173', 0);
      sfx.jupiter();
    };
    // A meteor shower, named for tonight's real one if it peaks tonight, or else the next
    const showerName = () => {
      const list = options.showers || [], today = options.today || new Date(), md = (m, d) => m * 100 + d, now = md(today.getMonth() + 1, today.getDate());
      if (!list.length) return 'The Leonids';
      const tonight = list.find((s) => s.peaks.some(([m, d]) => md(m, d) === now));
      const next = tonight || list.map((s) => ({ s, wait: Math.min(...s.peaks.map(([m, d]) => (md(m, d) - now + 1300) % 1300)) })).sort((a, b) => a.wait - b.wait)[0].s;
      return `The ${next.name}`;
    };
    const startShower = () => {
      shower = { name: showerName(), at: time, sent: 0, strikes: hits, slope: between([0.22, 0.4]) };
      card([shower.name, 'A meteor shower! Get through it'], '206 222 255', 0);
      sfx.shower();
      quietUntil = time + SHOWER_SECONDS + 1.6;
    };
    // The halo: where each of its stars is, easing to an even spacing as stars join and go
    let beadMix = 0;
    const haloR = () => lerp(me.r * HALO_OUT, me.r * 1.04, beadMix);
    const haloAt = (h) => {
      const a = haloTurn + h.angle, x = me.x + Math.cos(a) * haloR(), y = me.y + Math.sin(a) * haloR(), t = smooth(clamp((time - h.at) / 0.3, 0, 1));
      return { x: lerp(h.fx, x, t), y: lerp(h.fy, y, t) };
    };
    const spaceHalo = (dt) => halo.forEach((h, i) => {
      const goal = i / halo.length * TAU, off = ((goal - h.angle + Math.PI) % TAU + TAU) % TAU - Math.PI;
      h.angle += off * Math.min(1, dt / 0.25);
    });
    const burst = (x, y, color, count, speed) => {
      for (let n = 0; n < count; n++) {
        const a = Math.random() * TAU, v = H * speed * (0.3 + Math.random() * 0.7);
        bits.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, age: 0, life: 0.4 + Math.random() * 0.4, size: 1 + Math.random() * 1.4, color });
      }
    };
    const loseHalo = (count, x, y) => {
      let lost = 0;
      for (; lost < count && halo.length; lost++) {
        let nearest = 0, near = Infinity;
        halo.forEach((h, i) => { const p = haloAt(h), d = Math.hypot(p.x - x, p.y - y); if (d < near) { near = d; nearest = i; } });
        const h = halo[nearest], p = haloAt(h);
        flares.push({ x: p.x, y: p.y, r: me.r * HALO_STAR, which: h.which, age: 0 });
        burst(p.x, p.y, STARS[h.which].color, 10, 0.4);
        halo.splice(nearest, 1);
        haloLost += 1;
      }
      pop(me.x, me.y - me.r - 10, `−${lost} from the halo`, 'rgb(255,214,180)');
      sfx.shatter();
      showScore();
    };

    // What happens when something reaches the moon or its halo
    const catchStar = (o) => {
      const kind = STARS[o.which];
      if (halo.length < HALO_MAX) {
        const angle = Math.atan2(o.y - me.y, o.x - me.x) - haloTurn;
        halo.push({ which: o.which, at: time, fx: o.x, fy: o.y, angle });
        bestHalo = Math.max(bestHalo, halo.length);
      }
      const gain = earn(kind.points * Math.max(1, halo.length));
      caught += 1;
      flares.push({ x: o.x, y: o.y, r: o.r, which: o.which, age: 0 });
      pop(o.x, o.y - 2 * o.r, `+${number(gain)}`, `rgb(${kind.color})`);
      ringCatch(o.which);
      if (o.group) {
        const g = o.group;
        g.caught[o.index] = true;
        if (!g.failed && g.stars.every((s, k) => g.caught[k])) {
          const bonus = earn(g.shape.tight ? SISTERS_POINTS : SHAPE_POINTS * g.stars.length * Math.max(1, halo.length));
          g.done = true;
          g.flash = 2;
          if (g.shape.tight) counts.sisters = true; else counts.shapes.push(g.shape.name);
          pop(o.x, o.y - 3 * o.r, `${g.shape.name}! +${number(bonus)}`, 'rgb(232,238,255)', 2.2);
          sfx.shape();
          dropPower(o.x, o.y, true);
        }
      }
      showScore();
    };
    // Catching anything else the sky brings
    const collect = (o) => {
      if (o.kind === 'star') { catchStar(o); return; }
      if (o.kind === 'power') { takePower(o); return; }
      const say = (text, gain, color, life) => pop(o.x, o.y - 2 * o.r - 4, `${text} +${number(earn(gain))}`, color, life);
      if (o.kind === 'comet') { counts.comets += 1; say('Comet!', COMET_POINTS, 'rgb(214,236,255)'); flares.push({ x: o.x, y: o.y, r: o.r, which: 4, age: 0 }); sfx.comet(); }
      if (o.kind === 'galilean') {
        galileo += 1;
        say(`${o.name}!`, GALILEAN_POINTS, `rgb(${o.color})`);
        sfx.galilean();
        if (galileo === GALILEANS.length) { pop(me.x, me.y - me.r - 18, `Galileo's moons! +${number(earn(GALILEO_POINTS))}`, 'rgb(232,214,173)', 2.2); sfx.galileo(); }
      }
      if (o.kind === 'planet') { counts.venus = true; say('Venus!', VENUS_POINTS, 'rgb(255,246,220)'); flares.push({ x: o.x, y: o.y, r: o.r, which: 2, age: 0 }); sfx.venus(); }
      if (o.kind === 'lander') { counts.lander = true; say('The Eagle has landed!', LANDER_POINTS, 'rgb(240,214,140)', 2.6); burst(o.x, o.y, '240,214,140', 16, 0.4); sfx.lander(); }
      showScore();
    };
    // Power-ups. One shows up and streams in with everything else, with a card the first time each kind shows in this browser.
    const seenPowers = (() => { try { return (localStorage.getItem(SEEN_KEY) || '').split(',').filter(Boolean); } catch (e) { return []; } })();
    const spawnPower = (type, x, y) => {
      things.push({ kind: 'power', type, x, y: clamp(y, top - 0.3 * r, bottom + 0.2 * r), r: r * 0.34, speed: 0.7, drift: 0, vy: 0, seed: Math.random() * TAU });
      sfx.powerHere();
      if (!seenPowers.includes(type)) {
        seenPowers.push(type);
        try { localStorage.setItem(SEEN_KEY, seenPowers.join(',')); } catch (e) { /* blocked */ }
        card([POWERS[type].title, POWERS[type].says], POWERS[type].color.split(',').join(' '), 0, 3200);
      }
    };
    // A constellation completed leaves one where its last star was, and a boulder broken sometimes does: any but the blue moon,
    // dust storms once there's dust, and earthshine only in the crescent and after, when the rocks are dark
    const dropPower = (x, y, sure) => {
      if (!sure && Math.random() >= BOULDER_DROP) return;
      const kinds = ['supermoon', 'tide', 'ring', ...(dustOn ? ['storm'] : []), ...(stage >= 3 ? ['earth'] : [])];
      spawnPower(kinds[Math.floor(Math.random() * kinds.length)], x, y);
    };
    const endPower = () => {
      if (!power) return;
      const was = power.type;
      power = null;
      if (was === 'earth') rocksLitFor = -1;
      sfx.powerEnd();
    };
    const takePower = (o) => {
      const P = POWERS[o.type];
      endPower();
      powersTaken += 1;
      sfx.power(o.type);
      burst(o.x, o.y, P.color, 14, 0.35);
      pop(me.x, me.y - me.r - 16, `${P.title}!`, `rgb(${P.color})`, 1.8);
      // A ring around the moon fills the halo at once, its stars coming in from all around
      if (o.type === 'ring') {
        while (halo.length < HALO_MAX) {
          const a = Math.random() * TAU;
          halo.push({ which: 3 + Math.floor(Math.random() * 3), at: time, fx: me.x + Math.cos(a) * 3 * r, fy: me.y + Math.sin(a) * 3 * r, angle: a - haloTurn });
        }
        bestHalo = HALO_MAX;
        showScore();
        return;
      }
      power = { type: o.type, until: time + P.seconds, seconds: P.seconds };
      if (o.type === 'earth') rocksLitFor = -1;
      if (o.type === 'storm') stormTick = STORM_EVERY;
    };
    const drawPower = (o) => {
      const pulse = 0.75 + 0.25 * Math.sin(time * 5 + o.seed), glow = o.r * 3.4 * pulse, half = o.r * 1.7;
      ctx.globalAlpha = fieldAlpha * 0.9;
      ctx.drawImage(look.powerGlows[o.type], o.x - glow, o.y - glow, 2 * glow, 2 * glow);
      ctx.globalAlpha = fieldAlpha;
      ctx.drawImage(look.powers[o.type], o.x - half, o.y - half, 2 * half, 2 * half);
    };
    // Breaking a rock: a large one splits into two medium, a medium into two small, a small one crumbles; a boulder cracks at
    // the first puff and splits at the second. The pieces fly apart, up and down, off the moon's path.
    const crumble = (o, pieces = 14) => {
      for (let n = 0; n < pieces; n++) {
        const a = Math.random() * TAU, v = H * (0.1 + Math.random() * 0.35);
        bits.push({ x: o.x + Math.cos(a) * o.r * 0.6, y: o.y + Math.sin(a) * o.r * 0.6, vx: Math.cos(a) * v, vy: Math.sin(a) * v, age: 0, life: 0.45 + Math.random() * 0.45, size: 1 + Math.random() * 1.6 });
      }
    };
    const unpair = (o) => {
      if (!o.pair) return;
      const pair = o.pair;
      pair.members = pair.members.filter((m) => m !== o);
      pair.members.forEach((m) => { m.pair = null; m.speed = pair.speed; });
      const at = pairs.indexOf(pair);
      if (at >= 0 && pair.members.every((m) => !m.pair)) pairs.splice(at, 1);
      o.pair = null;
    };
    const remove = (o) => {
      unpair(o);
      if (o.group && !o.group.caught[o.index]) o.group.failed = true;
      o.gone = true;
      const i = things.indexOf(o);
      if (i >= 0) things.splice(i, 1);
    };
    const breakRock = (o) => {
      if (o.hp > 1) {
        o.hp -= 1;
        sfx.crack('boulder');
        crumble(o, 8);
        flares.push({ x: o.x, y: o.y, r: o.r * 0.5, which: 3, age: 0 });
        return;
      }
      const gain = earn(BREAK_POINTS[o.size]);
      broken += 1;
      sfx.crack(o.size);
      pop(o.x, o.y - o.r - 4, `+${gain}`, 'rgb(226,214,190)');
      crumble(o);
      remove(o);
      if (o.size === 'boulder') dropPower(o.x, o.y);
      const into = SPLITS_INTO[o.size];
      if (into) {
        [-1, 1].forEach((side) => rock(into, o.x, o.y + side * 0.35 * o.r, { speed: o.speed, drift: o.drift, vy: side * H * 0.55, spin: (Math.random() - 0.5) * 3 }));
      }
      showScore();
    };
    // A rock strikes the moon's edge: a flash there, and dust spraying out, and a crater, fresh and bright with rays, as young
    // craters such as Tycho are. The moon rocks a little and settles (its real rocking, as we see it, is called libration),
    // but the view never shakes.
    const crater = (toward, size) => {
      if (!maps) return;
      const [albedo, relief] = maps, half = S / 2, out = 0.72, cx = half + Math.cos(toward) * out * half, cy = half + Math.sin(toward) * out * half;
      // Near the edge, a crater is foreshortened toward the middle
      const across = 1, squash = Math.sqrt(1 - out * out), ux = Math.cos(toward), uy = Math.sin(toward), rc = half * (0.06 + 0.05 * size), reach = rc * 3.4;
      const rays = Array.from({ length: 6 + Math.floor(Math.random() * 3) }, () => Math.random() * TAU);
      for (let j = Math.max(0, Math.floor(cy - reach)); j < Math.min(S, Math.ceil(cy + reach)); j++) {
        for (let i = Math.max(0, Math.floor(cx - reach)); i < Math.min(S, Math.ceil(cx + reach)); i++) {
          const dx = i + 0.5 - cx, dy = j + 0.5 - cy, along = (dx * ux + dy * uy) / squash, side = (-dx * uy + dy * ux) * across, d = Math.hypot(along, side) / rc, kk = j * S + i;
          if (d < 1) { relief[kk] -= 34 * (1 - d * d); albedo[kk] = Math.max(albedo[kk], 150 + 40 * d); } else if (d < 1.3) { relief[kk] += 22 * (1 - Math.abs(d - 1.15) / 0.15); albedo[kk] = Math.max(albedo[kk], 215); }
          if (d > 1.2 && d < 3.4) {
            const ang = Math.atan2(side, along);
            for (const ray of rays) {
              const off = Math.abs(((ang - ray + Math.PI) % TAU + TAU) % TAU - Math.PI);
              if (off < 0.09) albedo[kk] = Math.min(255, albedo[kk] + 60 * (1 - (d - 1.2) / 2.2));
            }
          }
        }
      }
      litFor = -1;
    };
    const shake = (toward, amount, size) => {
      me.hitAt = time;
      me.hitDir = Math.sin(toward) < 0 ? 1 : -1;
      me.hitSize = amount;
      const ex = me.x + Math.cos(toward) * me.r * 0.96, ey = me.y + Math.sin(toward) * me.r * 0.96;
      for (let n = 0; n < Math.round(28 * size); n++) {
        const a = toward + (Math.random() - 0.5) * 2.2, v = H * (0.12 + Math.random() * 0.4);
        bits.push({ x: ex, y: ey, vx: Math.cos(a) * v, vy: Math.sin(a) * v, age: 0, life: 0.6 + Math.random() * 0.55, size: 1.4 + Math.random() * 1.6 });
      }
      clouds.push({ x: ex, y: ey, dx: Math.cos(toward), dy: Math.sin(toward), age: 0, size });
    };
    const eclipsing = () => stage === STAGES.length - 1 && stageTime >= SUN_SETTLES && !ringAt;
    // How the month ended: in a total eclipse, a partial one, or, with none of the sun covered, no eclipse at all
    const eclipseEnding = () => (totality > 0 ? 'eclipse' : Math.round(mostCover * 100) >= 1 ? 'partial' : 'month');
    const reachMoon = (o) => {
      const toward = Math.atan2(o.y - me.y, o.x - me.x);
      remove(o);
      // A supermoon is too big and bright to dent: the rock shatters on it
      if (power && power.type === 'supermoon') {
        sfx.crack(o.size);
        crumble(o, 18);
        shake(toward, 0.35, 0.5);
        pop(me.x, me.y - me.r - 10, `Shattered! +${number(earn(BREAK_POINTS[o.size]))}`, 'rgb(255,224,150)');
        showScore();
        return;
      }
      if ((HALO_POOL || eclipsing()) && halo.length) {
        absorbed += 1;
        loseHalo(HALO_COST[o.size] || 1, o.x, o.y);
        shake(toward, 0.5, 0.5);
        return;
      }
      lives -= 1;
      hits += 1;
      sfx.strike();
      shake(toward, 1, 1);
      crater(toward, o.r / r);
      pop(me.x, me.y - me.r - 10, lives ? 'A new crater! −1 life' : 'No lives left', 'rgb(255,198,162)');
      showScore();
      if (!lives) leave('out');
    };
    // A close shave pays, and knocks a third of a puff loose
    const closeShave = (o) => {
      shaves += 1;
      const got = earn(SHAVE_POINTS);
      if (dustOn) dust = Math.min(DUST_MAX, dust + 1 / 3);
      const toward = Math.atan2(o.y - me.y, o.x - me.x);
      burst(me.x + Math.cos(toward) * me.r, me.y + Math.sin(toward) * me.r, '226,214,190', 6, 0.25);
      pop(me.x, me.y - me.r - 10, `Close shave! +${got}`, 'rgb(214,226,255)');
      sfx.shave();
      showScore();
    };
    // Throwing dust, and a dry wisp when there's none left
    const throwDust = (free) => {
      if (!dustOn || phase !== 'play') return;
      if (!free && dust < 1) {
        sfx.dry();
        for (let n = 0; n < 4; n++) trail.push({ x: me.x + me.r, y: me.y + (Math.random() - 0.5) * me.r * 0.6, vx: H * 0.3, vy: (Math.random() - 0.5) * H * 0.1, age: 0, life: 0.3, size: 1, haze: false });
        return;
      }
      if (!free) dust -= 1;
      steered = true;
      sfx.puff();
      const grains = Array.from({ length: 12 }, () => ({ dx: (Math.random() - 0.5) * 0.9, dy: (Math.random() - 0.5) * 1.6, wob: Math.random() * TAU, size: 1 + Math.random() * 1.3 }));
      puffs.push({ x: me.x + me.r * 0.8, y: me.y, r: 0.9 * me.r, went: 0, age: 0, grains, done: 0 });
    };

    // Steering, and throwing dust
    const typing = () => (document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) || document.querySelector('dialog[open]');
    const KEYS = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down' };
    const onKeyDown = (e) => {
      if (typing() || e.metaKey || e.ctrlKey || e.altKey) return;
      wakeAudio();
      if (e.key === 'Escape') { e.preventDefault(); leave('quit'); return; }
      if (e.key === ' ') { e.preventDefault(); if (!e.repeat) throwDust(false); return; }
      const key = KEYS[e.key];
      if (!key) return;
      e.preventDefault();
      keys[key] = true;
      usedKeys = true;
      if (phase === 'play') steered = true;
    };
    const onKeyUp = (e) => {
      const key = KEYS[e.key];
      if (!key) return;
      keys[key] = false;
      // Letting go stops it soon, rather than easing on to where the keys had got to
      if (!keys.left && !keys.right && !keys.up && !keys.down && phase === 'play') {
        me.tx = clamp(lerp(me.x, me.tx, 0.25), minX, maxX);
        me.ty = clamp(lerp(me.y, me.ty, 0.25), top, bottom);
      }
    };
    const letGo = () => { keys = {}; drag = null; };
    const where = (e) => { const b = banner.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
    // A mouse button throws dust. On a touch screen a finger drags to steer, a quick tap throws dust, and so does a second
    // finger while the first steers.
    const onDown = (e) => {
      if (phase !== 'play' || e.target.closest('.bn-moon-quit, .bn-moon-sound')) return;
      wakeAudio();
      if (e.pointerType !== 'touch') { if (e.button === 0) throwDust(false); return; }
      if (drag && drag.id !== e.pointerId) { throwDust(false); return; }
      const p = where(e);
      drag = { id: e.pointerId, x: p.x, y: p.y, tx: me.tx, ty: me.ty, at: performance.now(), moved: 0 };
      try { banner.setPointerCapture(e.pointerId); } catch (x) { /* fine without */ }
    };
    const onMove = (e) => {
      if (phase !== 'play') return;
      const p = where(e);
      if (e.pointerType === 'touch') {
        if (!drag || e.pointerId !== drag.id) return;
        me.tx = clamp(drag.tx + (p.x - drag.x) * DRAG_GAIN, minX, maxX);
        me.ty = clamp(drag.ty + (p.y - drag.y) * DRAG_GAIN, top, bottom);
        drag.moved = Math.max(drag.moved, Math.hypot(p.x - drag.x, p.y - drag.y));
        if (drag.moved > 4) steered = true;
        return;
      }
      // The pointer: the moon follows it once it moves, and not before, so it starts where the opening left it
      me.tx = clamp(p.x, minX, maxX);
      me.ty = clamp(p.y, top, bottom);
      steered = true;
    };
    const onUp = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (drag.moved < 8 && performance.now() - drag.at < 250) throwDust(false);
      drag = null;
    };
    const onHidden = () => { if (document.hidden) { ending = ending || 'gone'; cleanup(); } };
    const stopClick = (e) => { e.stopPropagation(); leave('quit'); };
    quit.addEventListener('click', stopClick);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', letGo);
    banner.addEventListener('pointerdown', onDown);
    banner.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    document.addEventListener('visibilitychange', onHidden);

    // Ending: the moon goes home, lit as tonight, unless the banner has gone, when everything stops at once
    const leave = (why) => {
      if (ending) return;
      ending = why;
      phase = 'out';
      phaseTime = 0;
      from = { x: me.x, y: me.y, r: me.r, p: moonPhase, a: fieldAlpha };
      letGo();
      cards.forEach((el) => el.remove());
      clearTimeout(hintTimer);
      quit.remove();
      // The dark of space lifts from wherever it had got to, which is part way if the run ends during the opening
      const dark = Number(getComputedStyle(space).opacity) || 0;
      space.getAnimations().forEach((a) => a.cancel());
      space.animate([{ opacity: dark }, { opacity: 0 }], { duration: GOING_HOME * 1000, easing: 'ease-in-out', fill: 'forwards' });
      stopMusic(why === 'eclipse' ? 0.4 : 0.9);
      if (why === 'eclipse') {
        const bonus = earn(WIN_LIFE * lives);
        pop(me.x, me.y - me.r - 16, `Total eclipse! +${number(bonus)} for ${lives} ${lives === 1 ? 'life' : 'lives'} left`, 'rgb(255,240,206)', 2.6);
      }
      if (why === 'partial') {
        const pct = Math.round(mostCover * 100), bonus = earn(PARTIAL_POINTS * pct);
        pop(me.x, me.y - me.r - 16, `A partial eclipse: ${pct}% of the sun covered, +${number(bonus)}`, 'rgb(232,214,173)', 2.6);
      }
      if (why === 'idle' || !points) return;
      result = true;
      const newBest = best > 0 && points > best;
      if (points > best) { try { localStorage.setItem(BEST_KEY, String(points)); } catch (e) { /* blocked */ } }
      const how = why === 'eclipse' ? `Total eclipse, ${totality.toFixed(1)} seconds of totality, with` : why === 'partial' ? `A partial eclipse, ${Math.round(mostCover * 100)}% of the sun covered, with` : why === 'month' ? 'The moon came through the month but missed the eclipse, with' : why === 'out' ? `The moon went home at ${STAGES[stage].name.toLowerCase()} with` : 'The moon went home with';
      if (why === 'eclipse') { danubeFor = playDanube(); danubeEnds = performance.now() + danubeFor * 1000; } else if (newBest) sfx.best(); else if (why === 'partial' || why === 'month') sfx.partial(); else if (why === 'out') sfx.over();
      if (why === 'eclipse' && newBest) sfx.best();
      score.textContent = `${how} ${number(points)} points${newBest ? ', a new best!' : best ? `. Your best is ${number(Math.max(best, points))}.` : '.'}`;
      newBestRun = newBest;
      hint.textContent = `${touchOnly ? 'Tap' : 'Click'} the moon to fly again`;
      hint.style.opacity = 1;
      if (options.surge) options.surge();
    };
    const cleanup = () => {
      if (!running) return;
      running = false;
      current = null;
      clearTimeout(hintTimer);
      quit.removeEventListener('click', stopClick);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', letGo);
      banner.removeEventListener('pointerdown', onDown);
      banner.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      document.removeEventListener('visibilitychange', onHidden);
      cards.forEach((el) => el.remove());
      // The banner's moon, back as tonight's and without this run's craters, takes over where the game's left off
      if (options.restore) options.restore();
      stopMusic(0.2);
      const playing = !!danube && ending !== 'gone';
      if (!playing) stopDanube();
      [layer, space, quit, ...(playing ? [] : [soundSwitch]), ...(result ? [] : [score, hint])].forEach((el) => el.remove());
      banner.classList.remove('bn-moon-on');
      // A run worth remembering gets credits, as in the other games. While they rise, or The Blue Danube plays, the words stay above
      // the forest, so the Sound switch can still be reached.
      const credits = result && ending !== 'gone' && (caught >= 3 || points >= 300);
      if (credits || playing) banner.classList.add('bn-moon-after');
      const reached = ending === 'eclipse' ? 'Total eclipse' : ending === 'partial' ? 'Partial eclipse' : STAGES[stage].name;
      const afterwards = () => {
        score.style.visibility = '';
        hint.style.visibility = '';
        const still = !!danube, left = Math.max(0, danubeEnds - performance.now()), done = () => { stopDanube(); banner.classList.remove('bn-moon-after'); };
        if (result) linger(still ? [score, hint, soundSwitch] : [score, hint], still ? Math.max(9000, left) : 9000, done);
        else if (still) linger([soundSwitch], left, done);
        else done();
        // For people with the review link, the shared high scores: any score opens them, a top ten one to enter initials, and the
        // result line links to them. The table keeps how far the run got.
        if (result && window.auroraArcade) {
          window.auroraArcade.gameEnded(points, { game: 'moon', animal: reached }).then((shared) => {
            if (!shared || !score.isConnected) return;
            score.append(' ', Object.assign(document.createElement('span'), { textContent: 'High scores' }));
            score.classList.add('link');
            score.addEventListener('click', (e) => { e.stopPropagation(); window.auroraArcade.show('moon'); });
          });
        }
        if (onEnd) onEnd({ why: ending || 'gone', points, caught, hits, broken, shaves, bestHalo, haloLost, stage, reached });
      };
      if (credits) {
        score.style.visibility = 'hidden';
        hint.style.visibility = 'hidden';
        rollCredits(afterwards);
      } else afterwards();
    };
    // Credits: the run's numbers rising from behind the trees in the pixel font, while the aurora surges; a click or tap skips them
    const rollCredits = (done) => {
      const h = banner.getBoundingClientRect().height, secs = Math.round(flying), at = STAGES[stage].name.toLowerCase();
      const headline = ending === 'eclipse' ? 'Total eclipse!' : ending === 'partial' ? 'A partial eclipse' : ending === 'month' ? 'Through the month' : `Home at ${at}`;
      const rows = [
        ...(newBestRun ? ['New best!', ''] : []), 'Moon game', headline, '',
        `${caught} ${caught === 1 ? 'star' : 'stars'} caught`, ...(bestHalo ? [`Largest halo ${bestHalo}`] : []),
        ...(counts.shapes.length ? [`Constellations ${counts.shapes.length}`] : []), ...(counts.sisters ? ['The Seven Sisters'] : []),
        ...(counts.comets ? [`Comets ${counts.comets}`] : []), ...(galileo ? [`Jupiter's moons ${galileo} of 4`] : []),
        ...(counts.venus ? ['Venus'] : []), ...(counts.lander ? ['The Eagle has landed'] : []),
        ...(broken ? [`Rocks broken ${broken}`] : []), ...(shaves ? [`Close shaves ${shaves}`] : []), ...(powersTaken ? [`Power-ups ${powersTaken}`] : []),
        ...(hits ? [`New craters ${hits}`] : []),
        ...(totality > 0 ? [`Totality ${totality.toFixed(1)} seconds`] : ending === 'partial' ? [`${Math.round(mostCover * 100)}% of the sun covered`] : []),
        `Time ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`, '', 'Final score', number(points), '',
        ...(danube ? ['Music', 'The Blue Danube', 'Johann Strauss II, 1867', ''] : []),
        ...(ending === 'eclipse' ? ['The next total eclipse', 'August 2, 2027', 'Spain, North Africa and Egypt', ''] : []),
        'Thanks for playing',
      ];
      const heads = new Set(['New best!', 'Moon game', 'Final score', 'Music', 'The next total eclipse']);
      const roll = labels.appendChild(Object.assign(document.createElement('div'), { className: 'bn-credits bn-moon-credits' }));
      roll.replaceChildren(...rows.map((text) => (text ? Object.assign(document.createElement(heads.has(text) ? 'b' : 'span'), { textContent: text }) : document.createElement('i'))));
      const tall = roll.offsetHeight;
      const rise = roll.animate([{ opacity: 1, transform: `translate(-50%, ${h.toFixed(1)}px)` }, { opacity: 1, transform: `translate(-50%, ${(-tall).toFixed(1)}px)` }], { duration: (h + tall) / (h * 0.4) * 1000, easing: 'linear' });
      const skipHint = labels.appendChild(Object.assign(document.createElement('span'), { className: 'bn-skip', textContent: touchOnly ? 'Tap to skip' : 'Click to skip' }));
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        rise.cancel();
        roll.remove();
        skipHint.remove();
        banner.removeEventListener('click', skip, true);
        done();
      };
      // A click during the credits only skips them, except on the Sound switch
      const skip = (e) => { if (e.target.closest('.bn-moon-sound')) return; e.stopPropagation(); e.preventDefault(); finish(); };
      banner.addEventListener('click', skip, true);
      rise.onfinish = finish;
    };

    const update = (dt) => {
      time += dt;
      phaseTime += dt;
      // The stream gathers speed as a run begins, and slows as the moon goes home
      pace = FLOW * smooth(clamp(time / START_FLOW, 0, 1)) * (phase === 'out' ? 1 - smooth(clamp(phaseTime / GOING_HOME, 0, 1)) : 1);
      if (phase === 'in') {
        // Swooping down from its place and across to the left of the sky, below the words at the top, turning from tonight's
        // phase to full on the way
        const t = smooth(clamp(phaseTime / OPENING, 0, 1)), goal = { x: clamp(MOON_START * W, minX, maxX), y: lerp(top, bottom, 0.5) };
        me.x = lerp(home.x, goal.x, t);
        me.y = lerp(home.y, goal.y, t) + Math.sin(Math.PI * t) * 0.14 * sky;
        me.r = lerp(home.r, r, t);
        moonPhase = lerp(tonight, 0.5, t);
        fieldAlpha = t;
        if (phaseTime >= OPENING) { phase = 'play'; phaseTime = 0; me.tx = me.x; me.ty = me.y; }
      } else if (phase === 'play') {
        flying += dt;
        stageTime += dt;
        fieldAlpha = 1;
        if (!steered && flying > IDLE) { leave('idle'); return; }
        // The month moves on: the phase within the stage, and the next stage, or the month's end
        const st = STAGES[stage], next = STAGES[stage + 1];
        moonPhase = lerp(st.p, next ? next.p : MONTH_END, clamp(stageTime / st.seconds, 0, 1));
        if (stageTime >= st.seconds) {
          if (next) startStage(stage + 1); else { leave(eclipseEnding()); return; }
        }
        const ax = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), ay = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
        if (ax || ay) {
          const gentle = eclipsing() ? 0.4 : 1;
          me.tx = clamp(me.tx + ax * KEY_SPEED * gentle * H * dt, minX, maxX);
          me.ty = clamp(me.ty + ay * KEY_SPEED * gentle * H * dt, top, bottom);
        }
        let vx = (me.tx - me.x) / EASE, vy = (me.ty - me.y) / EASE;
        const speed = Math.hypot(vx, vy), cap = TOP_SPEED * H;
        if (speed > cap) { vx *= cap / speed; vy *= cap / speed; }
        me.x += vx * dt;
        me.y += vy * dt;
        if (dustOn) dust = Math.min(DUST_MAX, dust + dt / DUST_BACK);
        // Power-ups: one running out; a supermoon growing and shrinking back; a dust storm's puffs; the blue moon's one chance
        if (power && time >= power.until) endPower();
        superSize += ((power && power.type === 'supermoon' ? SUPER_SIZE : 1) - superSize) * Math.min(1, dt / 0.25);
        me.r = r * superSize;
        if (power && power.type === 'storm' && dustOn) { stormTick += dt; if (stormTick >= STORM_EVERY) { stormTick = 0; throwDust(true); } }
        if (!blueDone && stage >= 1 && stage <= 3 && flying >= blueAt) { blueDone = true; spawnPower('blue', W + 2 * r, anyHeight(0.2, 0)); }
        // New rocks and stars, and walls, with a quiet moment around each so it reads as a wall
        nextRock -= dt;
        nextStar -= dt;
        if (has('walls')) {
          nextWall -= dt;
          if (nextWall <= 0) { spawnWall(); nextWall = between(WALL_EVERY); }
        }
        if (nextRock <= 0 && time >= quietUntil && !ringAt && (!has('walls') || nextWall > 1.2)) {
          spawnRock();
          nextRock = STAGES[stage].rockEvery / rockShare * lerp(0.7, 1.3, Math.random());
        }
        if (nextStar <= 0) {
          spawnStar();
          nextStar = STAR_EVERY * lerp(0.6, 1.4, Math.random());
        }
        // Things in the sky, by stage: constellations and comets now and then, Jupiter and a meteor shower once, the Seven
        // Sisters once, and this run's rare ones when their time comes
        if (has('shapes')) { nextShape -= dt; if (nextShape <= 0) { spawnShape(nextShapeOf()); nextShape = between(SHAPE_EVERY); } }
        if (has('comets')) { nextComet -= dt; if (nextComet <= 0) { spawnComet(); nextComet = between(COMET_EVERY); } }
        if (stage === 2 && !jupiterDone && stageTime > 16) { jupiterDone = true; startJupiter(); }
        if (stage === 3 && !showerDone && !shower && stageTime > 10) { showerDone = true; startShower(); }
        if (stage === 3 && !sistersDone && stageTime > 28) { sistersDone = true; spawnShape(SISTERS); }
        if (!venusDone && stage >= 1 && flying >= venusAt) { venusDone = true; things.push({ kind: 'planet', x: W + 2 * r, y: anyHeight(0.2, 0), r: r * 0.22, speed: 0.6, drift: 0, vy: 0 }); }
        if (!landerDone && stage >= 1 && flying >= landerAt) { landerDone = true; things.push({ kind: 'lander', x: W + 2 * r, y: anyHeight(0, -0.2), r: r * 0.6, speed: 0.55, drift: (Math.random() - 0.5) * 0.04 * sky, vy: 0, seed: Math.random() * TAU }); }
        // The sun: in the crescent it comes into view at the right edge and drifts in; at new moon it comes to rest in the moon's
        // half of the sky, and wanders slowly
        const mid = (top + bottom) / 2, rs = r * SUN_SIZE, last = STAGES.length - 1;
        if (stage === last - 1 && stageTime > SUN_FROM * STAGES[last - 1].seconds) {
          const t = smooth(clamp((stageTime - SUN_FROM * STAGES[last - 1].seconds) / ((1 - SUN_FROM) * STAGES[last - 1].seconds), 0, 1));
          sun = { x: lerp(W + 1.2 * rs, 0.8 * W, t), y: lerp(top + 0.25 * (bottom - top), mid, t) };
        }
        if (stage === last) {
          if (!sunFrom) sunFrom = sun ? { ...sun } : { x: 0.8 * W, y: mid };
          const settle = smooth(clamp(stageTime / SUN_SETTLES, 0, 1)), rest = { x: clamp(0.3 * W, minX, maxX), y: mid };
          sun = { x: lerp(sunFrom.x, rest.x, settle) + settle * 0.3 * r * Math.sin(stageTime * 0.9), y: lerp(sunFrom.y, rest.y, settle) + settle * 0.22 * r * Math.sin(stageTime * 1.3 + 1) };
          const d = Math.hypot(sun.x - me.x, sun.y - me.y);
          cover = overlap(d, me.r, rs);
          if (eclipsing()) {
            mostCover = Math.max(mostCover, cover);
            const covered = d < TOTAL * me.r && totality < TOTAL_MAX;
            if (covered && !inTotality) {
              // Totality: the music drops to a hush, and the first time, the halo's stars line the moon's edge as Baily's beads
              inTotality = true;
              sfx.totality();
              stopMusic(1.2);
              pop(me.x, me.y - me.r - 18, 'Totality!', 'rgb(240,244,255)', 1.6);
              if (!beadsPaid && halo.length) { beadsPaid = true; pop(me.x, me.y + me.r + 22, `Baily's beads! +${number(earn(BEAD_POINTS * halo.length))}`, 'rgb(255,248,230)', 2.2, 0); sfx.beads(); }
            }
            if (!covered) inTotality = false;
            if (inTotality) {
              totality = Math.min(TOTAL_MAX, totality + dt);
              totalityBank += TOTAL_POINTS * dt;
              while (totalityBank >= 100) { totalityBank -= 100; earn(100); }
              showScore();
            }
            if (totality >= TOTAL_MAX || stageTime >= SUN_SETTLES + ECLIPSE_SECONDS) {
              // The eclipse is over. After a totality, the diamond ring: one bright point at the moon's edge where the sun comes
              // back. A partial eclipse just ends.
              ringAt = time;
              inTotality = false;
              ringSide = d > 0.5 ? Math.atan2(sun.y - me.y, sun.x - me.x) : -2.3;
              if (totality > 0) sfx.diamond();
            }
          }
          if (ringAt && time - ringAt >= RING_SECONDS) { leave(eclipseEnding()); return; }
        }
        // The shower's meteoroids, all slanting the same way, from one direction, as from a radiant
        if (shower) {
          while (shower.sent < SHOWER_COUNT && time - shower.at > 0.9 + shower.sent * SHOWER_SECONDS / SHOWER_COUNT) {
            shower.sent += 1;
            rock('small', W + 6 + Math.random() * 0.5 * H, lerp(top - 1.6 * r, bottom - 0.6 * r, Math.random()), { r: r * between([0.22, 0.3]), speed: FAST_SPEED * 1.1, drift: 0, fall: shower.slope * SPEED * H * FAST_SPEED, fast: true, spin: (Math.random() - 0.5) * 6 });
          }
          if (time - shower.at > 0.9 + SHOWER_SECONDS + 2.2) {
            if (hits === shower.strikes) { pop(me.x, me.y - me.r - 16, `Through ${shower.name.replace(/^The /, 'the ')}! +${number(earn(SHOWER_POINTS))}`, 'rgb(206,222,255)', 2.2); sfx.clean(); showScore(); }
            shower = null;
          }
        }
        // Flying close to Jupiter earns points every second; its pull drags the moon's course toward it
        if (jupiter) {
          const dx = jupiter.x - me.x, dy = jupiter.y - me.y, d = Math.hypot(dx, dy) || 1;
          if (d < 3.2 * jupiter.R) {
            const pull = JUPITER_PULL * H * Math.min(1, (jupiter.R / d) ** 2) * 0.4 * pace;
            me.tx = clamp(me.tx + dx / d * pull * dt, minX, maxX);
            me.ty = clamp(me.ty + dy / d * pull * dt, top, bottom);
          }
          if (d < 1.3 * jupiter.R) {
            nearTick += dt;
            if (nearTick >= 1) { nearTick -= 1; pop(me.x, me.y - me.r - 8, `+${number(earn(NEAR_JUPITER))}`, 'rgb(232,214,173)'); sfx.near(); showScore(); }
          }
        }
      } else if (phase === 'out') {
        const t = smooth(clamp(phaseTime / GOING_HOME, 0, 1));
        me.x = lerp(from.x, home.x, t);
        me.y = lerp(from.y, home.y, t) + Math.sin(Math.PI * t) * 0.14 * sky;
        me.r = lerp(from.r, home.r, t);
        moonPhase = lerp(from.p, tonight, t);
        fieldAlpha = from.a * (1 - t);
        if (phaseTime >= GOING_HOME) { cleanup(); return; }
      }
      haloTurn += HALO_SPIN * dt * (1 - 0.8 * beadMix);
      spaceHalo(dt);
      beadMix += ((inTotality ? 1 : 0) - beadMix) * Math.min(1, dt / 0.3);
      // Dust shed from the moon's side away from the way it's moving, more the faster it goes, and none while it holds still
      if (dt > 0) {
        const follow = Math.min(1, dt / 0.06);
        moving.vx += ((me.x - moving.x) / dt - moving.vx) * follow;
        moving.vy += ((me.y - moving.y) / dt - moving.vy) * follow;
        moving.x = me.x;
        moving.y = me.y;
        const howFast = clamp((Math.hypot(moving.vx, moving.vy) - 0.06 * H) / (0.8 * TOP_SPEED * H), 0, 1), back = Math.atan2(-moving.vy, -moving.vx);
        moving.owe = howFast ? moving.owe + TRAIL_RATE * howFast * dt : 0;
        while (moving.owe >= 1 && trail.length < 180) {
          moving.owe -= 1;
          moving.count += 1;
          const a = back + (Math.random() - 0.5) * TRAIL_SPREAD, v = H * lerp(TRAIL_THROW[0], TRAIL_THROW[1], Math.random());
          trail.push({ x: me.x + Math.cos(a) * me.r * 0.9, y: me.y + Math.sin(a) * me.r * 0.9, vx: Math.cos(a) * v, vy: Math.sin(a) * v, age: 0, life: lerp(TRAIL_LIFE[0], TRAIL_LIFE[1], Math.random()), size: 1.1 + Math.random() * 1.4, haze: moving.count % TRAIL_HAZE === 0 });
        }
      }
      // Everything streams left, the background at its own slow pace
      for (const s of bg) {
        s.x -= s.layer.speed * H * pace * dt;
        if (s.x < -4) { s.x = W + 4; s.y = Math.random() * (sky + 0.05 * H); }
      }
      const across = crossSpeed() * pace;
      // Constellations move as one, and so do Jupiter and its moons
      for (let i = groups.length - 1; i >= 0; i--) {
        const g = groups[i];
        g.anchor.x -= across * g.speed * dt;
        g.flash = Math.max(0, g.flash - dt);
        g.stars.forEach((o, k) => { if (!g.caught[k]) { o.x = g.anchor.x + g.offsets[k].x; o.y = g.anchor.y + g.offsets[k].y; } });
        if (g.anchor.x + Math.max(...g.offsets.map((q) => q.x)) < -4 * r && !g.flash) groups.splice(i, 1);
      }
      if (jupiter) {
        jupiter.x -= jupiter.speed * pace * dt;
        jupiter.moons.forEach((o) => { if (!o.gone) { o.x = jupiter.x + o.off; o.y = jupiter.y + o.rise; } });
        if (jupiter.x < -1.3 * jupiter.R - 3 * r) { jupiter.moons.forEach((o) => { if (!o.gone) remove(o); }); jupiter = null; }
      }
      // A meteoroid comes in fast once its glint has shown
      for (let i = glints.length - 1; i >= 0; i--) {
        if (time - glints[i].at < GLINT) continue;
        rock('small', undefined, glints[i].y, { r: r * between([0.26, 0.32]), speed: FAST_SPEED, drift: 0, fast: true, spin: (Math.random() - 0.5) * 6 });
        glints.splice(i, 1);
      }
      // Tumbling pairs turn about their middle as it comes
      for (const pair of pairs) {
        pair.x -= across * pair.speed * dt;
        pair.a += pair.spin * dt;
        pair.members.forEach((m, i) => { const a = pair.a + i * Math.PI; m.x = pair.x + Math.cos(a) * pair.reach; m.y = pair.y + Math.sin(a) * pair.reach * 0.7; });
      }
      for (let i = things.length - 1; i >= 0; i--) {
        const o = things[i];
        if (!o.pair && !o.group && o.kind !== 'galilean') {
          if (jupiter) {
            const dx = jupiter.x - o.x, dy = jupiter.y - o.y, d = Math.hypot(dx, dy) || 1;
            if (d < 3.2 * jupiter.R) {
              const pull = JUPITER_PULL * H * Math.min(1, (jupiter.R / d) ** 2) * pace;
              o.vx = (o.vx || 0) + dx / d * pull * dt;
              o.vy += dy / d * pull * dt;
            }
          }
          if (power && power.type === 'tide' && o.kind !== 'rock' && phase === 'play') {
            const dx = me.x - o.x, dy = me.y - o.y, d = Math.hypot(dx, dy) || 1;
            if (d < TIDE_REACH * me.r) { o.vx = (o.vx || 0) + dx / d * TIDE_PULL * H * dt * 3; o.vy += dy / d * TIDE_PULL * H * dt * 3; }
          }
          o.x += ((o.vx || 0) - across * o.speed) * dt;
          if (o.bob) { o.bob.base += o.drift * pace * dt; o.y = o.bob.base + Math.sin(o.bob.at + flying * o.bob.rate) * o.bob.reach; } else o.y += (o.drift * pace + o.vy + (o.fall || 0) * pace) * dt;
          o.vy *= 1 - 1.5 * dt;
          if (o.vx) o.vx *= 1 - 1.5 * dt;
        }
        if (o.kind === 'rock') o.turn += o.spin * dt;
        if (phase === 'play') {
          const apart = Math.hypot(o.x - me.x, o.y - me.y);
          if (o.kind !== 'rock') {
            const reach = o.r * 1.4;
            if (apart < me.r + reach || halo.some((h) => { const p = haloAt(h); return Math.hypot(o.x - p.x, o.y - p.y) < me.r * HALO_STAR + reach; })) { collect(o); remove(o); continue; }
            // Flying inside a comet's tail earns points and fills the moon's dust
            if (o.kind === 'comet') {
              const tail = tailOf(), vx = me.x - o.x, vy = me.y - o.y, along = vx * tail.dx + vy * tail.dy, off = Math.abs(vx * tail.dy - vy * tail.dx);
              if (along > o.r && along < tail.length && off < 0.25 * r + 0.75 * r * along / tail.length + 0.5 * me.r) {
                tailTick += dt;
                if (tailTick >= TAIL_TICK) {
                  tailTick -= TAIL_TICK;
                  const gain = earn(TAIL_POINTS * Math.max(1, halo.length));
                  tailGain += gain;
                  if (dustOn) dust = Math.min(DUST_MAX, dust + 0.35);
                  sfx.tail();
                  if (tailGain >= 4 * gain) { pop(me.x, me.y - me.r - 8, `Comet dust +${number(tailGain)}`, 'rgb(214,236,255)'); tailGain = 0; }
                  showScore();
                }
              }
            }
          } else {
            // A halo star in the way breaks the rock on itself
            const hit = halo.findIndex((h) => { const p = haloAt(h); return Math.hypot(o.x - p.x, o.y - p.y) < me.r * HALO_STAR + o.r * 0.85; });
            if (hit >= 0) {
              const h = halo[hit], p = haloAt(h);
              flares.push({ x: p.x, y: p.y, r: me.r * HALO_STAR, which: h.which, age: 0 });
              burst(p.x, p.y, STARS[h.which].color, 10, 0.4);
              halo.splice(hit, 1);
              haloLost += 1;
              sfx.shatter();
              crumble(o);
              remove(o);
              pop(me.x, me.y - me.r - 10, '−1 from the halo', 'rgb(255,214,180)');
              showScore();
              continue;
            }
            if (apart < me.r + o.r * 0.85) { reachMoon(o); if (!running) return; continue; }
            o.closest = Math.min(o.closest, apart - me.r - o.r);
            if (!o.shaved && o.x < me.x - me.r - o.r) {
              o.shaved = true;
              if (o.closest < CLOSE * r) closeShave(o);
            }
          }
        }
        if (o.x < -3 * o.r - 8) remove(o);
      }
      // Thrown dust flies straight ahead and breaks the first rock it meets
      for (let i = puffs.length - 1; i >= 0; i--) {
        const pf = puffs[i];
        pf.age += dt;
        if (pf.done) { pf.done += dt; if (pf.done > 0.3) puffs.splice(i, 1); continue; }
        const step = PUFF_SPEED * H * dt * (1 - 0.4 * pf.went / (PUFF_REACH * H));
        pf.x += step;
        pf.went += step;
        const target = things.find((o) => o.kind === 'rock' && Math.hypot(o.x - pf.x, o.y - pf.y) < pf.r * 0.85 + o.r * 0.8);
        if (target) {
          breakRock(target);
          pf.done = 0.001;
        } else if (pf.went >= PUFF_REACH * H) pf.done = 0.001;
      }
      for (let i = bits.length - 1; i >= 0; i--) {
        const b = bits[i];
        b.age += dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.vx *= 1 - 1.6 * dt;
        b.vy *= 1 - 1.6 * dt;
        if (b.age >= b.life) bits.splice(i, 1);
      }
      for (let i = clouds.length - 1; i >= 0; i--) { clouds[i].age += dt; if (clouds[i].age >= 0.9) clouds.splice(i, 1); }
      const behind = across * TRAIL_DRIFT;
      for (let i = trail.length - 1; i >= 0; i--) {
        const g = trail[i];
        g.age += dt;
        g.x += (g.vx - behind) * dt;
        g.y += g.vy * dt;
        g.vx *= 1 - 2.4 * dt;
        g.vy *= 1 - 2.4 * dt;
        if (g.age >= g.life) trail.splice(i, 1);
      }
      for (let i = flares.length - 1; i >= 0; i--) { flares[i].age += dt; if (flares[i].age >= 0.45) flares.splice(i, 1); }
      for (let i = pops.length - 1; i >= 0; i--) { pops[i].age += dt; if (pops[i].age >= pops[i].life) pops.splice(i, 1); }
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, layer.width, layer.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const f = litShare(moonPhase), dark = 1 - f, dim = cover * cover;
      if (dim > 0.002) {
        ctx.globalAlpha = 0.62 * dim * fieldAlpha;
        ctx.fillStyle = '#020309';
        ctx.fillRect(0, 0, W, sky + 0.12 * H);
      }
      // Background stars: points, the nearest layer with a short, faint streak behind it while the stream is moving. More
      // show as the moon wanes.
      ctx.fillStyle = '#E8EEFF';
      ctx.strokeStyle = '#E8EEFF';
      ctx.lineCap = 'round';
      for (const s of bg) {
        const L = s.layer, a = Math.min(1, fieldAlpha * L.alpha * (0.72 + 0.28 * dark) * (1 + 1.6 * dim) * (0.85 + 0.15 * Math.sin(time * 2.3 + s.twinkle)));
        if (a < 0.02 || s.y > sky + 2) continue;
        const streak = L === LAYERS[LAYERS.length - 1] ? L.speed * H * pace * 0.035 : 0;
        ctx.globalAlpha = streak > 1.5 ? a * 0.75 : a;
        if (streak > 1.5) {
          ctx.lineWidth = 2 * L.size;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x + streak, s.y);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(s.x, s.y, L.size, 0, TAU);
          ctx.fill();
        }
      }
      // Jupiter, behind everything
      if (jupiter) {
        ctx.globalAlpha = fieldAlpha;
        ctx.drawImage(look.jupiter, jupiter.x - jupiter.R, jupiter.y - jupiter.R, 2 * jupiter.R, 2 * jupiter.R);
      }
      if (sun) {
        const rs = r * SUN_SIZE, glow = rs * 3.4, half = rs / 0.72;
        ctx.globalAlpha = fieldAlpha * 0.75 * (1 - 0.85 * cover);
        ctx.drawImage(look.sunGlow, sun.x - glow, sun.y - glow, 2 * glow, 2 * glow);
        ctx.globalAlpha = fieldAlpha;
        ctx.drawImage(look.sun, sun.x - half, sun.y - half, 2 * half, 2 * half);
      }
      // Constellations on their way: faint lines between their stars and their name; when all are caught, the lines and the
      // stars' places shine for a moment
      ctx.font = `600 11px ${uiFont}`;
      ctx.textAlign = 'center';
      for (const g of groups) {
        const pos = g.offsets.map((q) => ({ x: g.anchor.x + q.x, y: g.anchor.y + q.y })), bright = Math.min(1, g.flash);
        if (g.failed && !bright) continue;
        ctx.strokeStyle = bright ? 'rgb(255,240,206)' : 'rgb(214,226,255)';
        ctx.lineWidth = bright ? 1.4 : 0.8;
        ctx.globalAlpha = fieldAlpha * (bright ? 0.85 * bright : 0.16);
        g.shape.lines.forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(pos[a].x, pos[a].y); ctx.lineTo(pos[b].x, pos[b].y); ctx.stroke(); });
        if (bright) {
          ctx.fillStyle = 'rgb(255,248,230)';
          pos.forEach((q) => { ctx.beginPath(); ctx.arc(q.x, q.y, 1.8, 0, TAU); ctx.fill(); });
        }
        // The name above it, or below it when the score line is in the way
        const topY = Math.min(...pos.map((q) => q.y)), lowY = Math.max(...pos.map((q) => q.y)), midX = pos.reduce((sum, q) => sum + q.x, 0) / pos.length;
        ctx.globalAlpha = fieldAlpha * (bright || 0.42);
        ctx.fillStyle = bright ? 'rgb(255,240,206)' : 'rgb(214,226,255)';
        ctx.fillText(g.shape.name, clamp(midX, 60, W - 60), topY - r * 0.7 < 40 ? lowY + r * 1.1 : topY - r * 0.7);
      }
      // A meteoroid's glint at the right edge, a moment before it comes
      for (const g of glints) {
        const t = (time - g.at) / GLINT, size = r * (0.3 + 0.5 * Math.sin(Math.PI * t));
        ctx.globalAlpha = fieldAlpha * Math.sin(Math.PI * t);
        ctx.drawImage(look.glint, W - 8 - size, g.y - size, 2 * size, 2 * size);
      }
      // Rocks, lit for the month's phase, and stars, then the moon
      lightRocks(moonPhase);
      for (const o of things) {
        if (o.y - 3 * o.r > sky) continue;
        if (o.kind === 'rock') {
          // A meteoroid leaves a thin streak behind it, back along its way, fading
          if (o.fast) {
            const away = Math.hypot(SPEED * H * o.speed, o.fall || 0) || 1, bx = SPEED * H * o.speed / away, by = -(o.fall || 0) / away;
            const tail = ctx.createLinearGradient(o.x, o.y, o.x + bx * o.r * 6, o.y + by * o.r * 6);
            tail.addColorStop(0, 'rgba(236,228,210,.55)');
            tail.addColorStop(1, 'rgba(236,228,210,0)');
            ctx.globalAlpha = fieldAlpha;
            ctx.strokeStyle = tail;
            ctx.lineWidth = Math.max(1, o.r * 0.45);
            ctx.beginPath();
            ctx.moveTo(o.x + bx * o.r * 0.6, o.y + by * o.r * 0.6);
            ctx.lineTo(o.x + bx * o.r * 6, o.y + by * o.r * 6);
            ctx.stroke();
          }
          ctx.globalAlpha = fieldAlpha;
          const turn = ((o.turn % TAU) + TAU) % TAU, sprite = o.shape.turns[Math.round(turn / TAU * ROCK_TURNS) % ROCK_TURNS];
          const c = Math.cos(turn) * dpr, n = Math.sin(turn) * dpr, half = o.r / ROCK_FILL;
          ctx.setTransform(c, n, -n, c, o.x * dpr, o.y * dpr);
          ctx.drawImage(sprite, -half, -half, 2 * half, 2 * half);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        } else if (o.kind === 'star') {
          ctx.globalAlpha = fieldAlpha * (0.82 + 0.18 * Math.sin(time * 9 + o.seed));
          const half = o.r * STAR_GLOW;
          ctx.drawImage(look.stars[o.which], o.x - half, o.y - half, 2 * half, 2 * half);
        } else if (o.kind === 'comet') {
          // The tail, widening and fading away from the sun, with dust drifting in it; then the head
          const tail = tailOf(), ex = o.x + tail.dx * tail.length, ey = o.y + tail.dy * tail.length, nx = -tail.dy, ny = tail.dx, near = 0.25 * r, far = r;
          const glow = ctx.createLinearGradient(o.x, o.y, ex, ey);
          glow.addColorStop(0, 'rgba(206,232,255,.5)');
          glow.addColorStop(0.4, 'rgba(180,214,255,.2)');
          glow.addColorStop(1, 'rgba(180,214,255,0)');
          ctx.globalAlpha = fieldAlpha;
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.moveTo(o.x + nx * near, o.y + ny * near);
          ctx.lineTo(ex + nx * far, ey + ny * far);
          ctx.lineTo(ex - nx * far, ey - ny * far);
          ctx.lineTo(o.x - nx * near, o.y - ny * near);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = 'rgb(226,240,255)';
          for (let g = 0; g < 16; g++) {
            const a = (g * 0.618 + o.seed + time * 0.12) % 1, along = a * tail.length, side = Math.sin(g * 2.3 + o.seed) * (near + (far - near) * a);
            ctx.globalAlpha = fieldAlpha * 0.6 * (1 - a);
            ctx.beginPath();
            ctx.arc(o.x + tail.dx * along + nx * side, o.y + tail.dy * along + ny * side, 0.8, 0, TAU);
            ctx.fill();
          }
          const half = o.r * 3.2;
          ctx.globalAlpha = fieldAlpha;
          ctx.drawImage(look.coma, o.x - half, o.y - half, 2 * half, 2 * half);
        } else if (o.kind === 'galilean') {
          // One of Jupiter's moons: a small disc in its own color, with a faint glow
          ctx.globalAlpha = fieldAlpha * 0.3;
          ctx.fillStyle = `rgb(${o.color})`;
          ctx.beginPath();
          ctx.arc(o.x, o.y, o.r * 2, 0, TAU);
          ctx.fill();
          ctx.globalAlpha = fieldAlpha;
          ctx.beginPath();
          ctx.arc(o.x, o.y, o.r, 0, TAU);
          ctx.fill();
        } else if (o.kind === 'planet') {
          // Venus: steady, since planets twinkle less than stars
          const half = o.r * 3.2;
          ctx.globalAlpha = fieldAlpha;
          ctx.drawImage(look.venus, o.x - half, o.y - half, 2 * half, 2 * half);
        } else if (o.kind === 'lander') {
          // The lunar module, rocking gently as it drifts
          const tilt = 0.18 * Math.sin(time * 1.2 + o.seed), c = Math.cos(tilt) * dpr, n = Math.sin(tilt) * dpr, half = o.r * 1.25;
          ctx.globalAlpha = fieldAlpha;
          ctx.setTransform(c, n, -n, c, o.x * dpr, o.y * dpr);
          ctx.drawImage(look.lander, -half, -half, 2 * half, 2 * half);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        } else if (o.kind === 'power') drawPower(o);
      }
      // The dust it sheds, behind it: grains spreading a little as they fade, in a faint haze
      ctx.fillStyle = 'rgb(226,214,190)';
      for (const g of trail) {
        const t = g.age / g.life, seen = (1 - t) * Math.min(1, t / 0.12);
        if (g.haze) {
          const size = me.r * (0.18 + 0.42 * t);
          ctx.globalAlpha = 0.32 * seen;
          ctx.drawImage(look.puff, g.x - size, g.y - size, 2 * size, 2 * size);
        }
        ctx.globalAlpha = 0.85 * seen;
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.size / 2 * (1 + 0.6 * t), 0, TAU);
        ctx.fill();
      }
      // The moon: its glare, stronger the more is lit; a dark disc, so the unlit moon hides what's behind it; its face, rocking
      // a little after a hit; and near new moon, a faint rim of light, so it stays in sight
      if (sun && cover > 0.85) {
        const half = me.r / (2 * 0.17) * 1.02;
        ctx.globalAlpha = fieldAlpha * clamp((cover - 0.85) / 0.13, 0, 1);
        ctx.drawImage(look.corona, sun.x - half, sun.y - half, 2 * half, 2 * half);
      }
      lightFace(moonPhase, phase === 'play' ? RELIGHT : 0.0004);
      const big = superSize - 1, glare = me.r * 2.8 * (1 + 1.4 * big);
      ctx.globalAlpha = Math.min(1, (0.2 + 0.8 * f) * (1 + 3 * big));
      ctx.drawImage(look.glare, me.x - glare, me.y - glare, 2 * glare, 2 * glare);
      const since = time - me.hitAt, rock = since < 1.6 ? 0.13 * me.hitSize * me.hitDir * Math.exp(-since / 0.32) * Math.sin(TAU * since / 0.42) : 0;
      if (dark > 0.05) {
        ctx.globalAlpha = Math.min(1, dark * 1.2);
        ctx.fillStyle = '#05070F';
        ctx.beginPath();
        ctx.arc(me.x, me.y, me.r * 0.99, 0, TAU);
        ctx.fill();
      }
      const c = Math.cos(rock) * dpr, n = Math.sin(rock) * dpr;
      ctx.globalAlpha = 1;
      ctx.setTransform(c, n, -n, c, me.x * dpr, me.y * dpr);
      ctx.drawImage(face, -me.r, -me.r, 2 * me.r, 2 * me.r);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // A blue moon: the moon tinted blue
      if (power && power.type === 'blue') {
        ctx.globalCompositeOperation = 'color';
        ctx.globalAlpha = 0.65;
        ctx.fillStyle = '#6E8CFF';
        ctx.beginPath();
        ctx.arc(me.x, me.y, me.r, 0, TAU);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
      // A power-up's time left, a thin ring in its color unwinding around the moon; and a spring tide's reach
      if (power) {
        const P = POWERS[power.type], left = clamp((power.until - time) / power.seconds, 0, 1);
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = `rgb(${P.color})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(me.x, me.y, me.r * 1.25, -Math.PI / 2, -Math.PI / 2 + TAU * left);
        ctx.stroke();
        if (power.type === 'tide') {
          ctx.globalAlpha = 0.07 + 0.04 * Math.sin(time * 4);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(me.x, me.y, TIDE_REACH * me.r, 0, TAU);
          ctx.stroke();
        }
      }
      if (dark > 0.4) {
        ctx.globalAlpha = 0.45 * (dark - 0.4) / 0.6;
        ctx.strokeStyle = 'rgb(206,216,240)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(me.x, me.y, me.r, 0, TAU);
        ctx.stroke();
      }
      if (ringAt && totality > 0) {
        const t = clamp((time - ringAt) / RING_SECONDS, 0, 1), x = me.x + Math.cos(ringSide) * me.r, y = me.y + Math.sin(ringSide) * me.r, glow = me.r * (0.5 + 0.9 * Math.sin(Math.PI * Math.min(1, t * 1.6)));
        ctx.globalAlpha = 0.6 * (1 - t);
        ctx.strokeStyle = 'rgb(255,250,236)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(me.x, me.y, me.r * 1.01, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 1 - t * t;
        ctx.drawImage(look.flash, x - glow, y - glow, 2 * glow, 2 * glow);
        ctx.drawImage(look.glint, x - glow * 0.8, y - glow * 0.8, 1.6 * glow, 1.6 * glow);
      }
      // The halo: a faint ring where its stars circle, and the stars, each in its own color
      if (halo.length) {
        ctx.globalAlpha = 0.08 * fieldAlpha;
        ctx.strokeStyle = 'rgb(232,238,255)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(me.x, me.y, haloR(), 0, TAU);
        ctx.stroke();
        for (const h of halo) {
          const p = haloAt(h), half = me.r * HALO_STAR * STAR_GLOW * (0.9 + 0.1 * Math.sin(time * 7 + h.angle * 3));
          ctx.globalAlpha = fieldAlpha;
          ctx.drawImage(look.stars[h.which], p.x - half, p.y - half, 2 * half, 2 * half);
        }
      }
      // Thrown dust: a cloud with grains in it, faint at full moon and brighter as the moon wanes, since fine dust shines most
      // when lit from behind
      for (const pf of puffs) {
        const fade = pf.done ? 1 - pf.done / 0.3 : Math.min(1, pf.age / 0.08), shine = 0.45 + 0.55 * dark, size = pf.r * (1.15 + (pf.done ? pf.done * 2 : 0));
        ctx.globalAlpha = 0.55 * shine * fade;
        ctx.drawImage(look.puff, pf.x - size, pf.y - size, 2 * size, 2 * size);
        ctx.fillStyle = `rgb(${Math.round(226 + 20 * dark)},${Math.round(214 + 20 * dark)},${Math.round(190 + 30 * dark)})`;
        for (const g of pf.grains) {
          ctx.globalAlpha = 0.9 * fade * (0.6 + 0.4 * shine);
          ctx.beginPath();
          ctx.arc(pf.x + g.dx * pf.r * (1 + (pf.done ? pf.done * 4 : 0)), pf.y + g.dy * pf.r * 0.6 + Math.sin(pf.age * 9 + g.wob) * 1.2, g.size / 2, 0, TAU);
          ctx.fill();
        }
      }
      // A strike's flash and dust, spreading from where the rock hit; broken rocks' dust; a catch's flare in its color
      for (const p of clouds) {
        const t = p.age / 0.9, size = me.r * (0.35 + 1.1 * Math.sqrt(t)) * (0.6 + 0.4 * p.size), x = p.x + p.dx * me.r * 0.6 * t, y = p.y + p.dy * me.r * 0.6 * t;
        ctx.globalAlpha = 0.85 * (1 - t);
        ctx.drawImage(look.puff, x - size, y - size, 2 * size, 2 * size);
        if (p.age < 0.32) {
          const glow = me.r * (0.45 + 0.35 * p.age / 0.32) * p.size;
          ctx.globalAlpha = 1 - p.age / 0.32;
          ctx.drawImage(look.flash, p.x - glow, p.y - glow, 2 * glow, 2 * glow);
        }
      }
      for (const b of bits) {
        ctx.globalAlpha = 0.95 * (1 - b.age / b.life);
        ctx.fillStyle = `rgb(${b.color || '234,222,198'})`;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size / 2, 0, TAU);
        ctx.fill();
      }
      for (const fl of flares) {
        const t = fl.age / 0.45, half = fl.r * STAR_GLOW * (1 + 1.6 * t);
        ctx.globalAlpha = (1 - t) * 0.9;
        ctx.drawImage(look.stars[fl.which], fl.x - half, fl.y - half, 2 * half, 2 * half);
        ctx.strokeStyle = `rgba(${STARS[fl.which].color},${((1 - t) * 0.7).toFixed(2)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(fl.x, fl.y, fl.r * (1 + 4 * t), 0, TAU);
        ctx.stroke();
      }
      // The moon's dust: three grains under it, bright when a puff is ready, filling as it comes back
      if (dustOn && phase === 'play') {
        for (let i = 0; i < DUST_MAX; i++) {
          const filled = clamp(dust - i, 0, 1), x = me.x + (i - 1) * me.r * 0.42, y = me.y + me.r + Math.max(4, me.r * 0.3);
          ctx.globalAlpha = 0.18 + 0.72 * filled * filled;
          ctx.fillStyle = filled >= 1 ? 'rgb(240,230,206)' : 'rgb(170,162,146)';
          ctx.beginPath();
          ctx.arc(x, y, 1.6, 0, TAU);
          ctx.fill();
        }
      }
      // Points and words, rising from where they happened
      ctx.font = `600 13px ${uiFont}`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#060D26';
      ctx.shadowBlur = 5 * dpr;
      for (const p of pops) {
        const half = ctx.measureText(p.text).width / 2 + 6;
        ctx.globalAlpha = clamp((p.life - p.age) * 1.8, 0, 1);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, clamp(p.x, half, W - half), Math.max(40, p.y - p.age * p.rise));
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    };

    const frame = (now) => {
      if (!running) return;
      const b = banner.getBoundingClientRect();
      if (document.hidden || b.bottom < 0 || Math.abs(b.width - W) > 0.5) { ending = ending || 'gone'; cleanup(); return; }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      update(dt);
      if (!running) return;
      draw();
      requestAnimationFrame(frame);
    };
    current = { leave };
    requestAnimationFrame((now) => { last = now; frame(now); });
  };

  window.auroraMoon = { start, stop: () => current && current.leave('quit') };
})();

// A second banner game, as a rough playable version for judging how it feels: the Great Bear comes down from the sky to run,
// double jump and roll across the landscape, catching stars and eating berries and honey while dodging bees. Five stings end
// a run, and a good enough run unlocks the fox. The camera doesn't move, because a moving foreground can bring on motion sickness
// (DESIGN.md), so the banner is the level. Loaded only when someone starts it, or has already unlocked an animal.
(() => {
  const STEP = 1 / 120, TAU = Math.PI * 2;
  // How it feels. All distances are in units of the banner's height / 216, so it plays the same at any size.
  const AIR_DRAG = 300;
  // Fast rolling runs on energy: it lasts about a second, and comes back in about four while walking
  const ROLL_SECONDS = 1.1, ROLL_RECOVERY = 4, ROLL_START_COST = 0.12, ROLL_READY_AGAIN = 0.35;
  const GRAVITY = 1900, FALL_MORE = 1.45, RELEASE_MORE = 2.4, MAX_FALL = 980;
  const COYOTE = 0.09, BUFFER = 0.12, FLIP = 0.36, TUCK_UNTIL = 0.72;
  // Five lives, as in the shooting star game: three felt hard
  const LIVES = 5, HURT_SECONDS = 1.5;
  const BERRY_POINTS = 25, HONEY_POINTS = 150, PLANE_POINTS = 100, SATELLITE_POINTS = 500;
  const CHASE_SPEED = 245, CHASE_SECONDS = 5, PLANE_SPEED = 115, PLANE_UP = 108;
  // Riding the airliner earns air miles: points for as long as the ride lasts
  const MILE_SECONDS = 0.25, MILE_POINTS = 5;
  // Now and then a star bounces along the hills. Catching it makes the animal invincible for a while, able to run into bees,
  // worth more for each one in a row, and a little quicker.
  const POWER_SECONDS = 8, POWER_LIFE = 11, POWER_SPEED = 1.15, POWER_COLORS = ['#9FF5DC', '#A9C1FF', '#D2B3FF', '#FFB6E6', '#FFE9B8'];
  // Catching things in quick succession builds a combo, which multiplies their points, and a long one pays a bonus when it ends.
  // A sting breaks it.
  const COMBO_SECONDS = 2.2, COMBO_TIERS = [[15, 5], [10, 4], [6, 3], [3, 2]], COMBO_BONUS_FROM = 5, COMBO_BONUS = 10;
  const COMBO_COLORS = { 1: '#E8EEFF', 2: '#9FF5DC', 3: '#A9C1FF', 4: '#D2B3FF', 5: '#FFD66B' };
  // Sound, off unless turned on, with the same setting as the shooting star game: simple tones made here, nothing to load
  const SOUND_KEY = 'aurora-banner-sound', PENTATONIC = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
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
  const tone = (freq, ms, { to = freq, type = 'triangle', level = 0.16, delay = 0 } = {}) => {
    if (!soundIsOn || !audio) return;
    const start = audio.currentTime + delay / 1000, end = start + ms / 1000, osc = audio.createOscillator(), gain = audio.createGain();
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
  const noise = (ms, level, from = 420, to = 70) => {
    if (!soundIsOn || !audio) return;
    if (!noiseData) {
      noiseData = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
      const samples = noiseData.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    }
    const start = audio.currentTime, end = start + ms / 1000, source = audio.createBufferSource(), low = audio.createBiquadFilter(), gain = audio.createGain();
    source.buffer = noiseData;
    low.type = 'lowpass';
    low.frequency.setValueAtTime(from, start);
    low.frequency.exponentialRampToValueAtTime(to, end);
    gain.gain.setValueAtTime(level, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    source.connect(low).connect(gain).connect(audioOut);
    source.start(start);
    source.stop(end + 0.02);
  };
  const note = (n) => 523.25 * 2 ** (n / 12);
  const sfx = {
    jump: () => tone(330, 90, { to: 520, type: 'square', level: 0.03 }),
    double: () => tone(520, 120, { to: 900, type: 'square', level: 0.035 }),
    land: (hard) => noise(80 + hard * 140, 0.08 + hard * 0.16, 320, 60),
    catch: (step) => { const f = note(PENTATONIC[Math.min(step, PENTATONIC.length) - 1]); tone(f, 160); tone(f * 2, 100, { level: 0.05, delay: 25 }); },
    berry: () => tone(880, 70, { to: 620, type: 'sine', level: 0.12 }),
    honey: () => { tone(300, 160, { to: 180, type: 'sine', level: 0.16 }); tone(220, 380, { to: 260, type: 'sawtooth', level: 0.03, delay: 120 }); },
    sting: () => { tone(200, 260, { to: 110, type: 'sawtooth', level: 0.06 }); noise(200, 0.2, 260, 60); },
    bonk: (step) => tone(note(-12 + Math.min(step, 6) * 2), 140, { to: note(Math.min(step, 6) * 2), type: 'square', level: 0.05 }),
    swat: () => noise(110, 0.16, 1400, 220),
    satellite: () => { tone(note(16), 80, { type: 'square', level: 0.04 }); tone(note(21), 120, { type: 'square', level: 0.04, delay: 90 }); },
    plane: () => { tone(note(7), 180, { level: 0.08 }); tone(note(4), 260, { level: 0.08, delay: 170 }); },
    moon: () => [0, 7, 12, 16, 19, 24].forEach((n, i) => tone(note(n - 5), 260, { type: 'sine', level: 0.08, delay: i * 60 })),
    power: () => [0, 4, 7, 12, 16, 19, 24, 28].forEach((n, i) => tone(note(n), 110, { type: 'square', level: 0.035, delay: i * 45 })),
    tier: (m) => { tone(note(4 + m * 2), 120, { level: 0.1 }); tone(note(9 + m * 2), 170, { level: 0.1, delay: 90 }); },
    comboEnd: () => [0, 4, 7].forEach((n) => tone(note(n + 12), 320, { level: 0.07 })),
    pounce: () => tone(700, 160, { to: 240, type: 'sine', level: 0.08 }),
    fires: () => [0, 7, 12, 16, 19].forEach((n, i) => tone(note(n + 2), 300, { type: 'sine', level: 0.07, delay: i * 50 })),
    unlock: () => [0, 4, 7, 12, 7, 12, 16].forEach((n, i) => tone(note(n), 200, { level: 0.1, delay: i * 120 })),
    over: () => [12, 7, 4, 0].forEach((n, i) => tone(note(n), 240, { level: 0.1, delay: i * 150 })),
    best: () => [0, 4, 7, 12, 16].forEach((n, i) => tone(note(n), 260, { level: 0.12, delay: i * 110 }))
  };
  // The real moon's gravity is about a sixth of Earth's; a third keeps the jumps inside a banner this short
  const MOON_POINTS = 200, MOON_PULL = 1 / 3, MOON_LAUNCH = 0.68, MOON_REST = 18;
  const SPARKS = ['#9FF5DC', '#A9C1FF', '#D2B3FF', '#FFE9B8'];
  // The floor is the banner's near ridge, where the trees stand and the cabin sits: NEAR in design/landing/banner_gen.py, in
  // the scene's 1600 by 240 units, without its smallest ripple
  const RIDGE = { base: 219, terms: [[7, 190, 2.6], [4, 74, 0.8], [2.2, 31, 1.9]] };
  const ridgeAt = (x) => RIDGE.base + RIDGE.terms.reduce((sum, [a, f, p]) => sum + a * Math.sin(x / f + p), 0);
  // The Big Dipper on the bear's back, as in the sky: the bowl on its hip and the handle along its spine
  const BACK_STARS = { Alkaid: [24, -41], Mizar: [12, -48], Alioth: [-2, -44], Megrez: [-20, -49], Phecda: [-16, -33], Merak: [-31, -28], Dubhe: [-34, -44] };
  const BACK_LINES = ['Alkaid', 'Mizar', 'Alioth', 'Megrez', 'Phecda', 'Merak', 'Dubhe', 'Megrez'];
  // What makes each animal different. top: how tall it is, for the banner's ceiling. reach: what it can touch, more than its
  // body so catching feels generous, with food on a bridge out of reach from the ground. sting: what a bee can hit, less than
  // its body so a near miss stays a miss. low: while curled up, tuck: during a flip, when it is a smaller target.
  const ANIMALS = {
    bear: {
      run: 225, accel: 1700, friction: 2200, airAccel: 1300, roll: 620, boost: 240, rollAccel: 1500, rollFriction: 260, tired: 150,
      jump: 80, double: 52, stride: 76, stand: { hw: 30, h: 56 }, low: { hw: 15, h: 30 }, top: 66, edge: 64, dust: 34,
      reach: { hw: 46, top: 74, food: 60 }, lowReach: { r: 26, y: 15 }, sting: { hw: 32, top: 58 }, lowSting: { r: 17, y: 15 }, tuckSting: { r: 30, y: 45 },
      turnAt: [-4, -45.5], shadow: 'rgba(150,185,255,.95)', glow: [[0, 'rgba(140,175,255,.5)'], [0.45, 'rgba(120,130,255,.14)'], [1, 'rgba(120,130,255,0)']], bestKey: 'aurora-bear-best',
      back: Object.values(BACK_STARS)
    },
    // Quicker and lighter, a smaller target that also catches less. Its stars run along its spine.
    fox: {
      run: 300, accel: 2400, friction: 2600, airAccel: 1900, roll: 400, boost: 120, rollAccel: 1400, rollFriction: 420, tired: 170,
      jump: 104, double: 44, stride: 62, stand: { hw: 22, h: 40 }, low: { hw: 20, h: 24 }, top: 62, edge: 48, dust: 26,
      reach: { hw: 30, top: 48, food: 36 }, lowReach: { r: 20, y: 10 }, sting: { hw: 20, top: 38 }, lowSting: { r: 12, y: 10 }, tuckSting: { r: 20, y: 30 },
      turnAt: [-1, -30], shadow: 'rgba(255,170,90,.95)', glow: [[0, 'rgba(255,180,110,.5)'], [0.45, 'rgba(255,130,80,.14)'], [1, 'rgba(255,120,80,0)']], bestKey: 'aurora-fox-best',
      back: [[-24, -30], [-16, -33], [-8, -31], [-1, -29], [6, -31], [13, -31], [20, -27]], pounce: 78, foxFires: true
    }
  };
  // A good enough run as the bear brings the fox: its stars appear in the sky, and clicking them starts the game as the fox
  const UNLOCK_STARS = 20, ANIMALS_KEY = 'aurora-animals', FOX_FIRES_EVERY = 10, FOX_FIRES_POINTS = 250, SWAT_POINTS = 25;
  const FOX_BODY = new Path2D('M-26-19C-32-26-29-36-18-36C-8-37 2-33 12-35C19-37 24-32 24-25C24-20 14-17 2-16C-8-15-20-14-26-19Z');
  // A fox's face, from the front, as a constellation: ear, inner ear, inner ear, ear, cheek, nose, cheek
  const FOX_SKY = [[0, 0], [0.3, 0.34], [0.7, 0.34], [1, 0], [0.93, 0.56], [0.5, 1], [0.07, 0.56]];
  const unlockedAnimals = () => { try { return (localStorage.getItem(ANIMALS_KEY) || '').split(',').filter(Boolean); } catch (e) { return []; } };
  const unlockAnimal = (name) => {
    const list = unlockedAnimals();
    if (!list.includes(name)) { try { localStorage.setItem(ANIMALS_KEY, [...list, name].join(',')); } catch (e) { /* blocked */ } }
  };
  const STYLE = `
.bn-bear-layer{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none}
.bn-bear-on{cursor:default;touch-action:none}
.bn-bear-on .bn-labels{z-index:2}
.bn-bear-on .bn-figure,.bn-bear-on .bn-label-dipper,.bn-bear-on .bn-label-north,.bn-bear-on .bn-meteor,.bn-bear-on .bn-plane,.bn-bear-on .bn-sat{visibility:hidden}
.bn-animal-sky{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.bn-animal-sky .lines{opacity:.45;transition:opacity .5s}
.bn-animal-on .bn-animal-sky .lines{opacity:1}
.bn-as-fox .bn-animal-sky{visibility:hidden}
.bn-animal-label{position:absolute;left:0;top:0;opacity:0;font-size:.8125rem;line-height:1;letter-spacing:.02em;color:#FFDDB0;text-shadow:0 0 6px #060D26,0 0 2px #060D26;white-space:nowrap;transition:opacity .6s}
.bn-animal-on .bn-animal-label{opacity:1}
.bn-bear-on .bn-animal-label{opacity:0}
.bn-bear-hint,.bn-bear-quit{position:absolute;font-size:.75rem;line-height:1;color:rgba(232,238,255,.9);text-shadow:0 0 4px #04071A,0 0 2px #04071A;white-space:nowrap}
.bn-bear-hint{left:50%;top:30px;transform:translateX(-50%);transition:opacity .8s}
.bn-bear-score{position:absolute;left:50%;top:10px;transform:translateX(-50%);font-size:.8125rem;font-weight:600;line-height:1;color:rgba(232,238,255,.95);text-shadow:0 0 4px #04071A,0 0 2px #04071A;white-space:nowrap}
.bn-bear-quit{right:0;top:0;padding:10px 12px 8px;cursor:pointer;pointer-events:auto}
.bn-bear-score.link{pointer-events:auto;cursor:pointer}
.bn-bear-sound{position:absolute;right:0;bottom:0;padding:10px 12px 8px;font-size:.75rem;line-height:1;color:rgba(232,238,255,.85);text-shadow:0 0 4px #04071A;cursor:pointer;pointer-events:auto}
.bn-bear-sound:hover{text-decoration:underline;text-underline-offset:2px}
.bn-bear-score.link span{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:2px}
.bn-bear-quit:hover{text-decoration:underline;text-underline-offset:2px}`;

  // Falling stars to catch, in the star game's colors: slow ones orange, then pale yellow and white, the fastest green and violet
  const STAR_COLORS = [[255, 178, 102], [255, 226, 160], [246, 249, 255], [150, 245, 205], [196, 170, 255]];
  const starColor = (speed) => {
    const at = speed * (STAR_COLORS.length - 1), i = Math.min(STAR_COLORS.length - 2, Math.floor(at)), f = at - i;
    return STAR_COLORS[i].map((c, n) => Math.round(c + (STAR_COLORS[i + 1][n] - c) * f)).join(' ');
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const approach = (v, goal, step) => (v < goal ? Math.min(goal, v + step) : Math.max(goal, v - step));
  const canvas = (w, h) => Object.assign(document.createElement('canvas'), { width: Math.ceil(w), height: Math.ceil(h) });
  const softDot = (size, stops) => {
    const c = canvas(size, size), x = c.getContext('2d'), g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(([at, color]) => g.addColorStop(at, color));
    x.fillStyle = g;
    x.fillRect(0, 0, size, size);
    return c;
  };
  // A leg's middle joint, from where it starts and ends
  const kneeOf = (hip, foot, lengths, forward) => {
    let dx = foot[0] - hip[0], dy = foot[1] - hip[1], d = Math.hypot(dx, dy) || 0.01;
    const reach = lengths * 2 - 0.01;
    if (d > reach) { dx *= reach / d; dy *= reach / d; d = reach; }
    const along = d / 2, out = Math.sqrt(Math.max(0, lengths * lengths - along * along)) * forward;
    return { knee: [hip[0] + dx / 2 + out * dy / d, hip[1] + dy / 2 - out * dx / d], foot: [hip[0] + dx, hip[1] + dy] };
  };
  const BODY = new Path2D('M-42-22C-50-40-40-56-22-55C-10-54-2-52 6-56C14-61 24-60 30-50C34-42 34-30 30-22C20-14-2-13-20-15C-30-15-38-16-42-22Z');

  let current = null, lingering = null;
  // Labels that outlast a run, until a click on the banner or a few seconds have passed
  const linger = (labels) => {
    const banner = labels[0].closest('.banner');
    const clear = () => {
      clearTimeout(timer);
      banner.removeEventListener('click', clear);
      labels.forEach((el) => el.remove());
      lingering = null;
    };
    const timer = setTimeout(clear, 9000);
    banner.addEventListener('click', clear);
    lingering = clear;
  };
  const addStyle = () => {
    if (!document.getElementById('bn-bear-style')) document.head.append(Object.assign(document.createElement('style'), { id: 'bn-bear-style', textContent: STYLE }));
  };
  // An unlocked animal's constellation, left of the Big Dipper, where even a phone has room
  let skyBoxes = [], skyWatching = false, skyTimer = 0;
  const svgEl = (tag, attrs) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  };
  const drawSky = (banner) => {
    addStyle();
    let sky = banner.querySelector('.bn-animal-sky');
    const b = banner.getBoundingClientRect(), left = banner.querySelector('.bn-dipper-stars').getBoundingClientRect().left - b.left, size = Math.min(b.height * 0.24, left - 16);
    skyBoxes = [];
    if (!unlockedAnimals().includes('fox') || size < 20) { if (sky) sky.remove(); return; }
    if (!sky) {
      sky = svgEl('svg', { class: 'bn-animal-sky', 'aria-hidden': 'true', focusable: 'false' });
      banner.querySelector('.bn-sky').after(sky);
    }
    const x0 = left / 2 - size / 2, y0 = b.height * 0.1, spots = FOX_SKY.map(([fx, fy]) => [x0 + fx * size, y0 + fy * size]);
    const defs = svgEl('defs', {}), soft = defs.appendChild(svgEl('radialGradient', { id: 'bn-animal-glow' }));
    soft.append(svgEl('stop', { offset: 0, 'stop-color': '#FFD9A0', 'stop-opacity': 0.6 }), svgEl('stop', { offset: 1, 'stop-color': '#FFD9A0', 'stop-opacity': 0 }));
    const lines = svgEl('polyline', { class: 'lines', points: [...spots, spots[0]].map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' '), fill: 'none', stroke: '#FFCF9A', 'stroke-opacity': 0.75, 'stroke-width': 0.9, 'stroke-linejoin': 'round' });
    sky.replaceChildren(defs, lines);
    spots.forEach(([x, y], i) => {
      sky.append(svgEl('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 5.5, fill: 'url(#bn-animal-glow)' }));
      sky.append(svgEl('circle', { 'data-sky-star': i, cx: x.toFixed(1), cy: y.toFixed(1), r: i === 5 || i === 0 || i === 3 ? 1.7 : 1.3, fill: '#FFF1DC' }));
    });
    skyBoxes.push({ kind: 'fox', l: x0 - 14, r: x0 + size + 14, t: y0 - 12, b: y0 + size + 12 });
    const labels = banner.querySelector('.bn-labels');
    const label = labels.querySelector('.bn-animal-label') || labels.appendChild(Object.assign(document.createElement('span'), { className: 'bn-animal-label' }));
    label.textContent = `The Little Fox · ${matchMedia('(hover: none)').matches ? 'Tap' : 'Click'} to play`;
    label.style.transform = `translate(${Math.max(8, x0 - 8).toFixed(1)}px, ${(y0 + size + 10).toFixed(1)}px)`;
  };
  const showSkyLabel = (banner, ms) => {
    clearTimeout(skyTimer);
    banner.classList.add('bn-animal-on');
    if (ms) skyTimer = setTimeout(() => banner.classList.remove('bn-animal-on'), ms);
  };
  const animalAt = (x, y) => { const hit = skyBoxes.find((s) => x >= s.l && x <= s.r && y >= s.t && y <= s.b); return hit ? hit.kind : null; };
  const showAnimals = (banner, announce) => {
    if (!unlockedAnimals().length) return;
    drawSky(banner);
    if (!skyWatching) {
      skyWatching = true;
      window.addEventListener('resize', () => drawSky(banner));
      let over = false;
      banner.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        const b = banner.getBoundingClientRect(), now = !current && !!animalAt(e.clientX - b.left, e.clientY - b.top);
        if (now !== over) { over = now; showSkyLabel(banner, now ? 0 : 1000); }
      });
    }
    if (announce && skyBoxes.length) showSkyLabel(banner, 6000);
  };
  const start = (banner, onEnd, options = {}) => {
    if (current) return;
    const kind = ANIMALS[options.kind] ? options.kind : 'bear', A = ANIMALS[kind];
    const jumpV = Math.sqrt(2 * GRAVITY * A.jump), doubleV = Math.sqrt(2 * GRAVITY * A.double);
    if (lingering) lingering();
    addStyle();
    if (kind === 'fox') drawSky(banner);
    const box = banner.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), u = box.height / 216, W = box.width / u;
    // The hills stay anchored to the banner's bottom edge and its middle, however it is cropped
    const k = Math.max(box.width / 1600, box.height / 240), side = (1600 - box.width / k) / 2;
    const floorAt = (x) => (box.height - (240 - ridgeAt(side + x * u / k)) * k) / u;
    const slopeAt = (x) => (floorAt(x + 4) - floorAt(x - 4)) / 8;
    const scale = dpr * u, touchOnly = matchMedia('(hover: none)').matches;
    const addLayer = () => {
      const c = banner.appendChild(canvas(box.width * dpr, box.height * dpr));
      c.className = 'bn-bear-layer';
      return c;
    };
    // The level: bridges of stars to land on from below, and a fallen log low enough that only a ball rolls under it
    const ledge = (x, up, w) => ({ x, y: floorAt(x) - up, w });
    const ledges = [ledge(W * 0.2, 58, 120), ledge(W * 0.52, 104, 120), ledge(W * 0.8, 60, 130)];
    // Its underside clears the highest ground below it by just enough for a ball, wherever that is
    const logAt = (x, w) => {
      let high = Infinity;
      for (let i = -w / 2; i <= w / 2; i += 5) high = Math.min(high, floorAt(x + i));
      return { x, y: high - 33 - 18, w, h: 18 };
    };
    const logs = [logAt(W * 0.36, 110)];
    const levelLayer = addLayer(), layer = addLayer(), foreLayer = canvas(box.width * dpr, box.height * dpr), ctx = layer.getContext('2d');
    // In front of the bear, for depth: a low near hill and clumps of spruce, darker than the forest behind, standing still. They
    // leave the log and the cabin in view.
    const clumps = [];
    {
      const c = foreLayer.getContext('2d');
      c.scale(scale, scale);
      let seed = 41;
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      const bottom = box.height / u, hillAt = (x) => Math.min(bottom + 2, floorAt(x) + 8 + 9 * Math.sin(x / 170 + 1.1) + 5 * Math.sin(x / 61 + 0.4));
      const cabinX = (1150 - side) * k / u, keepClear = [[cabinX, 75], ...logs.map((l) => [l.x, l.w / 2 + 40])];
      const spruce = (x, base, h) => {
        const tiers = Math.max(5, Math.min(13, Math.round(h / 4.5))), step = h * 0.86 / tiers, half0 = h * (0.2 + rand() * 0.06), lefts = [], rights = [];
        for (let i = 0; i < tiers; i++) {
          const along = i / tiers, y = base - h * 0.08 - i * step, half = half0 * (1 - along) ** 0.8 * (along > 0.65 ? 1.3 : 1);
          lefts.push([x - half * (0.75 + rand() * 0.4), y + step * 0.2], [x - half * 0.22, y - step * 0.6]);
          rights.push([x + half * (0.75 + rand() * 0.4), y + step * 0.2], [x + half * 0.22, y - step * 0.6]);
        }
        const outline = [[x - 1, base + 4], ...lefts, [x + (rand() - 0.5) * 0.8, base - h], ...rights.reverse(), [x + 1, base + 4]];
        c.beginPath();
        outline.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py)));
        c.closePath();
        c.fill();
      };
      c.fillStyle = '#02040E';
      c.beginPath();
      c.moveTo(-2, bottom + 2);
      for (let x = -2; x <= W + 4; x += 4) c.lineTo(x, hillAt(x));
      c.lineTo(W + 4, bottom + 2);
      c.closePath();
      c.fill();
      const slots = Math.max(2, Math.round(W / 290));
      for (let n = 0; n < slots; n++) {
        const wide = 20 + rand() * 30;
        let x = (n + 0.5) / slots * W + (rand() - 0.5) * W / slots * 0.45;
        keepClear.forEach(([cx, r]) => { if (Math.abs(x - cx) < r + wide) x = cx + (x < cx ? -1 : 1) * (r + wide); });
        const trees = 3 + Math.floor(rand() * 4);
        clumps.push({ x, wide });
        for (let i = 0; i < trees; i++) {
          const across = i / (trees - 1) * 2 - 1, px = x + across * wide + (rand() - 0.5) * 6;
          spruce(px, hillAt(px), (42 + rand() * 44) * (1 - Math.abs(across) * 0.35));
        }
      }
    }
    {
      const c = levelLayer.getContext('2d');
      c.scale(scale, scale);
      logs.forEach((l) => {
        const left = l.x - l.w / 2, right = l.x + l.w / 2;
        c.fillStyle = '#060A1E';
        [left + 6, right - 6].forEach((px) => { const under = floorAt(px); c.beginPath(); c.ellipse(px, under - 12, 10, under - l.y - l.h + 2, 0, 0, TAU); c.fill(); });
        c.fillStyle = '#0B1130';
        c.beginPath();
        c.roundRect(left, l.y, l.w, l.h, 9);
        c.fill();
        c.fillStyle = '#1B2350';
        c.beginPath();
        c.ellipse(right - 3, l.y + l.h / 2, 4, l.h / 2 - 1.5, 0, 0, TAU);
        c.fill();
        const moonlit = c.createLinearGradient(left, 0, right, 0);
        moonlit.addColorStop(0, 'rgba(255,233,184,.08)');
        moonlit.addColorStop(0.5, 'rgba(255,233,184,.7)');
        moonlit.addColorStop(1, 'rgba(255,233,184,.08)');
        c.strokeStyle = moonlit;
        c.lineWidth = 1.4;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(left + 8, l.y + 0.8);
        c.lineTo(right - 8, l.y + 0.8);
        c.stroke();
      });
      const dot = softDot(64, [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,240,205,.55)'], [1, 'rgba(255,235,190,0)']]);
      ledges.forEach((l, n) => {
        const count = Math.max(4, Math.round(l.w / 28)), left = l.x - l.w / 2;
        const spots = Array.from({ length: count }, (_, i) => [left + l.w * i / (count - 1), l.y + (i % 2 ? 0.9 : -0.5) * (((n + i) % 3) / 2 + 0.3)]);
        c.lineCap = 'round';
        c.lineJoin = 'round';
        [[5, 'rgba(255,233,184,.12)'], [1, 'rgba(255,240,205,.8)']].forEach(([width, color]) => {
          c.strokeStyle = color;
          c.lineWidth = width;
          c.beginPath();
          spots.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
          c.stroke();
        });
        spots.forEach(([x, y], i) => { const r = 4.6 + ((n + i * 2) % 3); c.drawImage(dot, x - r, y - r, r * 2, r * 2); });
      });
    }
    const off = canvas(180 * scale, 180 * scale), o = off.getContext('2d');
    const glow = softDot(256, A.glow);
    const starGlow = softDot(64, [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(235,242,255,.55)'], [1, 'rgba(220,232,255,0)']]);

    // Drawn once, then stamped where they are needed
    const sprite = (w, h, paint) => {
      const c = canvas(w * scale, h * scale), x = c.getContext('2d');
      x.scale(scale, scale);
      x.translate(w / 2, h / 2);
      paint(x);
      return { c, w, h };
    };
    const halo = (x, r, color) => {
      const g = x.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0, color);
      g.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
      x.fillStyle = g;
      x.fillRect(-r, -r, r * 2, r * 2);
    };
    const beeSprite = (up, angry) => sprite(36, 28, (x) => {
      halo(x, 14, angry ? 'rgba(255,110,70,.6)' : 'rgba(255,205,90,.5)');
      x.fillStyle = 'rgba(228,240,255,.85)';
      [-1.5, 2.2].forEach((wx, i) => { x.beginPath(); x.ellipse(wx, up ? -6.8 : -5, 2.7, up ? 5 : 3.2, up ? -0.35 : -1.15 + i * 0.3, 0, TAU); x.fill(); });
      x.fillStyle = '#1E1430';
      x.beginPath();
      x.moveTo(-6, -1.2);
      x.lineTo(-10, 0);
      x.lineTo(-6, 1.2);
      x.fill();
      x.fillStyle = angry ? '#FF8A47' : '#FFC94D';
      x.beginPath();
      x.ellipse(0, 0, 6.8, 4.8, 0, 0, TAU);
      x.fill();
      x.save();
      x.clip();
      x.fillStyle = '#1E1430';
      x.fillRect(-3, -6, 2.1, 12);
      x.fillRect(1, -6, 2.1, 12);
      x.restore();
      x.beginPath();
      x.arc(6, -0.4, 2.8, 0, TAU);
      x.fill();
    });
    const BEES = [[beeSprite(true, false), beeSprite(false, false)], [beeSprite(true, true), beeSprite(false, true)]];
    // Lingonberries, which grow on the floor of a northern forest
    const berrySprite = sprite(28, 26, (x) => {
      halo(x, 13, 'rgba(255,95,140,.42)');
      x.strokeStyle = '#2F7F68';
      x.lineWidth = 1.2;
      x.lineCap = 'round';
      x.beginPath();
      x.moveTo(0, -3);
      x.lineTo(1, -8);
      x.stroke();
      x.fillStyle = '#46B48C';
      x.beginPath();
      x.ellipse(4.2, -8, 4, 1.9, -0.35, 0, TAU);
      x.fill();
      [[-3.8, 1.8], [3.8, 1.8], [0, -2.4]].forEach(([bx, by]) => {
        x.fillStyle = '#FF5C8A';
        x.beginPath();
        x.arc(bx, by, 3.7, 0, TAU);
        x.fill();
        x.fillStyle = 'rgba(255,255,255,.75)';
        x.beginPath();
        x.arc(bx - 1.2, by - 1.3, 0.9, 0, TAU);
        x.fill();
      });
    });
    const potSprite = sprite(44, 44, (x) => {
      halo(x, 21, 'rgba(255,190,80,.55)');
      const amber = x.createLinearGradient(-11, 0, 11, 0);
      amber.addColorStop(0, '#FFC24D');
      amber.addColorStop(0.45, '#FFE08A');
      amber.addColorStop(1, '#D98A1F');
      x.fillStyle = amber;
      x.beginPath();
      x.moveTo(-8.5, -7);
      x.bezierCurveTo(-14, -2, -13, 10, -6.5, 12);
      x.lineTo(6.5, 12);
      x.bezierCurveTo(13, 10, 14, -2, 8.5, -7);
      x.closePath();
      x.fill();
      x.fillStyle = '#A85F1A';
      x.beginPath();
      x.roundRect(-10, -11, 20, 4.6, 2);
      x.fill();
      x.fillStyle = '#FFF0B8';
      x.beginPath();
      x.moveTo(-3, -7);
      x.bezierCurveTo(-3, -1, 1, -1, 1, -5);
      x.lineTo(1, -7);
      x.closePath();
      x.fill();
    });
    // Facing right. Its top edge, where the bear stands, is 5 above its middle
    const planeSprite = sprite(100, 44, (x) => {
      x.fillStyle = '#2A3570';
      x.beginPath();
      x.moveTo(-33, -4);
      x.lineTo(-44, -18);
      x.lineTo(-35, -18);
      x.lineTo(-22, -5);
      x.closePath();
      x.fill();
      x.fillStyle = '#343F85';
      x.beginPath();
      x.moveTo(-36, -5);
      x.lineTo(30, -5);
      x.bezierCurveTo(38, -4.5, 42, -1, 42, 1);
      x.bezierCurveTo(42, 3.5, 36, 5, 30, 5);
      x.lineTo(-30, 5);
      x.closePath();
      x.fill();
      x.fillStyle = '#242E66';
      x.beginPath();
      x.moveTo(7, 1);
      x.lineTo(-14, 14);
      x.lineTo(-5, 14);
      x.lineTo(18, 2);
      x.closePath();
      x.fill();
      x.strokeStyle = 'rgba(214,226,255,.75)';
      x.lineWidth = 1;
      x.beginPath();
      x.moveTo(-36, -5);
      x.lineTo(30, -5);
      x.bezierCurveTo(38, -4.5, 42, -1, 42, 1);
      x.stroke();
      x.fillStyle = 'rgba(255,236,180,.92)';
      for (let i = 0; i < 11; i++) x.fillRect(-24 + i * 4.8, -2, 2, 1.8);
    });
    const satelliteSprite = sprite(36, 22, (x) => {
      halo(x, 11, 'rgba(190,215,255,.45)');
      x.fillStyle = '#3F62D6';
      x.fillRect(-15, -2.8, 9.5, 5.6);
      x.fillRect(5.5, -2.8, 9.5, 5.6);
      x.strokeStyle = 'rgba(214,226,255,.8)';
      x.lineWidth = 0.5;
      [-15, -11.8, -8.6, -5.5, 5.5, 8.7, 11.9, 15].forEach((px) => { x.beginPath(); x.moveTo(px, -2.8); x.lineTo(px, 2.8); x.stroke(); });
      x.fillStyle = '#DCE6FF';
      x.beginPath();
      x.roundRect(-4, -3.8, 8, 7.6, 1.6);
      x.fill();
    });

    const powerSprite = (color) => sprite(40, 40, (x) => {
      halo(x, 19, 'rgba(255,225,130,.6)');
      x.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 4.6 : 11;
        if (i) x.lineTo(Math.cos(a) * r, Math.sin(a) * r); else x.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      x.closePath();
      x.lineJoin = 'round';
      x.lineWidth = 2.4;
      x.strokeStyle = '#FFFFFF';
      x.stroke();
      x.fillStyle = color;
      x.fill();
    });
    const POWERS = ['#FFD84D', '#FFB6E6', '#9FF5DC', '#D2B3FF'].map(powerSprite);

    // The seven stars leave the sky, and go back at the end
    const skyEls = kind === 'fox' ? [...banner.querySelectorAll('.bn-animal-sky [data-sky-star]')] : Object.keys(BACK_STARS).map((name) => banner.querySelector(`[data-star="${name}"]`));
    const skyStars = skyEls.map((el, i) => {
      const r = el.getBoundingClientRect();
      return { el, to: A.back[i], x: (r.left + r.width / 2 - box.left) / u, y: (r.top + r.height / 2 - box.top) / u };
    });
    const under = skyStars.length ? skyStars.reduce((sum, s) => sum + s.x, 0) / skyStars.length : W * 0.25;
    const me = { x: clamp(under, A.edge, W - A.edge), y: floorAt(clamp(under, A.edge, W - A.edge)), tilt: 0, tuck: 0, tail: -0.55, dive: 0, pouncing: false, power: 0, powerChain: 0, on: null, onFloor: true, hurt: 0, flash: 0, moonTime: 0, energy: 1, tired: false, peace: false, vx: 0, vy: 0, face: 1, ground: true, rolling: false, curl: 0, jumps: 0, coyote: COYOTE, buffer: 0, flip: 1, squash: 0, gait: 0, rollUntil: 0, alpha: 0, time: 0, autoDir: 1 };
    const keys = { left: false, right: false, down: false, jump: false };
    const sparks = [], fallers = [], pops = [], bees = [], pots = [], visitors = [], rings = [], powers = [];
    let nextPower = 22 + Math.random() * 10;
    let foxKnown = unlockedAnimals().includes('fox'), unlockedNow = false;
    let combo = 0, comboLeft = 0, bestCombo = 0, newBest = false;
    const counts = { berries: 0, honey: 0, bees: 0, satellites: 0, rides: 0, moons: 0, fires: 0, miles: 0 };
    let rideMiles = 0, rideClock = 0;
    // On a meteor shower's peak night, as in the shooting star game, stars are worth double
    const peak = options.peak || null;
    const uiFont = getComputedStyle(banner).fontFamily;
    readSound();
    if (document.fonts) document.fonts.load('12px "AURORA Arcade"');
    let nextStar = 1.2, nextBee = 4.5, nextPot = 11, nextVisitor = 13, planeTurn = Math.random() < 0.5, caught = 0, points = 0, playTime = 0, lives = LIVES, result = false;
    let best = 0;
    try { best = Number(localStorage.getItem(A.bestKey)) || 0; } catch (e) { /* blocked */ }
    // The moon, if it's up tonight. A bump from below brings moon gravity for a while, longer the more of it is lit.
    const moonGroup = banner.querySelector('.bn-moon'), moonDisc = banner.querySelector('.bn-moon-face'), moonArt = banner.querySelector('.bn-moonlayer');
    const moon = moonGroup && moonDisc && moonGroup.classList.contains('on') ? (() => {
      const r = moonDisc.getBoundingClientRect();
      return { x: (r.left + r.width / 2 - box.left) / u, y: (r.top + r.height / 2 - box.top) / u, r: r.width / 2 / u, lit: Number(moonGroup.dataset.lit) || 0.5, rest: 0, flash: 0, total: 0, used: false, told: false };
    })() : null;
    // Keeps a wide banner busy and a narrow one from crowding
    const density = Math.sqrt(clamp(W / 1440, 0.4, 1.7));
    let floorSum = 0;
    for (let x = 0; x <= W; x += 20) floorSum += floorAt(x);
    const planeY = floorSum / (Math.floor(W / 20) + 1) - PLANE_UP;
    // Where berries grow: along the ground, on the bridges, on top of the log and under it, where only a ball can reach
    const berries = [];
    for (let x = 70; x < W - 40; x += 175) if (!logs.some((l) => Math.abs(x - l.x) < l.w / 2 + 30)) berries.push({ x, y: floorAt(x) - 10 });
    ledges.forEach((l) => [-0.28, 0.28].forEach((f) => berries.push({ x: l.x + l.w * f, y: l.y - 10 })));
    logs.forEach((l) => berries.push({ x: l.x, y: l.y - 10 }, { x: l.x, y: floorAt(l.x) - 9, under: true }));
    const berryLimit = Math.max(2, Math.round(W / 360));
    let nextBerry = 6;
    const growBerry = () => {
      const free = berries.filter((b) => !b.on && Math.abs(b.x - me.x) > 120);
      if (!free.length || berries.filter((b) => b.on).length >= berryLimit) return false;
      const b = free[Math.floor(Math.random() * free.length)];
      b.on = true;
      b.grow = 0;
      return true;
    };
    berries.forEach((b) => { b.on = false; b.grow = 1; });
    // The hidden one under the log starts out there, as a reward for finding it
    berries.filter((b) => b.under).forEach((b) => { b.on = true; b.grow = 1; });
    while (growBerry());
    let phase = 'in', phaseTime = 0, running = true, acc = 0, last = performance.now(), swipeRoll = false;

    const spark = (x, y, vx, vy, life, size, color) => {
      if (sparks.length > 90) sparks.shift();
      sparks.push({ x, y, vx, vy, age: 0, life, size, color });
    };
    const burst = (x, y, count, speed, life) => {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * TAU, v = speed * (0.4 + 0.6 * Math.random());
        spark(x, y, Math.cos(a) * v, Math.sin(a) * v, life * (0.6 + 0.4 * Math.random()), 0.9 + Math.random() * 1.1, SPARKS[i % SPARKS.length]);
      }
    };
    // Faster, smaller stars are worth more, as in the star game. They fall more slowly than there, since the bear has to get under them.
    const dropStar = () => {
      if (fallers.length >= 14) return;
      const speed = Math.random() ** 1.4, large = Math.random(), x1 = 30 + Math.random() * (W - 60), x0 = x1 + (Math.random() - 0.5) * 170;
      const value = 5 * Math.round((10 + 50 * speed + 30 * (1 - large) + 60 * speed * (1 - large)) / 5);
      fallers.push({ x0, x1, y0: -14, y1: floorAt(x1), t: 0, ms: 4.4 - 2.2 * speed, r: 3 + 5 * large, head: 1.7 + 2.6 * large, tail: 34 + 80 * speed, points: value, color: starColor(speed) });
    };
    const number = (n) => n.toLocaleString('en-US');
    const showScore = () => {
      const goal = kind === 'bear' && !foxKnown;
      score.textContent = `${number(points)} points · ${caught}${goal ? ` of ${UNLOCK_STARS}` : ''} ${caught === 1 && !goal ? 'star' : 'stars'} · ${lives} ${lives === 1 ? 'life' : 'lives'} left`;
    };
    const pop = (x, y, text, color, life) => pops.push({ x, y, age: 0, text, color, life: life || Math.max(0.9, 0.055 * text.length) });
    const shower = (x, y, count, color) => { for (let n = 0; n < count; n++) { const a = Math.random() * TAU, v = 50 + Math.random() * 130; spark(x, y, Math.cos(a) * v, Math.sin(a) * v, 0.55, 0.9 + Math.random(), color); } };
    // What the bear can reach: more than its body, so catching feels generous. Food on a bridge is out of reach from the ground.
    const touching = (x, y, r, top = A.reach.top) => (me.rolling
      ? Math.hypot(x - me.x, y - (me.y - A.lowReach.y)) < A.lowReach.r + r
      : x > me.x - A.reach.hw - r && x < me.x + A.reach.hw + r && y > me.y - top - r && y < me.y + r);
    // What a bee can sting: less than its body, so a near miss stays a miss. Tucked or in a ball, the bear is a smaller target.
    const stingable = (x, y) => {
      if (me.pouncing || me.power > 0) return false;
      if (me.rolling) return Math.hypot(x - me.x, y - (me.y - A.lowSting.y)) < A.lowSting.r;
      if (me.tuck > 0.5) return Math.hypot(x - me.x, y - (me.y - A.tuckSting.y)) < A.tuckSting.r;
      return Math.abs(x - me.x) < A.sting.hw && y > me.y - A.sting.top && y < me.y - 2;
    };
    const tier = () => (COMBO_TIERS.find(([n]) => combo >= n) || [0, 1])[1];
    // A catch adds to the combo, and its points are multiplied by it
    const award = (base, x, y, color, { before = '', after = '', life } = {}) => {
      const was = tier();
      combo += 1;
      comboLeft = COMBO_SECONDS;
      bestCombo = Math.max(bestCombo, combo);
      const m = tier(), worth = base * m;
      points += worth;
      pop(x, y, `${before ? `${before} ` : ''}+${number(worth)}${m > 1 ? ` ×${m}` : ''}${after ? ` · ${after}` : ''}`, color, life);
      if (m > was) {
        pop(me.x, me.y - A.top - 40, `Combo ×${m}!`, COMBO_COLORS[m], 1.6);
        sfx.tier(m);
      }
      showScore();
      return worth;
    };
    const comboEnds = (stung) => {
      if (!stung && combo >= COMBO_BONUS_FROM) {
        const bonus = combo * COMBO_BONUS;
        points += bonus;
        pop(me.x, me.y - A.top - 40, `Combo of ${combo}! +${number(bonus)}`, COMBO_COLORS[5], 2);
        sfx.comboEnd();
        showScore();
      }
      combo = 0;
      comboLeft = 0;
    };
    const catchStar = (f, x, y) => {
      caught += 1;
      award(f.points * (peak ? 2 : 1), x, y - 8, `rgb(${f.color})`);
      sfx.catch(Math.max(1, combo));
      shower(x, y, 12, `rgb(${f.color})`);
      if (kind !== 'fox' && caught % 10 === 0) pop(me.x, me.y - A.top - 56, `${caught} stars!`, 'rgb(232,238,255)', 1.4);
      // Revontulet, Finnish for the northern lights, means fox fires: the sparks from a running fox's tail
      if (A.foxFires && caught % FOX_FIRES_EVERY === 0) {
        points += FOX_FIRES_POINTS;
        counts.fires += 1;
        sfx.fires();
        pop(me.x, me.y - A.top - 14, `Fox fires! +${FOX_FIRES_POINTS}`, 'rgb(255,200,130)', 2);
        shower(me.x - me.face * 50, me.y - 34, 22, 'rgb(255,190,110)');
        if (options.surge) options.surge();
      }
      if (kind === 'bear' && !foxKnown && caught >= UNLOCK_STARS) {
        foxKnown = true;
        unlockedNow = true;
        unlockAnimal('fox');
        drawSky(banner);
        showSkyLabel(banner, 6000);
        pop(me.x, me.y - A.top - 14, 'You unlocked the fox!', 'rgb(255,214,160)', 3.5);
        sfx.unlock();
        shower(me.x, me.y - 40, 26, 'rgb(255,190,110)');
      }
      showScore();
    };
    // The fox's dive, which is safe from bees, bats away any it meets, and on landing catches what is close by
    const startPounce = () => {
      me.pouncing = true;
      me.flip = 1;
      me.vy = Math.max(me.vy, 620);
      me.vx += me.face * 60;
      burst(me.x, me.y - 20, 8, 90, 0.35);
      sfx.pounce();
    };
    const swat = (b) => {
      counts.bees += 1;
      award(SWAT_POINTS, b.x, b.y - 10, 'rgb(255,214,120)');
      sfx.swat();
      shower(b.x, b.y, 8, 'rgb(255,200,120)');
    };
    const pounceLands = () => {
      rings.push({ x: me.x, y: me.y - 8, age: 0, life: 0.42, r: A.pounce });
      for (let i = fallers.length - 1; i >= 0; i--) {
        const f = fallers[i], x = lerp(f.x0, f.x1, f.t), y = lerp(f.y0, f.y1, f.t);
        if (Math.hypot(x - me.x, y - (me.y - 20)) < A.pounce + f.r) { fallers.splice(i, 1); catchStar(f, x, y); }
      }
      for (let i = bees.length - 1; i >= 0; i--) {
        const b = bees[i];
        if (Math.hypot(b.x - me.x, b.y - (me.y - 20)) < A.pounce) { bees.splice(i, 1); swat(b); }
      }
    };
    // Bees cross at different heights, some to jump and some to roll under, and later ones swoop at where the bear was
    const sendBee = (kind) => {
      if (bees.length >= 12 && !kind) return;
      const hard = 1 - Math.exp(-playTime / 70);
      if (kind === 'swoop' || (!kind && playTime > 18 && Math.random() < 0.2 + 0.25 * hard)) {
        const x0 = Math.random() * W, x2 = clamp(me.x + (Math.random() < 0.5 ? -1 : 1) * (200 + Math.random() * 300), 0, W), tx = me.x, ty = me.y - 30;
        bees.push({ kind: 'swoop', x: x0, y: -16, age: 0, dir: 1, x0, x2, cx: 2 * tx - (x0 + x2) / 2, cy: 2 * ty + 16, dur: 2.8 + Math.random() * 1.2 });
      } else {
        const dir = Math.random() < 0.5 ? 1 : -1, x = dir > 0 ? -20 : W + 20;
        bees.push({ kind: 'cruise', x, y: 0, age: 0, dir, speed: 110 + Math.random() * 70 + 50 * hard, base: [24, 40, 62, 90][Math.floor(Math.random() * 4)], amp: 6 + Math.random() * 10, freq: 3 + Math.random() * 2, phase: Math.random() * TAU });
      }
    };
    const sendAngry = (x, y) => {
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + (i - 1) * 0.9;
        bees.push({ kind: 'chase', x, y, age: 0, dir: 1, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170, ox: (i - 1) * 22, oy: (i - 1) * 12 });
      }
    };
    // A honey pot appears somewhere up high or along the ground, away from the bear, and doesn't wait long
    const dropPot = () => {
      const spots = [...ledges.map((l) => ({ x: l.x, y: l.y - 14 })), ...berries.filter((b) => b.y > planeY + 80 && !b.under).map((b) => ({ x: b.x + 30, y: floorAt(b.x + 30) - 15 }))];
      const far = spots.filter((s) => Math.abs(s.x - me.x) > 180), pick = (far.length ? far : spots)[Math.floor(Math.random() * (far.length || spots.length))];
      pots.push({ x: pick.x, y: pick.y, age: 0, life: 14 });
      shower(pick.x, pick.y, 10, 'rgb(255,214,120)');
    };
    const sendVisitor = (kind) => {
      const dir = Math.random() < 0.5 ? 1 : -1, plane = kind ? kind === 'plane' : (planeTurn = !planeTurn);
      visitors.push(plane
        ? { kind: 'plane', x: dir > 0 ? -60 : W + 60, y: planeY, vx: dir * PLANE_SPEED, vy: 0, w: 74 }
        : { kind: 'satellite', x: dir > 0 ? -20 : W + 20, y: 12 + Math.random() * 14, vx: dir * (155 + Math.random() * 50), vy: Math.random() * 5 });
    };
    const dropPower = () => {
      const x = 30 + Math.random() * (W - 60), towardBear = Math.sign(me.x - x) || 1;
      powers.push({ x, y: -16, vx: towardBear * (80 + Math.random() * 50), vy: 40, age: 0 });
    };
    const knockOut = (b) => {
      me.powerChain += 1;
      counts.bees += 1;
      award(Math.min(400, 50 * 2 ** (me.powerChain - 1)), b.x, b.y - 12, 'rgb(255,226,150)');
      sfx.bonk(me.powerChain);
      shower(b.x, b.y, 10, POWER_COLORS[me.powerChain % POWER_COLORS.length]);
      b.kind = 'down';
      b.vx = (Math.sign(b.x - me.x) || 1) * 130;
      b.vy = -240;
    };
    const sting = (b) => {
      lives -= 1;
      comboEnds(true);
      sfx.sting();
      // One sting satisfies a swarm, so a mistake with the honey costs one life rather than all three
      if (b.kind === 'chase') bees.forEach((other) => { if (other.kind === 'chase') other.age = Math.max(other.age, CHASE_SECONDS); });
      me.hurt = HURT_SECONDS;
      me.flash = 0.22;
      me.on = null;
      me.vx = (Math.sign(me.x - b.x) || 1) * 190;
      me.vy = -250;
      me.ground = false;
      shower(me.x, me.y - 35, 14, 'rgb(255,170,120)');
      pop(me.x, me.y - A.top - 10, '−1 life', 'rgb(255,196,130)');
      showScore();
      if (lives <= 0) leave();
    };
    const size = () => (me.rolling ? A.low : A.stand);
    const overlaps = (l, x, y, s) => x + s.hw > l.x - l.w / 2 && x - s.hw < l.x + l.w / 2 && y > l.y && y - s.h < l.y + l.h;
    const canStand = () => !logs.some((l) => overlaps(l, me.x, me.y, A.stand));
    const jump = (v) => {
      me.pouncing = false;
      me.vy = -v;
      me.ground = false;
      me.buffer = 0;
    };
    const update = (dt) => {
      me.time += dt;
      me.buffer -= dt;
      me.coyote = me.ground ? COYOTE : me.coyote - dt;
      me.flip = Math.min(1, me.flip + dt / (FLIP * (me.moonTime > 0 ? 1.8 : 1)));
      // A flip is done tucked: in quickly at the start, and opening out for the last part of the turn
      me.tuck = approach(me.tuck, me.flip < TUCK_UNTIL ? 1 : 0, dt / (me.flip < TUCK_UNTIL ? 0.07 : 0.09));
      me.squash *= Math.exp(-dt * 11);
      me.curl = clamp(me.curl + (me.rolling ? dt : -dt) / 0.09, 0, 1);
      const steering = phase === 'play';
      const dir = !steering ? 0 : touchOnly ? me.autoDir : (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      if (dir) me.face = dir;
      // Curling up and getting up, which needs room overhead
      const wantsBall = steering && (keys.down || swipeRoll);
      if (A.pounce && wantsBall && !me.ground && !me.rolling) {
        if (!me.pouncing && me.y < floorAt(me.x) - 20) startPounce();
      } else if (wantsBall && !me.rolling) {
        me.rolling = true;
        me.rollUntil = me.time + 0.3;
        me.flip = 1;
        if (me.ground && !me.tired) {
          me.vx += me.face * A.boost;
          me.energy = Math.max(0, me.energy - ROLL_START_COST);
          burst(me.x, me.y - 3, 7, 70, 0.4);
        }
      } else if (!wantsBall && me.rolling && me.time > me.rollUntil && canStand()) {
        me.rolling = false;
      }
      // Running, with less grip and more speed in a ball
      const slope = me.ground && me.onFloor ? slopeAt(me.x) : 0;
      me.tilt = lerp(me.tilt, Math.atan(slope), 1 - Math.exp(-dt * 14));
      // A little faster downhill and slower uphill, and a ball picks up speed going down
      // Rolling fast uses up energy. Out of it, the bear can stay curled up, to duck or get under the log, but only crawls.
      if (me.rolling && Math.abs(me.vx) > A.run * 0.9) {
        me.energy -= dt / ROLL_SECONDS;
        if (me.energy <= 0) { me.energy = 0; me.tired = true; }
      } else {
        me.energy = Math.min(1, me.energy + dt / ROLL_RECOVERY * (me.rolling ? 0.5 : 1));
        if (me.tired && me.energy >= ROLL_READY_AGAIN) me.tired = false;
      }
      const top = (me.rolling ? (me.tired ? A.tired : A.roll) : A.run) * (1 + 0.8 * slope * dir) * (me.power > 0 ? POWER_SPEED : 1), accel = !me.ground ? A.airAccel : me.rolling ? A.rollAccel : A.accel;
      if (me.rolling && me.ground && !me.tired) me.vx += slope * 1100 * dt;
      const grip = !me.ground ? AIR_DRAG : me.rolling ? (me.tired ? 1100 : A.rollFriction) : A.friction;
      if (!dir) me.vx = approach(me.vx, 0, grip * dt);
      else if (Math.sign(me.vx) === dir && Math.abs(me.vx) > top) me.vx = approach(me.vx, dir * top, grip * dt);
      else me.vx = approach(me.vx, dir * top, accel * (Math.sign(me.vx) === -dir ? 1.6 : 1) * dt);
      // Jumping: a moment's grace after leaving an edge, and a jump pressed just before landing still counts
      if (steering && me.buffer > 0) {
        const launch = me.moonTime > 0 ? MOON_LAUNCH : 1;
        if (me.coyote > 0) {
          jump(jumpV * launch);
          sfx.jump();
          me.coyote = 0;
          me.jumps = 1;
          me.squash = -0.14;
          burst(me.x, me.y - 2, 5, 60, 0.35);
        } else if (me.jumps < 2) {
          jump(doubleV * launch);
          sfx.double();
          me.jumps = 2;
          if (!me.rolling) me.flip = 0;
          burst(me.x, me.y - 6, 16, 150, 0.55);
        }
      }
      let g = GRAVITY * (me.moonTime > 0 ? MOON_PULL : 1);
      if (me.vy > 0) g *= me.moonTime > 0 ? 1 : FALL_MORE;
      else if (!keys.jump && !touchOnly) g *= me.moonTime > 0 ? 1.5 : RELEASE_MORE;
      if (me.rolling && !me.ground && keys.down) g *= 1.3;
      if (me.pouncing) g *= 1.6;
      me.vy = Math.min(MAX_FALL, me.vy + g * dt);
      // Across, stopping at the banner's edges and the log
      const s = size();
      me.x += (me.vx + (me.on ? me.on.vx : 0)) * dt;
      for (const l of logs) {
        if (overlaps(l, me.x, me.y, s)) {
          me.x = me.vx > 0 ? l.x - l.w / 2 - s.hw : l.x + l.w / 2 + s.hw;
          me.vx = 0;
          if (touchOnly) me.autoDir = -me.autoDir;
        }
      }
      // (Far enough in that the head stays in the banner)
      if (me.x < A.edge || me.x > W - A.edge) {
        me.x = clamp(me.x, A.edge, W - A.edge);
        me.vx = 0;
        if (touchOnly) me.autoDir = me.x < W / 2 ? 1 : -1;
      }
      // Down, landing on the ground, a ledge or the log, and bumping the log from under
      const was = me.y, wasGround = me.ground, fall = me.vy;
      me.y += me.vy * dt;
      // The top of the banner is as high as the bear goes
      const headroom = me.rolling ? A.low.h : A.top;
      if (me.vy < 0 && me.y < headroom) { me.y = headroom; me.vy = 0; }
      me.ground = false;
      me.onFloor = false;
      me.on = null;
      if (me.vy >= 0) {
        for (const l of [...ledges, ...logs, ...visitors.filter((v) => v.kind === 'plane')]) {
          if (was <= l.y + 0.01 && me.y >= l.y && me.x + s.hw > l.x - l.w / 2 && me.x - s.hw < l.x + l.w / 2) {
            me.y = l.y;
            me.vy = 0;
            me.ground = true;
            if (l.kind === 'plane') {
              me.on = l;
              if (!l.boarded && phase === 'play') {
                l.boarded = true;
                counts.rides += 1;
                award(PLANE_POINTS, me.x, me.y + 40, 'rgb(255,214,170)', { after: 'Air traffic control has questions' });
                sfx.plane();
              }
            }
          }
        }
        // Stays on the ground going downhill, rather than skipping off it
        const floor = floorAt(me.x);
        if (me.y >= floor || (wasGround && !me.ground && floor - me.y < 2 + Math.abs(me.vx) * dt * 0.4)) { me.y = floor; me.vy = 0; me.ground = true; me.onFloor = true; }
      } else {
        for (const l of logs) {
          const under = l.y + l.h;
          if (was - s.h >= under - 0.01 && me.y - s.h < under && me.x + s.hw > l.x - l.w / 2 && me.x - s.hw < l.x + l.w / 2) { me.y = under + s.h; me.vy = 0; }
        }
      }
      // Air miles while riding, totted up when the ride ends
      if (me.on && phase === 'play') {
        rideClock += dt;
        while (rideClock >= MILE_SECONDS) {
          rideClock -= MILE_SECONDS;
          rideMiles += MILE_POINTS;
          points += MILE_POINTS;
          if (rideMiles % 100 === 0) tone(note(19), 70, { type: 'sine', level: 0.04 });
          showScore();
        }
      } else if (rideMiles) {
        counts.miles += rideMiles;
        pop(me.x, me.y - A.top - 14, `+${number(rideMiles)} air miles`, 'rgb(255,214,170)', 1.8);
        rideMiles = 0;
        rideClock = 0;
      }
      if (me.ground) {
        me.jumps = 0;
        if (me.pouncing) { me.pouncing = false; pounceLands(); }
        if (!wasGround) {
          me.squash = clamp(fall / 1500, 0.06, 0.2);
          me.flip = 1;
          burst(me.x, me.y - 2, 4 + Math.round(fall / 110), 40 + fall / 7, 0.45);
          if (fall > 250) sfx.land(clamp(fall / 1000, 0, 1));
        }
      }
      // The legs keep pace with the ground, and the bear settles when it stops
      me.gait = lerp(me.gait, me.ground ? clamp(Math.abs(me.vx) / 90, 0, 1) : 0, 1 - Math.exp(-dt * 16));
      if (me.ground) me.stride = ((me.stride || 0) + Math.abs(me.vx) * dt / A.stride) % 1;
      // A trail: stars from a ball, a little dust at full speed
      if (me.ground && Math.random() < (me.rolling ? (me.tired ? 0.03 : 0.32) : Math.abs(me.vx) >= A.run * 0.95 ? 0.08 : 0)) {
        spark(me.x - me.face * (me.rolling ? 10 : A.dust), me.y - Math.random() * 6, -me.vx * 0.12 + (Math.random() - 0.5) * 30, -18 - Math.random() * 34, 0.55, 0.8 + Math.random(), SPARKS[Math.floor(Math.random() * SPARKS.length)]);
      }
      if (phase === 'play') {
        playTime += dt;
        nextStar -= dt;
        if (nextStar <= 0) { dropStar(); nextStar = lerp(1.25, 0.55, 1 - Math.exp(-playTime / 45)) * (0.75 + Math.random() * 0.5) / density; }
        if (!me.peace) {
          nextBee -= dt;
          if (nextBee <= 0) { sendBee(); nextBee = lerp(6, 2, 1 - Math.exp(-playTime / 70)) * (0.75 + Math.random() * 0.5) / density; }
          nextPot -= dt;
          if (nextPot <= 0) { dropPot(); nextPot = 15 + Math.random() * 9; }
          nextVisitor -= dt;
          if (nextVisitor <= 0) { sendVisitor(); nextVisitor = 14 + Math.random() * 8; }
          nextPower -= dt;
          if (nextPower <= 0) { dropPower(); nextPower = 35 + Math.random() * 20; }
        }
      }
      // The bouncing star
      me.power = Math.max(0, me.power - dt);
      if (me.power > 0 && Math.random() < 0.34) spark(me.x + (Math.random() - 0.5) * A.reach.hw * 1.6, me.y - Math.random() * A.top, (Math.random() - 0.5) * 40, -20 - Math.random() * 40, 0.6, 0.8 + Math.random() * 0.8, POWER_COLORS[Math.floor(Math.random() * POWER_COLORS.length)]);
      for (let i = powers.length - 1; i >= 0; i--) {
        const s = powers[i];
        s.age += dt;
        s.vy += 520 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.x < 24 || s.x > W - 24) { s.vx = -s.vx; s.x = clamp(s.x, 24, W - 24); }
        const floor = floorAt(s.x) - 14;
        if (s.y > floor && s.vy > 0) { s.y = floor; s.vy = -300; }
        if (phase === 'play' && touching(s.x, s.y, 11)) {
          powers.splice(i, 1);
          me.power = POWER_SECONDS;
          me.powerChain = 0;
          me.hurt = 0;
          me.energy = 1;
          me.tired = false;
          pop(me.x, me.y - A.top - 14, 'Invincible! Run into the bees', 'rgb(255,226,150)', 2.2);
          sfx.power();
          POWER_COLORS.forEach((color) => shower(s.x, s.y, 7, color));
        } else if (s.age >= POWER_LIFE) powers.splice(i, 1);
      }
      me.hurt = Math.max(0, me.hurt - dt);
      if (comboLeft > 0 && phase === 'play') { comboLeft -= dt; if (comboLeft <= 0) comboEnds(false); }
      me.flash = Math.max(0, me.flash - dt);
      me.moonTime = Math.max(0, me.moonTime - dt);
      if (A.foxFires) {
        const goal = me.pouncing ? 1.45 : !me.ground ? (me.vy > 0 ? 0.85 : -0.25) : Math.abs(me.vx) > 40 ? 0.22 : -0.55;
        me.tail = lerp(me.tail, goal, 1 - Math.exp(-dt * 9));
        me.dive = approach(me.dive, me.pouncing ? 1 : 0, dt / 0.07);
        if (!me.rolling && Math.abs(me.vx) >= A.run * 0.7 && Math.random() < 0.26) {
          spark(me.x - me.face * (56 + Math.random() * 16), me.y - 30 - Math.random() * 14, -me.vx * 0.1 + (Math.random() - 0.5) * 30, -50 - Math.random() * 70, 0.7, 0.7 + Math.random() * 0.7, Math.random() < 0.5 ? '#FFC27A' : '#FFE3B0');
        }
      }
      for (let i = rings.length - 1; i >= 0; i--) { rings[i].age += dt; if (rings[i].age >= rings[i].life) rings.splice(i, 1); }
      if (moon) {
        moon.rest = Math.max(0, moon.rest - dt);
        moon.flash = Math.max(0, moon.flash - dt);
        if (phase === 'play' && !moon.rest && touching(moon.x, moon.y, moon.r * 0.7, 66)) {
          moon.used = true;
          moon.total = me.moonTime = 5 + 7 * moon.lit;
          moon.rest = moon.total + MOON_REST;
          moon.flash = 0.7;
          counts.moons += 1;
          award(MOON_POINTS, moon.x, moon.y + moon.r + 26, 'rgb(255,232,170)', { before: 'Moon gravity!', life: 2 });
          sfx.moon();
          shower(moon.x, moon.y + moon.r * 0.6, 20, 'rgb(255,232,170)');
          if (me.vy < 0) me.vy = 50;
          // It takes the bump and settles back
          if (moonArt) moonArt.animate([0, -8, 3, -1, 0].map((y) => ({ transform: `translateY(${(y * u).toFixed(1)}px)` })), { duration: 650, easing: 'ease-out' });
        }
        // In case no one has thought of it
        if (phase === 'play' && !moon.used && !moon.told && playTime > 14) {
          moon.told = true;
          pop(moon.x, moon.y + moon.r + 26, 'Try bumping the moon', 'rgb(255,232,170)', 3.5);
        }
      }
      if (me.moonTime > 0 && !me.ground && Math.random() < 0.14) spark(me.x + (Math.random() - 0.5) * 70, me.y - Math.random() * 56, (Math.random() - 0.5) * 14, 16 + Math.random() * 18, 0.9, 0.7 + Math.random() * 0.6, 'rgb(255,232,170)');
      for (let i = fallers.length - 1; i >= 0; i--) {
        const f = fallers[i];
        f.t += dt / f.ms;
        const x = lerp(f.x0, f.x1, f.t), y = lerp(f.y0, f.y1, f.t);
        if (phase === 'play' && touching(x, y, f.r)) {
          fallers.splice(i, 1);
          catchStar(f, x, y);
        } else if (f.t >= 1) {
          fallers.splice(i, 1);
          for (let n = 0; n < 5; n++) spark(x, y - 2, (Math.random() - 0.5) * 70, -20 - Math.random() * 50, 0.4, 0.7, `rgb(${f.color})`);
        }
      }
      // Berries, one at a time, up to the limit
      nextBerry -= dt;
      if (nextBerry <= 0) { growBerry(); nextBerry = (7 + Math.random() * 5) / density; }
      for (const b of berries) {
        if (!b.on) continue;
        b.grow = Math.min(1, b.grow + dt * 2.5);
        if (phase === 'play' && touching(b.x, b.y, 4, 60)) {
          b.on = false;
          counts.berries += 1;
          award(BERRY_POINTS, b.x, b.y - 10, 'rgb(255,130,165)');
          sfx.berry();
          shower(b.x, b.y, 7, 'rgb(255,110,150)');
        }
      }
      // Honey is worth a lot, but it brings angry bees
      for (let i = pots.length - 1; i >= 0; i--) {
        const p = pots[i];
        p.age += dt;
        if (phase === 'play' && touching(p.x, p.y, 7, 66)) {
          pots.splice(i, 1);
          counts.honey += 1;
          award(HONEY_POINTS, p.x, p.y - 16, 'rgb(255,214,120)', { after: 'Angry bees!' });
          sfx.honey();
          shower(p.x, p.y, 16, 'rgb(255,214,120)');
          sendAngry(p.x, p.y);
        } else if (p.age >= p.life) pots.splice(i, 1);
      }
      // Bees
      for (let i = bees.length - 1; i >= 0; i--) {
        const b = bees[i];
        b.age += dt;
        let gone = false;
        if (b.kind === 'down') {
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.vy += 900 * dt;
          gone = b.y > box.height / u + 30;
          if (gone) bees.splice(i, 1);
          continue;
        }
        if (b.kind === 'cruise') {
          b.x += b.dir * b.speed * dt;
          b.y = floorAt(clamp(b.x, 0, W)) - b.base + Math.sin(b.age * b.freq + b.phase) * b.amp;
          gone = b.x < -30 || b.x > W + 30;
        } else if (b.kind === 'swoop') {
          const f = b.age / b.dur, nx = (1 - f) ** 2 * b.x0 + 2 * f * (1 - f) * b.cx + f * f * b.x2, ny = (1 - f) ** 2 * -16 + 2 * f * (1 - f) * b.cy + f * f * -16;
          if (Math.abs(nx - b.x) > 0.01) b.dir = Math.sign(nx - b.x);
          b.x = nx;
          b.y = ny;
          gone = f >= 1;
        } else {
          if (b.age < CHASE_SECONDS && phase === 'play') {
            const dx = me.x + b.ox - b.x, dy = me.y - 32 + b.oy - b.y, d = Math.hypot(dx, dy) || 1;
            b.vx += dx / d * 1000 * dt;
            b.vy += dy / d * 1000 * dt;
            const v = Math.hypot(b.vx, b.vy);
            if (v > CHASE_SPEED) { b.vx *= CHASE_SPEED / v; b.vy *= CHASE_SPEED / v; }
          } else b.vy -= 500 * dt;
          b.x += b.vx * dt;
          b.y += (b.vy + Math.sin(b.age * 19 + i) * 40) * dt;
          if (Math.abs(b.vx) > 8) b.dir = Math.sign(b.vx);
          gone = b.y < -30 || b.x < -40 || b.x > W + 40;
        }
        if (gone) bees.splice(i, 1);
        else if (phase === 'play' && me.power > 0 && touching(b.x, b.y, 6)) knockOut(b);
        else if (phase === 'play' && me.pouncing && touching(b.x, b.y, 8)) {
          bees.splice(i, 1);
          swat(b);
        } else if (phase === 'play' && me.hurt <= 0 && stingable(b.x, b.y)) {
          bees.splice(i, 1);
          sting(b);
        }
      }
      // An airliner to ride, and a satellite, high up, worth a lot
      for (let i = visitors.length - 1; i >= 0; i--) {
        const v = visitors[i];
        v.x += v.vx * dt;
        v.y += v.vy * dt;
        if (v.kind === 'satellite' && phase === 'play' && touching(v.x, v.y, 7)) {
          visitors.splice(i, 1);
          counts.satellites += 1;
          award(SATELLITE_POINTS, v.x, Math.max(30, v.y + 40), 'rgb(214,226,255)', { before: 'Satellite!' });
          sfx.satellite();
          shower(v.x, v.y, 18, 'rgb(214,226,255)');
        } else if (v.x < -80 || v.x > W + 80) visitors.splice(i, 1);
      }
      for (let i = pops.length - 1; i >= 0; i--) { pops[i].age += dt; if (pops[i].age > pops[i].life) pops.splice(i, 1); }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.age += dt;
        if (p.age >= p.life) { sparks.splice(i, 1); continue; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 180 * dt;
        p.vx *= 1 - 1.6 * dt;
      }
    };

    const paintBear = () => {
      const air = me.ground ? 0 : 1, phaseNow = me.stride || 0, g = me.gait;
      const wave = Math.sin(phaseNow * TAU), breath = Math.sin(me.time * 2.4) * (1 - g) * (1 - air);
      // Tucked, the body folds to half its length around its middle and a round shape grows around it, with the legs and head inside
      const tuck = smooth(me.tuck), fold = (x) => -8 + (x + 8) * (1 - 0.5 * tuck);
      const bob = -Math.abs(wave) * 3.4 * g + breath * 0.8, pitch = (wave * 0.055 * g + clamp(me.vy / 900, -1, 1) * 0.22 * air) * (1 - tuck);
      const rise = clamp(-me.vy / 500, -1, 1);
      const footFor = (hipX, offset, front) => {
        const p = (phaseNow + offset) % 1, stance = p < 0.5;
        const runX = stance ? hipX + 18 - 72 * p : hipX - 18 + 72 * (p - 0.5), runY = stance ? 0 : -11 * Math.sin((p - 0.5) * TAU);
        const standX = hipX + (front ? 2 : -2);
        const airX = hipX + (front ? 12 : -12) * Math.max(0, rise) + (front ? 3 : -3), airY = rise > 0 ? -9 : -4;
        return air ? [airX, airY] : [lerp(standX, runX, g), lerp(0, runY, g)];
      };
      // A gallop: the hind legs close together, then the front
      const tucked = [[7, -24], [-13, -24], [9, -25], [-10, -25]];
      const feet = [footFor(21, 0.5, true), footFor(-29, 0, false), footFor(27, 0.62, true), footFor(-23, 0.12, false)].map(([x, y], i) => [lerp(x, tucked[i][0], tuck), lerp(y, tucked[i][1], tuck)]);
      const c = Math.cos(pitch), s = Math.sin(pitch);
      const turned = (x, y) => [x * c - (y + 35) * s, x * s + (y + 35) * c - 35 + bob];
      const hips = [{ at: turned(fold(21), -26), forward: 1 }, { at: turned(fold(-29), -27), forward: -1 }, { at: turned(fold(27), -26), forward: 1 }, { at: turned(fold(-23), -27), forward: -1 }];
      const body = () => {
        o.translate(0, bob - 35);
        o.rotate(pitch);
        o.translate(0, 35);
      };
      const folded = () => {
        o.translate(-8, 0);
        o.scale(1 - 0.5 * tuck, 1);
        o.translate(8, 0);
      };
      // The head comes down to the chest, chin first
      const head = () => {
        o.translate(38 - 26 * tuck, -44 + 18 * tuck);
        o.rotate(lerp(-pitch * 1.6, 1.1, tuck));
        o.scale(1 - 0.15 * tuck, 1 - 0.15 * tuck);
        o.translate(-38, 44);
      };
      // Everything drawn twice, a brighter size larger first, so the outline runs around the whole shape
      const shapes = (edge) => {
        o.save();
        const a = hips.map((h) => h.at);
        // The legs are placed in the banner's frame and the rest turns with the body, so the feet stay on the ground
        o.save();
        const limb = (i, color, width) => {
          const { knee, foot } = kneeOf(a[i], feet[i], lerp(14, 6, tuck), hips[i].forward);
          o.strokeStyle = color;
          o.lineWidth = width;
          o.beginPath();
          o.moveTo(...a[i]);
          o.lineTo(...knee);
          o.lineTo(...foot);
          o.lineTo(foot[0] + 4.5, foot[1] - 0.5);
          o.stroke();
        };
        o.lineCap = 'round';
        o.lineJoin = 'round';
        limb(2, edge ? 'rgba(170,190,255,.75)' : '#3C49A6', edge ? 15 : 12.5);
        limb(3, edge ? 'rgba(170,190,255,.75)' : '#3C49A6', edge ? 15 : 12.5);
        limb(0, edge ? '#D5E3FF' : '#5166D6', edge ? 17.5 : 14.5);
        limb(1, edge ? '#D5E3FF' : '#5166D6', edge ? 17.5 : 14.5);
        o.restore();
        body();
        o.fillStyle = edge ? '#D5E3FF' : '#5166D6';
        o.strokeStyle = o.fillStyle;
        o.lineCap = 'round';
        o.lineWidth = edge ? 3 : 0.01;
        o.save();
        folded();
        o.fill(BODY);
        o.stroke(BODY);
        o.restore();
        if (tuck > 0) {
          o.beginPath();
          o.arc(-4, -37, 27 * tuck + (edge ? 1.5 : 0), 0, TAU);
          o.fill();
        }
        head();
        o.lineWidth = edge ? 25 : 22;
        o.beginPath();
        o.moveTo(22, -46);
        o.lineTo(40, -47);
        o.stroke();
        const spot = (x, y, rx, ry) => {
          const grow = edge ? 1.5 : 0;
          o.beginPath();
          o.ellipse(x, y, rx + grow, ry + grow, 0, 0, TAU);
          o.fill();
        };
        spot(42, -47, 13, 12.5);
        spot(54, -42, 9, 6.6);
        spot(33, -59, 4.8, 4.8);
        o.restore();
        o.save();
        body();
        o.fillStyle = edge ? '#D5E3FF' : '#5166D6';
        o.beginPath();
        o.ellipse(fold(-46), -38, 4.2 + (edge ? 1.5 : 0), 4.2 + (edge ? 1.5 : 0), 0, 0, TAU);
        o.fill();
        o.restore();
      };
      shapes(true);
      shapes(false);
      // Lit from above by the aurora, violet underneath
      o.save();
      o.globalCompositeOperation = 'source-atop';
      const light = o.createLinearGradient(0, -66, 0, 2);
      light.addColorStop(0, 'rgba(159,245,220,.62)');
      light.addColorStop(0.42, 'rgba(120,150,255,0)');
      light.addColorStop(1, 'rgba(170,96,230,.68)');
      o.fillStyle = light;
      o.fillRect(-90, -110, 180, 180);
      o.restore();
      // The face, and the stars on its back
      o.save();
      body();
      o.save();
      head();
      o.fillStyle = '#F6FAFF';
      o.beginPath();
      o.arc(47, -50, 1.5, 0, TAU);
      o.fill();
      o.fillStyle = '#141B47';
      o.beginPath();
      o.ellipse(61.5, -44, 2.3, 1.9, 0, 0, TAU);
      o.fill();
      o.restore();
      o.strokeStyle = 'rgba(232,240,255,.5)';
      o.lineWidth = 0.7;
      o.beginPath();
      BACK_LINES.forEach((name, i) => { const [x, y] = BACK_STARS[name]; if (i) o.lineTo(fold(x), y); else o.moveTo(fold(x), y); });
      o.stroke();
      Object.values(BACK_STARS).forEach(([x, y], i) => {
        const r = 4.2 + Math.sin(me.time * 3 + i * 1.7) * 0.7;
        o.drawImage(starGlow, fold(x) - r, y - r, r * 2, r * 2);
      });
      o.restore();
    };
    const paintBall = () => {
      const r = 15, spin = me.x / r * me.face;
      o.save();
      o.translate(0, -r);
      o.fillStyle = '#D5E3FF';
      o.beginPath();
      o.arc(0, 0, r + 1.5, 0, TAU);
      o.fill();
      const fill = o.createRadialGradient(-3, -5, 1, 0, 0, r);
      fill.addColorStop(0, '#8FA6FF');
      fill.addColorStop(0.65, '#5166D6');
      fill.addColorStop(1, '#6E3FB8');
      o.fillStyle = fill;
      o.beginPath();
      o.arc(0, 0, r, 0, TAU);
      o.fill();
      o.rotate(spin);
      // The curled up body's lines turn with it, and an ear gives away which way is up
      o.strokeStyle = 'rgba(214,228,255,.7)';
      o.lineWidth = 1.5;
      o.lineCap = 'round';
      o.beginPath();
      o.arc(0, 0, r * 0.62, 0.3, 2.5);
      o.moveTo(r * 0.26, 0);
      o.arc(0, 0, r * 0.26, 0, 2.6);
      o.stroke();
      o.fillStyle = '#D5E3FF';
      o.beginPath();
      o.arc(r * 0.72, -r * 0.72, 3.4, 0, TAU);
      o.fill();
      for (let i = 0; i < 7; i++) {
        const a = i * 2.4, d = r * (0.25 + 0.09 * i), g = 3.8;
        o.drawImage(starGlow, Math.cos(a) * d - g, Math.sin(a) * d - g, g * 2, g * 2);
      }
      o.restore();
    };
    const paintFox = () => {
      const air = me.ground ? 0 : 1, stride = me.stride || 0, g = me.gait;
      const tuck = smooth(me.tuck), flat = smooth(me.curl), dive = smooth(me.dive), fold = (x) => -2 + (x + 2) * (1 - 0.5 * tuck);
      const wave = Math.sin(stride * TAU), breath = Math.sin(me.time * 3) * (1 - g) * (1 - air);
      const bob = -Math.abs(wave) * 2.6 * g + breath * 0.5, pitch = (wave * 0.08 * g + clamp(me.vy / 900, -1, 1) * 0.24 * air) * (1 - tuck) * (1 - dive);
      const rise = clamp(-me.vy / 500, -1, 1), length = lerp(10.5, 5, tuck);
      const footFor = (hipX, offset, front) => {
        const p = (stride + offset) % 1, stance = p < 0.5;
        const runX = stance ? hipX + 14 - 56 * p : hipX - 14 + 56 * (p - 0.5), runY = stance ? 0 : -8 * Math.sin((p - 0.5) * TAU);
        const standX = hipX + (front ? 1.5 : -1.5);
        const airX = hipX + (front ? 11 : -11) * Math.max(0, rise) + (front ? 3 : -3), airY = rise > 0 ? -6 : -3;
        return air ? [airX, airY] : [lerp(standX, runX, g), lerp(0, runY, g)];
      };
      const tucked = [[6, -15], [-9, -15], [8, -16], [-6, -16]], diving = [[26, -15], [-27, -13], [29, -13], [-24, -11]];
      const feet = [footFor(16, 0.5, true), footFor(-20, 0, false), footFor(20, 0.62, true), footFor(-15, 0.12, false)]
        .map(([x, y], i) => [lerp(lerp(x, tucked[i][0], tuck), diving[i][0], dive), lerp(lerp(y, tucked[i][1], tuck), diving[i][1], dive)]);
      const c = Math.cos(pitch), s = Math.sin(pitch);
      const turned = (x, y) => [x * c - (y + 26) * s, x * s + (y + 26) * c - 26 + bob];
      const hips = [turned(fold(16), -19), turned(fold(-20), -20), turned(fold(20), -19), turned(fold(-15), -20)], forward = [1, -1, 1, -1];
      const body = () => {
        o.translate(0, bob - 26);
        o.rotate(pitch);
        o.translate(0, 26);
      };
      const folded = () => {
        o.translate(-2, 0);
        o.scale(1 - 0.5 * tuck, 1);
        o.translate(2, 0);
      };
      const head = () => {
        o.translate(27 - 18 * tuck, -41 + 13 * tuck);
        o.rotate(lerp(-pitch * 1.4, 1.1, tuck));
        o.scale(1 - 0.1 * tuck, 1 - 0.1 * tuck);
        o.translate(-27, 41);
      };
      // Sliding, it flattens, and the feet stay on the ground
      o.scale(1 + 0.12 * flat, 1 - 0.45 * flat);
      // (The paws are drawn around their centers)
      o.translate(0, -4);
      const tail = (edge) => {
        const a = lerp(me.tail, 1.3, tuck), len = 46 * (1 - 0.25 * tuck), dx = -Math.cos(a), dy = -Math.sin(a), [bx, by] = turned(fold(-25), -29);
        const at = (f) => {
          const off = Math.sin(f * 3.4 + me.time * 7 * g) * (1.2 + 2.2 * f) * g + f * f * 6;
          return [bx + dx * len * f - dy * off, by + dy * len * f + dx * off];
        };
        const width = (f) => 1.2 + 8.8 * Math.sin(Math.PI * (0.03 + 0.97 * f) ** 0.72) + (edge ? 1.6 : 0);
        const piece = (from, to, color) => {
          const up = [], down = [];
          for (let i = 0; i <= 9; i++) {
            const f = lerp(from, to, i / 9), [x, y] = at(f), w = width(f);
            up.push([x - dy * w, y + dx * w]);
            down.push([x + dy * w, y - dx * w]);
          }
          o.fillStyle = color;
          o.beginPath();
          [...up, ...down.reverse()].forEach(([x, y], i) => (i ? o.lineTo(x, y) : o.moveTo(x, y)));
          o.closePath();
          o.fill();
        };
        piece(0, 0.74, edge ? '#FFE6C4' : '#EE8237');
        piece(0.7, 1, edge ? '#FFE6C4' : '#FFF6EA');
      };
      const shapes = (edge) => {
        const main = edge ? '#FFE6C4' : '#EE8237', farMain = edge ? 'rgba(255,214,170,.7)' : '#A5572B';
        const limb = (i, upper, lower, width) => {
          const { knee, foot } = kneeOf(hips[i], feet[i], length, forward[i]);
          o.lineWidth = width;
          o.strokeStyle = upper;
          o.beginPath();
          o.moveTo(...hips[i]);
          o.lineTo(...knee);
          o.stroke();
          o.strokeStyle = lower;
          o.beginPath();
          o.moveTo(...knee);
          o.lineTo(...foot);
          o.lineTo(foot[0] + 3.6, foot[1] - 0.4);
          o.stroke();
        };
        o.lineCap = 'round';
        o.lineJoin = 'round';
        tail(edge);
        limb(2, farMain, edge ? farMain : '#2C1A26', edge ? 8 : 5.6);
        limb(3, farMain, edge ? farMain : '#2C1A26', edge ? 8 : 5.6);
        limb(0, main, edge ? main : '#3A2230', edge ? 9.4 : 6.8);
        limb(1, main, edge ? main : '#3A2230', edge ? 9.4 : 6.8);
        o.save();
        body();
        o.fillStyle = main;
        o.strokeStyle = main;
        o.save();
        folded();
        o.lineWidth = edge ? 3 : 0.01;
        o.fill(FOX_BODY);
        o.stroke(FOX_BODY);
        o.restore();
        if (tuck > 0) {
          o.beginPath();
          o.arc(-1, -26, 18 * tuck + (edge ? 1.5 : 0), 0, TAU);
          o.fill();
        }
        head();
        o.lineWidth = edge ? 13.5 : 11;
        o.beginPath();
        o.moveTo(14, -30);
        o.lineTo(26, -40);
        o.stroke();
        o.beginPath();
        o.arc(27, -41, 8.2 + (edge ? 1.5 : 0), 0, TAU);
        o.fill();
        const shape = (points, color) => {
          o.fillStyle = color;
          o.strokeStyle = color;
          o.lineWidth = edge ? 3 : 1.2;
          o.beginPath();
          points.forEach(([x, y], i) => (i ? o.lineTo(x, y) : o.moveTo(x, y)));
          o.closePath();
          o.fill();
          o.stroke();
        };
        shape([[28, -47], [44, -37.5], [30, -33.5]], main);
        shape([[27, -47], [29, -59], [34, -45.5]], edge ? farMain : '#C96A2E');
        shape([[20.5, -46], [19, -59.5], [28, -48.5]], main);
        o.restore();
      };
      shapes(true);
      shapes(false);
      // Warm from above, and dusky underneath
      o.save();
      o.globalCompositeOperation = 'source-atop';
      const light = o.createLinearGradient(0, -60, 0, 2);
      light.addColorStop(0, 'rgba(255,226,150,.5)');
      light.addColorStop(0.45, 'rgba(255,160,90,0)');
      light.addColorStop(1, 'rgba(176,58,92,.5)');
      o.fillStyle = light;
      o.fillRect(-90, -110, 180, 180);
      // The pale chest and jaw, the ear's inside and the face
      o.fillStyle = `rgba(255,241,223,${(0.92 * (1 - tuck)).toFixed(2)})`;
      body();
      o.beginPath();
      o.ellipse(fold(21), -24, 5.2, 8, 0, 0, TAU);
      o.fill();
      o.save();
      head();
      o.beginPath();
      o.moveTo(30, -37.8);
      o.lineTo(44.2, -37.4);
      o.lineTo(30.5, -33);
      o.closePath();
      o.fill();
      o.fillStyle = '#7A3A25';
      o.beginPath();
      o.moveTo(22, -48.5);
      o.lineTo(20.6, -56.5);
      o.lineTo(25.6, -50);
      o.closePath();
      o.fill();
      o.globalCompositeOperation = 'source-over';
      o.fillStyle = '#1E1430';
      o.beginPath();
      o.ellipse(33.5, -43, 1.9, 1.5, 0, 0, TAU);
      o.fill();
      o.beginPath();
      o.ellipse(44.5, -37.6, 2, 1.7, 0, 0, TAU);
      o.fill();
      o.fillStyle = '#FFFFFF';
      o.beginPath();
      o.arc(34.1, -43.6, 0.6, 0, TAU);
      o.fill();
      o.restore();
      o.globalCompositeOperation = 'source-over';
      // Its stars, along the spine
      o.strokeStyle = 'rgba(255,240,215,.55)';
      o.lineWidth = 0.6;
      o.beginPath();
      A.back.forEach(([x, y], i) => (i ? o.lineTo(fold(x), y) : o.moveTo(fold(x), y)));
      o.stroke();
      A.back.forEach(([x, y], i) => {
        const r = 3.3 + Math.sin(me.time * 3 + i * 1.7) * 0.5;
        o.drawImage(starGlow, fold(x) - r, y - r, r * 2, r * 2);
      });
      o.restore();
    };
    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, layer.width, layer.height);
      const px = me.x * scale, py = me.y * scale, under = floorAt(me.x), height = clamp((under - me.y) / 150, 0, 1);
      // The bear's light on the forest and on the ground below it
      // It grows with each star caught and fades with each sting
      const health = Math.max(0, lives) / LIVES, flicker = me.hurt > 0 && Math.floor(me.hurt * 14) % 2 ? 0.4 : 1;
      const stamp = (s, x, y, dir = 1) => {
        ctx.setTransform(scale * dir, 0, 0, scale, x * scale, y * scale);
        ctx.drawImage(s.c, -s.w / 2, -s.h / 2, s.w, s.h);
      };
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = me.alpha * 0.85 * (0.45 + 0.55 * health);
      const glowSize = (210 + Math.min(90, caught * 3)) * (0.7 + 0.3 * health) * scale;
      ctx.drawImage(glow, px - glowSize / 2, py - 30 * scale - glowSize / 2, glowSize, glowSize);
      ctx.globalAlpha = me.alpha * 0.6 * (1 - height);
      ctx.drawImage(glow, (me.x - 80) * scale, (under - 9) * scale, 160 * scale, 18 * scale);
      ctx.globalCompositeOperation = 'source-over';
      // The plane and the satellite pass behind the bear
      const outFade = phase === 'out' ? clamp(1 - phaseTime / 0.5, 0, 1) : 1;
      for (const v of visitors) {
        ctx.globalAlpha = outFade;
        if (v.kind === 'plane') {
          const dir = Math.sign(v.vx);
          stamp(planeSprite, v.x, v.y + 5, dir);
          ctx.setTransform(scale, 0, 0, scale, 0, 0);
          if (Math.sin(me.time * 8) > 0.2) ctx.drawImage(starGlow, v.x - dir * 41 - 6, v.y - 19, 12, 12);
          // The air miles so far, under the plane being ridden
          if (me.on === v && rideMiles) {
            ctx.font = `600 12px ${uiFont}`;
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFD9A0';
            ctx.shadowColor = '#060D26';
            ctx.shadowBlur = 4 * scale;
            ctx.fillText(`Air miles ${number(rideMiles)}`, clamp(v.x, 50, W - 50), v.y + 30);
            ctx.shadowBlur = 0;
          }
          ctx.fillStyle = Math.sin(me.time * 8) > 0.2 ? '#FF5A48' : '#7A2A2A';
          ctx.beginPath();
          ctx.arc(v.x - dir * 41, v.y - 13, 1.8, 0, TAU);
          ctx.fill();
        } else {
          stamp(satelliteSprite, v.x, v.y);
          ctx.setTransform(scale, 0, 0, scale, 0, 0);
          const r = 5 + Math.sin(me.time * 6) * 1.5;
          ctx.drawImage(starGlow, v.x - r, v.y - r, r * 2, r * 2);
        }
      }
      // The moon's ring: a slow pulse when it is ready, then the time left
      if (moon && phase === 'play') {
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#FFE8AA';
        if (moon.flash > 0) {
          const f = moon.flash / 0.7, size = moon.r * (9 - 4 * f);
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = f;
          ctx.drawImage(starGlow, moon.x - size / 2, moon.y - size / 2, size, size);
          ctx.globalCompositeOperation = 'source-over';
        }
        if (me.moonTime > 0) {
          ctx.globalAlpha = 0.9;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(moon.x, moon.y, moon.r + 4, -Math.PI / 2, -Math.PI / 2 + TAU * me.moonTime / moon.total);
          ctx.stroke();
        } else if (!moon.rest) {
          const pulse = 0.5 + 0.5 * Math.sin(me.time * 3.2);
          ctx.globalAlpha = 0.25 + 0.45 * pulse;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(moon.x, moon.y, moon.r + 3 + pulse * 2.5, 0, TAU);
          ctx.stroke();
        }
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (me.alpha > 0) {
        o.setTransform(1, 0, 0, 1, 0, 0);
        o.clearRect(0, 0, off.width, off.height);
        const sx = 1 + me.squash * 0.75, sy = 1 - me.squash;
        o.setTransform(scale * me.face * sx, 0, 0, scale * sy, 90 * scale, 110 * scale);
        o.rotate(me.face * me.tilt);
        if (me.flip < 1) {
          const turn = smooth(me.flip) * TAU;
          o.translate(...A.turnAt);
          o.rotate(turn);
          o.translate(-A.turnAt[0], -A.turnAt[1]);
        }
        if (kind === 'fox') {
          // Nose first in a pounce
          if (me.dive > 0) {
            o.translate(0, -30);
            o.rotate(smooth(me.dive) * 1.05);
            o.translate(0, 30);
          }
          paintFox();
        } else {
          // Curling up: the bear shrinks into the ball, which grows out of it
          const curling = me.curl < 0.5 ? 1 - me.curl * 0.7 : 0.65 + (me.curl - 0.5) * 0.7;
          o.scale(curling, curling);
          // (The paws are drawn around their centers, so the bear stands that much higher for them to rest on the ground)
          if (me.curl < 0.5) { o.translate(0, -8.5); paintBear(); } else paintBall();
        }
        if (me.flash > 0) {
          o.setTransform(1, 0, 0, 1, 0, 0);
          o.globalCompositeOperation = 'source-atop';
          o.fillStyle = `rgba(255,110,90,${(me.flash / 0.22 * 0.75).toFixed(2)})`;
          o.fillRect(0, 0, off.width, off.height);
          o.globalCompositeOperation = 'source-over';
        }
        // Pale gold in moon gravity, blinking when it is about to end
        const moonlit = me.moonTime > 1.5 || (me.moonTime > 0 && Math.floor(me.moonTime * 8) % 2 === 0);
        if (moonlit) {
          o.setTransform(1, 0, 0, 1, 0, 0);
          o.globalCompositeOperation = 'source-atop';
          o.fillStyle = 'rgba(255,226,150,.34)';
          o.fillRect(0, 0, off.width, off.height);
          o.globalCompositeOperation = 'source-over';
        }
        // Cycling through the aurora's colors while invincible, blinking when it is about to end
        const charged = me.power > 1.5 || (me.power > 0 && Math.floor(me.power * 8) % 2 === 0);
        const chargedColor = POWER_COLORS[Math.floor(me.time * 13) % POWER_COLORS.length];
        if (charged) {
          o.setTransform(1, 0, 0, 1, 0, 0);
          o.globalCompositeOperation = 'source-atop';
          o.globalAlpha = 0.62;
          o.fillStyle = chargedColor;
          o.fillRect(0, 0, off.width, off.height);
          o.globalAlpha = 1;
          o.globalCompositeOperation = 'source-over';
        }
        ctx.globalAlpha = me.alpha * flicker * (0.7 + 0.3 * health);
        ctx.shadowColor = charged ? chargedColor : moonlit ? 'rgba(255,226,150,.95)' : A.shadow;
        ctx.shadowBlur = (charged ? 26 : 6 + 14 * health) * scale;
        ctx.drawImage(off, px - 90 * scale, py - 110 * scale);
        ctx.shadowBlur = 0;
        // Rolling energy, while it is in use or coming back
        if (me.energy < 1 && phase === 'play') {
          const bx = px - 17 * scale, by = py - (me.rolling ? A.low.h + 12 : A.top + 9) * scale;
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = '#E8EEFF';
          ctx.fillRect(bx, by, 34 * scale, 3 * scale);
          ctx.globalAlpha = 0.95;
          ctx.fillStyle = me.tired ? '#FF9A6B' : '#FFE8AA';
          ctx.fillRect(bx, by, 34 * me.energy * scale, 3 * scale);
        }
      }
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      const fade = outFade;
      for (const f of fallers) {
        const x = lerp(f.x0, f.x1, f.t), y = lerp(f.y0, f.y1, f.t), dx = f.x1 - f.x0, dy = f.y1 - f.y0, d = Math.hypot(dx, dy);
        const tx = x - dx / d * f.tail, ty = y - dy / d * f.tail, tail = ctx.createLinearGradient(x, y, tx, ty);
        tail.addColorStop(0, `rgba(${f.color.replaceAll(' ', ',')},.9)`);
        tail.addColorStop(1, `rgba(${f.color.replaceAll(' ', ',')},0)`);
        ctx.globalAlpha = fade * Math.min(1, f.t * 9);
        ctx.strokeStyle = tail;
        ctx.lineWidth = f.head * 0.9;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        const r = f.head * 3.4;
        ctx.drawImage(starGlow, x - r, y - r, r * 2, r * 2);
      }
      // The near hill and trees, in front of the bear and the stars
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = phase === 'in' ? smooth(clamp(phaseTime, 0, 1)) : phase === 'out' ? 1 - smooth(clamp(phaseTime / 0.9, 0, 1)) : 1;
      ctx.drawImage(foreLayer, 0, 0);
      // In front of them, so they are always in view: food, and the bees
      for (const b of berries) {
        if (!b.on) continue;
        ctx.globalAlpha = fade * smooth(b.grow);
        stamp(berrySprite, b.x, b.y);
      }
      for (const p of pots) {
        ctx.globalAlpha = fade * Math.min(1, p.age * 3) * (p.life - p.age < 3 && Math.floor(p.age * 6) % 2 ? 0.45 : 1);
        stamp(potSprite, p.x, p.y);
      }
      const wing = Math.floor(me.time * 34) % 2;
      for (const b of bees) {
        ctx.globalAlpha = fade * Math.min(1, b.age * 4);
        const look = BEES[b.kind === 'chase' && b.age < CHASE_SECONDS ? 1 : 0][wing];
        if (b.kind === 'down') {
          // Knocked out, upside down
          ctx.setTransform(scale * b.dir, 0, 0, -scale, b.x * scale, b.y * scale);
          ctx.drawImage(look.c, -look.w / 2, -look.h / 2, look.w, look.h);
        } else stamp(look, b.x, b.y, b.dir);
      }
      for (const s of powers) {
        const look = POWERS[Math.floor(me.time * 7) % POWERS.length], turn = s.age * 2.6 * Math.sign(s.vx), c = Math.cos(turn) * scale, n = Math.sin(turn) * scale;
        ctx.globalAlpha = fade * (POWER_LIFE - s.age < 3 && Math.floor(s.age * 7) % 2 ? 0.4 : 1);
        ctx.setTransform(c, n, -n, c, s.x * scale, s.y * scale);
        ctx.drawImage(look.c, -look.w / 2, -look.h / 2, look.w, look.h);
      }
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.font = `600 13px ${uiFont}`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#060D26';
      ctx.shadowBlur = 5 * scale;
      for (const p of pops) {
        const half = ctx.measureText(p.text).width / 2 + 6;
        ctx.globalAlpha = fade * clamp((p.life - p.age) * 1.8, 0, 1);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, clamp(p.x, half, W - half), Math.max(46, p.y - p.age * 22));
      }
      // The combo, above the animal: how many in a row, the multiplier, and how long is left to keep it going
      if (combo >= 2 && phase === 'play') {
        const m = tier(), x = clamp(me.x, 46, W - 46), y = Math.max(14, me.y - A.top - 24);
        ctx.font = `12px "AURORA Arcade", ${uiFont}`;
        ctx.globalAlpha = 1;
        ctx.fillStyle = COMBO_COLORS[m];
        ctx.fillText(`${combo} COMBO${m > 1 ? ` ×${m}` : ''}`, x, y);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(x - 17, y + 4, 34 * comboLeft / COMBO_SECONDS, 2.4);
      }
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'lighter';
      for (const ring of rings) {
        const f = ring.age / ring.life;
        ctx.globalAlpha = (1 - f) * 0.9;
        ctx.strokeStyle = '#FFD9A0';
        ctx.lineWidth = 3 * (1 - f) + 0.5;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.r * (0.3 + 0.7 * f), 0, TAU);
        ctx.stroke();
      }
      for (const p of sparks) {
        ctx.globalAlpha = 1 - p.age / p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TAU);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      // The stars on their way down from the sky, or back
      if (phase !== 'play') {
        const t = smooth(clamp(phaseTime / 1, 0, 1)), there = phase === 'in' ? t : 1 - t;
        ctx.globalAlpha = 1;
        skyStars.forEach((star, i) => {
          const [bx, by] = star.to, x = lerp(star.x, me.x + bx * me.face, there), y = lerp(star.y, me.y + by, there) - Math.sin(there * Math.PI) * (20 + i * 5), r = 7;
          ctx.drawImage(starGlow, x - r, y - r, r * 2, r * 2);
        });
      }
    };

    // Starting and stopping
    skyStars.forEach((s) => { s.el.style.visibility = 'hidden'; });
    banner.classList.add('bn-bear-on');
    banner.classList.toggle('bn-as-fox', kind === 'fox');
    banner.classList.remove('bn-animal-on');
    const labels = banner.querySelector('.bn-labels');
    const hint = labels.appendChild(Object.assign(document.createElement('span'), { className: 'bn-bear-hint', textContent: kind === 'fox'
      ? (touchOnly ? 'Tap to jump, again to double jump · Swipe down to pounce or slide' : '← → run · ↑ or Space jump, twice for a double jump · ↓ pounces in the air, slides on the ground · Esc quits')
      : (touchOnly ? 'Tap to jump, again to double jump · Swipe down to roll' : '← → run · ↑ or Space jump, twice for a double jump · ↓ roll · Esc quits') }));
    const quit = labels.appendChild(Object.assign(document.createElement('span'), { className: 'bn-bear-quit', textContent: 'Quit' }));
    const score = labels.appendChild(Object.assign(document.createElement('span'), { className: 'bn-bear-score', textContent: 'Catch stars, eat berries and honey, dodge the bees' }));
    const soundSwitch = labels.appendChild(Object.assign(document.createElement('span'), { className: 'bn-bear-sound' }));
    const showSound = () => { soundSwitch.textContent = `Sound: ${soundIsOn ? 'on' : 'off'}`; };
    showSound();
    wakeAudio();
    soundSwitch.addEventListener('click', (e) => {
      e.stopPropagation();
      soundIsOn = !soundIsOn;
      try { localStorage.setItem(SOUND_KEY, soundIsOn ? '1' : '0'); } catch (x) { /* blocked */ }
      wakeAudio();
      showSound();
      sfx.catch(1);
    });
    if (peak) {
      const card = labels.appendChild(Object.assign(document.createElement('div'), { className: 'bn-wave bn-bear-wave' }));
      card.style.setProperty('--c', '255 214 150');
      card.append(Object.assign(document.createElement('b'), { textContent: 'Peak tonight' }), Object.assign(document.createElement('span'), { textContent: `The ${peak}` }), Object.assign(document.createElement('b'), { textContent: 'Double points for stars' }));
      card.animate([{ opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: 3200, delay: 900 }).onfinish = () => card.remove();
    }
    // After the controls, what a run can bring
    let hintTimer = setTimeout(() => {
      if (kind !== 'bear' || foxKnown) { hint.style.opacity = 0; return; }
      hint.textContent = `Catch ${UNLOCK_STARS} stars in one run to unlock a new animal`;
      hintTimer = setTimeout(() => { hint.style.opacity = 0; }, 7000);
    }, 8000);
    const typing = () => document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.querySelector('dialog[open]');
    const MAP = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowDown: 'down', s: 'down', S: 'down', ArrowUp: 'jump', w: 'jump', W: 'jump', ' ': 'jump' };
    const onKeyDown = (e) => {
      if (typing() || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') { e.preventDefault(); leave(); return; }
      const k = MAP[e.key];
      if (!k) return;
      e.preventDefault();
      if (k === 'jump' && !e.repeat) me.buffer = BUFFER;
      keys[k] = true;
    };
    const onKeyUp = (e) => { const k = MAP[e.key]; if (k) keys[k] = false; };
    const letGo = () => { keys.left = keys.right = keys.down = keys.jump = false; };
    // On a touch screen the bear runs by itself and turns at each end: a tap jumps, after a short wait to tell it from a swipe
    let touch = null;
    const onDown = (e) => {
      if (e.pointerType !== 'touch') return;
      touch = { y: e.clientY, timer: setTimeout(() => { if (touch) { touch.timer = 0; me.buffer = BUFFER; keys.jump = true; } }, 70) };
    };
    const onMove = (e) => {
      if (!touch || !touch.timer || e.clientY - touch.y < 14) return;
      clearTimeout(touch.timer);
      touch.timer = 0;
      swipeRoll = true;
    };
    const onUp = () => {
      if (touch && touch.timer) { clearTimeout(touch.timer); me.buffer = BUFFER; }
      touch = null;
      keys.jump = false;
      swipeRoll = false;
    };
    const stopClick = (e) => { e.stopPropagation(); leave(); };
    quit.addEventListener('click', stopClick);
    // (A switch or link inside the banner mustn't start anything)
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', letGo);
    banner.addEventListener('pointerdown', onDown);
    banner.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    const cleanup = () => {
      if (!running) return;
      running = false;
      current = null;
      clearTimeout(hintTimer);
      if (touch && touch.timer) clearTimeout(touch.timer);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', letGo);
      banner.removeEventListener('pointerdown', onDown);
      banner.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (points > best) { try { localStorage.setItem(A.bestKey, String(points)); } catch (e) { /* blocked */ } }
      [layer, levelLayer, quit, soundSwitch, ...(result ? [] : [hint, score])].forEach((el) => el.remove());
      skyStars.forEach((s) => { s.el.style.visibility = ''; });
      banner.classList.remove('bn-bear-on', 'bn-as-fox');
      if (!result) { if (onEnd) onEnd(); return; }
      // A run worth remembering gets credits, as in the shooting star game, while the aurora surges
      if (caught >= 3 || points >= 300) {
        score.style.visibility = 'hidden';
        hint.style.visibility = 'hidden';
        rollCredits(afterwards);
      } else afterwards();
    };
    const rollCredits = (done) => {
      const h = banner.getBoundingClientRect().height, time = Math.round(playTime);
      const rows = [...(newBest ? ['New best!', ''] : []), kind === 'fox' ? 'The Little Fox' : 'The Great Bear', '', `${caught} ${caught === 1 ? 'star' : 'stars'} caught`,
        ...(bestCombo >= 3 ? [`Longest combo ${bestCombo}`] : []), ...(counts.berries ? [`Berries ${counts.berries}`] : []), ...(counts.honey ? [`Honey pots ${counts.honey}`] : []),
        ...(counts.bees ? [`Bees bonked ${counts.bees}`] : []), ...(counts.satellites ? [`Satellites ${counts.satellites}`] : []), ...(counts.miles ? [`Air miles ${number(counts.miles)}`] : counts.rides ? [`Plane rides ${counts.rides}`] : []),
        ...(counts.moons ? [`Moon gravity ${counts.moons}`] : []), ...(counts.fires ? [`Fox fires ${counts.fires}`] : []),
        `Time ${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`, '', 'Final score', number(points), '', 'Thanks for playing'];
      const heads = new Set(['New best!', 'The Little Fox', 'The Great Bear', 'Final score']);
      const credits = labels.appendChild(Object.assign(document.createElement('div'), { className: 'bn-credits bn-bear-credits' }));
      credits.replaceChildren(...rows.map((text) => (text ? Object.assign(document.createElement(heads.has(text) ? 'b' : 'span'), { textContent: text }) : document.createElement('i'))));
      const tall = credits.offsetHeight;
      const rise = credits.animate([{ opacity: 1, transform: `translate(-50%, ${h.toFixed(1)}px)` }, { opacity: 1, transform: `translate(-50%, ${(-tall).toFixed(1)}px)` }], { duration: (h + tall) / (h * 0.4) * 1000, easing: 'linear' });
      const skipHint = labels.appendChild(Object.assign(document.createElement('span'), { className: 'bn-skip', textContent: touchOnly ? 'Tap to skip' : 'Click to skip' }));
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        rise.cancel();
        credits.remove();
        skipHint.remove();
        banner.removeEventListener('click', skip, true);
        done();
      };
      // A click during the credits only skips them
      const skip = (e) => { e.stopPropagation(); e.preventDefault(); finish(); };
      banner.addEventListener('click', skip, true);
      rise.onfinish = finish;
      if (options.surge) options.surge();
    };
    const afterwards = () => {
      score.style.visibility = '';
      hint.style.visibility = '';
      if (soundIsOn && audio) setTimeout(() => { if (!current && audio) audio.suspend(); }, 2500);
      {
        linger([hint, score]);
        // For people with the review link, the shared high scores: a top ten score opens them, and the line links to them
        if (window.auroraArcade) {
          window.auroraArcade.gameEnded(points, { game: 'bear', animal: kind }).then((shared) => {
            if (!shared || !score.isConnected) return;
            score.append(' · ', Object.assign(document.createElement('span'), { textContent: 'High scores' }));
            score.classList.add('link');
            score.addEventListener('click', (e) => { e.stopPropagation(); window.auroraArcade.show('bear'); });
          });
        }
      }
      if (onEnd) onEnd();
    };
    const leave = () => {
      if (phase === 'out') return;
      phase = 'out';
      phaseTime = 0;
      letGo();
      // The result stays for a moment after the bear has gone back to the sky
      if (!points) return;
      result = true;
      newBest = best > 0 && points > best;
      if (newBest) sfx.best(); else sfx.over();
      score.textContent = `${number(points)} points · ${caught} ${caught === 1 ? 'star' : 'stars'}${points > best && best ? ' · New best!' : best ? ` · Best ${number(Math.max(best, points))}` : ''}`;
      clearTimeout(hintTimer);
      const touchWord = touchOnly ? 'Tap' : 'Click';
      hint.textContent = unlockedNow ? `You unlocked the fox! ${touchWord} its stars, at the upper left, to play as the fox` : kind === 'fox' ? `${touchWord} the fox's stars to play again` : `${touchWord} the Big Dipper to play again`;
      hint.style.opacity = 1;
    };
    const frame = (now) => {
      if (!running) return;
      const b = banner.getBoundingClientRect();
      if (document.hidden || b.bottom < 0 || Math.abs(b.width - box.width) > 0.5) { cleanup(); return; }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      acc += dt;
      phaseTime += dt;
      if (phase === 'in') {
        me.alpha = smooth(clamp((phaseTime - 0.6) / 0.4, 0, 1));
        if (phaseTime >= 1) { phase = 'play'; burst(me.x, me.y - 30, 18, 130, 0.6); }
      } else if (phase === 'out') {
        me.alpha = 1 - smooth(clamp(phaseTime / 0.4, 0, 1));
        if (phaseTime >= 1) { cleanup(); return; }
      }
      while (acc >= STEP) { update(STEP); acc -= STEP; }
      draw();
      requestAnimationFrame(frame);
    };
    current = { leave };
    requestAnimationFrame(frame);
  };
  window.auroraBear = { start, showAnimals, animalAt, stop: () => current && current.leave() };
})();

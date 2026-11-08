// The cabin game, the banner's fourth: a click on the cabin stokes its fire and starts a winter. Winter's army, figures of
// snow and ice with eyes glowing ice blue, marches out of the forest along the ridge to put out the cabin's fire. Lanterns,
// fire pits and woodpiles built on rings along the ridge melt and slow it, a woodshed brings more wood, and a click on the
// cabin stokes the fire again, sending out a ring of warmth. In March, Old Man Winter comes himself. Keep the fire going till
// spring. index.html loads this the first time someone starts it.
//
// The spec is Clinicians/Dashboard/Cabin game spec 2026-11-06.md, in the project folder. This is all four of its steps: the
// ridge and lanterns; the winter (the other buildings, the rest of the army, the cards and the endings); credits, high
// scores, sound and music; and star lanterns, then balance, with bots at three widths.
(() => {
  const TAU = Math.PI * 2;
  // The scene is drawn 1600 by 240 (design/landing/banner_gen.py), anchored to the banner's bottom edge and its middle, so a
  // wide banner crops sky and a narrow one the sides. NEAR is the near ridge, where the trees stand and the cabin sits. The
  // cabin's base is at CABIN, drawn at CABIN.k times its own units, in which its left wall is at WALL, its gable end at GABLE,
  // its chimney's top at CHIMNEY, its window is WINDOW, and ROOF runs along the roof's edges, from the eave over the ridge to
  // the gable's foot.
  const NEAR = { base: 219, terms: [[7, 190, 2.6], [4, 74, 0.8], [2.2, 31, 1.9], [1, 13, 2.2]] };
  const ridgeAt = (x) => NEAR.base + NEAR.terms.reduce((sum, [a, f, p]) => sum + a * Math.sin(x / f + p), 0);
  const CABIN = { x: 1150, y: 225.1, k: 1.2 };
  const WALL = -12, GABLE = 14, CHIMNEY = [-8.6, -19.3], WINDOW = [[-7.5, -2.45], [-7.5, -6.35], [-1.5, -6.6], [-1.5, -2.3]];
  const ROOF = [[-12.8, -7.8], [-8, -14.4], [9, -15.3], [14.7, -8.9]];
  // Gameplay distances are in banner heights, so it plays the same at any width (the shooting star game turned out far
  // easier on a phone, aurora-mdy). What stands on the ridge is drawn in the scene's units, so it matches the trees and the
  // cabin. The army comes out of the trees PATH banner heights left of the cabin, or in at the left edge where the banner is
  // narrower, below about 700 px; from January it also comes round the cabin, out of the trees RIGHT_PATH banner heights
  // right of it, where a banner leaves RIGHT_ROOM banner heights there, about 750 px wide and up.
  const PATH = 4, RIGHT_PATH = 1.2, RIGHT_ROOM = 0.75;
  // Rings to build on: up to RINGS of them on the left, the first FIRST_RING banner heights left of the cabin and then every
  // RING_GAP, as many as fit at least EDGE from the banner's edge; from January, up to RIGHT_RINGS on the right, the first
  // RIGHT_FIRST out and then every RIGHT_GAP, closer together so that both fit from about 750 px (at 768 px, with the left
  // side's spacing, the second missed by 3 px, and one lantern alone there let packs of runners through); and from December,
  // the woodshed's place, SHED left of the cabin.
  const RINGS = 7, FIRST_RING = 0.6, RING_GAP = 0.55, EDGE = 0.2, RIGHT_RINGS = 2, RIGHT_FIRST = 0.5, RIGHT_GAP = 0.5, SHED = 0.3;
  // Wood: START_WOOD to begin with, a cord between months (CORD), and NEXT_WOOD for each second of a breather skipped, as
  // tower defense games reward calling a wave early. Each of the army melted is worth a little too (HOST, below).
  const START_WOOD = 100, CORD = 60, NEXT_WOOD = 5;
  // What can be built, and from which month (from, 0 for November):
  // - A lantern shines on the one of the army nearest the cabin within its reach, melting it a little at a time. By level:
  //   what it costs to build or upgrade, its reach from the lamp (banner heights) and how fast it melts (HOST's health).
  // - A fire pit melts all of the army on the ground within its reach at once, more slowly, so it's for ranks and brutes;
  //   upgraded, it's a bonfire. Its reach is from the fire.
  // - A woodpile is a low wall of split wood that the army clambers over at slow of its speed, and goes on at it for after
  //   seconds more, winded, so it stays longer in a lantern's light. Set alight (alight more wood), it melts whatever climbs it at melt a second for burn seconds, then
  //   burns down to embers and its ring is free again. It's half banner heights to either side, and tall units high.
  // - A woodshed, one only, in its own place beside the cabin, brings wood more at the start of every month after.
  // Taking anything down gives back half the wood spent on it.
  const BUILD = {
    lantern: { name: 'Lantern', from: 0, levels: [{ cost: 40, reach: 0.5, melt: 0.7 }, { cost: 60, reach: 0.58, melt: 1.15 }, { cost: 90, reach: 0.66, melt: 1.8 }] },
    firepit: { name: 'Fire pit', from: 1, levels: [{ cost: 70, reach: 0.33, melt: 0.7 }, { cost: 100, reach: 0.4, melt: 1.1 }] },
    woodpile: { name: 'Woodpile', from: 2, levels: [{ cost: 25 }], alight: 40, burn: 20, slow: 0.5, after: 2, melt: 1.6, half: 0.07, tall: 8 },
    woodshed: { name: 'Woodshed', from: 1, levels: [{ cost: 60 }], wood: 40 },
  };
  // Winter's army: figures of packed snow and ice, eyes glowing ice blue, marching out of the forest along the ridge to put
  // out the cabin's fire, which is the one thing that holds them back. health: how much melting they take; tall: their
  // height in the scene's units, the cabin being about 26; speed: banner heights a second in November; stride: how far one
  // goes in a full step of both legs, in its heights; points and wood: what melting one is worth, the wood growing with the
  // health, as a tower defense pays for each enemy (at about half this, the defense couldn't grow to meet March; at about
  // this and a half, every bot won); lives: what one costs reaching the cabin. A brute, half melted, cracks apart into two
  // soldiers, and is worth its points then. Runners come in packs of RUNNERS, quick and frail. Old Man Winter, the army's
  // king, walks behind it in March; reaching the cabin, he puts the fire out.
  const HOST = {
    soldier: { health: 2.5, tall: 16, speed: 0.11, stride: 1.1, points: 20, wood: 2, lives: 1 },
    brute: { health: 10, tall: 25, speed: 0.08, stride: 0.95, points: 50, wood: 3, lives: 2 },
    runner: { health: 1.2, tall: 12, speed: 0.2, stride: 1.7, points: 20, wood: 1, lives: 1 },
    king: { health: 110, tall: 44, speed: 0.055, stride: 0.75, points: 2000, wood: 0, lives: 5 },
  };
  const RUNNERS = [3, 4];
  // Frost wraiths, from February: shapes of mist and ice that fly in over the trees for the chimney, between FLY low and high
  // banner heights above the ridge, weaving WEAVE to either side of their line, which narrows as they near it. Only lanterns
  // reach them up there, and the fire's sparks: a stoke sends sparks at up to SPARKS of them within SPARK_REACH banner heights
  // of the chimney, each taking SPARK_HIT.
  const WRAITH = { health: 2, size: 5, speed: 0.16, points: 50, wood: 3, lives: 1 };
  const FLY = [0.42, 0.62], WEAVE = 0.07, SPARKS = 3, SPARK_REACH = 1.6, SPARK_HIT = 3;
  // Old Man Winter comes KING_AT seconds into March. One of his army melted within RAISE banner heights of him rises again
  // from its snow RAISE_AFTER seconds later, at most one every RAISE_EVERY seconds, so his army is best broken where he
  // isn't. Lanterns turn on him whenever he's in their light, since otherwise they shine on the army marching ahead of him
  // and he walks through untouched (in bot tests he reached the cabin in every run). A stoke takes KING_STOKE of his health.
  // Melting him brings the thaw at once.
  const KING_AT = 10, RAISE = 0.6, RAISE_AFTER = 1.2, RAISE_EVERY = 2.5, KING_STOKE = 0.06;
  // A run is one winter, in five months, each opened by a card. seconds: how long the army keeps coming; every: seconds
  // between ranks, at its start and its end; brutes: the share of ranks' figures that are brutes; runners: the share of ranks
  // that are packs of runners; right: the share that come round the cabin from the right, where there's room; wraiths:
  // seconds between frost wraiths, at its start and its end; pace: how much faster the army moves than in November; ranks:
  // the share that come two or three together, one behind another; snow: how thickly snow falls, as weather; news: what's
  // new, under the score as it begins; fact: a line after it.
  const MONTHS = [
    { name: 'November', says: 'First snow', seconds: 35, every: [5, 3.5], brutes: 0, runners: 0, right: 0, wraiths: null, pace: 1, ranks: 0.1, snow: 0.3, news: '', fact: '' },
    { name: 'December', says: 'The longest night', seconds: 40, every: [2.6, 1.8], brutes: 0.15, runners: 0, right: 0, wraiths: null, pace: 1.06, ranks: 0.2, snow: 0.45, news: 'Brutes are coming. Fire pits melt everything near them, and a woodshed beside the cabin brings more wood', fact: 'The winter solstice, around December 21, is the longest night of the year' },
    { name: 'January', says: 'Deep cold', seconds: 40, every: [1.65, 1.15], brutes: 0.3, runners: 0.25, right: 0.25, wraiths: null, pace: 1.12, ranks: 0.25, snow: 0.6, news: 'They come from both sides now, with runners. Woodpiles slow them, and burn', fact: '−40°, where Fahrenheit and Celsius agree' },
    { name: 'February', says: 'The coldest night', seconds: 40, every: [1.2, 0.82], brutes: 0.4, runners: 0.2, right: 0.3, wraiths: [5, 3.5], pace: 1.18, ranks: 0.3, snow: 0.8, news: 'Frost wraiths fly for the chimney. Stoking the fire sends sparks at them', fact: '−81 °F at Snag, Yukon, on February 3, 1947, the coldest on record in Canada' },
    { name: 'March', says: 'The last storm', seconds: 30, every: [1.05, 0.72], brutes: 0.45, runners: 0.2, right: 0.35, wraiths: [4.5, 3], pace: 1.24, ranks: 0.35, snow: 1, news: 'Old Man Winter is coming. Melt him and the winter breaks', fact: 'Hold on till spring' },
  ];
  // Five lives, as in the other games. Each new month gives one back and is worth MONTH_POINTS for each month kept so far;
  // the thaw is worth THAW_POINTS for each life left, and a point for each piece of wood.
  const LIVES = 5, MONTH_POINTS = 500, THAW_POINTS = 2000;
  // Stoking the fire sends a ring of warmth STOKE_REACH banner heights out from the cabin over STOKE_SPREAD seconds, which
  // melts soldiers and runners outright and takes half from brutes. Then the fire needs STOKE_EVERY seconds to build back.
  // One of the army reaching the cabin makes the fire flare too, with a ring FLARE_REACH out, so a defense that gives way
  // loses its lives one at a time rather than all at once (in bot tests, a run that let snow through in March lost all five
  // within seconds).
  const STOKE_EVERY = 10, STOKE_REACH = 1, STOKE_SPREAD = 0.45, FLARE_REACH = 0.5;
  // A player who hasn't found the stoke gets a reminder when it would help: with the fire ready, no stoke for NUDGE_IDLE
  // seconds, and one of the army within NUDGE_NEAR banner heights of the cabin (or a wraith of the chimney), or a life just
  // lost, a label over the cabin says what a click or tap there does, for NUDGE_SHOW seconds, while the glow around it
  // brightens. At most one every NUDGE_EVERY seconds, and none once the fire has been stoked NUDGE_STOKES times, since by
  // then it's known. Otherwise the only telling is the line under the score as November begins, easy to miss while the first
  // soldiers march in, and a screen without a pointer never gets the label that pointing at the cabin brings (in bot tests,
  // never stoking kept the fire one winter in ten).
  const NUDGE_IDLE = 25, NUDGE_NEAR = 0.8, NUDGE_SHOW = 4, NUDGE_EVERY = 20, NUDGE_STOKES = 3;
  // Star lanterns: now and then, every STAR_EVERY seconds or so while the army marches, the first FIRST_STAR seconds into the
  // winter, a star falls toward the clearing over about STAR_FALL seconds. A click or tap catches it, anywhere within
  // STAR_HIT banner heights, and it flies to the nearest lantern without a star, or with a cooler one, which takes its light
  // and color and melts heat times as fast: the bluer the star, the hotter, as real stars are (blue the hottest and red the
  // coolest, the reverse of the colors people expect for hot and cold). With no lantern to take it, it's worth its points.
  // The colors, from the commonest and coolest to the rarest and hottest, and how often each comes (share, out of 100), are
  // the moon game's real star colors, worth 10 to 150 points, as in the other games.
  const STAR_EVERY = [20, 30], FIRST_STAR = 12, STAR_FALL = 3.2, STAR_HIT = 0.1;
  const STARS = [
    { color: '255,164,124', points: 10, share: 30, heat: 1.1 },
    { color: '255,202,150', points: 20, share: 25, heat: 1.2 },
    { color: '255,236,184', points: 30, share: 20, heat: 1.3 },
    { color: '242,245,255', points: 50, share: 13, heat: 1.45 },
    { color: '190,210,255', points: 80, share: 8, heat: 1.65 },
    { color: '150,180,255', points: 150, share: 4, heat: 2 },
  ];
  const pickStar = () => {
    let roll = Math.random() * 100;
    for (let i = 0; i < STARS.length; i++) { roll -= STARS[i].share; if (roll < 0) return i; }
    return 0;
  };
  // A run with nothing built in its first IDLE seconds ends without a score, so a click meant only to stoke the fire costs
  // nothing. The army waits for the first lantern. A breather of BREATHER seconds comes between months. The rings fade in
  // over OPENING, and everything fades over FADE as a run ends. The thaw holds SPRING_HOLD seconds before it does, and after
  // the fire goes out it stays out OUT_DARK seconds, then relights with a stoke, as in the shooting star game.
  const IDLE = 10, BREATHER = 12, OPENING = 0.8, FADE = 1.2, SPRING_HOLD = 3, OUT_DARK = 2.5;
  const BEST_KEY = 'aurora-cabin-best';
  // Colors: firelight for what's warm, ice for what's cold, and the messages
  const GOLD = 'rgb(255,226,160)', WARM = 'rgb(255,198,162)', ICE = 'rgb(206,226,255)';

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t);
  const number = (n) => n.toLocaleString('en-US');
  const canvas = (w, h) => Object.assign(document.createElement('canvas'), { width: Math.max(1, Math.ceil(w)), height: Math.max(1, Math.ceil(h)) });

  // Sound, off unless turned on, with the same setting as the other games: tones made here, nothing to load. Every gain starts
  // silent, since a sound can start a fraction of a sample before its gain is turned down, which clicks.
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
  // A note, sliding from one pitch to another if asked, rising over attack seconds and dying away, through a low-pass filter
  // at cutoff if given
  const tone = (freq, ms, { to = freq, type = 'triangle', level = 0.1, delay = 0, attack = 0.008, cutoff = 0 } = {}) => {
    if (!soundIsOn || !audio) return;
    const start = audio.currentTime + delay / 1000, end = start + ms / 1000, osc = audio.createOscillator(), gain = audio.createGain();
    gain.gain.value = 0;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (to !== freq) osc.frequency.exponentialRampToValueAtTime(to, end);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(level, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    let head = osc;
    if (cutoff) { const low = audio.createBiquadFilter(); low.type = 'lowpass'; low.frequency.value = cutoff; osc.connect(low); head = low; }
    head.connect(gain).connect(audioOut);
    osc.start(start);
    osc.stop(end + 0.02);
  };
  const noiseBuffer = () => {
    if (!noiseData) {
      noiseData = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
      const samples = noiseData.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    }
    return noiseData;
  };
  // Noise through a low-pass filter sweeping from one frequency to another: a rush, a hiss, a crack
  const noise = (ms, level, from = 420, to = 70, delay = 0) => {
    if (!soundIsOn || !audio) return;
    const start = audio.currentTime + delay / 1000, end = start + ms / 1000, source = audio.createBufferSource(), low = audio.createBiquadFilter(), gain = audio.createGain();
    gain.gain.value = 0;
    source.buffer = noiseBuffer();
    low.type = 'lowpass';
    low.frequency.setValueAtTime(from, start);
    low.frequency.exponentialRampToValueAtTime(to, end);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(level, start + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    source.connect(low).connect(gain).connect(audioOut);
    source.start(start, Math.random() * 0.5);
    source.stop(end + 0.02);
  };
  // The game's sounds. A horn, low and distant, as each month's army sets out, deeper for Old Man Winter; a chime for a lantern
  // lit, rising for an upgrade; a fire catching; knocks for the woodshed; a whoosh as a woodpile goes up; a hiss as one of the
  // army melts; a crack of ice as a brute breaks; a wraith thinning to nothing; ice crackling on the window as a life goes; a
  // stoke, as the bear game's; sparks flying up; a month kept; the king coming and his fall; a new best; the fire going out.
  const sfx = {
    horn: (deep = 0) => [[41 - deep, 0], [48 - deep, 60]].forEach(([n, delay]) => tone(midiHz(n), 1500 + deep * 120, { type: 'sawtooth', level: 0.045, attack: 0.35, cutoff: 520, delay })),
    build: () => { tone(midiHz(84), 220, { type: 'sine', level: 0.07 }); tone(midiHz(96), 160, { type: 'sine', level: 0.025, delay: 30 }); },
    upgrade: () => [84, 88, 91].forEach((n, i) => tone(midiHz(n), 180, { type: 'sine', level: 0.06, delay: i * 70 })),
    fire: () => { noise(380, 0.09, 2400, 300); tone(90, 260, { to: 55, type: 'sine', level: 0.08 }); },
    shed: () => [0, 140].forEach((delay) => tone(150, 90, { to: 95, type: 'square', level: 0.04, cutoff: 900, delay })),
    alight: () => { noise(700, 0.1, 600, 2600); noise(300, 0.05, 3000, 1200, 350); },
    melt: () => noise(150, 0.035, 3200, 900),
    crack: () => { noise(110, 0.13, 4200, 1300); tone(120, 160, { to: 70, type: 'triangle', level: 0.06 }); },
    wraith: () => tone(midiHz(91), 320, { to: midiHz(79), type: 'sine', level: 0.04 }),
    chill: () => { [0, 60, 130].forEach((delay) => noise(50, 0.06, 6000, 2500, delay)); tone(70, 300, { to: 45, type: 'sine', level: 0.1 }); },
    stoke: () => { noise(520, 0.12, 900, 140); [0, 5, 9].forEach((n, i) => tone(midiHz(n + 48), 170, { type: 'triangle', level: 0.05, delay: 60 + i * 80 })); },
    sparks: () => [0, 1, 2].forEach((i) => tone(midiHz(88 + i * 4), 90, { to: midiHz(100 + i * 4), type: 'sine', level: 0.03, delay: i * 60 })),
    kept: () => [0, 4, 7].forEach((n, i) => tone(midiHz(72 + n), 260, { type: 'triangle', level: 0.06, delay: i * 90 })),
    king: () => { sfx.horn(5); [0, 3, 7].forEach((n) => tone(midiHz(57 + n), 2200, { type: 'sine', level: 0.025, attack: 0.6, delay: 600 })); },
    kingFalls: () => { noise(900, 0.2, 3000, 200); [0, 4, 7, 12, 16].forEach((n, i) => tone(midiHz(72 + n), 420, { type: 'triangle', level: 0.07, delay: 200 + i * 90 })); },
    best: () => [0, 4, 7, 12, 16].forEach((n, i) => tone(midiHz(72 + n), 260, { level: 0.1, delay: i * 110 })),
    out: () => [12, 7, 3, 0].forEach((n, i) => tone(midiHz(60 + n), 300, { type: 'sine', level: 0.08, delay: i * 180 })),
    // A star caught, higher for a bluer one, and its light reaching its lantern
    star: (which) => [0, 4, 7].forEach((n, i) => tone(midiHz(79 + which * 2 + n), 220, { type: 'sine', level: 0.05, delay: i * 60 })),
    starlit: () => { tone(midiHz(96), 500, { to: midiHz(98), type: 'sine', level: 0.04 }); tone(midiHz(84), 300, { type: 'sine', level: 0.03, delay: 40 }); },
  };

  // Music, with sound on: Vivaldi's Four Seasons (1725, long in the public domain), made here like the other sounds. Each piece
  // is a loop of notes by voice, [voice, MIDI note, start, length] in beats, at its tempo. It follows the winter, from quiet to
  // storm and out (MONTH_MUSIC, below); the Largo plays between months, by the fire, and the opening of Spring after the thaw
  // and over the credits. MUSIC_LEVEL keeps it under the effects, which the compressor on the output brings up along with it.
  const MUSIC_LEVEL = 0.6;
  let music = null;
  // A trill alternates the note with the one above it, TRILL_RATE times a second
  const TRILL_RATE = 14;
  // held: for muted strings, the note stays at its level and then releases over this many seconds past its end, overlapping
  // the next, on two oscillators a little apart in pitch, since one alone sounds static over several seconds
  const musicNote = (freq, at, dur, { type, level, cutoff = 0, attack = 0.012, pluck = false, trill = 0, held = 0 }) => {
    const osc = audio.createOscillator(), gain = audio.createGain(), end = at + dur;
    gain.gain.value = 0;
    osc.type = type;
    osc.frequency.value = freq;
    if (trill) {
      const up = freq * 2 ** (trill / 12);
      for (let t = at, i = 0; t < end; t += 1 / TRILL_RATE, i += 1) osc.frequency.setValueAtTime(i % 2 ? freq : up, t);
    }
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level, at + attack);
    if (held) gain.gain.setValueAtTime(level, Math.max(at + attack, end));
    else if (!pluck) gain.gain.exponentialRampToValueAtTime(level * 0.6, at + Math.max(attack + 0.01, dur * 0.75));
    gain.gain.exponentialRampToValueAtTime(0.0001, end + held);
    const oscs = [osc];
    if (held) {
      const twin = audio.createOscillator();
      twin.type = type;
      twin.frequency.value = freq;
      twin.detune.value = 6;
      osc.detune.value = -6;
      oscs.push(twin);
    }
    let head = osc;
    if (cutoff) { const low = audio.createBiquadFilter(); low.type = 'lowpass'; low.frequency.value = cutoff; oscs.forEach((o) => o.connect(low)); head = low; }
    head.connect(gain).connect(music.out);
    oscs.forEach((o) => { o.start(at); o.stop(end + held + 0.02); });
  };
  // The voices: strings as a saw softened by a low-pass filter, darker lower down; plucked strings for the Largo's pizzicato,
  // a quick-fading triangle; and a harpsichord's chords, a short square
  const VOICES = {
    solo: (f, at, dur, v, trill) => musicNote(f, at, dur * 0.95, { type: 'sawtooth', level: 0.036 * v, cutoff: 3200, attack: 0.02, trill }),
    // The Largo's solo, singing: a slower bow and a darker tone
    cantabile: (f, at, dur, v, trill) => musicNote(f, at, dur * 0.97, { type: 'sawtooth', level: 0.04 * v, cutoff: 2300, attack: 0.07, trill }),
    violin: (f, at, dur, v) => musicNote(f, at, dur * 0.92, { type: 'sawtooth', level: 0.024 * v, cutoff: 2600, attack: 0.015 }),
    viola: (f, at, dur, v) => musicNote(f, at, dur * 0.92, { type: 'sawtooth', level: 0.022 * v, cutoff: 1800, attack: 0.02 }),
    bass: (f, at, dur, v) => musicNote(f, at, dur * 0.9, { type: 'sawtooth', level: 0.048 * v, cutoff: 700, attack: 0.015 }),
    // Autumn's Adagio, muted: dark, swelling in slowly and holding
    sordino: (f, at, dur, v) => musicNote(f, at, dur, { type: 'sawtooth', level: 0.008 * v, cutoff: 1000, attack: 0.5, held: 0.7 }),
    // December's quiet repeated notes: a softer start to each and a darker tone than the violins'
    hushed: (f, at, dur, v) => musicNote(f, at, dur * 0.92, { type: 'sawtooth', level: 0.024 * v, cutoff: 1500, attack: 0.04 }),
    pizz: (f, at, dur, v) => musicNote(f, at, Math.min(0.4, Math.max(0.18, dur)), { type: 'triangle', level: 0.05 * v, attack: 0.004, pluck: true }),
    harpsichord: (f, at, dur, v) => musicNote(f, at, 0.28, { type: 'square', level: 0.011 * v, cutoff: 3000, attack: 0.004, pluck: true }),
  };
  // Spring's opening, as the bear game's grand finale plays it: its tune, then the same again softer as an echo, over a bass
  // driving in eighths and a harpsichord's chords, at 100 beats a minute
  const SPRING = (() => {
    const phrase = [[76, 2], [80, 2], [80, 2], [80, 2], [78, 1], [76, 1], [83, 6], [83, 1], [81, 1], [80, 2], [80, 2], [80, 2], [78, 1], [76, 1], [83, 6], [83, 1], [81, 1],
      [80, 2], [81, 2], [83, 2], [81, 2], [80, 2], [78, 2], [76, 2]];
    const notes = [];
    [0, 48].forEach((from) => {
      const v = from ? 0.45 : 1;
      let at = from;
      phrase.forEach(([n, len]) => { notes.push(['solo', n, at / 4, len / 4, v]); at += len; });
      for (let p = 0; p < 48; p += 2) notes.push(['bass', p === 40 ? 49 : p === 42 || p === 44 ? 47 : 52, (from + p) / 4, 0.4, v]);
      for (let p = 2; p < 48; p += 4) (p === 42 ? [63, 66, 71] : [64, 68, 71]).forEach((n) => notes.push(['harpsichord', n, (from + p) / 4, 0.25, v]));
    });
    return { bpm: 100, beats: 24, notes };
  })();
  const PIECES = { spring: SPRING };
  // Autumn's Adagio and Winter's three passages come from cabin-music.js, loaded the first time sound is on: note lists from the
  // Mutopia Project's editions, under their license (CC BY-SA 3.0, named in that file and in the credits). For each: its tempo,
  // in quarter notes a minute, and which voice plays each part, how loud. In the Largo the violins play pizzicato, which the edition marks as the
  // rain, and the viola and bass are hushed, as marked. A trill goes up a step in the passage's key, half or whole as the scale
  // has it; long notes are bowed again every REBOW beats, as a player would.
  // winterhush is Winter's first movement cut short: from takes its notes, upTo where it stops, loopFrom where it goes back to,
  // and only the parts named play. Its first 11 bars are strings entering one at a time on repeated notes, before any of the
  // solo's fast runs, and going back to bar 4 keeps them all playing. rebow: Infinity for notes held as written.
  const WINTER = {
    autumn2: { bpm: 54, rebow: Infinity, voices: { violin1: ['sordino', 1], violin2: ['sordino', 0.9], viola: ['sordino', 0.9], bass: ['sordino', 1.2], cembalo: ['harpsichord', 0.4] } },
    winterhush: { from: 'winter1', upTo: 44, loopFrom: 12, bpm: 92, voices: { violin1: ['hushed', 0.8], violin2: ['hushed', 0.85], viola: ['hushed', 0.95], bass: ['bass', 0.55] } },
    winter1: { bpm: 106, voices: { solo: ['solo', 1], violin1: ['violin', 0.75], violin2: ['violin', 0.8], viola: ['viola', 0.9], bass: ['bass', 1] } },
    winter2: { bpm: 52, voices: { solo: ['cantabile', 1], violin1: ['pizz', 0.6], violin2: ['pizz', 0.5], viola: ['viola', 0.45], bass: ['bass', 0.5] } },
    winter3: { bpm: 100, voices: { solo: ['solo', 1], violin1: ['violin', 0.75], violin2: ['violin', 0.8], viola: ['viola', 0.9], bass: ['bass', 0.9] } },
  };
  const SCALES = { 'F minor': [5, 7, 8, 10, 0, 1, 3], 'E-flat major': [3, 5, 7, 8, 10, 0, 2] }, REBOW = 3;
  const stepAbove = (n, key) => ((SCALES[key] || []).includes((n + 1) % 12) ? 1 : 2);
  // The winter's emotional journey, month by month, as [passage, tempo]: Autumn's hushed Adagio as the first snow falls, in
  // Vivaldi's own order of the seasons; in December, only the quiet opening of Winter, something gathering; in January, the
  // whole of it, with the solo's runs for the first time, as the army comes from both sides; a little faster in February; and
  // Winter's third movement for the last storm.
  const MONTH_MUSIC = [['autumn2', 1], ['winterhush', 1], ['winter1', 1.04], ['winter1', 1.12], ['winter3', 1.16]];
  const buildWinter = () => {
    const M = window.auroraCabinMusic;
    if (!M || PIECES.winter1) return;
    for (const [name, setup] of Object.entries(WINTER)) {
      const P = M[setup.from || name], rebow = setup.rebow || REBOW, upTo = setup.upTo || Infinity;
      if (!P) continue;
      const notes = [];
      for (const [part, flat] of Object.entries(P.parts)) {
        if (!setup.voices[part]) continue;
        const [voice, v] = setup.voices[part], trills = new Set((P.trills && P.trills[part]) || []);
        for (let i = 0; i < flat.length; i += 3) {
          const n = flat[i], start = flat[i + 1] / 8, len = flat[i + 2] / 8, trill = trills.has(flat[i + 1]) ? stepAbove(n, P.key) : 0;
          if (start >= upTo) continue;
          for (let s = 0; s < len; s += rebow) notes.push([voice, n, start + s, Math.min(rebow, len - s), v, trill]);
        }
      }
      PIECES[name] = { bpm: setup.bpm, beats: Math.min(P.beats, upTo), loopFrom: setup.loopFrom || 0, notes };
    }
  };
  let musicLoad = null;
  const loadMusic = (src, then) => {
    if (window.auroraCabinMusic) { buildWinter(); then(); return; }
    if (!musicLoad) {
      musicLoad = new Promise((resolve, reject) => { document.head.append(Object.assign(document.createElement('script'), { src, onload: resolve, onerror: reject })); });
      // If it can't load, the game plays on without Winter, and a later run tries again
      musicLoad.catch(() => { musicLoad = null; });
    }
    musicLoad.then(() => { buildWinter(); then(); }, () => {});
  };
  const startMusic = (name, tempo = 1, fade = 2) => {
    if (!soundIsOn || !audio || !PIECES[name]) return;
    if (music && music.name === name && music.tempo === tempo) return;
    if (music) stopMusic(0.8);
    const piece = PIECES[name], out = audio.createGain();
    out.gain.setValueAtTime(0, audio.currentTime);
    out.gain.linearRampToValueAtTime(MUSIC_LEVEL, audio.currentTime + fade);
    out.connect(audioOut);
    const notes = [...piece.notes].sort((a, b) => a[2] - b[2]);
    music = { name, tempo, out, i: 0, origin: audio.currentTime + 0.1, timer: 0 };
    const loopFrom = piece.loopFrom || 0, loopNote = Math.max(0, notes.findIndex((n) => n[2] >= loopFrom));
    // Notes are scheduled a little ahead, so a busy frame doesn't make them late
    const plan = () => {
      if (!music || music.out !== out) return;
      const beat = 60 / piece.bpm / tempo, horizon = audio.currentTime + 0.35;
      for (;;) {
        if (music.i >= notes.length) { music.i = loopNote; music.origin += (piece.beats - loopFrom) * beat; }
        const [voice, n, start, len, v = 1, trill = 0] = notes[music.i], at = music.origin + start * beat;
        if (at > horizon) break;
        if (at >= audio.currentTime - 0.02) VOICES[voice](midiHz(n), at, len * beat, v, trill);
        music.i += 1;
      }
    };
    music.timer = setInterval(plan, 80);
    plan();
  };
  const stopMusic = (fade = 1) => {
    if (!music) return;
    clearInterval(music.timer);
    const { out } = music;
    music = null;
    out.gain.setTargetAtTime(0.0001, audio.currentTime, Math.max(0.01, fade / 4));
    setTimeout(() => out.disconnect(), fade * 1000 + 600);
  };

  const STYLE = `
.bn-cabin-layer{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none}
.bn-cabin-on{cursor:default}
.bn-cabin-on .bn-labels{z-index:2}
.bn-cabin-on .bn-figure,.bn-cabin-on .bn-label-dipper,.bn-cabin-on .bn-label-north,.bn-cabin-on .bn-meteor,.bn-cabin-on .bn-plane,.bn-cabin-on .bn-sat,.bn-cabin-on .bn-champ-label,.bn-cabin-on .bn-animal-label,.bn-cabin-on .bn-moon-label,.bn-cabin-on .bn-cabin-label{visibility:hidden}
.bn-cabin-hint,.bn-cabin-quit,.bn-cabin-next{position:absolute;font-size:.75rem;line-height:1;color:rgba(232,238,255,.9);text-shadow:0 0 4px #04071A,0 0 2px #04071A;white-space:nowrap}
.bn-cabin-hint,.bn-cabin-next{left:50%;top:30px;transform:translateX(-50%);transition:opacity .8s}
.bn-cabin-next{top:26px;padding:4px 8px;cursor:pointer;pointer-events:auto}
.bn-cabin-next:hover,.bn-cabin-quit:hover{text-decoration:underline;text-underline-offset:2px}
.bn-cabin-quit{right:0;top:0;padding:10px 12px 8px;cursor:pointer;pointer-events:auto}
.bn-cabin-score{position:absolute;left:50%;top:10px;transform:translateX(-50%);font-size:.8125rem;font-weight:600;line-height:1;color:rgba(232,238,255,.95);text-shadow:0 0 4px #04071A,0 0 2px #04071A;white-space:nowrap}
.bn-wave.bn-cabin-wave{top:max(24%,44px)}
.bn-cabin-menu{position:absolute;left:0;top:0;display:flex;gap:5px;padding:5px;border-radius:7px;background:rgba(6,13,38,.9);box-shadow:0 0 0 1px rgba(232,238,255,.16),0 4px 14px rgba(2,4,14,.6);transform:translate(-50%,-100%);pointer-events:auto}
.bn-cabin-menu span{padding:7px 9px;border-radius:5px;font-size:.75rem;line-height:1;white-space:nowrap;color:rgba(255,236,206,.98);background:rgba(255,206,140,.15);cursor:pointer}
.bn-cabin-menu span:hover{background:rgba(255,206,140,.28)}
.bn-cabin-menu span.off{color:rgba(232,238,255,.45);background:rgba(232,238,255,.06);cursor:default}
.bn-cabin-sound{position:absolute;left:0;top:0;display:flex;align-items:center;gap:5px;padding:8px 12px;font-size:.8125rem;line-height:1;color:rgba(232,238,255,.9);text-shadow:0 0 4px #04071A;cursor:pointer;pointer-events:auto}
.bn-cabin-sound svg{flex:none;filter:drop-shadow(0 0 2px #04071A)}
.bn-cabin-sound:hover{text-decoration:underline;text-underline-offset:2px}
.bn-cabin-score.link{pointer-events:auto;cursor:pointer}`;
  const addStyle = () => {
    if (!document.getElementById('bn-cabin-style')) document.head.append(Object.assign(document.createElement('style'), { id: 'bn-cabin-style', textContent: STYLE }));
  };

  // Looks, drawn once and reused: glows, steam, mist, a heap of snow
  const softDot = (size, stops) => {
    const c = canvas(size, size), g = c.getContext('2d'), m = size / 2, fill = g.createRadialGradient(m, m, 0, m, m, m);
    stops.forEach(([at, color]) => fill.addColorStop(at, color));
    g.fillStyle = fill;
    g.fillRect(0, 0, size, size);
    return c;
  };
  // A heap of snow, which is what a melted figure leaves for a moment, with a few glints of ice
  const moundLook = () => {
    const w = 96, h = 44, c = canvas(w, h), g = c.getContext('2d');
    g.shadowColor = 'rgba(170,205,255,.7)';
    g.shadowBlur = 5;
    const fill = g.createLinearGradient(0, 6, 0, h);
    fill.addColorStop(0, '#DCE6F8');
    fill.addColorStop(0.5, '#BFCDEB');
    fill.addColorStop(1, '#8EA2CE');
    g.fillStyle = fill;
    g.beginPath();
    g.moveTo(3, h - 2);
    g.bezierCurveTo(w * 0.25, h * 0.55, w * 0.4, 7, w * 0.55, 7);
    g.bezierCurveTo(w * 0.72, 7, w * 0.82, h * 0.5, w - 3, h - 2);
    g.closePath();
    g.fill();
    g.shadowBlur = 0;
    g.fillStyle = 'rgba(255,255,255,.9)';
    for (const [x, y] of [[0.4, 0.55], [0.6, 0.35], [0.72, 0.6]]) { g.beginPath(); g.arc(w * x, h * y, 1.4, 0, TAU); g.fill(); }
    return c;
  };
  // The army's figures, drawn in the scene's units from the feet up, facing the cabin from the left, partway through a step
  // (phase, in radians), with their far limbs in shade. Their snow is blue-gray, as snow is by moonlight, so their eyes stand
  // out (pure white, they read as glowing ghosts, eyes lost). Old Man Winter is ice, paler and bluer.
  const SNOW = '#C9D5EE', SHADE = '#8296C6', EYE = '#D8FFFF', ICE_LIGHT = '#D9F0FF', ICE_DEEP = '#7298CF';
  const limb = (g, x, y, angle, length, width, color) => {
    g.strokeStyle = color;
    g.lineWidth = width;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.sin(angle) * length, y + Math.cos(angle) * length);
    g.stroke();
  };
  const sideFill = (g, x0, x1, back = SHADE, front = SNOW) => {
    const fill = g.createLinearGradient(x0, 0, x1, 0);
    fill.addColorStop(0, back);
    fill.addColorStop(0.55, front);
    fill.addColorStop(1, front);
    return fill;
  };
  const eye = (g, x, y, r) => {
    g.fillStyle = EYE;
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
  };
  const jagged = (g, pts) => {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    pts.slice(1).forEach(([x, y]) => g.lineTo(x, y));
    g.closePath();
    g.fill();
  };
  // A soldier: a figure of packed snow, its head jagged on top like broken ice
  const drawSoldier = (g, phase) => {
    const step = 0.42 * Math.sin(phase), swing = -0.5 * Math.sin(phase);
    g.lineCap = 'round';
    limb(g, -0.3, -6.2, -step, 6.2, 2, SHADE);
    limb(g, -0.4, -10.4, -swing, 4.8, 1.6, SHADE);
    g.fillStyle = sideFill(g, -3, 3.2);
    g.beginPath();
    g.moveTo(-1.9, -5.4);
    g.quadraticCurveTo(-3, -8.6, -2.3, -11.3);
    g.quadraticCurveTo(0.6, -12.6, 3.1, -11.1);
    g.quadraticCurveTo(2.7, -8.2, 1.9, -5.4);
    g.closePath();
    g.fill();
    limb(g, 0.4, -6.2, step, 6.2, 2, SNOW);
    limb(g, 1.6, -10.4, swing, 4.8, 1.6, SNOW);
    g.fillStyle = sideFill(g, -1.5, 3.4);
    g.beginPath();
    g.arc(1.1, -13.5, 2.3, 0, TAU);
    g.fill();
    jagged(g, [[-1, -14.2], [-0.5, -16.4], [0.4, -15.3], [1.1, -16.9], [1.8, -15.4], [2.6, -16.3], [3.2, -14.2]]);
    eye(g, 2.15, -13.6, 0.7);
    eye(g, 3.1, -13.5, 0.55);
  };
  // A brute: taller and broader, hunched, with long arms and spikes of ice along its shoulders
  const drawBrute = (g, phase) => {
    const step = 0.3 * Math.sin(phase), swing = -0.35 * Math.sin(phase);
    g.lineCap = 'round';
    limb(g, -0.8, -8.4, -step, 8.4, 3.2, SHADE);
    limb(g, -1.2, -17.2, -swing, 10.6, 2.8, SHADE);
    g.fillStyle = sideFill(g, -5, 5.5);
    g.beginPath();
    g.moveTo(-3.4, -7.6);
    g.quadraticCurveTo(-5.4, -13, -3.6, -18.4);
    g.quadraticCurveTo(0.4, -21.6, 4.6, -18.6);
    g.quadraticCurveTo(5.6, -13, 3.4, -7.6);
    g.closePath();
    g.fill();
    g.fillStyle = '#B4D9F4';
    for (const [x, y, lean, h] of [[-3.6, -17.4, -0.5, 3.2], [-1.6, -19.6, -0.25, 3.8], [0.8, -20.6, 0, 3.4], [2.9, -20, 0.25, 2.6]]) {
      jagged(g, [[x - 0.9, y + 0.6], [x + Math.sin(lean) * h, y - Math.cos(lean) * h], [x + 0.9, y + 0.6]]);
    }
    limb(g, 0.9, -8.4, step, 8.4, 3.2, SNOW);
    limb(g, 3.8, -16.8, swing, 10.2, 2.8, SNOW);
    g.fillStyle = sideFill(g, 2, 7.6);
    g.beginPath();
    g.arc(5, -18.2, 2.6, 0, TAU);
    g.fill();
    eye(g, 6.3, -18.4, 0.75);
    eye(g, 7.3, -18.2, 0.6);
  };
  // A runner: small and quick, bent low, running with long strides
  const drawRunner = (g, phase) => {
    const step = 0.75 * Math.sin(phase), swing = -0.9 * Math.sin(phase);
    g.lineCap = 'round';
    limb(g, -0.2, -4.6, -step, 4.6, 1.5, SHADE);
    limb(g, 1.3, -7.8, -swing - 0.5, 3.4, 1.2, SHADE);
    g.fillStyle = sideFill(g, -1.8, 3.4);
    g.beginPath();
    g.moveTo(-1.3, -4.1);
    g.quadraticCurveTo(-1.6, -7.4, 0.9, -8.9);
    g.quadraticCurveTo(2.8, -9.2, 3.3, -7.6);
    g.quadraticCurveTo(1.6, -5.4, 1.2, -3.9);
    g.closePath();
    g.fill();
    limb(g, 0.3, -4.6, step, 4.6, 1.5, SNOW);
    limb(g, 2.4, -7.6, swing - 0.5, 3.4, 1.2, SNOW);
    g.fillStyle = sideFill(g, 1.4, 5.2);
    g.beginPath();
    g.arc(3.5, -9.4, 1.75, 0, TAU);
    g.fill();
    jagged(g, [[1.8, -9.9], [1.4, -11.7], [2.5, -10.9], [3.1, -12.2], [3.8, -10.8], [4.6, -10.4]]);
    eye(g, 4.35, -9.55, 0.55);
    eye(g, 5.05, -9.4, 0.45);
  };
  // Old Man Winter: tall and gaunt, made of ice, in a long robe whose jagged hem sways as he walks, with a beard of icicles,
  // a crown of them, and a staff of ice
  const drawKing = (g, phase) => {
    const sway = 0.5 * Math.sin(phase), lean = 0.12 * Math.sin(phase + 0.7);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    // The staff, planted ahead and swinging with his stride, with a crystal at its head
    const foot = [8.4 + 3.5 * lean, 1], top = [5.4 - 2 * lean, -35];
    g.strokeStyle = '#BFE4FF';
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(foot[0], foot[1]);
    g.lineTo(top[0], top[1]);
    g.stroke();
    g.fillStyle = '#EAF9FF';
    jagged(g, [[top[0], top[1] - 2.6], [top[0] + 1, top[1] - 0.4], [top[0], top[1] + 0.8], [top[0] - 1, top[1] - 0.4]]);
    // The robe
    g.fillStyle = sideFill(g, -7, 7, ICE_DEEP, ICE_LIGHT);
    g.beginPath();
    g.moveTo(-7.2 + sway, 0);
    g.quadraticCurveTo(-6.4, -16, -4.4, -29.5);
    g.quadraticCurveTo(0.2, -32.6, 4.6, -29.4);
    g.quadraticCurveTo(5.8, -16, 6.8 + sway, 0);
    const hem = 7;
    for (let i = 1; i < hem; i++) {
      const x = lerp(6.8 + sway, -7.2 + sway, i / hem);
      g.lineTo(x + 0.5, i % 2 ? -1.6 : 0.3);
    }
    g.closePath();
    g.fill();
    // His arm, reaching to the staff
    limb(g, 3.4, -27.6, 0.55 + 0.3 * lean, 9.5, 2.2, ICE_LIGHT);
    // The head, the beard and the crown
    g.fillStyle = sideFill(g, -1.4, 5.2, ICE_DEEP, ICE_LIGHT);
    g.beginPath();
    g.arc(1.9, -34.6, 3.1, 0, TAU);
    g.fill();
    g.fillStyle = '#E4F6FF';
    jagged(g, [[-0.4, -33], [1, -30.4], [1.6, -26.6], [2.4, -29.6], [3.2, -24.8], [3.8, -29.2], [4.8, -27.4], [5, -33]]);
    jagged(g, [[-1.4, -36], [-1, -40.4], [0.3, -37.4], [0.9, -42], [2.1, -37.6], [2.9, -43.4], [3.6, -37.6], [4.6, -41.6], [4.9, -37.2], [5.6, -39.6], [5.2, -35.8]]);
    eye(g, 2.9, -34.9, 0.8);
    eye(g, 4.2, -34.7, 0.65);
  };
  // Each kind's drawing, its bounds around the feet in the scene's units (left, top, right, bottom), and where its eyes are,
  // for their glow. WALK_FRAMES poses make a full step of both legs.
  const FIGURES = {
    soldier: { draw: drawSoldier, box: [-5, -17.6, 6, 1.6], eyes: [2.6, -13.55] },
    brute: { draw: drawBrute, box: [-6.6, -24.8, 10.4, 2], eyes: [6.8, -18.3] },
    runner: { draw: drawRunner, box: [-4.6, -13, 7, 1.4], eyes: [4.7, -9.5] },
    king: { draw: drawKing, box: [-9.5, -45, 13.5, 2.4], eyes: [3.5, -34.8] },
  };
  const WALK_FRAMES = 8;
  let looks = null;
  const makeLooks = () => {
    if (looks) return looks;
    looks = {
      // A lamp's glow, and its light pooled on the ground
      glow: softDot(96, [[0, 'rgba(255,232,180,.95)'], [0.18, 'rgba(255,196,110,.55)'], [0.5, 'rgba(255,164,72,.16)'], [1, 'rgba(255,164,72,0)']]),
      pool: softDot(96, [[0, 'rgba(255,190,110,.5)'], [0.5, 'rgba(255,170,90,.16)'], [1, 'rgba(255,170,90,0)']]),
      // The army's own faint cold light, where firelight warms one, and its eyes
      cool: softDot(64, [[0, 'rgba(190,220,255,.55)'], [0.45, 'rgba(170,205,255,.16)'], [1, 'rgba(170,205,255,0)']]),
      heat: softDot(64, [[0, 'rgba(255,214,150,.75)'], [0.4, 'rgba(255,180,100,.25)'], [1, 'rgba(255,180,100,0)']]),
      eyes: softDot(32, [[0, 'rgba(200,255,255,1)'], [0.25, 'rgba(110,236,255,.6)'], [1, 'rgba(110,236,255,0)']]),
      steam: softDot(64, [[0, 'rgba(232,238,250,.55)'], [0.5, 'rgba(226,234,248,.2)'], [1, 'rgba(226,234,248,0)']]),
      // A frost wraith's mist
      mist: softDot(64, [[0, 'rgba(226,244,255,.9)'], [0.35, 'rgba(190,226,255,.45)'], [1, 'rgba(190,226,255,0)']]),
      mound: moundLook(),
      // A star's glow in each of the real stars' colors, around a white core
      stars: STARS.map((st) => softDot(48, [[0, 'rgba(255,255,255,1)'], [0.16, `rgba(${st.color},.85)`], [0.45, `rgba(${st.color},.22)`], [1, `rgba(${st.color},0)`]])),
    };
    return looks;
  };

  // The result and a hint stay a while after a run, until a click on the banner or a few seconds have passed
  let lingering = null;
  const linger = (els) => {
    const banner = els[0].closest('.banner');
    const clear = () => {
      clearTimeout(timer);
      banner.removeEventListener('click', clear);
      els.forEach((el) => el.remove());
      lingering = null;
    };
    const timer = setTimeout(clear, 9000);
    banner.addEventListener('click', clear);
    lingering = clear;
  };

  let current = null;
  // options: stoke, the banner's own stoke of the cabin's fire (a puff of smoke, sparks and the window's flare); surge, the
  // aurora's surge, for the thaw; and music, cabin-music.js's address, which index.html gives stamped, as it does its scripts
  const start = (banner, onEnd, options = {}) => {
    if (current) return;
    if (lingering) lingering();
    addStyle();
    const look = makeLooks();
    const box = banner.getBoundingClientRect(), W = box.width, H = box.height, dpr = Math.min(2, window.devicePixelRatio || 1);
    const touchOnly = matchMedia('(hover: none)').matches, uiFont = getComputedStyle(banner).fontFamily, press = touchOnly ? 'Tap' : 'Click';
    // The scene's units in the banner: k pixels each, with side units cropped at the left
    const k = Math.max(W / 1600, H / 240), side = (1600 - W / k) / 2;
    const sx = (x) => (x - side) * k, sy = (y) => H - (240 - y) * k;
    const groundAt = (x) => sy(ridgeAt(side + x / k));
    // Points on the cabin, in its own units: its middle, which a click or tap stokes; its walls, where the army reaches it;
    // and its chimney
    const onCabinAt = (u, v) => ({ x: sx(CABIN.x + u * CABIN.k), y: sy(CABIN.y + v * CABIN.k) });
    const middle = onCabinAt(1, -8), wall = onCabinAt(WALL, -1), gable = onCabinAt(GABLE, -1), chimney = onCabinAt(...CHIMNEY);
    const cabinHit = Math.max(20, 0.13 * H);
    // Where the army comes from, and the rings: on the left, then on the right from January (from: the month, 0 for November),
    // and the woodshed's place from December
    const entry = Math.max(middle.x - PATH * H, -0.06 * H);
    const rightOK = W - middle.x >= RIGHT_ROOM * H, rightEntry = Math.min(middle.x + RIGHT_PATH * H, W + 0.06 * H);
    const rings = [];
    for (let i = 0; i < RINGS; i++) {
      const x = middle.x - (FIRST_RING + RING_GAP * i) * H;
      if (x < EDGE * H) break;
      rings.push({ side: 'left', i, from: 0, x, y: groundAt(x), half: 0.2 * H, building: null });
    }
    if (rightOK) {
      for (let i = 0; i < RIGHT_RINGS; i++) {
        const x = middle.x + (RIGHT_FIRST + RIGHT_GAP * i) * H;
        if (x > W - EDGE * H) break;
        rings.push({ side: 'right', i, from: 2, x, y: groundAt(x), half: 0.2 * H, building: null });
      }
    }
    const shedX = middle.x - SHED * H;
    rings.push({ side: 'shed', i: 0, from: 1, x: shedX, y: groundAt(shedX), half: 0.1 * H, building: null });
    // A lantern's lamp, above its ring, on a post POST units tall, and POST_STEP taller for each level; a fire's middle
    const POST = 15, POST_STEP = 2.5;
    const lampAt = (ring) => {
      const level = ring.building ? ring.building.level : 0;
      return { x: ring.x, y: ring.y - (POST + POST_STEP * level) * k };
    };
    const fireAt = (ring) => ({ x: ring.x, y: ring.y - 3 * k });

    // The army's figures at this banner's scale, drawn once for a run in each pose of a step
    const frames = {};
    for (const [kind, F] of Object.entries(FIGURES)) {
      const scale = k * dpr, [x0, y0, x1, y1] = F.box;
      frames[kind] = Array.from({ length: WALK_FRAMES }, (_, i) => {
        const c = canvas((x1 - x0) * scale, (y1 - y0) * scale), g = c.getContext('2d');
        g.setTransform(scale, 0, 0, scale, -x0 * scale, -y0 * scale);
        F.draw(g, i / WALK_FRAMES * TAU);
        return c;
      });
    }
    // Snow falling as weather, more of it as the winter deepens; it plays no part in the game
    const weather = Array.from({ length: Math.round(clamp(W / 12, 30, 160)) }, () => ({ x: Math.random() * W, y: Math.random() * H, v: lerp(0.08, 0.2, Math.random()), size: lerp(0.8, 1.7, Math.random()), a: lerp(0.3, 0.75, Math.random()), seed: Math.random() * TAU }));

    // The canvas, in front of the forest and the cabin, as the bear game's is
    const layer = canvas(W * dpr, H * dpr), ctx = layer.getContext('2d');
    layer.className = 'bn-cabin-layer';
    banner.append(layer);
    banner.classList.add('bn-cabin-on', 'bn-burning');
    const setFire = () => banner.style.setProperty('--bn-fire', (Math.max(0, lives) / LIVES).toFixed(2));

    // The words: the score line, a hint, the Quit link, the next month's link, a ring's menu and the cards
    const labels = banner.querySelector('.bn-labels');
    const score = labels.appendChild(Object.assign(document.createElement('span'), { className: 'bn-cabin-score' }));
    const hint = labels.appendChild(Object.assign(document.createElement('span'), { className: 'bn-cabin-hint' }));
    const quit = labels.appendChild(Object.assign(document.createElement('span'), { className: 'bn-cabin-quit', textContent: 'Quit' }));
    const nextLink = labels.appendChild(Object.assign(document.createElement('span'), { className: 'bn-cabin-next' }));
    const menu = labels.appendChild(Object.assign(document.createElement('div'), { className: 'bn-cabin-menu' }));
    const soundSwitch = labels.appendChild(Object.assign(document.createElement('span'), { className: 'bn-cabin-sound' }));
    nextLink.style.display = 'none';
    menu.style.display = 'none';
    // A speaker beside the words, with sound waves when on and crossed out when off, as in the other games. It sits at the
    // top left, level with Quit, where the other games have it at the bottom right, since here that corner is the cabin's on a
    // narrow banner and the right side's rings' on a wider one (at 520 px it covered the cabin, and at 768 px a ring).
    const showSound = () => { soundSwitch.innerHTML = `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M7.3 3.3L4 6H1.3v4H4l3.3 2.7z" fill="currentColor"/><path d="${soundIsOn ? 'M10.4 5.6a3.3 3.3 0 0 1 0 4.8M12.7 3.3a6.7 6.7 0 0 1 0 9.4' : 'M15 6l-4 4M11 6l4 4'}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>Sound: ${soundIsOn ? 'on' : 'off'}`; };
    readSound();
    wakeAudio();
    showSound();
    let heard = false;
    let cards = [];
    const card = (lines, color, delay, ms = 3200) => {
      cards.forEach((el) => el.remove());
      const el = labels.appendChild(Object.assign(document.createElement('div'), { className: 'bn-wave bn-cabin-wave' }));
      el.style.setProperty('--c', color);
      el.append(...lines.map((text, i) => Object.assign(document.createElement(i % 2 ? 'span' : 'b'), { textContent: text })));
      el.animate([{ opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: ms, delay }).onfinish = () => el.remove();
      cards = [el];
    };
    let hintTimers = [];
    const say = (text, ms) => {
      hintTimers.forEach(clearTimeout);
      hintTimers = [];
      hint.textContent = text;
      hint.style.opacity = text ? 1 : 0;
      if (ms) hintTimers.push(setTimeout(() => { hint.style.opacity = 0; }, ms));
    };
    // Two lines in turn, the second when the first has had its time
    const sayThen = (first, second, ms) => {
      say(first, ms);
      if (second) hintTimers.push(setTimeout(() => say(second, ms), ms + 900));
    };

    // The state of a run
    const foes = [], drips = [], steam = [], bits = [], pops = [], warmth = [], remains = [], sparks = [], risers = [];
    let warmthId = 0;
    let wood = START_WOOD, points = 0, lives = LIVES, melted = 0, lost = 0, stoked = 0, built = 0;
    let phase = 'open', phaseTime = 0, time = 0, monthIndex = 0, monthTime = 0, nextRank = 0, nextWraith = 0, breatherLeft = 0;
    let fieldAlpha = 0, fadeFrom = 1, fadeFor = FADE, stokeAt = -Infinity, hover = null, menuFor = null, menuKey = '', preview = null;
    let king = null, kingCame = false, lastRaise = -Infinity, nudgeUntil = -Infinity, lastNudge = -Infinity, lastMeltSound = -Infinity, began = 0;
    // For the credits: the army melted by kind, what was built, woodpiles lit, months kept, and the king
    const counts = { soldier: 0, brute: 0, runner: 0, wraith: 0, lantern: 0, firepit: 0, woodpile: 0, woodshed: 0, alight: 0, kept: 0, king: false, stars: 0 };
    // Stars falling toward the clearing, to catch for star lanterns, and whether the first one's hint has had its time
    const skyStars = [];
    let nextStar = FIRST_STAR, starHinted = false;
    let ending = null, result = false, running = true, last = performance.now();
    const best = (() => { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch (e) { return 0; } })();
    // The month being played, or coming next during a breather
    const shownIndex = () => Math.min(MONTHS.length - 1, phase === 'breather' ? monthIndex + 1 : monthIndex);
    const showScore = () => {
      if (phase === 'open' && !built) return;
      score.textContent = `${W < 560 ? '' : `${MONTHS[shownIndex()].name}: `}${number(points)} points, ${number(wood)} wood, ${lives} ${lives === 1 ? 'foxfire' : 'foxfires'}`;
      renderMenu();
    };
    score.textContent = `Keep the fire going till spring${best ? `. Your best is ${number(best)}` : ''}`;
    say(`Winter's army is coming for the fire. ${press} a ring to build a lantern, ${BUILD.lantern.levels[0].cost} wood`);
    card([MONTHS[0].name, MONTHS[0].says], '196 220 255', 300);
    setFire();

    // What happens to the army
    const pop = (x, y, text, color) => pops.push({ x, y, text, color, age: 0, life: Math.max(1, 0.055 * text.length) });
    const puffOfSteam = (x, y, r, n = 3) => {
      for (let i = 0; i < n; i++) steam.push({ x: x + (Math.random() - 0.5) * r, y, r: r * lerp(0.7, 1.1, Math.random()), vx: (Math.random() - 0.5) * 0.05 * H, age: -i * 0.08, life: lerp(0.8, 1.1, Math.random()) });
    };
    const spray = (x, y, n, color, up = true) => {
      for (let i = 0; i < n; i++) {
        const a = up ? -Math.PI / 2 + (Math.random() - 0.5) * 2.4 : Math.random() * TAU, v = H * (0.12 + Math.random() * 0.3);
        bits.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, age: 0, life: 0.5 + Math.random() * 0.4, size: 1 + Math.random() * 1.4, color });
      }
    };
    const rightSide = (M) => rightOK && Math.random() < M.right;
    const makeWalker = (kind, more) => {
      const K = HOST[kind];
      return { kind, flies: false, dir: 1, x: 0, y: 0, lift: 0, r: 0.3 * K.tall * k, health: K.health, max: K.health, speed: K.speed * lerp(0.94, 1.06, Math.random()) * MONTHS[monthIndex].pace, phase: Math.random() * TAU, seed: Math.random() * TAU, born: time, rise: 0, heat: 0, dead: false, stoked: null, ...more };
    };
    // A rank comes out of the trees together, one behind another, or a pack of runners, from the left or round the cabin from
    // the right
    const spawnRank = (M) => {
      const dir = rightSide(M) ? -1 : 1, from = dir > 0 ? entry : rightEntry;
      const pack = Math.random() < M.runners, count = pack ? RUNNERS[0] + Math.floor(Math.random() * (RUNNERS[1] - RUNNERS[0] + 1)) : Math.random() < M.ranks ? (Math.random() < 0.6 ? 2 : 3) : 1;
      for (let n = 0; n < count; n++) {
        const kind = pack ? 'runner' : Math.random() < M.brutes ? 'brute' : 'soldier';
        foes.push(makeWalker(kind, { dir, x: from - dir * n * (pack ? 0.06 : 0.09) * H }));
      }
      return count;
    };
    // A frost wraith sets out above the trees for the chimney, weaving as it comes
    const spawnWraith = (M) => {
      const dir = rightSide(M) ? -1 : 1, x = dir > 0 ? entry : rightEntry, y = groundAt(x) - lerp(FLY[0], FLY[1], Math.random()) * H;
      const len = Math.hypot(chimney.x - x, chimney.y - y);
      foes.push({ kind: 'wraith', flies: true, dir, sx: x, sy: y, x, y, t: 0, len, r: WRAITH.size * k, angle: 0, health: WRAITH.health, max: WRAITH.health, speed: WRAITH.speed * MONTHS[monthIndex].pace, seed: Math.random() * TAU, born: time, heat: 0, dead: false, stoked: null });
    };
    const spawnKing = () => {
      kingCame = true;
      king = makeWalker('king', { x: entry, speed: HOST.king.speed });
      foes.push(king);
      card(['Old Man Winter', 'Melt him and the winter breaks'], '200 236 255', 0, 3600);
      sfx.king();
    };
    // How near one is to putting out the fire: a walker by the ground between it and the cabin, a wraith by its way to the
    // chimney. Lanterns shine on the nearest.
    const nearness = (f) => (f.flies ? Math.hypot(f.x - chimney.x, f.y - chimney.y) : Math.abs(f.x - middle.x));
    // Melted, one of the army slumps into a heap of snow and the light goes out of its eyes, or a wraith thins to nothing.
    // Near Old Man Winter, a walker rises again from its snow.
    const melt = (f, free = false) => {
      f.dead = true;
      const gy = groundAt(f.x) - (f.lift || 0);
      if (!free) {
        const K = f.flies ? WRAITH : HOST[f.kind];
        points += K.points;
        wood += K.wood;
        melted += 1;
        if (f.kind !== 'king') counts[f.kind] += 1;
        // (a hiss for each, but not so many at once that they pile up)
        if (f.flies) sfx.wraith();
        else if (time - lastMeltSound > 0.12) { lastMeltSound = time; sfx.melt(); }
      }
      if (f.flies) {
        puffOfSteam(f.x, f.y, f.r * 1.6, 4);
      } else {
        const F = FIGURES[f.kind];
        puffOfSteam(f.x, f.y, f.r * 1.2);
        remains.push({ x: f.x, gy, w: 2.4 * f.r, age: 0, ex: f.x + f.dir * F.eyes[0] * k, ey: gy + F.eyes[1] * k * 0.62 });
        if (!free && king && f !== king && !king.dead && Math.abs(f.x - king.x) <= RAISE * H && time >= lastRaise + RAISE_EVERY) {
          lastRaise = time;
          risers.push({ x: f.x, dir: f.dir, at: time + RAISE_AFTER });
        }
      }
      if (f === king) kingFalls();
      showScore();
    };
    // Half melted, a brute cracks apart into two soldiers
    const breakBrute = (f, stoke) => {
      f.dead = true;
      const K = HOST.brute;
      points += K.points;
      wood += K.wood;
      spray(f.x, f.y, 14, '220,236,255');
      pop(f.x, f.y - 1.6 * f.r, `+${K.points}`, GOLD);
      counts.brute += 1;
      sfx.crack();
      for (const s of [-1, 1]) foes.push(makeWalker('soldier', { dir: f.dir, x: f.x + s * 0.035 * H, born: time - 1, stoked: stoke || null }));
      showScore();
    };
    const hurt = (f, amount, stoke) => {
      if (f.dead) return;
      f.health -= amount;
      f.heat = 0.2;
      if (f.kind === 'brute' && f.health <= f.max / 2) breakBrute(f, stoke);
      else if (f.health <= 0) melt(f);
    };
    // Old Man Winter melts: his whole army falls to snow with him, and the thaw comes
    const kingFalls = () => {
      pop(king.x, king.y - 1.2 * king.r, `Old Man Winter melted! +${number(HOST.king.points)}`, GOLD);
      counts.king = true;
      sfx.kingFalls();
      for (const f of foes) if (!f.dead) melt(f, true);
      risers.length = 0;
      thaw();
    };
    // One of the army reaching the cabin chills it: lives, a spray of ice against the wall or out of the chimney, frost on
    // the window and the roof, a drift by the wall, and the fire dims, until the last life puts it out
    const reachCabin = (f) => {
      f.dead = true;
      const cost = f.flies ? WRAITH.lives : HOST[f.kind].lives, at = f.flies ? chimney : f.dir > 0 ? wall : gable;
      lives -= cost;
      lost += 1;
      sfx.chill();
      spray(at.x, f.flies ? at.y : f.y, 16, '220,236,255');
      pop(at.x, Math.min(at.y, wall.y) - 0.3 * H, lives > 0 ? (cost > 1 ? `−${cost} foxfires` : '−1 foxfire') : 'The fire went out', WARM);
      if (lives > 0) {
        warmth.push({ age: 0, id: ++warmthId, reach: FLARE_REACH });
        nudge(true);
      }
      setFire();
      showScore();
      if (lives <= 0) leave('out');
    };

    // Building
    const sparkle = (x, y) => {
      for (let n = 0; n < 10; n++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6, v = H * (0.1 + Math.random() * 0.25);
        bits.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, age: 0, life: 0.5 + Math.random() * 0.5, size: 1 + Math.random(), color: '255,206,130' });
      }
    };
    const costOf = (kind, level = 0) => BUILD[kind].levels[level].cost;
    // What a ring can take this month
    const kindsFor = (ring) => (ring.side === 'shed' ? ['woodshed'] : ['lantern', 'firepit', 'woodpile'].filter((kind) => BUILD[kind].from <= shownIndex()));
    const open = (ring) => ring.from <= shownIndex();
    const build = (ring, kind) => {
      const cost = costOf(kind);
      if (wood < cost) { pop(ring.x, ring.y - 0.3 * H, `${BUILD[kind].name} needs ${cost} wood`, ICE); return; }
      wood -= cost;
      built += 1;
      ring.building = { kind, level: 0, spent: cost, target: null, at: time, flicker: Math.random() * TAU, burning: false, until: 0, out: 0 };
      sparkle(ring.x, kind === 'lantern' ? lampAt(ring).y : ring.y - 6 * k);
      counts[kind] += 1;
      if (kind === 'lantern') sfx.build(); else if (kind === 'firepit') sfx.fire(); else sfx.shed();
      if (phase === 'open') startMonth(0);
      closeMenu();
      showScore();
    };
    const upgrade = (ring) => {
      const b = ring.building, next = b && BUILD[b.kind].levels[b.level + 1];
      if (!next || wood < next.cost) return;
      wood -= next.cost;
      b.level += 1;
      b.spent += next.cost;
      b.at = time;
      sparkle(ring.x, b.kind === 'lantern' ? lampAt(ring).y : ring.y - 6 * k);
      if (b.kind === 'lantern') sfx.upgrade(); else sfx.fire();
      menuKey = '';
      showScore();
    };
    // A woodpile set alight burns for a while, melting whatever climbs it, then burns down to embers and frees its ring
    const setAlight = (ring) => {
      const b = ring.building;
      if (!b || b.kind !== 'woodpile' || b.burning || wood < BUILD.woodpile.alight) return;
      wood -= BUILD.woodpile.alight;
      b.burning = true;
      b.until = time + BUILD.woodpile.burn;
      counts.alight += 1;
      sfx.alight();
      sparkle(ring.x, ring.y - 6 * k);
      closeMenu();
      showScore();
    };
    const takeDown = (ring) => {
      if (!ring.building) return;
      const back = Math.floor(ring.building.spent / 2);
      wood += back;
      puffOfSteam(ring.x, ring.y - 8 * k, 0.04 * H, 2);
      pop(ring.x, ring.y - 0.3 * H, `+${back} wood`, GOLD);
      ring.building = null;
      closeMenu();
      showScore();
    };
    // A ring's menu: what it can take, or for a building, its upgrade and taking it down. On a screen with a pointer, an item
    // shows the reach of what it would build.
    const item = (text, act, kind) => {
      const el = Object.assign(document.createElement('span'), { textContent: text });
      if (!act) el.className = 'off';
      el.addEventListener('click', (e) => { e.stopPropagation(); if (act) act(); });
      if (kind) {
        el.addEventListener('pointerenter', () => { preview = kind; });
        el.addEventListener('pointerleave', () => { preview = null; });
      }
      return el;
    };
    const renderMenu = () => {
      if (!menuFor) return;
      const ring = menuFor, b = ring.building;
      let key, items;
      if (!b) {
        const kinds = kindsFor(ring);
        key = `build,${kinds.map((kind) => wood >= costOf(kind)).join()}`;
        if (key === menuKey) return;
        items = () => kinds.map((kind) => item(`${BUILD[kind].name}, ${costOf(kind)} wood`, wood >= costOf(kind) ? () => build(ring, kind) : null, kind));
      } else {
        const next = BUILD[b.kind].levels[b.level + 1], back = Math.floor(b.spent / 2);
        key = `${b.kind},${b.level},${b.burning},${next ? wood >= next.cost : '-'},${wood >= BUILD.woodpile.alight},${back}`;
        if (key === menuKey) return;
        const down = item(`Take down, +${back} wood`, () => takeDown(ring));
        if (b.kind === 'lantern') items = () => [item(next ? `Upgrade, ${next.cost} wood` : 'As bright as it gets', next && wood >= next.cost ? () => upgrade(ring) : null), down];
        else if (b.kind === 'firepit') items = () => [item(next ? `Make it a bonfire, ${next.cost} wood` : 'A bonfire', next && wood >= next.cost ? () => upgrade(ring) : null), down];
        else if (b.kind === 'woodpile') items = () => (b.burning ? [item('Burning', null)] : [item(`Set alight, ${BUILD.woodpile.alight} wood`, wood >= BUILD.woodpile.alight ? () => setAlight(ring) : null), down]);
        else items = () => [item(`${BUILD.woodshed.wood} more wood a month`, null), down];
      }
      menuKey = key;
      menu.replaceChildren(...items());
      menu.style.display = '';
      const half = menu.offsetWidth / 2, top = b && b.kind === 'lantern' ? lampAt(ring).y : ring.y - 12 * k;
      menu.style.left = `${clamp(ring.x, half + 4, W - half - 4).toFixed(1)}px`;
      menu.style.top = `${Math.max(menu.offsetHeight + 4, top - 0.08 * H).toFixed(1)}px`;
    };
    const openMenu = (ring) => { menuFor = ring; menuKey = ''; preview = null; renderMenu(); };
    const closeMenu = () => { menuFor = null; menuKey = ''; preview = null; menu.style.display = 'none'; };

    // Stoking: the banner's stoke, a ring of warmth spreading from the cabin, and from February, sparks at the frost wraiths
    // nearest the chimney
    // The reminder to stoke, when it would help (NUDGE_IDLE, above); now: at once, as when a life has just been lost
    const nudge = (now) => {
      if (stoked >= NUDGE_STOKES || time < stokeAt + STOKE_EVERY || time - stokeAt < NUDGE_IDLE || time - lastNudge < NUDGE_EVERY) return;
      if (!now && !foes.some((f) => !f.dead && (f.flies ? Math.hypot(f.x - chimney.x, f.y - chimney.y) : Math.abs(f.x - middle.x)) < NUDGE_NEAR * H)) return;
      lastNudge = time;
      nudgeUntil = time + NUDGE_SHOW;
    };
    const stokeFire = () => {
      if (time < stokeAt + STOKE_EVERY) { pop(middle.x, middle.y - 0.3 * H, `Stoke again in ${Math.ceil(stokeAt + STOKE_EVERY - time)} s`, ICE); return; }
      stokeAt = time;
      stoked += 1;
      nudgeUntil = -Infinity;
      warmth.push({ age: 0, id: ++warmthId, reach: STOKE_REACH });
      const aimed = foes.filter((f) => f.flies && !f.dead && Math.hypot(f.x - chimney.x, f.y - chimney.y) <= SPARK_REACH * H)
        .sort((a, b) => nearness(a) - nearness(b)).slice(0, SPARKS);
      aimed.forEach((f, i) => sparks.push({ target: f, x: chimney.x, y: chimney.y, age: -i * 0.06, life: 0.4 }));
      sfx.stoke();
      if (aimed.length) sfx.sparks();
      if (options.stoke) options.stoke();
    };

    // A star falling toward the clearing, from high in the sky, at a slant
    const spawnStar = () => {
      const which = pickStar(), x0 = lerp(0.12, 0.88, Math.random()) * W, x1 = x0 + (Math.random() < 0.5 ? -1 : 1) * lerp(0.15, 0.4, Math.random()) * H;
      skyStars.push({ which, x0, y0: -0.04 * H, x1, y1: groundAt(x1) - 28 * k, x: x0, y: -0.04 * H, t: 0, dur: STAR_FALL * lerp(0.9, 1.1, Math.random()), caught: null, gone: 0 });
    };
    // Caught, a star is worth its points and flies to the nearest lantern without one, or with a cooler one
    const catchStar = (st) => {
      if (st.caught || st.gone) return;
      const S = STARS[st.which];
      points += S.points;
      counts.stars += 1;
      sfx.star(st.which);
      pop(st.x, st.y - 0.06 * H, `+${S.points}`, `rgb(${S.color})`);
      let to = null, far = Infinity;
      for (const ring of rings) {
        const b = ring.building;
        if (!b || b.kind !== 'lantern' || (b.star != null && STARS[b.star].heat >= S.heat)) continue;
        const lamp = lampAt(ring), d = Math.hypot(lamp.x - st.x, lamp.y - st.y) + (b.star != null ? W : 0);
        if (d < far) { far = d; to = ring; }
      }
      st.caught = { ring: to, x: st.x, y: st.y, t: 0 };
      if (!to) pop(st.x, st.y - 0.12 * H, 'No lantern to take its light', ICE);
      showScore();
    };

    // The months
    // The music for where the winter is: each month's (MONTH_MUSIC), the Largo between months, and Spring after the thaw
    const musicNow = () => {
      if (soundIsOn && audio) heard = true;
      if (phase === 'breather') startMusic('winter2');
      else if (phase === 'spring' || ending === 'spring') startMusic('spring');
      else if (phase === 'month') startMusic(...MONTH_MUSIC[monthIndex]);
    };
    soundSwitch.addEventListener('click', (e) => {
      e.stopPropagation();
      soundIsOn = !soundIsOn;
      try { localStorage.setItem(SOUND_KEY, soundIsOn ? '1' : '0'); } catch (x) { /* blocked */ }
      wakeAudio();
      showSound();
      sfx.build();
      if (soundIsOn) loadMusic(options.music || './cabin-music.js', () => { if (running) musicNow(); }); else stopMusic(0.2);
    });
    if (soundIsOn) loadMusic(options.music || './cabin-music.js', () => { if (running) musicNow(); });
    const startMonth = (i) => {
      if (!i) began = time;
      monthIndex = i;
      monthTime = 0;
      nextRank = i ? 0.8 : 2;
      nextWraith = MONTHS[i].wraiths ? 2.5 : Infinity;
      phase = 'month';
      phaseTime = 0;
      nextLink.style.display = 'none';
      if (i) sayThen(MONTHS[i].news, MONTHS[i].fact, 6000);
      else say(`${press} the cabin to stoke the fire, once every ${STOKE_EVERY} s`, 6000);
      sfx.horn();
      musicNow();
      showScore();
    };
    const updateNext = () => {
      const s = Math.max(1, Math.ceil(breatherLeft));
      nextLink.textContent = `${MONTHS[monthIndex + 1].name} in ${s} s. Start now, +${s * NEXT_WOOD} wood`;
    };
    const endMonth = () => {
      const gain = MONTH_POINTS * (monthIndex + 1);
      points += gain;
      pop(middle.x, middle.y - 0.42 * H, `${MONTHS[monthIndex].name} kept! +${number(gain)}`, GOLD);
      counts.kept += 1;
      sfx.kept();
      phase = 'breather';
      phaseTime = 0;
      breatherLeft = BREATHER;
      const shed = rings.find((r) => r.building && r.building.kind === 'woodshed'), more = shed ? BUILD.woodshed.wood : 0;
      wood += CORD + more;
      const back = lives < LIVES;
      lives = Math.min(LIVES, lives + 1);
      setFire();
      pop(middle.x, middle.y - 0.28 * H, `+${CORD + more} wood${back ? ' and a foxfire back' : ''}`, GOLD);
      const M = MONTHS[monthIndex + 1];
      card([M.name, M.says], '196 220 255', 600);
      say('');
      updateNext();
      nextLink.style.display = '';
      musicNow();
      showScore();
    };
    const thaw = () => {
      phase = 'spring';
      phaseTime = 0;
      const forLives = THAW_POINTS * Math.max(0, lives);
      points += forLives + wood;
      card(['Spring!', 'The fire kept all winter'], '159 245 220', 300, 3400);
      say('');
      pop(middle.x, middle.y - 0.28 * H, `+${number(forLives)} for ${lives} ${lives === 1 ? 'foxfire' : 'foxfires'} left`, GOLD);
      if (wood) pop(middle.x, middle.y - 0.14 * H, `+${number(wood)} for wood left`, GOLD);
      if (options.surge) options.surge();
      counts.kept += 1;
      musicNow();
      showScore();
    };

    // Input
    const typing = () => (document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) || document.querySelector('dialog[open]');
    const where = (e) => { const b = banner.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
    const onCabin = (p) => Math.hypot(p.x - middle.x, p.y - middle.y) < cabinHit;
    const ringAt = (p) => rings.find((r) => open(r) && Math.abs(p.x - r.x) < r.half && p.y > r.y - 0.36 * H && p.y < r.y + 0.14 * H);
    const starAt = (p) => skyStars.find((st) => !st.caught && !st.gone && Math.hypot(p.x - st.x, p.y - st.y) < Math.max(18, STAR_HIT * H));
    const pick = (p) => {
      const star = starAt(p);
      if (star) return { star };
      if (onCabin(p)) return { cabin: true };
      const ring = ringAt(p);
      return ring ? { ring } : null;
    };
    const onClick = (e) => {
      if (ending || menu.contains(e.target) || e.target === quit || e.target === nextLink) return;
      const p = where(e), got = pick(p), was = menuFor;
      closeMenu();
      if (!got) return;
      if (got.star) { catchStar(got.star); return; }
      if (got.cabin) { stokeFire(); return; }
      const ring = got.ring;
      if (was === ring) return;
      if (ring.building) { openMenu(ring); return; }
      const kinds = kindsFor(ring);
      if (kinds.length === 1) build(ring, kinds[0]); else openMenu(ring);
    };
    const onMove = (e) => {
      if (e.pointerType === 'touch' || ending) return;
      hover = pick(where(e));
      banner.style.cursor = hover ? 'pointer' : '';
    };
    const onLeave = () => { hover = null; };
    const onKey = (e) => {
      if (typing() || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        if (menuFor) closeMenu(); else leave('quit');
      } else if (e.code === 'Space') {
        // The space bar stokes, and never scrolls the page during a run, since scrolling the banner away would end it
        e.preventDefault();
        if (!ending && phase !== 'open') stokeFire();
      }
    };
    const onHidden = () => { if (document.hidden) { ending = ending || 'gone'; cleanup(); } };
    const onQuit = (e) => { e.stopPropagation(); leave('quit'); };
    const onNext = (e) => {
      e.stopPropagation();
      if (phase !== 'breather') return;
      const s = Math.max(1, Math.ceil(breatherLeft));
      wood += s * NEXT_WOOD;
      pop(middle.x, middle.y - 0.28 * H, `+${s * NEXT_WOOD} wood`, GOLD);
      startMonth(monthIndex + 1);
    };
    banner.addEventListener('click', onClick);
    banner.addEventListener('pointermove', onMove);
    banner.addEventListener('pointerleave', onLeave);
    window.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onHidden);
    quit.addEventListener('click', onQuit);
    nextLink.addEventListener('click', onNext);

    // Ending: the fire out, the thaw, quitting, or the banner gone, when everything stops at once. A winter kept or lost with
    // CREDITS_FROM points or more gets credits, as in the other games, and then the result line and, for people with the
    // review link, the high scores.
    const CREDITS_FROM = 300;
    let newBest = false, credited = false;
    const unburn = () => { banner.classList.remove('bn-burning'); banner.style.removeProperty('--bn-fire'); };
    // The fire, out, relights with a stoke, unless another run has taken it over
    const relight = () => {
      if (current || banner.classList.contains('bn-playing') || banner.classList.contains('bn-cabin-on')) return;
      unburn();
      if (options.stoke) options.stoke();
    };
    const leave = (why) => {
      if (ending) return;
      ending = why;
      phase = 'end';
      phaseTime = 0;
      fadeFrom = fieldAlpha;
      fadeFor = why === 'out' ? FADE * 1.4 : why === 'spring' ? FADE * 1.6 : FADE * 0.6;
      closeMenu();
      hintTimers.forEach(clearTimeout);
      nextLink.remove();
      quit.remove();
      banner.style.cursor = '';
      if (why === 'out') {
        lives = 0;
        setFire();
        stopMusic(1.5);
        sfx.out();
      } else if (why !== 'spring') stopMusic(0.6);
      if (why === 'idle' || !points) { say(''); return; }
      result = true;
      credited = (why === 'spring' || why === 'out') && points >= CREDITS_FROM;
      newBest = best > 0 && points > best;
      if (points > best) { try { localStorage.setItem(BEST_KEY, String(points)); } catch (e) { /* blocked */ } }
      const tail = newBest ? ', a new best!' : best ? `. Your best is ${number(Math.max(best, points))}.` : '.';
      const month = MONTHS[monthIndex].name;
      score.textContent = why === 'spring' ? `Spring! The fire kept all winter, with ${number(points)} points${tail}`
        : why === 'out' ? `The fire went out in ${month} with ${number(points)} points${tail}`
        : `The winter ended in ${month} with ${number(points)} points${tail}`;
      say(`${press} the cabin to play again`);
    };
    // The credits rise from behind the trees, in the pixel font, as in the other games; a click or tap skips them
    const rollCredits = (done) => {
      const played = Math.round(time - began);
      const rows = [...(newBest ? ['New best!', ''] : []), 'Winter at the cabin', ending === 'spring' ? 'Spring!' : `The fire went out in ${MONTHS[monthIndex].name}`, '',
        `Months kept ${counts.kept}`, ...(counts.soldier ? [`Soldiers melted ${counts.soldier}`] : []), ...(counts.brute ? [`Brutes broken ${counts.brute}`] : []),
        ...(counts.runner ? [`Runners melted ${counts.runner}`] : []), ...(counts.wraith ? [`Frost wraiths ${counts.wraith}`] : []), ...(counts.king ? ['Old Man Winter melted'] : []), '',
        ...(counts.lantern ? [`Lanterns lit ${counts.lantern}`] : []), ...(counts.firepit ? [`Fire pits ${counts.firepit}`] : []),
        ...(counts.alight ? [`Woodpiles burned ${counts.alight}`] : counts.woodpile ? [`Woodpiles ${counts.woodpile}`] : []), ...(counts.woodshed ? ['A woodshed'] : []),
        `Stokes ${stoked}`, ...(counts.stars ? [`Star lanterns ${counts.stars}`] : []), `Time ${Math.floor(played / 60)}:${String(played % 60).padStart(2, '0')}`, '', 'Final score', number(points), '',
        ...(heard ? ['Music', 'Vivaldi, The Four Seasons', 'Autumn and Winter from the', "Mutopia Project's edition,", 'CC BY-SA', ''] : []), 'Foxfires', 'The aurora in Finnish is', 'revontulet, fox fires', '', 'Thanks for playing'];
      const heads = new Set(['New best!', 'Winter at the cabin', 'Final score', 'Music', 'Foxfires']);
      const credits = labels.appendChild(Object.assign(document.createElement('div'), { className: 'bn-credits bn-cabin-credits' }));
      credits.replaceChildren(...rows.map((text) => (text ? Object.assign(document.createElement(heads.has(text) ? 'b' : 'span'), { textContent: text }) : document.createElement('i'))));
      const tall = credits.offsetHeight;
      const rise = credits.animate([{ opacity: 1, transform: `translate(-50%, ${H.toFixed(1)}px)` }, { opacity: 1, transform: `translate(-50%, ${(-tall).toFixed(1)}px)` }], { duration: (H + tall) / (H * 0.4) * 1000, easing: 'linear' });
      const skipHint = labels.appendChild(Object.assign(document.createElement('span'), { className: 'bn-skip', textContent: `${press} to skip` }));
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
      const skip = (e) => { e.stopImmediatePropagation(); e.preventDefault(); finish(); };
      banner.addEventListener('click', skip, true);
      rise.onfinish = finish;
    };
    // Then the result line, a new best's fanfare, the fire relit if it went out, and the high scores
    const afterwards = () => {
      score.style.visibility = '';
      hint.style.visibility = '';
      soundSwitch.remove();
      stopMusic(1.5);
      if (newBest) sfx.best();
      if (soundIsOn && audio) setTimeout(() => { if (!current && !music && audio) audio.suspend(); }, 3000);
      if (ending === 'out') setTimeout(relight, credited ? 400 : (OUT_DARK - fadeFor) * 1000);
      if (result) {
        linger([score, hint]);
        // For people with the review link, the shared high scores: any score opens them, a top ten one to enter initials, and
        // the line links to them. How far the run got goes beside the initials.
        if (window.auroraArcade) {
          const reached = ending === 'spring' ? 'Spring' : MONTHS[monthIndex].name;
          window.auroraArcade.gameEnded(points, { game: 'cabin', animal: reached }).then((shared) => {
            if (!shared || !score.isConnected) return;
            score.append(' ', Object.assign(document.createElement('span'), { textContent: 'High scores' }));
            score.classList.add('link');
            score.addEventListener('click', (e) => { e.stopPropagation(); window.auroraArcade.show('cabin'); });
          });
        }
      }
      if (onEnd) onEnd({ why: ending || 'gone', points, melted, lost, stoked });
    };
    const cleanup = () => {
      if (!running) return;
      running = false;
      current = null;
      hintTimers.forEach(clearTimeout);
      banner.removeEventListener('click', onClick);
      banner.removeEventListener('pointermove', onMove);
      banner.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onHidden);
      quit.removeEventListener('click', onQuit);
      nextLink.removeEventListener('click', onNext);
      cards.forEach((el) => el.remove());
      [layer, menu, nextLink, quit, ...(result ? [] : [score, hint])].forEach((el) => el.remove());
      banner.classList.remove('bn-cabin-on');
      banner.style.cursor = '';
      if (ending !== 'out') unburn();
      if (!ending || ending === 'gone') {
        // The banner gone: everything stops at once
        stopMusic(0.2);
        soundSwitch.remove();
        if (ending === 'gone' && lives <= 0) unburn();
        if (onEnd) onEnd({ why: 'gone', points, melted, lost, stoked });
        return;
      }
      if (credited) {
        score.style.visibility = 'hidden';
        hint.style.visibility = 'hidden';
        rollCredits(afterwards);
      } else afterwards();
    };

    const update = (dt) => {
      time += dt;
      phaseTime += dt;
      const M = MONTHS[monthIndex];
      if (phase === 'open') {
        fieldAlpha = smooth(clamp(phaseTime / OPENING, 0, 1));
        if (!built && phaseTime > IDLE) { leave('idle'); return; }
      } else if (phase === 'month') {
        fieldAlpha = 1;
        monthTime += dt;
        if (monthTime < M.seconds) {
          nextRank -= dt;
          if (nextRank <= 0) {
            const count = spawnRank(M);
            nextRank = lerp(M.every[0], M.every[1], monthTime / M.seconds) * lerp(0.75, 1.25, Math.random()) * (count > 1 ? 1.4 : 1);
          }
          nextWraith -= dt;
          if (nextWraith <= 0 && M.wraiths) {
            spawnWraith(M);
            nextWraith = lerp(M.wraiths[0], M.wraiths[1], monthTime / M.seconds) * lerp(0.8, 1.2, Math.random());
          }
        }
        if (monthIndex === MONTHS.length - 1 && !kingCame && monthTime >= KING_AT) spawnKing();
        nudge(false);
        if (monthTime >= M.seconds && !foes.length && !risers.length && (monthIndex < MONTHS.length - 1 || kingCame)) endMonth();
      } else if (phase === 'breather') {
        breatherLeft -= dt;
        if (breatherLeft <= 0) startMonth(monthIndex + 1); else updateNext();
      } else if (phase === 'spring') {
        if (phaseTime > SPRING_HOLD) leave('spring');
      } else if (phase === 'end') {
        fieldAlpha = fadeFrom * (1 - smooth(clamp(phaseTime / fadeFor, 0, 1)));
        if (phaseTime >= fadeFor) { cleanup(); return; }
      }
      const playing = phase === 'month' || phase === 'breather';
      // The buildings at work: lanterns shine on the one nearest the cabin within their reach, fire pits melt all of the
      // army on the ground near them, and burning woodpiles burn down
      for (const ring of rings) {
        const b = ring.building;
        if (!b) continue;
        if (b.kind === 'woodpile' && b.burning && time >= b.until && !b.out) b.out = time;
        if (b.out && time - b.out > 1.6) { ring.building = null; if (menuFor === ring) closeMenu(); continue; }
        if (!playing) continue;
        if (b.kind === 'lantern') {
          const L = BUILD.lantern.levels[b.level], lamp = lampAt(ring), reach = L.reach * H;
          const onKing = !!king && !king.dead && Math.hypot(king.x - lamp.x, king.y - lamp.y) <= reach + king.r;
          let target = onKing ? king : null;
          for (const f of foes) {
            if (onKing || f.dead || f.rise || time - f.born < 0.25 || (target && nearness(f) >= nearness(target))) continue;
            if (Math.hypot(f.x - lamp.x, f.y - lamp.y) <= reach + f.r) target = f;
          }
          b.target = target;
          if (target) hurt(target, L.melt * (b.star != null ? STARS[b.star].heat : 1) * dt);
        } else if (b.kind === 'firepit') {
          const F = BUILD.firepit.levels[b.level], fire = fireAt(ring), reach = F.reach * H;
          for (const f of foes) if (!f.dead && !f.flies && !f.rise && Math.hypot(f.x - fire.x, f.y - fire.y) <= reach + f.r) hurt(f, F.melt * dt);
        }
      }
      // Rings of warmth from a stoke or a flare: soldiers and runners melt as one passes, brutes lose half, and Old Man Winter
      // a little
      for (let i = warmth.length - 1; i >= 0; i--) {
        const w = warmth[i];
        w.age += dt;
        const reach = w.reach * H * smooth(clamp(w.age / STOKE_SPREAD, 0, 1));
        if (playing && w.age <= STOKE_SPREAD + dt) {
          for (const f of foes) {
            if (f.dead || f.stoked === w.id || Math.hypot(f.x - middle.x, f.y - middle.y) > reach) continue;
            f.stoked = w.id;
            hurt(f, f.kind === 'king' ? KING_STOKE * f.max : f.kind === 'brute' ? f.health / 2 : f.health, w.id);
          }
        }
        if (w.age > STOKE_SPREAD + 0.6) warmth.splice(i, 1);
      }
      // Sparks from a stoke, flying to the wraiths
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.age += dt;
        if (s.age >= s.life) { if (!s.target.dead) hurt(s.target, SPARK_HIT); sparks.splice(i, 1); }
      }
      // The army marches along the ridge toward the cabin, slowed where it clambers over a woodpile, and holds where it is as
      // a run ends; wraiths fly for the chimney
      for (let i = foes.length - 1; i >= 0; i--) {
        const f = foes[i];
        if (f.dead) { foes.splice(i, 1); continue; }
        f.heat = Math.max(0, f.heat - dt);
        if (f.flies) {
          if (playing) f.t += f.speed * H * dt / f.len;
          const t = Math.min(1, f.t), bx = lerp(f.sx, chimney.x, t), by = lerp(f.sy, chimney.y, t);
          const nx = -(chimney.y - f.sy) / f.len, ny = (chimney.x - f.sx) / f.len, weave = Math.sin(t * Math.PI * 3 + f.seed) * WEAVE * H * (1 - t);
          const x = bx + nx * weave, y = by + ny * weave;
          f.angle = Math.atan2(y - f.y, x - f.x) || f.angle;
          f.x = x;
          f.y = y;
          if (playing && !ending && f.t >= 1) reachCabin(f);
          continue;
        }
        const K = HOST[f.kind];
        if (f.rise) f.rise = Math.max(0, f.rise - dt);
        // Clambering over a woodpile, slowly, and burning while it does if the pile is alight
        let lift = 0, slow = 1;
        for (const ring of rings) {
          const b = ring.building;
          if (!b || b.kind !== 'woodpile' || b.out) continue;
          const half = BUILD.woodpile.half * H, dx = (f.x - ring.x) / half;
          if (Math.abs(dx) >= 1) continue;
          lift = Math.max(lift, BUILD.woodpile.tall * k * (1 - dx * dx));
          slow = BUILD.woodpile.slow;
          f.winded = time + BUILD.woodpile.after;
          if (b.burning && playing) hurt(f, BUILD.woodpile.melt * dt);
        }
        if (f.dead) continue;
        if (f.winded > time) slow = BUILD.woodpile.slow;
        f.lift = lift;
        if (playing && !f.rise) {
          const step = f.speed * slow * H * dt;
          f.x += f.dir * step;
          f.phase += step / (K.stride * K.tall * k) * TAU;
        }
        f.y = groundAt(f.x) - lift - 0.5 * K.tall * k;
        // Melting, it drips and steams
        if (f.heat > 0.1 && Math.random() < dt * 6) drips.push({ x: f.x + (Math.random() - 0.5) * f.r, y: f.y, vy: 0, floor: groundAt(f.x) });
        if (f.heat > 0.1 && Math.random() < dt * 2) steam.push({ x: f.x, y: f.y - f.r, r: f.r * 0.6, vx: 0, age: 0, life: 0.6 });
        if (playing && !ending && (f.dir > 0 ? f.x + f.r * 0.8 >= wall.x : f.x - f.r * 0.8 <= gable.x)) reachCabin(f);
      }
      // Near Old Man Winter, the melted rise again
      for (let i = risers.length - 1; i >= 0; i--) {
        const r = risers[i];
        if (time < r.at) continue;
        risers.splice(i, 1);
        if (!playing || !king || king.dead) continue;
        foes.push(makeWalker('soldier', { dir: r.dir, x: r.x, rise: 0.6 }));
        spray(r.x, groundAt(r.x) - 2, 8, '200,236,255');
      }
      // Stars fall now and then while the army marches; caught, one flies to its lantern; missed, it fades into the trees
      if (phase === 'month') {
        nextStar -= dt;
        if (nextStar <= 0) {
          spawnStar();
          nextStar = lerp(STAR_EVERY[0], STAR_EVERY[1], Math.random());
        }
      }
      for (let i = skyStars.length - 1; i >= 0; i--) {
        const st = skyStars[i];
        if (st.caught) {
          const c = st.caught;
          c.t += dt / 0.6;
          if (c.t >= 1) {
            if (c.ring && c.ring.building && c.ring.building.kind === 'lantern') {
              c.ring.building.star = st.which;
              c.ring.building.at = time;
              sparkle(c.ring.x, lampAt(c.ring).y);
              sfx.starlit();
            }
            skyStars.splice(i, 1);
          }
          continue;
        }
        if (st.gone) { st.gone += dt; if (st.gone > 0.5) skyStars.splice(i, 1); continue; }
        if (playing) st.t += dt / st.dur;
        const t = clamp(st.t, 0, 1);
        st.x = lerp(st.x0, st.x1, t);
        st.y = lerp(st.y0, st.y1, t * (0.7 + 0.3 * t));
        if (st.t >= 1) st.gone = dt;
      }
      // Snow falling as weather, drifting a little with the wind, the way the chimney's smoke leans
      for (const w of weather) {
        w.y += w.v * H * dt;
        w.x += (0.03 + 0.02 * Math.sin(time * 0.9 + w.seed)) * H * dt;
        if (w.y > H + 2) { w.y = -2; w.x = Math.random() * W; }
        if (w.x > W + 2) w.x = -2;
      }
      for (let i = remains.length - 1; i >= 0; i--) { remains[i].age += dt; if (remains[i].age >= 1.2) remains.splice(i, 1); }
      for (let i = drips.length - 1; i >= 0; i--) {
        const d = drips[i];
        d.vy += 1.4 * H * dt;
        d.y += d.vy * dt;
        if (d.y >= d.floor) drips.splice(i, 1);
      }
      for (let i = steam.length - 1; i >= 0; i--) {
        const s = steam[i];
        s.age += dt;
        if (s.age > 0) { s.y -= 0.16 * H * dt; s.x += s.vx * dt; }
        if (s.age >= s.life) steam.splice(i, 1);
      }
      for (let i = bits.length - 1; i >= 0; i--) {
        const b = bits[i];
        b.age += dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.vy += 0.9 * H * dt;
        b.vx *= 1 - 1.5 * dt;
        if (b.age >= b.life) bits.splice(i, 1);
      }
      for (let i = pops.length - 1; i >= 0; i--) { pops[i].age += dt; if (pops[i].age >= pops[i].life) pops.splice(i, 1); }
    };

    // Drawing
    const glowAt = (img, x, y, r, a, wide = 1) => {
      if (a <= 0.01) return;
      ctx.globalAlpha = a;
      ctx.drawImage(img, x - r * wide, y - r, 2 * r * wide, 2 * r);
    };
    const poly = (pts) => {
      ctx.beginPath();
      pts.forEach(([u, v], i) => { const p = onCabinAt(u, v); if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
    };
    const label = (text, x, y, color) => {
      ctx.font = `600 12px ${uiFont}`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#060D26';
      ctx.shadowBlur = 5 * dpr;
      const half = ctx.measureText(text).width / 2 + 6;
      ctx.fillStyle = color;
      ctx.fillText(text, clamp(x, half, W - half), y);
      ctx.shadowBlur = 0;
    };
    const flicker = (b) => 0.88 + 0.07 * Math.sin(time * 7.3 + b.flicker) + 0.05 * Math.sin(time * 12.9 + 2 * b.flicker);
    // Flames: tongues of fire from a base, flickering, in firelight's colors
    const flames = (x, y, width, height, count, seed, alpha) => {
      for (let i = 0; i < count; i++) {
        const fx = x + (i - (count - 1) / 2) * width / count, h = height * (0.65 + 0.35 * Math.sin(time * (9 + i * 1.7) + seed + i * 2.1)), w = width / count * 0.95;
        for (const [color, scale] of [['rgba(255,140,50,.85)', 1], ['rgba(255,214,120,.95)', 0.55]]) {
          ctx.globalAlpha = alpha;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(fx - w / 2 * scale, y);
          ctx.quadraticCurveTo(fx - w * 0.6 * scale, y - h * 0.45 * scale, fx + Math.sin(time * 6 + i + seed) * w * 0.25, y - h * scale);
          ctx.quadraticCurveTo(fx + w * 0.6 * scale, y - h * 0.45 * scale, fx + w / 2 * scale, y);
          ctx.closePath();
          ctx.fill();
        }
      }
    };
    // The reach of what a ring has, or would have: a lantern's around its lamp, a fire's around the fire, and the stretch of
    // ground a woodpile covers
    const reachOf = (ring, kind, level) => {
      ctx.fillStyle = 'rgba(255,200,130,.06)';
      ctx.strokeStyle = 'rgba(255,214,160,.38)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      if (kind === 'lantern') {
        const lamp = ring.building ? lampAt(ring) : { x: ring.x, y: ring.y - POST * k };
        ctx.arc(lamp.x, lamp.y, BUILD.lantern.levels[level].reach * H, 0, TAU);
      } else if (kind === 'firepit') {
        const fire = fireAt(ring);
        ctx.arc(fire.x, fire.y, BUILD.firepit.levels[level].reach * H, 0, TAU);
      } else if (kind === 'woodpile') {
        const half = BUILD.woodpile.half * H;
        ctx.rect(ring.x - half, ring.y - 0.12 * H, 2 * half, 0.14 * H);
      }
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
    };
    // The buildings
    const drawLantern = (ring, b, A) => {
      const lamp = lampAt(ring), postW = Math.max(1.3, 1.5 * k), grow = smooth(clamp((time - b.at) / 0.3, 0, 1));
      const post = ctx.createLinearGradient(0, lamp.y, 0, ring.y);
      post.addColorStop(0, '#7A5530');
      post.addColorStop(0.5, '#3A2616');
      post.addColorStop(1, '#1A120C');
      ctx.globalAlpha = A;
      ctx.fillStyle = post;
      ctx.fillRect(ring.x - postW / 2, lamp.y, postW, ring.y - lamp.y + 1);
      const gw = (3.8 + 0.7 * b.level) * k * (0.6 + 0.4 * grow), gh = (5 + 0.9 * b.level) * k * (0.6 + 0.4 * grow);
      ctx.fillStyle = '#1C140E';
      ctx.fillRect(lamp.x - gw / 2 - 0.6 * k, lamp.y - gh - 1.3 * k, gw + 1.2 * k, 1.3 * k);
      if (b.level === 2) { ctx.beginPath(); ctx.moveTo(lamp.x - gw / 2 - 1.4 * k, lamp.y - gh - 1.2 * k); ctx.lineTo(lamp.x, lamp.y - gh - 3.4 * k); ctx.lineTo(lamp.x + gw / 2 + 1.4 * k, lamp.y - gh - 1.2 * k); ctx.fill(); }
      ctx.fillRect(lamp.x - gw / 2 - 0.4 * k, lamp.y - 0.2 * k, gw + 0.8 * k, 0.9 * k);
      ctx.fillStyle = b.star != null ? `rgb(${STARS[b.star].color})` : '#FFE7B0';
      ctx.fillRect(lamp.x - gw / 2, lamp.y - gh, gw, gh);
    };
    // A fire pit: a ring of stones around a fire; a bonfire is taller, on crossed logs
    const drawFirepit = (ring, b, A) => {
      const big = b.level === 1, rx = (big ? 7.5 : 6) * k, ry = 1.8 * k;
      ctx.globalAlpha = A;
      if (big) {
        ctx.strokeStyle = '#3A2616';
        ctx.lineWidth = 1.8 * k;
        ctx.beginPath();
        ctx.moveTo(ring.x - 5 * k, ring.y - 0.5 * k);
        ctx.lineTo(ring.x + 4 * k, ring.y - 3.5 * k);
        ctx.moveTo(ring.x + 5 * k, ring.y - 0.5 * k);
        ctx.lineTo(ring.x - 4 * k, ring.y - 3.5 * k);
        ctx.stroke();
      }
      flames(ring.x, ring.y - 0.6 * k, (big ? 9 : 6) * k, (big ? 13 : 8) * k, big ? 5 : 3, b.flicker, A * 0.95);
      ctx.globalAlpha = A;
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * TAU, x = ring.x + Math.cos(a) * rx, y = ring.y + Math.sin(a) * ry;
        if (Math.sin(a) < -0.2) continue;
        ctx.fillStyle = '#3B3F4E';
        ctx.beginPath();
        ctx.ellipse(x, y, 1.6 * k, 1.1 * k, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,170,90,.35)';
        ctx.beginPath();
        ctx.ellipse(x, y - 0.5 * k, 1.1 * k, 0.5 * k, 0, 0, TAU);
        ctx.fill();
      }
    };
    // A woodpile: split logs stacked three, two, one, their cut ends showing; alight, with flames along its top, then embers
    const drawWoodpile = (ring, b, A) => {
      const r = 2.1 * k, fade = b.out ? 1 - clamp((time - b.out) / 1.6, 0, 1) : 1;
      ctx.globalAlpha = A * fade;
      for (const [row, count] of [[0, 3], [1, 2], [2, 1]]) {
        for (let i = 0; i < count; i++) {
          const x = ring.x + (i - (count - 1) / 2) * 2.1 * r, y = ring.y - r - row * 1.75 * r;
          ctx.fillStyle = b.out ? '#4A2010' : '#5A3D22';
          ctx.beginPath();
          ctx.arc(x, y, r, 0, TAU);
          ctx.fill();
          ctx.fillStyle = b.out ? 'rgba(255,120,50,.7)' : '#9C7448';
          ctx.beginPath();
          ctx.arc(x, y, r * 0.6, 0, TAU);
          ctx.fill();
        }
      }
      if (b.burning) flames(ring.x, ring.y - 5.6 * r, 7 * r * fade, 5 * r * fade * (b.out ? 0.5 : 1), 4, b.flicker, A * 0.9 * fade);
    };
    // A woodshed: a lean-to roof over stacked split wood
    const drawWoodshed = (ring, b, A) => {
      const x = ring.x, y = ring.y, w = 8 * k, h = 10 * k;
      ctx.globalAlpha = A;
      ctx.fillStyle = '#0B1330';
      ctx.fillRect(x - w, y - h * 0.8, 2 * w, h * 0.8);
      ctx.fillStyle = '#5A3D22';
      for (let row = 0; row < 3; row++) for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(x - w * 0.7 + i * w * 0.47, y - 1.6 * k - row * 2.4 * k, 1.1 * k, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = '#060B22';
      ctx.beginPath();
      ctx.moveTo(x - w - 1.5 * k, y - h * 0.75);
      ctx.lineTo(x + w + 1.5 * k, y - h * 1.05);
      ctx.lineTo(x + w + 1.5 * k, y - h * 0.9);
      ctx.lineTo(x - w - 1.5 * k, y - h * 0.62);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(150,170,230,.28)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x - w - 1.5 * k, y - h * 0.75);
      ctx.lineTo(x + w + 1.5 * k, y - h * 1.05);
      ctx.stroke();
    };
    // A figure of the army, slumping and fading as it melts, facing the way it marches, and rising from the ground if it has
    // just been raised
    const drawWalker = (f, A) => {
      const F = FIGURES[f.kind], left = clamp(f.health / f.max, 0, 1), shown = A * clamp((time - f.born) / 0.6, 0, 1) * (0.6 + 0.4 * left);
      if (shown <= 0.01) return;
      const gy = groundAt(f.x) + 0.5 - f.lift, tall = 0.62 + 0.38 * left, wide = 1 + 0.12 * (1 - left), [x0, y0, x1, y1] = F.box;
      const pose = frames[f.kind][((Math.floor(f.phase / TAU * WALK_FRAMES) % WALK_FRAMES) + WALK_FRAMES) % WALK_FRAMES];
      ctx.globalCompositeOperation = 'lighter';
      glowAt(look.cool, f.x, f.y, f.r * 2.2, shown * (f.kind === 'king' ? 0.4 : 0.15));
      if (f.heat > 0) glowAt(look.heat, f.x, f.y, f.r * 1.9, shown * 0.8 * f.heat / 0.2);
      ctx.globalCompositeOperation = 'source-over';
      ctx.save();
      if (f.rise) {
        // Rising from its snow: only what has risen above the ground shows
        const up = (1 - f.rise / 0.6) * (y1 - y0) * k;
        ctx.beginPath();
        ctx.rect(f.x - 20 * k, gy - up, 40 * k, up + 2);
        ctx.clip();
      }
      ctx.translate(f.x, gy);
      ctx.scale(f.dir * wide, tall);
      ctx.globalAlpha = shown;
      ctx.drawImage(pose, x0 * k, y0 * k, (x1 - x0) * k, (y1 - y0) * k);
      ctx.restore();
      ctx.globalCompositeOperation = 'lighter';
      glowAt(look.eyes, f.x + f.dir * F.eyes[0] * k * wide, gy + F.eyes[1] * k * tall, (f.kind === 'king' ? 5.6 : f.kind === 'brute' ? 4.4 : 3.6) * k, shown * (0.8 + 0.2 * Math.sin(time * 5 + f.seed)));
      ctx.globalCompositeOperation = 'source-over';
      // How much of Old Man Winter is left, over his crown
      if (f.kind === 'king' && left < 1) {
        const w = 0.22 * H, y = gy + y0 * k - 6;
        ctx.globalAlpha = A * 0.8;
        ctx.fillStyle = 'rgba(6,13,38,.7)';
        ctx.fillRect(f.x - w / 2, y, w, 3);
        ctx.fillStyle = 'rgb(200,236,255)';
        ctx.fillRect(f.x - w / 2, y, w * left, 3);
      }
    };
    // A frost wraith: a trail of mist behind a pale body, and eyes
    const drawWraith = (f, A) => {
      const left = clamp(f.health / f.max, 0, 1), shown = A * clamp((time - f.born) / 0.6, 0, 1) * (0.55 + 0.45 * left);
      if (shown <= 0.01) return;
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.angle);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 4; i >= 1; i--) glowAt(look.mist, -i * f.r * 0.85, Math.sin(time * 6 + i + f.seed) * f.r * 0.3, f.r * (1 - i * 0.14), shown * 0.3 * (1 - i / 5));
      glowAt(look.mist, 0, 0, f.r * 1.1, shown * 0.8, 1.5);
      if (f.heat > 0) glowAt(look.heat, 0, 0, f.r * 1.4, shown * 0.7 * f.heat / 0.2);
      glowAt(look.eyes, f.r * 0.55, -f.r * 0.2, f.r * 0.45, shown);
      glowAt(look.eyes, f.r * 0.55, f.r * 0.2, f.r * 0.4, shown);
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
    };
    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, layer.width, layer.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const A = fieldAlpha, chosen = menuFor || (hover && hover.ring);
      // The rings still free, faint on the ground: the woodshed's place from December, the right side's from January
      for (const ring of rings) {
        if (ring.building || !open(ring)) continue;
        const on = chosen === ring, rx = (ring.side === 'shed' ? 0.05 : 0.07) * H, ry = rx * 0.3;
        ctx.globalAlpha = A * (on ? 0.85 : 0.4);
        ctx.strokeStyle = on ? 'rgb(255,226,180)' : 'rgb(214,228,255)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(ring.x, ring.y + 0.5, rx, ry, 0, 0, TAU);
        ctx.stroke();
        if (on) { ctx.globalAlpha = A * 0.14; ctx.fillStyle = 'rgb(255,214,160)'; ctx.fill(); }
      }
      // The reach of the chosen ring's building, or of what an item in its menu would build, or of a new lantern in November
      if (chosen && A > 0.5) {
        ctx.globalAlpha = A;
        const b = chosen.building, kinds = kindsFor(chosen);
        if (b) reachOf(chosen, b.kind, b.level);
        else if (preview) reachOf(chosen, preview, 0);
        else if (kinds.length === 1 && kinds[0] !== 'woodshed') reachOf(chosen, kinds[0], 0);
      }
      // Firelight on the ground, then the buildings
      ctx.globalCompositeOperation = 'lighter';
      for (const ring of rings) {
        const b = ring.building;
        if (!b || b.kind === 'woodshed' || (b.kind === 'woodpile' && !b.burning)) continue;
        const f = flicker(b), size = b.kind === 'lantern' ? 0.05 + 0.012 * b.level : b.kind === 'firepit' ? 0.07 + 0.02 * b.level : 0.06;
        glowAt(look.pool, ring.x, ring.y, size * H, A * (b.kind === 'lantern' ? 0.5 : 0.7) * f, 4.2);
      }
      ctx.globalCompositeOperation = 'source-over';
      for (const ring of rings) {
        const b = ring.building;
        if (!b) continue;
        if (b.kind === 'lantern') drawLantern(ring, b, A);
        else if (b.kind === 'firepit') drawFirepit(ring, b, A);
        else if (b.kind === 'woodpile') drawWoodpile(ring, b, A);
        else drawWoodshed(ring, b, A);
      }
      // The cabin, frosting over with each life lost: a drift against its wall, rime along the roof and ice on the window
      const frost = (LIVES - Math.max(0, lives)) / LIVES;
      if (frost > 0 && A > 0) {
        ctx.globalAlpha = A * (0.15 + 0.6 * frost);
        ctx.strokeStyle = 'rgb(226,238,255)';
        ctx.lineWidth = Math.max(1, 1.1 * k);
        ctx.lineJoin = 'round';
        poly(ROOF);
        ctx.stroke();
        ctx.globalAlpha = A * 0.85 * frost;
        ctx.fillStyle = 'rgb(214,232,255)';
        poly(WINDOW);
        ctx.closePath();
        ctx.fill();
        const lostNow = LIVES - Math.max(0, lives), foot = onCabinAt(WALL - 0.5, 0.8);
        const rx = (2.5 + 1.6 * lostNow) * CABIN.k * k, ry = 1.1 * lostNow * CABIN.k * k, drift = ctx.createLinearGradient(0, foot.y - ry, 0, foot.y);
        drift.addColorStop(0, 'rgba(236,244,255,.95)');
        drift.addColorStop(1, 'rgba(176,198,236,.8)');
        ctx.globalAlpha = A;
        ctx.fillStyle = drift;
        ctx.beginPath();
        ctx.ellipse(foot.x, foot.y, rx, ry, 0, Math.PI, TAU);
        ctx.fill();
      }
      // Snow falling as weather
      const falling = Math.round(weather.length * MONTHS[shownIndex()].snow);
      ctx.fillStyle = 'rgb(236,242,255)';
      for (let i = 0; i < falling; i++) {
        const w = weather[i];
        ctx.globalAlpha = A * w.a;
        ctx.fillRect(w.x - w.size / 2, w.y - w.size / 2, w.size, w.size);
      }
      // The army, Old Man Winter behind it, and the wraiths above
      for (const f of foes) if (f.kind === 'king') drawWalker(f, A);
      for (const f of foes) if (!f.flies && f.kind !== 'king') drawWalker(f, A);
      for (const f of foes) if (f.flies) drawWraith(f, A);
      // Stars falling toward the clearing, each a glow in its color with a faint tail behind it, and caught ones flying to their
      // lanterns
      ctx.globalCompositeOperation = 'lighter';
      for (const st of skyStars) {
        const S = STARS[st.which];
        if (st.caught) {
          const c = st.caught, to = c.ring ? lampAt(c.ring) : { x: c.x, y: c.y - 0.3 * H }, t = smooth(clamp(c.t, 0, 1));
          const x = lerp(c.x, to.x, t), y = lerp(c.y, to.y, t) - Math.sin(Math.PI * t) * 0.12 * H;
          glowAt(look.stars[st.which], x, y, 4.5 * k * (1 - 0.3 * t), A * (c.ring ? 1 : 1 - t));
          continue;
        }
        const fade = st.gone ? 1 - st.gone / 0.5 : clamp(st.t / 0.08, 0, 1), dx = st.x1 - st.x0, dy = st.y1 - st.y0, len = Math.hypot(dx, dy) || 1;
        ctx.globalAlpha = A * fade * 0.7;
        const tail = ctx.createLinearGradient(st.x, st.y, st.x - dx / len * 0.2 * H, st.y - dy / len * 0.2 * H);
        tail.addColorStop(0, `rgba(${S.color},.8)`);
        tail.addColorStop(1, `rgba(${S.color},0)`);
        ctx.strokeStyle = tail;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(st.x, st.y);
        ctx.lineTo(st.x - dx / len * 0.2 * H, st.y - dy / len * 0.2 * H);
        ctx.stroke();
        glowAt(look.stars[st.which], st.x, st.y, 8.5 * k * (0.9 + 0.12 * Math.sin(time * 9 + st.x0)), A * fade);
      }
      ctx.globalCompositeOperation = 'source-over';
      // What melted ones leave for a moment: a heap of snow, and the last of the light in their eyes
      for (const m of remains) {
        const t = m.age / 1.2;
        ctx.globalAlpha = A * (1 - t);
        ctx.drawImage(look.mound, m.x - m.w / 2, m.gy - m.w * 0.42, m.w, m.w * 0.42);
        if (m.age < 0.6) {
          ctx.globalCompositeOperation = 'lighter';
          glowAt(look.eyes, m.ex, m.ey + m.age * 0.05 * H, 2.6 * k, A * (1 - m.age / 0.6));
          ctx.globalCompositeOperation = 'source-over';
        }
      }
      // Light: the rays from lamps to what they're melting, the lamps' and fires' glow, and sparks flying to the wraiths
      ctx.globalCompositeOperation = 'lighter';
      for (const ring of rings) {
        const b = ring.building;
        if (!b) continue;
        const f = flicker(b);
        if (b.kind === 'lantern') {
          const lamp = lampAt(ring);
          if (b.target && !b.target.dead && A > 0) {
            const t = b.target, ray = ctx.createLinearGradient(lamp.x, lamp.y, t.x, t.y);
            ray.addColorStop(0, 'rgba(255,224,170,0)');
            ray.addColorStop(0.3, 'rgba(255,214,150,.4)');
            ray.addColorStop(1, 'rgba(255,200,130,.8)');
            ctx.globalAlpha = A * f;
            ctx.strokeStyle = ray;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(lamp.x, lamp.y - 2 * k);
            ctx.lineTo(t.x, t.y);
            ctx.stroke();
          }
          glowAt(look.glow, lamp.x, lamp.y - 2.5 * k, (9.5 + 3.5 * b.level) * k, A * 0.9 * f);
          // A star lantern shines in its star's color, and twinkles
          if (b.star != null) glowAt(look.stars[b.star], lamp.x, lamp.y - 2.5 * k, (8 + 3 * b.level) * k * (0.9 + 0.15 * Math.sin(time * 5 + b.flicker)), A * 0.95);
        } else if (b.kind === 'firepit') {
          glowAt(look.glow, ring.x, ring.y - 4 * k, (14 + 6 * b.level) * k, A * 0.75 * f);
        } else if (b.kind === 'woodpile' && b.burning) {
          glowAt(look.glow, ring.x, ring.y - 9 * k, 14 * k, A * 0.7 * f * (b.out ? 1 - clamp((time - b.out) / 1.6, 0, 1) : 1));
        }
      }
      for (const s of sparks) {
        if (s.age <= 0) continue;
        const t = s.age / s.life, x = lerp(s.x, s.target.x, t), y = lerp(s.y, s.target.y, t) - Math.sin(Math.PI * t) * 0.15 * H;
        glowAt(look.glow, x, y, 4 * k, A);
      }
      // A stoke's ring of warmth, and whether the fire is ready to stoke again: a glow around the cabin while it is, and an
      // arc filling while it builds back
      for (const w of warmth) {
        const t = clamp(w.age / (STOKE_SPREAD + 0.6), 0, 1), reach = w.reach * H * smooth(clamp(w.age / STOKE_SPREAD, 0, 1));
        ctx.globalAlpha = A * 0.9 * (1 - t);
        ctx.strokeStyle = 'rgba(255,190,110,.35)';
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.arc(middle.x, middle.y, reach, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,226,170,.9)';
        ctx.lineWidth = 2;
        ctx.stroke();
        glowAt(look.glow, middle.x, middle.y, 0.45 * H * w.reach, A * 0.5 * (1 - t));
      }
      if (phase === 'month' || phase === 'breather') {
        const ready = clamp((time - stokeAt) / STOKE_EVERY, 0, 1);
        if (ready >= 1) glowAt(look.glow, middle.x, middle.y, cabinHit * 1.6, A * (time < nudgeUntil ? 0.5 + 0.2 * Math.sin(time * 7) : 0.22 + 0.1 * Math.sin(time * 4.4)));
        else {
          ctx.globalAlpha = A * 0.55;
          ctx.strokeStyle = 'rgb(255,206,140)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(middle.x, middle.y, cabinHit + 3, -Math.PI / 2, -Math.PI / 2 + TAU * ready);
          ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      // Steam rising from melting snow, drips, and sparks and ice
      for (const s of steam) {
        if (s.age <= 0) continue;
        const t = s.age / s.life;
        glowAt(look.steam, s.x, s.y, s.r * (1 + 1.4 * t), A * 0.7 * (1 - t));
      }
      ctx.fillStyle = 'rgb(200,224,255)';
      for (const d of drips) {
        ctx.globalAlpha = A * 0.85;
        ctx.fillRect(d.x - 0.5, d.y - 0.8, 1, 1.6);
      }
      for (const b of bits) {
        ctx.globalAlpha = A * 0.95 * (1 - b.age / b.life);
        ctx.fillStyle = `rgb(${b.color})`;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size / 2, 0, TAU);
        ctx.fill();
      }
      // What a click would do, on a screen with a pointer
      if (hover && !menuFor && A > 0.5 && !ending) {
        ctx.globalAlpha = A;
        // (not in the moment after a stoke, which shows for itself)
        if (hover.cabin && phase !== 'open' && time - stokeAt > 1.2) {
          const wait = Math.ceil(stokeAt + STOKE_EVERY - time);
          label(wait > 0 ? `Stoke again in ${wait} s` : 'Stoke the fire', middle.x, middle.y - cabinHit - 8, 'rgb(255,226,190)');
        } else if (hover.ring && !hover.ring.building) {
          const kinds = kindsFor(hover.ring), only = kinds.length === 1 ? kinds[0] : null, cost = only && costOf(only);
          const text = !only ? `${press} to build` : only === 'woodshed' ? `Woodshed, ${cost} wood: ${BUILD.woodshed.wood} more wood a month` : wood >= cost ? `${BUILD[only].name}, ${cost} wood` : `${BUILD[only].name} needs ${cost} wood`;
          label(text, hover.ring.x, hover.ring.y - 0.3 * H, !only || wood >= cost ? 'rgb(255,226,190)' : 'rgb(206,226,255)');
        }
      }
      // The first falling star says what it's for
      if (counts.stars) starHinted = true;
      const first = !starHinted && skyStars.find((st) => !st.caught && !st.gone);
      if (first && A > 0.5 && !ending) {
        ctx.globalAlpha = A * clamp(first.t / 0.1, 0, 1);
        label(`${press} the falling star to light a lantern with it`, first.x, Math.max(48, first.y - 0.08 * H), `rgb(${STARS[first.which].color})`);
        if (first.t > 0.95) starHinted = true;
      }
      // The reminder to stoke, over the cabin, pulsing with its glow and fading as it ends
      if (time < nudgeUntil && A > 0.5 && !ending && !(hover && hover.cabin)) {
        ctx.globalAlpha = A * clamp((nudgeUntil - time) / 0.4, 0, 1) * (0.8 + 0.2 * Math.sin(time * 7));
        label(`${press} the cabin to stoke the fire`, middle.x, middle.y - cabinHit - 8, 'rgb(255,226,190)');
      }
      // Points and lives, rising from where they happened
      ctx.font = `600 13px ${uiFont}`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#060D26';
      ctx.shadowBlur = 5 * dpr;
      for (const p of pops) {
        const half = ctx.measureText(p.text).width / 2 + 6;
        ctx.globalAlpha = clamp((p.life - p.age) * 1.8, 0, 1) * Math.max(A, phase === 'end' ? 1 : 0);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, clamp(p.x, half, W - half), Math.max(52, p.y - p.age * 20));
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

  window.auroraCabin = { start, stop: () => current && current.leave('quit') };
})();

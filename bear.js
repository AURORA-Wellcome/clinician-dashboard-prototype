// A second banner game, as a rough playable version for judging how it feels: the Great Bear comes down from the sky to run,
// double jump and roll across the landscape, catching stars and eating berries and honey while dodging bees. Its seven stars
// come down dim, and catching falling stars relights them, one stage at a time; with all seven relit before dawn it goes home
// to the sky, which unlocks the fox. Five stings, or dawn, end a run sooner. The camera doesn't move, because a moving
// foreground can bring on motion sickness (DESIGN.md), so the banner is the level. Loaded only when someone starts it, or has
// already unlocked an animal.
(() => {
  const STEP = 1 / 120, TAU = Math.PI * 2;
  // How it feels. All distances are in units of the banner's height / 216, so it plays the same at any size.
  const AIR_DRAG = 300;
  // Fast rolling runs on energy: it lasts about a second, and comes back in about four while walking
  const ROLL_SECONDS = 1.1, ROLL_RECOVERY = 4, ROLL_START_COST = 0.12, ROLL_READY_AGAIN = 0.35;
  // A quick second press of ← or → (two within DASH_TAP seconds) dashes that way, at DASH_SPEED times running speed for a moment:
  // on the ground, or once a jump in the air, where it holds its height. Jumping during a dash keeps its speed, for a long jump.
  // Then a short wait before the next. A quick sideways swipe does it on a touch screen.
  const DASH_TAP = 0.25, DASH_SECONDS = 0.4, DASH_SPEED = 2.5, DASH_AGAIN = 0.45, DASH_LEAN = 0.14, DASH_TRAIL = 0.16;
  const GRAVITY = 1900, FALL_MORE = 1.45, RELEASE_MORE = 2.4, MAX_FALL = 980;
  const COYOTE = 0.09, BUFFER = 0.12, FLIP = 0.36, TUCK_UNTIL = 0.72;
  // Five lives, as in the shooting star game: three felt hard
  const LIVES = 5, HURT_SECONDS = 1.5;
  // A run is one night, in seven stages, one for each of the animal's seven stars, which come down from the sky dim. Each star
  // caught in a stage flies up to a big star taking shape in a clear part of the sky and becomes one of its seven points
  // (POINTS). With all seven, the big star flies to its place in the constellation and relights it, and the stage gives back a
  // life and is worth 250 points for each star relit so far. Relighting all seven before dawn brings the animal home. Each
  // stage brings one new thing, so the extras come one at a time. star: seconds between falling stars. slow: how far they
  // lean toward slow stars, as the exponent on a random number, so 1 is even. bee: seconds between bees, 0 for none.
  const POINTS = 7;
  const STAGES = [
    { name: 'Dubhe', star: 1.1, slow: 2, bee: 0, says: 'Catch 7 falling stars' },
    { name: 'Merak', star: 1.05, slow: 1.8, bee: 0, says: 'Roll under the log' },
    { name: 'Phecda', star: 1, slow: 1.6, bee: 5, says: 'The bees are awake' },
    { name: 'Megrez', star: 0.95, slow: 1.45, bee: 4.3, says: 'Grab honey, then outrun the bees' },
    { name: 'Alioth', star: 0.9, slow: 1.3, bee: 3.8, says: 'Ride the airliner' },
    { name: 'Mizar', star: 0.85, slow: 1.15, bee: 3.3, says: 'Bump the moon' },
    { name: 'Alkaid', star: 0.75, slow: 1, bee: 2.6, says: 'The last star' }
  ];
  // The stages that bring bees, honey and the bouncing star, the airliner and the satellite, moon gravity, and bees that swoop
  const BEES_FROM = STAGES.findIndex((s) => s.bee), HONEY_FROM = 3, VISITORS_FROM = 4, MOON_FROM = 5, SWOOP_FROM = 6, SWOOP_SHARE = 0.35;
  // The night runs from 9 PM to 6 AM in NIGHT_SECONDS of play, not counting the breathers between stages. Dawn's glow brightens
  // over its last 40%, a warning comes at 5 AM, and each minute of night left on getting home is worth 10 points. In tests, bots
  // that went for every star got home in 72 to 91 s, and bots that missed a third of the bees and ignored nearly half the stars
  // in 94 to 141 s, and with seven stars a stage, in 70 to 88 s and 100 to 112 s; people won't place themselves as well.
  const NIGHT_SECONDS = 150, NIGHT_STARTS = 21, NIGHT_HOURS = 9, DAWN_GLOW = 0.4, NIGHT_MINUTE_POINTS = 10;
  const RELIGHT_POINTS = 250, BREATHER = 2.5, HOME_SECONDS = 2.2, SLEEP_SECONDS = 2.8;
  // Alcor, Mizar's faint companion and a traditional test of eyesight, is a bonus for whoever spots it in Mizar's stage. ALCOR_TURN:
  // the angle from the line to Alkaid to the line to Alcor, from both stars' positions in the sky.
  const ALCOR_STAGE = STAGES.findIndex((s) => s.name === 'Mizar'), ALCOR_POINTS = 500, ALCOR_GAP = 9, ALCOR_TURN = 75.6 * Math.PI / 180;
  const BERRY_POINTS = 25, HONEY_POINTS = 150, PLANE_POINTS = 100, SATELLITE_POINTS = 500;
  const CHASE_SPEED = 245, CHASE_SECONDS = 5, PLANE_SPEED = 115, PLANE_UP = 108;
  // Honey gives a honey rush: every animal runs at RUSH_TOP at least, enough to outrun the angry swarm, and jumps higher. The
  // swarm first rises out of the pot and gathers, and on a narrow banner, with less room to run, it gives up sooner. If no bee
  // stings before it gives up, escaping it is worth a bonus. Every seven berries make a full belly, which gives back a life, or
  // with every life lit is worth points.
  const RUSH_SECONDS = 5, RUSH_TOP = 315, RUSH_JUMP = 1.12, CHASE_RISE = 0.45, CHASE_CLIMB = 350, CHASE_CLIMB_TOP = 130, ESCAPE_POINTS = 300, BELLY = 7, BELLY_POINTS = 250;
  // Each berry makes the animal a little bigger for the rest of the run (GROW_EACH), up to a quarter bigger at GROW_BERRIES
  // berries, and a sting takes GROW_STING berries' worth back off, so a player who keeps getting stung shrinks into a target
  // that's easier to keep safe. Each starts at its own size (ANIMALS' start: the bear a little smaller than it was drawn
  // before growing came in, since a quarter bigger made it quite large). Bigger, it reaches farther for stars but is a
  // bigger target for bees; it runs and jumps as before, so berries don't turn into a trap. What it fits through stays as at
  // the start, since the level is tuned to a few units (STAND and LOW): it lands, and meets the log, at that size; curled
  // up, sliding or in its shell, it reaches and is stung at that size, and the bear's ball is drawn that size again to
  // match, since the log has only a few units to spare; and the heights it reaches food at don't grow, so food on the
  // bridges stays out of reach from the ground. Even a quarter bigger than ANIMALS' sizes, the highest bees would pass over
  // a standing bear. Bears fatten up on berries before winter, so the bear's belly rounds out as well; the fox grows a
  // fuller winter coat; and the crab, which can only grow by molting, grows at each full belly, stepping out of its old
  // shell, which it leaves behind for SHED_SECONDS.
  const GROW_EACH = 0.025, GROW_BERRIES = 10, GROW_STING = 3, BIGGEST = 1 + GROW_EACH * GROW_BERRIES, SHED_SECONDS = 3;
  // The bridges of stars move at the start of each stage from Merak's, as the log does. Each goes where it fits: LEDGE_SIDE or
  // more in from the banner's sides; LEDGE_GAP or more from a bridge of its height, so the two read as two, but only
  // LEDGE_STEP from one of the other height, which its height sets apart; and LEDGE_MOVE or more from where any bridge of its
  // height was, so the stage looks new, or failing that, on a phone, LEDGE_MOVE_LEAST. It goes only over ground about as
  // level as under the first stage's bridges: nowhere under it, or within 20 of its ends, more than LEDGE_DIP lower than under
  // its middle, so it's no harder to jump up to (for its first few hours, a bridge could land over a dip, up to 118 above
  // the ground, out of reach of a double jump pressed early). Its stars fly there in LEDGE_FLY seconds, plus one for
  // every LEDGE_FLY_PER units it goes, leaving LEDGE_STAGGER apart, the one in front first.
  const LEDGE_SIDE = 30, LEDGE_GAP = 40, LEDGE_STEP = 10, LEDGE_MOVE = 150, LEDGE_MOVE_LEAST = 60, LEDGE_DIP = 4;
  const LEDGE_FLY = 0.6, LEDGE_FLY_PER = 1800, LEDGE_STAGGER = 0.02;
  // The cabin: the animal can land on its roof, and landing there stokes the fire, as a click on the cabin does outside the
  // games, with the chimney's puff of smoke and sparks. A thick cloud of smoke rises from the chimney for SMOKE_SECONDS, and
  // smoke calms bees, as a beekeeper's does: a bee that flies into it, an angry swarm's too, forgets the animal and drifts off,
  // worth SWAT_POINTS. A calmed swarm counts as escaped. Then the fire needs STOKE_AGAIN seconds to build back. In the scene's
  // units, ROOF is the roof's ridge, a little wider than drawn so a landing is forgiving, and CHIMNEY where its smoke starts.
  const SMOKE_SECONDS = 6, STOKE_AGAIN = 20, ROOF = { x: 1150.6, y: 207.3, w: 26 }, CHIMNEY = { x: 1139.7, y: 201.9 };
  // Riding the airliner earns air miles, by the distance flown: 5 points every 0.25 s at its usual speed
  const MILE_SECONDS = 0.25, MILE_POINTS = 5;
  // The longer the ride, the faster it flies, turning at the banner's edges while it has a rider, until at three times its
  // speed (in about 11 s) it breaks the sound barrier. Its engines shed slow stars to catch on the way.
  const PLANE_ACCEL = 20, PLANE_TOP = 3 * PLANE_SPEED, BOOM_POINTS = 500, EXHAUST_EVERY = 0.9, EXHAUST_LIMIT = 10;
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
    // A gain starts at full strength, so it's silenced at once: a source can start a fraction of a sample early, and its first
    // sample would come through at full strength, a click
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
  const noiseBuffer = () => {
    if (!noiseData) {
      noiseData = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
      const samples = noiseData.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    }
    return noiseData;
  };
  const noise = (ms, level, from = 420, to = 70) => {
    if (!soundIsOn || !audio) return;
    const start = audio.currentTime, end = start + ms / 1000, source = audio.createBufferSource(), low = audio.createBiquadFilter(), gain = audio.createGain();
    gain.gain.value = 0;
    source.buffer = noiseBuffer();
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
    // The honey rush kicking in, the swarm escaped, and a full belly
    rush: () => [0, 5, 10, 15].forEach((n, i) => tone(note(n + 12), 70, { type: 'square', level: 0.03, delay: 160 + i * 40 })),
    escape: () => [7, 12, 16, 19, 24].forEach((n, i) => tone(note(n), 110, { type: 'square', level: 0.04, delay: i * 60 })),
    // A dash: a rush of air falling away, over a quick rising note
    dash: () => { noise(170, 0.07, 3400, 700); tone(260, 110, { to: 560, type: 'triangle', level: 0.03 }); },
    belly: () => [0, 4, 7, 12].forEach((n, i) => tone(note(n + 5), 150, { level: 0.09, delay: i * 80 })),
    // The crab's old shell cracking open, and it stepping out
    molt: () => { noise(120, 0.08, 3200, 900); tone(note(7), 140, { to: note(14), type: 'triangle', level: 0.05, delay: 360 }); },
    sting: () => { tone(200, 260, { to: 110, type: 'sawtooth', level: 0.06 }); noise(200, 0.2, 260, 60); },
    bonk: (step) => tone(note(-12 + Math.min(step, 6) * 2), 140, { to: note(Math.min(step, 6) * 2), type: 'square', level: 0.05 }),
    swat: () => noise(110, 0.16, 1400, 220),
    // The fire stoked from the roof: a rush of flame and a warm rising call; and bees calmed by its smoke, a soft falling hum
    stoke: () => { noise(520, 0.12, 900, 140); [0, 5, 9].forEach((n, i) => tone(note(n - 12), 170, { type: 'triangle', level: 0.05, delay: 60 + i * 80 })); },
    calm: () => tone(note(7), 360, { to: note(0), type: 'sine', level: 0.05 }),
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
    best: () => [0, 4, 7, 12, 16].forEach((n, i) => tone(note(n), 260, { level: 0.12, delay: i * 110 })),
    boom: () => { noise(650, 0.3, 900, 40); tone(140, 520, { to: 38, type: 'square', level: 0.05 }); },
    // A star relit, higher for each stage; its light reaching the sky; dawn coming; home; asleep; and Alcor spotted
    relight: (n) => [0, 4, 7, 12].forEach((s, i) => tone(note(s + n), 220, { level: 0.09, delay: i * 70 })),
    point: (k) => tone(note(12 + PENTATONIC[k]), 90, { type: 'sine', level: 0.04 }),
    lit: () => tone(note(24), 420, { to: note(26), type: 'sine', level: 0.06 }),
    dawn: () => [0, 1].forEach((i) => tone(note(-5), 300, { type: 'sine', level: 0.09, delay: i * 380 })),
    home: () => [0, 4, 7, 12, 16, 19, 24, 28].forEach((n, i) => tone(note(n), 320, { level: 0.1, delay: i * 110 })),
    sleep: () => [7, 4, 0, -5].forEach((n, i) => tone(note(n), 420, { type: 'sine', level: 0.08, delay: i * 240 })),
    alcor: () => [19, 24, 28, 31].forEach((n, i) => tone(note(n), 150, { type: 'sine', level: 0.06, delay: i * 70 }))
  };
  // Music during a run, with sound on, made here like the other sounds: a tune for each animal, written for the game rather
  // than taken from another. The bear's is in the style of classic platform games, a square-wave lead over a triangle bass and
  // soft drums, 16 bars in A minor at 144 beats a minute, so about 27 s before it repeats. The fox's is bright, silly dance-pop
  // in the spirit of "What Does the Fox Say?" but not its tune: 16 bars in G major at 128 beats a minute, about 30 s, with a
  // kick on every beat, a filtered saw bass on the offbeats, a bouncy lead and yips, quick rising squeaks, for the fox's calls.
  // Both play a little faster while the airliner being ridden speeds up.
  // MUSIC_LEVEL keeps it under the sound effects, which the compressor on the output brings up along with it
  const MUSIC_BASS = [0, 12, 0, 12, 0, 12, 7, 12], MUSIC_LEVEL = 0.6;
  // Each bar: its chord's root, a MIDI note for the bass, and the melody as [note, eighths], null for a rest
  const TUNE = [
    [45, [[76, 2], [81, 2], [79, 1], [76, 1], [74, 1], [76, 1]]], [41, [[77, 2], [76, 1], [74, 1], [72, 2], [69, 2]]],
    [36, [[67, 2], [72, 2], [76, 1], [74, 1], [72, 1], [76, 1]]], [43, [[74, 3], [null, 1], [71, 2], [67, 2]]],
    [45, [[76, 2], [81, 2], [79, 1], [76, 1], [74, 1], [76, 1]]], [41, [[77, 2], [81, 2], [79, 1], [77, 1], [76, 1], [77, 1]]],
    [43, [[79, 2], [77, 1], [76, 1], [74, 2], [71, 1], [74, 1]]], [40, [[76, 3], [null, 1], [80, 2], [83, 2]]],
    [41, [[84, 2], [81, 1], [77, 1], [84, 2], [81, 2]]], [43, [[83, 2], [79, 1], [74, 1], [83, 2], [79, 2]]],
    [40, [[83, 2], [79, 1], [76, 1], [79, 2], [83, 2]]], [45, [[84, 2], [83, 1], [81, 1], [76, 4]]],
    [38, [[77, 2], [76, 1], [74, 1], [81, 2], [77, 2]]], [43, [[79, 2], [77, 1], [74, 1], [71, 2], [74, 2]]],
    [36, [[76, 2], [79, 2], [84, 2], [83, 1], [81, 1]]], [40, [[80, 4], [76, 2], [71, 2]]]
  ];
  // The fox's, in the same form, with 'yip' after a note that's a yip. Eight bars of G, D, Em and C, then eight of Em, C, G
  // and D, where the yips come in.
  const FOX_TUNE = [
    [43, [[null, 1], [71, 1], [74, 1], [null, 1], [79, 1], [null, 1], [74, 1], [71, 1]]], [38, [[69, 1], [null, 1], [78, 1], [null, 1], [81, 2], [78, 1], [74, 1]]],
    [40, [[79, 1], [null, 1], [76, 1], [null, 1], [71, 2], [76, 1], [79, 1]]], [36, [[76, 2], [74, 1], [72, 1], [74, 3], [null, 1]]],
    [43, [[null, 1], [71, 1], [74, 1], [null, 1], [79, 1], [81, 1], [83, 2]]], [38, [[81, 1], [78, 1], [74, 1], [78, 1], [81, 2], [null, 2]]],
    [40, [[79, 1], [76, 1], [71, 1], [76, 1], [79, 1], [83, 1], [81, 1], [79, 1]]], [36, [[76, 2], [79, 2], [74, 4]]],
    [40, [[76, 1, 'yip'], [76, 1, 'yip'], [null, 1], [79, 1, 'yip'], [null, 1], [83, 1], [81, 1], [79, 1]]], [36, [[72, 1, 'yip'], [72, 1, 'yip'], [null, 1], [76, 1, 'yip'], [null, 1], [79, 1], [76, 1], [72, 1]]],
    [43, [[71, 1, 'yip'], [71, 1, 'yip'], [null, 1], [74, 1, 'yip'], [null, 1], [79, 1], [78, 1], [79, 1]]], [38, [[81, 2], [78, 1], [74, 1], [69, 2], [null, 1], [74, 1, 'yip']]],
    [40, [[76, 1, 'yip'], [79, 1, 'yip'], [83, 1, 'yip'], [null, 1], [83, 1], [81, 1], [79, 1], [76, 1]]], [36, [[72, 1, 'yip'], [76, 1, 'yip'], [79, 1, 'yip'], [null, 1], [79, 1], [76, 1], [74, 1], [72, 1]]],
    [43, [[71, 1], [74, 1], [79, 1], [74, 1], [83, 2], [81, 1], [79, 1]]], [38, [[78, 2], [81, 2], [86, 1, 'yip'], [null, 1], [86, 1, 'yip'], [null, 1]]]
  ];
  // The crab's, in the same form: calypso, in F major at 112 beats a minute, about 34 s, its lead like a steel drum
  const CRAB_TUNE = [
    [41, [[72, 1], [null, 1], [69, 1], [72, 1], [null, 1], [77, 2], [null, 1]]], [48, [[76, 1], [74, 1], [72, 1], [null, 1], [67, 2], [72, 1], [null, 1]]],
    [46, [[74, 1], [null, 1], [70, 1], [74, 1], [null, 1], [77, 2], [74, 1]]], [48, [[72, 3], [null, 1], [67, 1], [69, 1], [70, 1], [72, 1]]],
    [41, [[77, 1], [null, 1], [76, 1], [77, 1], [null, 1], [81, 2], [77, 1]]], [50, [[74, 2], [69, 1], [74, 1], [null, 1], [77, 2], [74, 1]]],
    [43, [[70, 1], [74, 1], [79, 1], [null, 1], [77, 1], [74, 1], [70, 2]]], [48, [[72, 4], [null, 2], [67, 1], [69, 1]]],
    [41, [[72, 1], [69, 1], [65, 1], [69, 1], [72, 2], [77, 1], [null, 1]]], [46, [[74, 1], [null, 1], [77, 1], [74, 1], [70, 2], [null, 2]]],
    [41, [[69, 1], [72, 1], [77, 1], [null, 1], [81, 1], [79, 1], [77, 2]]], [48, [[76, 2], [72, 1], [null, 1], [67, 2], [null, 2]]],
    [50, [[74, 1], [null, 1], [77, 1], [81, 1], [null, 1], [79, 1], [77, 1], [74, 1]]], [46, [[74, 2], [70, 1], [null, 1], [77, 2], [74, 1], [70, 1]]],
    [48, [[72, 1], [76, 1], [79, 1], [null, 1], [84, 2], [79, 1], [76, 1]]], [41, [[77, 4], [null, 1], [72, 1], [69, 1], [65, 1]]]
  ];
  // For the grand finale, Vivaldi's Spring: the opening of the first concerto of The Four Seasons (1725), long in the public
  // domain, played here like the other tunes. Its tune, by sixteenth note from the upbeat, [note, sixteenths]; then the same
  // again, softer, as an echo, over a bass driving in eighths and a harpsichord's chords on the beat, at 100 beats a minute.
  const SPRING_PHRASE = [[76, 2], [80, 2], [80, 2], [80, 2], [78, 1], [76, 1], [83, 6], [83, 1], [81, 1], [80, 2], [80, 2], [80, 2], [78, 1], [76, 1], [83, 6], [83, 1], [81, 1],
    [80, 2], [81, 2], [83, 2], [81, 2], [80, 2], [78, 2], [76, 2]];
  const SPRING_STEPS = (() => {
    const steps = Array.from({ length: 96 }, () => ({}));
    [0, 48].forEach((from) => {
      let at = from;
      SPRING_PHRASE.forEach(([n, len]) => { steps[at].tune = [n, len]; at += len; });
      // E, then under the turn at the end A's C sharp and the dominant's B, and E again
      for (let p = 0; p < 48; p += 2) steps[from + p].bass = p === 40 ? 49 : p === 42 || p === 44 ? 47 : 52;
      for (let p = 2; p < 48; p += 4) steps[from + p].chord = p === 42 ? [63, 66, 71] : [64, 68, 71];
      for (let p = 0; p < 48; p++) steps[from + p].soft = from > 0;
    });
    return steps;
  })();
  // A tune by eighth note: the bar's root, where in the bar, and any melody note starting there
  const stepsOf = (tune) => tune.flatMap(([root, line]) => {
    const leads = Array(8).fill(null);
    let at = 0;
    line.forEach(([n, len, yip]) => { if (n) leads[at] = [n, len, yip]; at += len; });
    return leads.map((lead, e) => ({ root, e, lead }));
  });
  let music = null;
  const midiHz = (n) => 440 * 2 ** ((n - 69) / 12);
  // A note. to: a pitch it slides to as it starts, for a yip. cutoff: a low-pass filter, to round off a saw.
  const musicTone = (freq, at, dur, type, level, { to, cutoff } = {}) => {
    const osc = audio.createOscillator(), gain = audio.createGain();
    gain.gain.value = 0;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, at + Math.min(0.07, dur * 0.6));
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level, at + 0.008);
    gain.gain.exponentialRampToValueAtTime(level * 0.5, at + dur * 0.8);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    if (cutoff) {
      const low = audio.createBiquadFilter();
      low.type = 'lowpass';
      low.frequency.value = cutoff;
      osc.connect(low).connect(gain);
    } else osc.connect(gain);
    gain.connect(music.out);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  };
  // Drums: a kick, and noise with its lows cut away for the rest: [where the cut is, how long, how loud]
  const DRUMS = { snare: [1800, 0.09, 0.05], clap: [1200, 0.12, 0.045], hat: [7000, 0.03, 0.014], open: [6500, 0.07, 0.016], rim: [2600, 0.025, 0.035], shaker: [6000, 0.045, 0.011], jingle: [8000, 0.06, 0.02] };
  const musicDrum = (at, kind, kickLevel = 0.08) => {
    const gain = audio.createGain();
    gain.gain.value = 0;
    gain.connect(music.out);
    if (kind === 'kick') {
      const osc = audio.createOscillator();
      osc.frequency.setValueAtTime(140, at);
      osc.frequency.exponentialRampToValueAtTime(45, at + 0.09);
      gain.gain.setValueAtTime(kickLevel, at);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.1);
      osc.connect(gain);
      osc.start(at);
      osc.stop(at + 0.12);
      return;
    }
    const [cut, len, level] = DRUMS[kind], source = audio.createBufferSource(), high = audio.createBiquadFilter();
    source.buffer = noiseBuffer();
    high.type = 'highpass';
    high.frequency.value = cut;
    gain.gain.setValueAtTime(level, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + len);
    source.connect(high).connect(gain);
    source.start(at, Math.random() * 0.5);
    source.stop(at + len + 0.02);
  };
  const SONGS = {
    bear: { bpm: 144, steps: stepsOf(TUNE), play: ({ root, e, lead }, at, eighth) => {
      musicTone(midiHz(root + MUSIC_BASS[e]), at, eighth * 0.8, 'triangle', 0.07);
      if (lead) musicTone(midiHz(lead[0]), at, lead[1] * eighth * 0.9, 'square', 0.02);
      if (e === 0 || e === 4) musicDrum(at, 'kick');
      else if (e === 2 || e === 6) musicDrum(at, 'snare');
      if (e % 2) musicDrum(at, 'hat');
    } },
    // Four on the floor: a kick on every beat, a clap on the second and fourth, and an open hat between. The bass pumps on the
    // offbeats, up an octave on the last; the lead is short and bouncy; and a yip slides up from a fourth below its note to a
    // step above it.
    fox: { bpm: 128, steps: stepsOf(FOX_TUNE), play: ({ root, e, lead }, at, eighth) => {
      if (e % 2) musicTone(midiHz(root + (e === 7 ? 12 : 0)), at, eighth * 0.75, 'sawtooth', 0.05, { cutoff: 700 });
      if (lead) {
        const [n, len, yip] = lead;
        if (yip) musicTone(midiHz(n - 5), at, Math.min(0.13, eighth * 0.6), 'square', 0.024, { to: midiHz(n + 2) });
        else musicTone(midiHz(n), at, len * eighth * (len > 1 ? 0.85 : 0.55), 'square', 0.02);
      }
      if (e % 2 === 0) musicDrum(at, 'kick');
      if (e === 2 || e === 6) musicDrum(at, 'clap');
      if (e % 2) musicDrum(at, 'open');
    } },
    // The bass on a 3-3-2 rhythm, root, root and fifth; a lead like a steel drum, a sine with a fainter octave over it, quick to
    // fade; a soft kick on the beat, a rim on the offbeats of the 3-3-2, and a shaker on every eighth
    crab: { bpm: 112, steps: stepsOf(CRAB_TUNE), play: ({ root, e, lead }, at, eighth) => {
      if (e === 0 || e === 3 || e === 6) musicTone(midiHz(root + (e === 6 ? 7 : 0)), at, eighth * 1.4, 'triangle', 0.055);
      if (lead) {
        const [n, len] = lead, dur = Math.min(len, 2) * eighth * 0.95;
        musicTone(midiHz(n), at, dur, 'sine', 0.042);
        musicTone(midiHz(n + 12), at, dur * 0.5, 'sine', 0.015);
      }
      if (e === 0 || e === 4) musicDrum(at, 'kick', 0.05);
      if (e === 3 || e === 6) musicDrum(at, 'rim');
      musicDrum(at, 'shaker');
    } },
    // Strings, a saw softened by a low-pass filter, for the tune and the bass, and a harpsichord's quick square-wave chords
    spring: { bpm: 100, per: 4, steps: SPRING_STEPS, play: ({ tune, bass, chord, soft }, at, sixteenth) => {
      const v = soft ? 0.45 : 1;
      if (tune) musicTone(midiHz(tune[0]), at, tune[1] * sixteenth * 0.92, 'sawtooth', 0.035 * v, { cutoff: 2600 });
      if (bass) musicTone(midiHz(bass), at, sixteenth * 1.6, 'sawtooth', 0.052 * v, { cutoff: 700 });
      if (chord) chord.forEach((n) => musicTone(midiHz(n), at, 0.28, 'square', 0.012 * v, { cutoff: 3000 }));
    } }
  };
  // While the animal is invincible, from the bouncing star, its tune turns to bells: the melody an octave up on a glockenspiel,
  // a twinkling run up and down through each bar's root, fifth and octave over two octaves, sleigh bells shaken on the
  // offbeats, and the bass and drums as they were, 20% faster. Each animal's tune does this, so it stays the same piece, made
  // special.
  const STAR_TEMPO = 1.2, STAR_RUN = [24, 31, 36, 43, 48, 43, 36, 31];
  // A struck bar: its note, ringing longest, and two higher partials, out of tune with it as a bar's are, which die away fast
  const BELL_PARTIALS = [[1, 1, 1], [2.76, 0.35, 0.32], [5.4, 0.1, 0.14]];
  const bell = (n, at, ring, level) => BELL_PARTIALS.forEach(([ratio, share, lasts]) => {
    const osc = audio.createOscillator(), gain = audio.createGain(), end = at + ring * lasts;
    gain.gain.value = 0;
    osc.type = 'sine';
    osc.frequency.value = midiHz(n) * ratio;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level * share, at + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain).connect(music.out);
    osc.start(at);
    osc.stop(end + 0.02);
  });
  const starBells = ({ root, e, lead }, at, eighth) => {
    if (lead) bell(lead[0] + 12, at, Math.max(0.5, lead[1] * eighth * 1.6), 0.05);
    bell(root + STAR_RUN[e], at, 0.4, 0.02);
    // (A shake: two quick hits of high noise)
    if (e % 2) { musicDrum(at, 'jingle'); musicDrum(at + 0.035, 'jingle'); }
  };
  // Notes are scheduled a little ahead, so a busy frame doesn't make them late
  const startMusic = (kind) => {
    if (music || !soundIsOn || !audio) return;
    const song = SONGS[kind] || SONGS.bear, out = audio.createGain();
    // It fades in, which is gentler, and keeps its first notes from coming through louder while the compressor settles
    out.gain.setValueAtTime(0, audio.currentTime);
    out.gain.linearRampToValueAtTime(MUSIC_LEVEL, audio.currentTime + 2.5);
    out.connect(audioOut);
    music = { out, step: 0, at: audio.currentTime + 0.1, tempo: 1, timer: 0, star: false };
    const plan = () => {
      if (!music || music.out !== out) return;
      if (music.at < audio.currentTime) music.at = audio.currentTime + 0.05;
      while (music.at < audio.currentTime + 0.3) {
        const step = 60 / song.bpm / (song.per || 2) / music.tempo, s = song.steps[music.step];
        // (An animal's tune, by eighth note with a root, can turn to bells; the finale's can't, and needn't)
        if (music.star && s.root !== undefined) {
          song.play({ ...s, lead: null }, music.at, step);
          starBells(s, music.at, step);
        } else song.play(s, music.at, step);
        music.at += step;
        music.step = (music.step + 1) % song.steps.length;
      }
    };
    music.timer = setInterval(plan, 80);
    plan();
  };
  const stopMusic = (fade) => {
    if (!music) return;
    clearInterval(music.timer);
    const { out } = music;
    music = null;
    out.gain.setTargetAtTime(0.0001, audio.currentTime, Math.max(0.01, fade / 4));
    setTimeout(() => out.disconnect(), fade * 1000 + 600);
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
  // The animals' own constellations, for the sky and the stars they come down from, scaled to a height of 1, from the top left.
  // A fox's face, from the front: ear, inner ear, inner ear, ear, cheek, nose, cheek.
  const FOX_SKY = [[0, 0], [0.3, 0.34], [0.7, 0.34], [1, 0], [0.93, 0.56], [0.5, 1], [0.07, 0.56]];
  // Cancer as in the sky, never mirrored, from its stars' right ascension and declination, north up, in the order the crab's
  // stages relight them: Acubens (alpha), Tarf (beta), Asellus Borealis (gamma), Asellus Australis (delta), Tegmine (zeta),
  // Iota Cancri, and Praesepe, the Beehive Cluster, between the two Aselli, the donkeys at its manger
  const CRAB_SKY = [[0, 0.864], [0.507, 1], [0.183, 0.373], [0.167, 0.542], [0.559, 0.568], [0.143, 0], [0.219, 0.464]];
  const CRAB_NAMES = ['Acubens', 'Tarf', 'Asellus Borealis', 'Asellus Australis', 'Tegmine', 'Iota Cancri', 'Praesepe'];
  // How each is drawn in the sky: its lines, by star, its colors, its brighter stars, and a star that's a cluster
  const SKY_ANIMALS = {
    fox: { spots: FOX_SKY, lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0]], line: '#FFCF9A', star: '#FFF1DC', glow: '#FFD9A0', bright: [0, 3, 5] },
    crab: { spots: CRAB_SKY, lines: [[5, 2], [2, 3], [3, 1], [3, 0]], line: '#A8F5E6', star: '#EAFFFA', glow: '#B4FFEC', bright: [1, 3, 5], cluster: 6 }
  };
  // What makes each animal different. top: how tall it is, for the banner's ceiling. reach: what it can touch, more than its
  // body so catching feels generous, with food on a bridge out of reach from the ground. sting: what a bee can hit, less than
  // its body so a near miss stays a miss. low: while curled up, tuck: during a flip, when it is a smaller target. start: the
  // size it starts a run at, as a share of these (1 if not given), before berries make it grow.
  const ANIMALS = {
    bear: {
      // A little smaller to begin with, since a quarter bigger made it quite large: fully grown, it's about 6% bigger than these
      start: 0.85,
      run: 225, accel: 1700, friction: 2200, airAccel: 1300, roll: 620, boost: 240, rollAccel: 1500, rollFriction: 260, tired: 150,
      jump: 80, double: 52, stride: 76, stand: { hw: 30, h: 56 }, low: { hw: 15, h: 30 }, top: 66, edge: 64, dust: 34,
      reach: { hw: 46, top: 74, food: 60 }, lowReach: { r: 26, y: 15 }, sting: { hw: 32, top: 58 }, lowSting: { r: 17, y: 15 }, tuckSting: { r: 30, y: 45 },
      turnAt: [-4, -45.5], shadow: 'rgba(150,185,255,.95)', glow: [[0, 'rgba(140,175,255,.5)'], [0.45, 'rgba(120,130,255,.14)'], [1, 'rgba(120,130,255,0)']], bestKey: 'aurora-bear-best',
      back: Object.values(BACK_STARS),
      title: 'The Great Bear', who: 'The Great Bear', short: 'bear', names: STAGES.map((st) => st.name), unlocks: 'fox', tint: 'rgba(235,242,255,.55)', card: '169 193 255',
      again: 'the Big Dipper', homeHint: 'Bring the Great Bear home to unlock a new animal',
      keys: '← and → to run (twice quickly to dash), ↑ or Space to jump (twice for a double jump), ↓ to roll, Esc to quit', taps: 'Tap to jump, tap again to double jump, and swipe down to roll'
    },
    // Quicker and lighter, a smaller target that also catches less. Its stars run along its spine.
    fox: {
      run: 300, accel: 2400, friction: 2600, airAccel: 1900, roll: 400, boost: 120, rollAccel: 1400, rollFriction: 420, tired: 170,
      jump: 104, double: 44, stride: 62, stand: { hw: 22, h: 40 }, low: { hw: 20, h: 24 }, top: 62, edge: 48, dust: 26,
      reach: { hw: 30, top: 48, food: 36 }, lowReach: { r: 20, y: 10 }, sting: { hw: 20, top: 38 }, lowSting: { r: 12, y: 10 }, tuckSting: { r: 20, y: 30 },
      turnAt: [-1, -30], shadow: 'rgba(255,170,90,.95)', glow: [[0, 'rgba(255,180,110,.5)'], [0.45, 'rgba(255,130,80,.14)'], [1, 'rgba(255,120,80,0)']], bestKey: 'aurora-fox-best',
      back: [[-24, -30], [-16, -33], [-8, -31], [-1, -29], [6, -31], [13, -31], [20, -27]], pounce: 78, foxFires: true,
      title: 'The Little Fox', who: 'The fox', short: 'fox', names: null, unlocks: 'crab', tint: 'rgba(255,226,190,.55)', card: '255 214 160',
      again: "the fox's stars", homeHint: 'Bring the fox home to unlock a new animal', says: { 1: 'Slide under the log' },
      keys: '← and → to run (twice quickly to dash), ↑ or Space to jump (twice for a double jump), ↓ to pounce in the air or slide on the ground, Esc to quit',
      taps: 'Tap to jump, tap again to double jump, and swipe down to pounce or slide'
    },
    // Low and wide. It scuttles sideways, so it never turns around; it's short enough to walk under the log, jumps short, and
    // catches wide with its claws. Down pulls it into its shell, where it can't move but stings bounce off. Cancer's stars lie
    // across its shell.
    crab: {
      run: 240, accel: 2000, friction: 2600, airAccel: 1400, roll: 0, boost: 0, rollAccel: 0, rollFriction: 3200, tired: 0,
      jump: 50, double: 34, stride: 34, stand: { hw: 28, h: 28 }, low: { hw: 26, h: 18 }, top: 40, edge: 56, dust: 22,
      reach: { hw: 58, top: 50, food: 34 }, lowReach: { r: 22, y: 9 }, sting: { hw: 24, top: 26 }, lowSting: { r: 0, y: 9 }, tuckSting: { r: 20, y: 18 },
      turnAt: [0, -16], shadow: 'rgba(130,240,220,.95)', glow: [[0, 'rgba(120,235,215,.5)'], [0.45, 'rgba(90,200,220,.14)'], [1, 'rgba(90,200,220,0)']], bestKey: 'aurora-crab-best',
      back: CRAB_SKY.map(([fx, fy]) => [(fy - 0.5) * 30, -15 + (fx - 0.28) * 16]), sideways: true, shell: true, molts: true,
      title: 'The Crab', who: 'The crab', short: 'crab', names: CRAB_NAMES, unlocks: null, tint: 'rgba(190,255,236,.55)', card: '159 245 220',
      again: "the crab's stars", says: { 1: 'Walk under the log', 6: 'The Beehive Cluster' },
      keys: '← and → to scuttle (twice quickly to dash), ↑ or Space to jump (twice for a double jump), ↓ to pull into its shell, Esc to quit',
      taps: 'Tap to jump, tap again to double jump, and swipe down to pull into its shell'
    }
  };
  // Bringing the Great Bear home brings the fox, and bringing the fox home the crab: its stars appear in the sky, and clicking
  // them starts the game as that animal
  const ANIMALS_KEY = 'aurora-animals', FOX_FIRES_EVERY = 10, FOX_FIRES_POINTS = 250, SWAT_POINTS = 25;
  const FOX_BODY = new Path2D('M-26-19C-32-26-29-36-18-36C-8-37 2-33 12-35C19-37 24-32 24-25C24-20 14-17 2-16C-8-15-20-14-26-19Z');
  // The animals brought home in this browser. The first time all three are, the grand finale plays.
  const HOMES_KEY = 'aurora-homes';
  const allHome = () => { try { const list = (localStorage.getItem(HOMES_KEY) || '').split(','); return Object.keys(ANIMALS).every((kind) => list.includes(kind)); } catch (e) { return false; } };
  const bringHome = (kind) => {
    let list = [];
    try { list = (localStorage.getItem(HOMES_KEY) || '').split(',').filter(Boolean); } catch (e) { return false; }
    if (list.includes(kind)) return false;
    try { localStorage.setItem(HOMES_KEY, [...list, kind].join(',')); } catch (e) { return false; }
    return Object.keys(ANIMALS).every((other) => other === kind || list.includes(other));
  };
  const unlockedAnimals = () => { try { return (localStorage.getItem(ANIMALS_KEY) || '').split(',').filter(Boolean); } catch (e) { return []; } };
  const unlockAnimal = (name) => {
    const list = unlockedAnimals();
    if (!list.includes(name)) { try { localStorage.setItem(ANIMALS_KEY, [...list, name].join(',')); } catch (e) { /* blocked */ } }
  };
  const STYLE = `
.bn-bear-layer{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none}
.bn-fireworks{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.bn-bear-dawn{position:absolute;inset:0;pointer-events:none;opacity:0;background:linear-gradient(0deg,rgb(160 172 240/.75),rgb(160 172 240/0) 62%)}
.bn-bear-on{cursor:default;touch-action:none}
.bn-bear-on .bn-labels,.bn-bear-finale .bn-labels{z-index:2}
.bn-bear-on .bn-figure,.bn-bear-on .bn-label-dipper,.bn-bear-on .bn-label-north,.bn-bear-on .bn-meteor,.bn-bear-on .bn-plane,.bn-bear-on .bn-sat{visibility:hidden}
.bn-animal-sky{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.bn-animal-sky .lines{opacity:.45;transition:opacity .5s}
.bn-animal-sky g.on .lines{opacity:1}
.bn-as-fox .bn-animal-sky .fox,.bn-as-crab .bn-animal-sky .crab{visibility:hidden}
.bn-animal-label{position:absolute;left:0;top:0;opacity:0;font-size:.8125rem;line-height:1;letter-spacing:.02em;color:#FFDDB0;text-shadow:0 0 6px #060D26,0 0 2px #060D26;white-space:nowrap;transition:opacity .6s}
.bn-animal-label.crab{color:#C4FFF0}
.bn-animal-label.on{opacity:1}
.bn-bear-on .bn-animal-label{opacity:0}
.bn-bear-hint,.bn-bear-quit{position:absolute;font-size:.75rem;line-height:1;color:rgba(232,238,255,.9);text-shadow:0 0 4px #04071A,0 0 2px #04071A;white-space:nowrap}
.bn-bear-hint{left:50%;top:30px;transform:translateX(-50%);transition:opacity .8s}
.bn-wave.bn-bear-wave{top:max(26%,46px)}
.bn-bear-score{position:absolute;left:50%;top:10px;transform:translateX(-50%);font-size:.8125rem;font-weight:600;line-height:1;color:rgba(232,238,255,.95);text-shadow:0 0 4px #04071A,0 0 2px #04071A;white-space:nowrap}
.bn-bear-quit{right:0;top:0;padding:10px 12px 8px;cursor:pointer;pointer-events:auto}
.bn-bear-score.link{pointer-events:auto;cursor:pointer}
.bn-bear-sound{position:absolute;right:0;bottom:0;display:flex;align-items:center;gap:5px;padding:8px 12px;font-size:.8125rem;line-height:1;color:rgba(232,238,255,.9);text-shadow:0 0 4px #04071A;cursor:pointer;pointer-events:auto}
.bn-bear-sound svg{flex:none;filter:drop-shadow(0 0 2px #04071A)}
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
  // The unlocked animals' constellations, side by side left of the Big Dipper, where even a phone has room: the crab's, then the
  // fox's, each in a group of its own, with a label under it
  let skyBoxes = [], skyWatching = false, skyTimer = 0;
  const svgEl = (tag, attrs) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  };
  const drawSky = (banner) => {
    addStyle();
    let sky = banner.querySelector('.bn-animal-sky');
    const b = banner.getBoundingClientRect(), left = banner.querySelector('.bn-dipper-stars').getBoundingClientRect().left - b.left;
    const kinds = ['crab', 'fox'].filter((kind) => unlockedAnimals().includes(kind)), labels = banner.querySelector('.bn-labels');
    const aspect = (kind) => Math.max(...SKY_ANIMALS[kind].spots.map(([fx]) => fx)), widths = kinds.reduce((sum, kind) => sum + aspect(kind), 0);
    // As tall as a quarter of the banner, or less where they'd crowd, with a gap of 16 px around each
    const size = Math.min(b.height * 0.24, (left - 16 * (kinds.length + 1)) / (widths || 1)), gap = (left - widths * size) / (kinds.length + 1);
    skyBoxes = [];
    labels.querySelectorAll('.bn-animal-label').forEach((el) => { if (!kinds.includes(el.dataset.kind)) el.remove(); });
    if (!kinds.length || size < 20) { if (sky) sky.remove(); labels.querySelectorAll('.bn-animal-label').forEach((el) => el.remove()); return; }
    if (!sky) {
      sky = svgEl('svg', { class: 'bn-animal-sky', 'aria-hidden': 'true', focusable: 'false' });
      banner.querySelector('.bn-sky').after(sky);
    }
    sky.replaceChildren();
    let x0 = gap;
    kinds.forEach((kind) => {
      const look = SKY_ANIMALS[kind], y0 = b.height * 0.1, wide = aspect(kind) * size, spots = look.spots.map(([fx, fy]) => [x0 + fx * size, y0 + fy * size]);
      const group = sky.appendChild(svgEl('g', { class: kind, 'data-kind': kind })), defs = group.appendChild(svgEl('defs', {}));
      const soft = defs.appendChild(svgEl('radialGradient', { id: `bn-animal-glow-${kind}` }));
      soft.append(svgEl('stop', { offset: 0, 'stop-color': look.glow, 'stop-opacity': 0.6 }), svgEl('stop', { offset: 1, 'stop-color': look.glow, 'stop-opacity': 0 }));
      const lines = group.appendChild(svgEl('g', { class: 'lines', stroke: look.line, 'stroke-opacity': 0.75, 'stroke-width': 0.9, 'stroke-linecap': 'round' }));
      look.lines.forEach(([a, c]) => lines.append(svgEl('line', { x1: spots[a][0].toFixed(1), y1: spots[a][1].toFixed(1), x2: spots[c][0].toFixed(1), y2: spots[c][1].toFixed(1) })));
      spots.forEach(([x, y], i) => {
        group.append(svgEl('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 5.5, fill: `url(#bn-animal-glow-${kind})` }));
        // A cluster is a few faint stars together, around the one the game uses
        if (look.cluster === i) [[-2.2, -1.1], [1.9, -1.6], [2.4, 1.2], [-1.4, 2], [0.3, -2.6]].forEach(([dx, dy]) => group.append(svgEl('circle', { cx: (x + dx).toFixed(1), cy: (y + dy).toFixed(1), r: 0.6, fill: look.star })));
        group.append(svgEl('circle', { 'data-sky-star': i, cx: x.toFixed(1), cy: y.toFixed(1), r: look.bright.includes(i) ? 1.7 : look.cluster === i ? 0.8 : 1.3, fill: look.star }));
      });
      skyBoxes.push({ kind, l: x0 - 14, r: x0 + wide + 14, t: y0 - 12, b: y0 + size + 12 });
      const label = labels.querySelector(`.bn-animal-label[data-kind="${kind}"]`) || labels.appendChild(Object.assign(document.createElement('span'), { className: `bn-animal-label ${kind}` }));
      label.dataset.kind = kind;
      label.textContent = `${matchMedia('(hover: none)').matches ? 'Tap' : 'Click'} to play as ${kind === 'fox' ? 'the Little Fox' : 'the Crab'}`;
      label.style.transform = `translate(${Math.max(8, x0 - 8).toFixed(1)}px, ${(y0 + size + 10).toFixed(1)}px)`;
      x0 += wide + gap;
    });
  };
  // An animal's label and lines, or every animal's; for a while, or until shown otherwise
  const showSkyLabel = (banner, ms, kind) => {
    clearTimeout(skyTimer);
    const parts = [...banner.querySelectorAll('.bn-animal-label, .bn-animal-sky g[data-kind]')];
    parts.forEach((el) => el.classList.toggle('on', !!kind && el.dataset.kind === kind));
    if (ms) skyTimer = setTimeout(() => parts.forEach((el) => el.classList.remove('on')), ms);
  };
  const animalAt = (x, y) => { const hit = skyBoxes.find((s) => x >= s.l && x <= s.r && y >= s.t && y <= s.b); return hit ? hit.kind : null; };
  const showAnimals = (banner, announce) => {
    if (!unlockedAnimals().length) return;
    drawSky(banner);
    if (!skyWatching) {
      skyWatching = true;
      window.addEventListener('resize', () => drawSky(banner));
      let over = null;
      banner.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        const b = banner.getBoundingClientRect(), now = current ? null : animalAt(e.clientX - b.left, e.clientY - b.top);
        if (now !== over) { const was = over; over = now; showSkyLabel(banner, now ? 0 : 1000, now || was); }
      });
    }
    // When the page opens, the label of the animal unlocked last, so two labels don't overlap
    if (announce && skyBoxes.length) showSkyLabel(banner, 6000, unlockedAnimals().filter((kind) => SKY_ANIMALS[kind]).pop());
  };
  const start = (banner, onEnd, options = {}) => {
    if (current) return;
    const kind = ANIMALS[options.kind] ? options.kind : 'bear', A = ANIMALS[kind], finaleOnly = !!options.finaleOnly;
    // Its size at the start of the run, which is the size of what it fits through for the whole run (GROW_EACH): its body for
    // the log and for landing (STAND), and curled up, sliding or in its shell (LOW)
    const START = A.start || 1, STAND = { hw: A.stand.hw * START, h: A.stand.h * START }, LOW = { hw: A.low.hw * START, h: A.low.h * START };
    const jumpV = Math.sqrt(2 * GRAVITY * A.jump), doubleV = Math.sqrt(2 * GRAVITY * A.double);
    if (lingering) lingering();
    addStyle();
    if (SKY_ANIMALS[kind]) drawSky(banner);
    const box = banner.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), u = box.height / 216, W = box.width / u;
    // The hills stay anchored to the banner's bottom edge and its middle, however it is cropped
    const k = Math.max(box.width / 1600, box.height / 240), side = (1600 - box.width / k) / 2;
    const floorAt = (x) => (box.height - (240 - ridgeAt(side + x * u / k)) * k) / u;
    const slopeAt = (x) => (floorAt(x + 4) - floorAt(x - 4)) / 8;
    // The cabin's roof, to land on, and its chimney, in the game's units: none where a narrow banner crops the cabin
    const sceneX = (x) => (x - side) * k / u, sceneY = (y) => (box.height - (240 - y) * k) / u;
    const roof = { x: sceneX(ROOF.x), y: sceneY(ROOF.y), w: ROOF.w * k / u }, chimney = { x: sceneX(CHIMNEY.x), y: sceneY(CHIMNEY.y) };
    const roofs = roof.x > 30 && roof.x < W - 30 ? [roof] : [];
    const scale = dpr * u, touchOnly = matchMedia('(hover: none)').matches;
    const addLayer = () => {
      const c = banner.appendChild(canvas(box.width * dpr, box.height * dpr));
      c.className = 'bn-bear-layer';
      return c;
    };
    // The level: bridges of stars to land on from below, and a fallen log low enough that only a ball rolls under it. A bridge
    // stands up above the ground under its middle, with its two berries at LEDGE_BERRIES of its width from there. fly: on its
    // way to a new place (moveLedges), when it can't be landed on.
    const LEDGE_BERRIES = [-0.28, 0.28];
    const ledge = (x, up, w) => ({ x, y: floorAt(x) - up, w, up, fly: null });
    const ledges = [ledge(W * 0.2, 58, 120), ledge(W * 0.52, 104, 120), ledge(W * 0.8, 60, 130)];
    // Its underside clears the highest ground below it by just enough for a ball, wherever that is
    const logAt = (x, w) => {
      let high = Infinity;
      for (let i = -w / 2; i <= w / 2; i += 5) high = Math.min(high, floorAt(x + i));
      return { x, y: high - 33 - 18, w, h: 18 };
    };
    // The log: none in the first stage, and from Merak's on, somewhere new each stage (moveLog), first where it always was
    const logW = 110, firstLog = logAt(W * 0.36, logW), logs = [];
    const levelLayer = addLayer(), logLayer = addLayer(), layer = addLayer(), foreLayer = canvas(box.width * dpr, box.height * dpr), ctx = layer.getContext('2d');
    // In front of the bear, for depth: a low near hill and clumps of spruce, darker than the forest behind, standing still. They
    // leave the log's first place and the cabin in view.
    const clumps = [], cabinX = (1150 - side) * k / u;
    {
      const c = foreLayer.getContext('2d');
      c.scale(scale, scale);
      let seed = 41;
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      const bottom = box.height / u, hillAt = (x) => Math.min(bottom + 2, floorAt(x) + 8 + 9 * Math.sin(x / 170 + 1.1) + 5 * Math.sin(x / 61 + 0.4));
      const keepClear = [[cabinX, 75], [firstLog.x, firstLog.w / 2 + 40]];
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
    // Where the log can go: clear of the clumps in front, so it stays in view, of the cabin and of the banner's edges, and when
    // there's room, out from under the low bridges where they are now, which it would crowd. Places at least 150 apart, its
    // first place first when that's clear. The clumps leave room for three on a wide banner and one or two on a phone.
    const logSpots = () => {
      const low = ledges.filter((l) => l.up < 80);
      const clear = (x, roomy) => x - logW / 2 > 100 && x + logW / 2 < W - 100 && Math.abs(x - cabinX) > 75 + logW / 2
        && clumps.every((c) => Math.abs(x - c.x) > c.wide + 24 + logW / 2) && (!roomy || low.every((l) => Math.abs(x - l.x) > l.w / 2 + logW / 2 + 10));
      const find = (roomy) => {
        const spots = clear(firstLog.x, roomy) ? [firstLog.x] : [];
        for (let x = 0; x <= W; x += 10) if (clear(x, roomy) && spots.every((s) => Math.abs(x - s) >= 150)) spots.push(x);
        return spots;
      };
      const roomy = find(true);
      return roomy.length >= 3 ? roomy : find(false);
    };
    // The log has a layer of its own, so it can fade out where it was and in where it goes
    const paintLogs = () => {
      const c = logLayer.getContext('2d');
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, logLayer.width, logLayer.height);
      c.setTransform(scale, 0, 0, scale, 0, 0);
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
    };
    // A bridge's stars, left to right, each a little up or down and its own size, the same wherever the bridge goes: [x, y, r]
    const ledgeStars = (l, n, x = l.x, y = l.y) => {
      const count = Math.max(4, Math.round(l.w / 28)), left = x - l.w / 2;
      return Array.from({ length: count }, (_, i) => [left + l.w * i / (count - 1), y + (i % 2 ? 0.9 : -0.5) * (((n + i) % 3) / 2 + 0.3), 4.6 + ((n + i * 2) % 3)]);
    };
    const ledgeDot = softDot(64, [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,240,205,.55)'], [1, 'rgba(255,235,190,0)']]);
    const paintLedge = (c, stars) => {
      c.lineCap = 'round';
      c.lineJoin = 'round';
      [[5, 'rgba(255,233,184,.12)'], [1, 'rgba(255,240,205,.8)']].forEach(([width, color]) => {
        c.strokeStyle = color;
        c.lineWidth = width;
        c.beginPath();
        stars.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
        c.stroke();
      });
      stars.forEach(([x, y, r]) => c.drawImage(ledgeDot, x - r, y - r, r * 2, r * 2));
    };
    // The bridges in place have a canvas of their own, painted again only when one leaves or arrives. One on its way is drawn
    // with the rest of the game (draw).
    const paintLedges = () => {
      const c = levelLayer.getContext('2d');
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, levelLayer.width, levelLayer.height);
      c.setTransform(scale, 0, 0, scale, 0, 0);
      ledges.forEach((l, n) => { if (!l.fly) paintLedge(c, ledgeStars(l, n)); });
    };
    paintLedges();
    // A bridge's stars on their way, the one in front leaving first and each LEDGE_STAGGER after the one ahead of it, along an
    // arc that rises higher the farther it goes
    const flyingStars = (l, n) => {
      const f = l.fly, from = ledgeStars(l, n, f.x0, f.y0), to = ledgeStars(l, n), last = from.length - 1, ahead = l.x > f.x0;
      const lift = Math.min(30, 12 + Math.abs(l.x - f.x0) * 0.04), span = f.life - last * LEDGE_STAGGER;
      return from.map(([x0, y0, r], i) => {
        const t = smooth(clamp((f.age - (ahead ? last - i : i) * LEDGE_STAGGER) / span, 0, 1));
        return [lerp(x0, to[i][0], t), lerp(y0, to[i][1], t) - Math.sin(t * Math.PI) * lift, r];
      });
    };
    // The animal is drawn on a canvas of its own, around its feet, with room for it at its biggest. Only the part around it at
    // its size now (g) is copied to the banner, so its shadow costs no more than it did before it grew.
    const ROOM = BIGGEST + 0.05, OFF_X = 90 * ROOM, OFF_Y = 110 * ROOM, off = canvas(180 * ROOM * scale, 180 * ROOM * scale), o = off.getContext('2d');
    const putAnimal = (c, x, y, g) => {
      const k = clamp(g, 1, ROOM), w = 180 * k * scale;
      c.drawImage(off, (OFF_X - 90 * k) * scale, (OFF_Y - 110 * k) * scale, w, w, (x - 90 * k) * scale, (y - 110 * k) * scale, w, w);
    };
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
    const skyEls = SKY_ANIMALS[kind] ? [...banner.querySelectorAll(`.bn-animal-sky .${kind} [data-sky-star]`)] : Object.keys(BACK_STARS).map((name) => banner.querySelector(`[data-star="${name}"]`));
    const skyStars = skyEls.map((el, i) => {
      const r = el.getBoundingClientRect();
      return { el, to: A.back[i], x: (r.left + r.width / 2 - box.left) / u, y: (r.top + r.height / 2 - box.top) / u };
    });
    const under = skyStars.length ? skyStars.reduce((sum, s) => sum + s.x, 0) / skyStars.length : W * 0.25;
    // The stages relight them in order: the Dipper's from Dubhe, around the bowl and out along the handle, the fox's around its
    // face, and Cancer's by their Greek letters, ending with Praesepe. A relit star shines on the animal's back at once, and in
    // the sky when its big star gets there. skyLines: the lines between them, as pairs of stars.
    const order = kind === 'bear' ? STAGES.map((st) => Object.keys(BACK_STARS).indexOf(st.name)) : [0, 1, 2, 3, 4, 5, 6];
    const dipperLine = BACK_LINES.map((name) => Object.keys(BACK_STARS).indexOf(name));
    const skyLines = kind === 'bear' ? dipperLine.slice(1).map((c, n) => [dipperLine[n], c]) : SKY_ANIMALS[kind].lines;
    const skyGlow = kind === 'bear' ? starGlow : softDot(64, [[0, 'rgba(255,255,255,1)'], [0.25, A.tint], [1, A.tint.replace(/[\d.]+\)$/, '0)')]]);
    const stageName = (n) => (A.names ? A.names[n] : `Star ${n + 1}`);
    // The big star being made, in a clear part of the sky between the middle and the moon (forge); stars on their way to it
    // (pieces); each stage's points so far, in the colors of the stars that made them (built); finished big stars on their way
    // to the constellation (beams); and the places in the sky they've reached (skyLit). forged: big stars finished so far, so
    // the one being made is for that stage.
    const lit = Array(7).fill(false), beams = [], pieces = [], built = STAGES.map(() => []), skyLit = Array(7).fill(false);
    const forge = { x: W * 0.74, y: 56, R: 18, r: 7.5 };
    let stage = 0, got = 0, forged = 0, forgeAge = 1, between = 0, night = 0, warned = false, ending = '', home = null, shownMinute = -1;
    const inSky = (i) => skyLit[i];
    // A point of the big star, k from the top and around clockwise, at a fraction f of the way out from the middle
    const pointAt = (k, f) => { const a = -Math.PI / 2 + k * TAU / POINTS; return [forge.x + Math.cos(a) * forge.R * f, forge.y + Math.sin(a) * forge.R * f]; };
    const pieceAt = (p) => {
      const t = smooth(clamp(p.age / p.life, 0, 1)), [tx, ty] = pointAt(p.k, 0.62);
      return [lerp(p.from.x, tx, t), lerp(p.from.y, ty, t) - Math.sin(t * Math.PI) * 36];
    };
    // A finished big star flashes where it was made, then flies across to its place, shrinking to a star's size as it goes
    const beamAt = (b) => {
      const t = smooth(clamp((b.age - b.hold) / (b.life - b.hold), 0, 1)), to = skyStars[b.i];
      return [lerp(b.from.x, to.x, t), lerp(b.from.y, to.y, t) - Math.sin(t * Math.PI) * 30, t];
    };
    // Alcor sits on the same side of Mizar as in the sky, though farther out, or it couldn't be told apart
    const alcor = kind === 'bear' && skyStars.length === 7 ? (() => {
      const [mizar, alkaid] = ['Mizar', 'Alkaid'].map((name) => skyStars[Object.keys(BACK_STARS).indexOf(name)]);
      const dx = alkaid.x - mizar.x, dy = alkaid.y - mizar.y, d = Math.hypot(dx, dy) || 1, c = Math.cos(ALCOR_TURN), s = Math.sin(ALCOR_TURN);
      return { x: mizar.x + (dx * c - dy * s) / d * ALCOR_GAP, y: mizar.y + (dx * s + dy * c) / d * ALCOR_GAP, got: false };
    })() : null;
    const me = { x: clamp(under, A.edge, W - A.edge), y: floorAt(clamp(under, A.edge, W - A.edge)), tilt: 0, tuck: 0, tail: -0.55, dive: 0, pouncing: false, power: 0, powerChain: 0, on: null, onFloor: true, hurt: 0, flash: 0, moonTime: 0, energy: 1, tired: false, snore: 0, snip: 0, rush: 0, dash: 0, dashDir: 1, dashSpeed: 0, dashAsk: 0, dashAskDir: 1, dashWait: 0, airDashed: false, lean: 0, trail: [], vx: 0, vy: 0, face: 1, ground: true, rolling: false, curl: 0, jumps: 0, coyote: COYOTE, buffer: 0, flip: 1, squash: 0, gait: 0, rollUntil: 0, alpha: 0, time: 0, autoDir: 1, fed: 0, molted: 0, big: START, bigV: 0, grown: 0, molting: false };
    const keys = { left: false, right: false, down: false, jump: false };
    const sparks = [], fallers = [], pops = [], bees = [], pots = [], visitors = [], rings = [], powers = [], swarms = [], sheds = [];
    let nextPower = 22 + Math.random() * 10;
    let unlockedNow = '', finale = false;
    let combo = 0, comboLeft = 0, bestCombo = 0, newBest = false;
    const counts = { berries: 0, bellies: 0, honey: 0, escapes: 0, stokes: 0, calmed: 0, bees: 0, satellites: 0, rides: 0, moons: 0, fires: 0, miles: 0, booms: 0, alcor: 0, left: 0 };
    let rideMiles = 0, rideClock = 0, rideAir = 0, ridePlane = null;
    // On a meteor shower's peak night, as in the shooting star game, stars are worth double
    const peak = options.peak || null;
    const uiFont = getComputedStyle(banner).fontFamily;
    readSound();
    if (document.fonts) document.fonts.load('12px "AURORA Arcade"');
    let nextStar = 1.2, nextBee = 4.5, nextPot = 11, nextVisitor = 13, planeTurn = Math.random() < 0.5, caught = 0, points = 0, playTime = 0, lives = LIVES, belly = 0, result = false;
    // How long an angry swarm chases: 5 s on a wide banner, down to 2 s on a phone's, with a third of the room to run
    const chaseFor = CHASE_SECONDS * clamp((W - 200) / 1000, 0.4, 1);
    let best = 0;
    try { best = Number(localStorage.getItem(A.bestKey)) || 0; } catch (e) { /* blocked */ }
    // The moon, if it's up tonight. A bump from below brings moon gravity for a while, longer the more of it is lit.
    const moonGroup = banner.querySelector('.bn-moon'), moonDisc = banner.querySelector('.bn-moon-face'), moonArt = banner.querySelector('.bn-moonlayer');
    const moon = moonGroup && moonDisc && moonGroup.classList.contains('on') ? (() => {
      const r = moonDisc.getBoundingClientRect();
      return { x: (r.left + r.width / 2 - box.left) / u, y: (r.top + r.height / 2 - box.top) / u, r: r.width / 2 / u, lit: Number(moonGroup.dataset.lit) || 0.5, rest: 0, flash: 0, total: 0 };
    })() : null;
    // Keeps a wide banner busy and a narrow one from crowding
    const density = Math.sqrt(clamp(W / 1440, 0.4, 1.7));
    let floorSum = 0;
    for (let x = 0; x <= W; x += 20) floorSum += floorAt(x);
    const planeY = floorSum / (Math.floor(W / 20) + 1) - PLANE_UP;
    // Where berries grow: along the ground, on the bridges, on top of the log and under it, where only a ball can reach. The
    // two by the log go where it goes, and grow only while it's there; the two on each bridge go where it goes (ledge, at f
    // of its width from its middle), and don't grow while it's on its way.
    const berries = [], logBerries = [{ x: firstLog.x, y: firstLog.y - 10, log: true }, { x: firstLog.x, y: floorAt(firstLog.x) - 9, under: true, log: true }];
    for (let x = 70; x < W - 40; x += 175) if (Math.abs(x - firstLog.x) >= firstLog.w / 2 + 30) berries.push({ x, y: floorAt(x) - 10 });
    ledges.forEach((l) => LEDGE_BERRIES.forEach((f) => berries.push({ x: l.x + l.w * f, y: l.y - 10, ledge: l, f })));
    berries.push(...logBerries);
    const berryLimit = Math.max(2, Math.round(W / 360));
    let nextBerry = 6;
    const growBerry = () => {
      const free = berries.filter((b) => !b.on && Math.abs(b.x - me.x) > 120 && (!b.log || logs.length) && !(b.ledge && b.ledge.fly));
      if (!free.length || berries.filter((b) => b.on).length >= berryLimit) return false;
      const b = free[Math.floor(Math.random() * free.length)];
      b.on = true;
      b.grow = 0;
      return true;
    };
    berries.forEach((b) => { b.on = false; b.grow = 1; });
    while (growBerry());
    // A new place for the log, at the start of each stage from Merak's: it fades out where it was, and in somewhere new once it
    // has, chosen then, away from the animal and any honey pot. The berry under it is there again, as a reward for finding it.
    // With nowhere else free, as on a banner with room for it in only one place, it stays where it is.
    const moveLog = () => {
      // (Its places, worked out against where the bridges go this stage, which move first)
      const old = logs[0], near = logW / 2 + STAND.hw + 12, spots = logSpots();
      const free = (x, gap) => Math.abs(x - me.x) > gap && !pots.some((p) => Math.abs(p.x - x) < logW / 2 + 20);
      if (old && !spots.some((x) => Math.abs(x - old.x) > 100 && free(x, near))) return;
      const appear = () => {
        if (!running || ending || logs.length) return;
        const others = spots.filter((x) => !old || Math.abs(x - old.x) > 100), wide = others.filter((x) => free(x, 160));
        const ok = wide.length ? wide : others.filter((x) => free(x, near));
        // The first time, where it always was if that's free; then anywhere else that's free; failing that, back where it was;
        // and with the animal in the way of all of them, in a moment
        const x = !old && ok.includes(firstLog.x) ? firstLog.x : ok.length ? ok[Math.floor(Math.random() * ok.length)] : old && free(old.x, near) ? old.x : undefined;
        if (x === undefined) { setTimeout(appear, 400); return; }
        logLayer.style.opacity = '';
        const l = logAt(x, logW);
        logs.push(l);
        paintLogs();
        Object.assign(logBerries[0], { x, y: l.y - 10 });
        Object.assign(logBerries[1], { x, y: floorAt(x) - 9, on: true, grow: 0 });
        shower(x, l.y + 9, 16, 'rgb(255,233,184)');
        logLayer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450 });
      };
      if (!old) { appear(); return; }
      logs.length = 0;
      logBerries.forEach((b) => { b.on = false; });
      shower(old.x, old.y + 9, 14, 'rgb(190,200,255)');
      logLayer.style.opacity = '0';
      logLayer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 }).onfinish = appear;
    };
    // New places for the bridges at the start of each stage from Merak's, as for the log, and chosen before the log's, so it
    // can keep out from under them. A bridge the animal stands on, or one with a honey pot on it, stays where it is, and one
    // still on its way from the last stage, which can end quickly after a sonic boom, keeps going. The others go where they
    // fit, at random, each LEDGE_MOVE or more from where any bridge of its height was; failing that, as on a
    // phone, LEDGE_MOVE_LEAST; and failing that, as on the narrowest phones, LEDGE_MOVE_LEAST from where it was itself, which
    // can swap the low bridges' sides. With no room even for that, they stay. Their stars fly there (flyingStars), and a berry
    // that was ripe on one is ripe again when it gets there. A shell the crab left on one falls.
    const high = (l) => l.up >= 80;
    // Where one bridge can go, whatever the others do: in from the banner's sides, clear of the cabin's roof so the animal can
    // still land on it, and the high bridge clear of the big star being made, which an animal standing there would hide
    const ledgeFits = (l, x) => x - l.w / 2 >= LEDGE_SIDE && x + l.w / 2 <= W - LEDGE_SIDE
      && roofs.every((r) => Math.abs(x - r.x) >= (l.w + r.w) / 2 + 20)
      && (!high(l) || Math.abs(x - forge.x) >= l.w / 2 + forge.R + 14);
    // And over ground level enough (LEDGE_DIP), from the ground's height every unit across (ground), with a low bridge's
    // berries 65 or more above the ground under them, out of reach from it (60, the reach for food, and a berry's size)
    let ground = null;
    const ledgeLevel = (l, x) => {
      const mid = floorAt(x);
      for (let s = Math.max(0, Math.round(x - l.w / 2 - 20)); s <= Math.min(ground.length - 1, x + l.w / 2 + 20); s += 2) if (ground[s] - mid > LEDGE_DIP) return false;
      return LEDGE_BERRIES.every((f) => floorAt(x + l.w * f) - (mid - l.up - 10) >= 65);
    };
    // Each bridge's places as far as those go, which hold for the whole run: worked out when the bridges first move
    const ledgePlaces = new Map();
    const placesFor = (l) => {
      if (!ground) ground = Array.from({ length: Math.floor(W) + 1 }, (_, i) => floorAt(i));
      if (!ledgePlaces.has(l)) {
        const list = [];
        for (let x = LEDGE_SIDE + l.w / 2; x <= W - LEDGE_SIDE - l.w / 2; x += 1) if (ledgeFits(l, x) && ledgeLevel(l, x)) list.push(x);
        ledgePlaces.set(l, list);
      }
      return ledgePlaces.get(l);
    };
    const apart = (a, xa, b, xb) => Math.abs(xa - xb) >= (a.w + b.w) / 2 + (high(a) === high(b) ? LEDGE_GAP : LEDGE_STEP);
    const moveLedges = () => {
      const s = size(), stays = ledges.filter((l) => l.fly || pots.some((p) => p.on === l)
        || (me.ground && !me.onFloor && Math.abs(me.y - l.y) < 0.5 && Math.abs(me.x - l.x) < l.w / 2 + s.hw));
      const moving = ledges.filter((l) => !stays.includes(l)), was = ledges.map((l) => ({ l, x: l.x, high: high(l) }));
      if (!moving.length) return;
      for (const [far, own] of [[LEDGE_MOVE, false], [LEDGE_MOVE_LEAST, false], [LEDGE_MOVE_LEAST, true]]) {
        // Every place each could go, a unit apart, since on a phone a place can be a window of a few units, then one bridge at
        // a time, in a new order each try so none always gets first pick, each at random among its places still apart from
        // those placed. A try that leaves one nowhere starts over.
        const spots = new Map(moving.map((l) => [l, placesFor(l).filter((x) => was.every((o) => (own ? o.l !== l : o.high !== high(l)) || Math.abs(x - o.x) >= far)
          && stays.every((o) => apart(l, x, o, o.x)))]));
        for (let tries = 0; tries < 60; tries++) {
          const order = moving.slice(), placed = [];
          for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
          for (const l of order) {
            const ok = spots.get(l).filter((x) => placed.every(([o, ox]) => apart(l, x, o, ox)));
            if (!ok.length) break;
            placed.push([l, ok[Math.floor(Math.random() * ok.length)]]);
          }
          if (placed.length < moving.length) continue;
          for (const [l, x] of placed) {
            const x0 = l.x, y0 = l.y;
            l.fly = { x0, y0, age: 0, life: LEDGE_FLY + Math.abs(x - x0) / LEDGE_FLY_PER };
            l.x = x;
            l.y = floorAt(x) - l.up;
            sheds.forEach((sh) => { if (sh.landed && Math.abs(sh.y - y0) < 0.5 && Math.abs(sh.x - x0) < l.w / 2) { sh.landed = false; sh.vy = 0; } });
            berries.forEach((b) => { if (b.ledge === l) Object.assign(b, { back: b.on, on: false, x: x + l.w * b.f, y: l.y - 10 }); });
          }
          paintLedges();
          return;
        }
      }
    };
    let phase = 'in', phaseTime = 0, running = true, acc = 0, last = performance.now(), swipeRoll = false, smokeLeft = 0, fireReadyAt = 0;

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
    // Faster, smaller stars are worth more, as in the star game. They fall more slowly than there, since the bear has to get under
    // them, and each stage brings more of the fast ones.
    const dropStar = () => {
      if (fallers.length >= 14) return;
      const speed = Math.random() ** STAGES[Math.min(stage, STAGES.length - 1)].slow, large = Math.random(), x1 = 30 + Math.random() * (W - 60), x0 = x1 + (Math.random() - 0.5) * 170;
      const value = 5 * Math.round((10 + 50 * speed + 30 * (1 - large) + 60 * speed * (1 - large)) / 5);
      fallers.push({ x0, x1, y0: -14, y1: floorAt(x1), t: 0, ms: 4.4 - 2.2 * speed, r: 3 + 5 * large, head: 1.7 + 2.6 * large, tail: 34 + 80 * speed, points: value, color: starColor(speed) });
    };
    // Stars shed by a ridden airliner's engines, drifting down behind it: slow, so orange, and worth a little. They start below
    // the deck, out of reach of a rider, so catching them means jumping off. A sonic boom throws out a fan of them (spread),
    // however many are already falling.
    const shedStar = (v, spread) => {
      if (spread === undefined && fallers.filter((f) => f.exhaust).length >= EXHAUST_LIMIT) return;
      const dir = v.face || 1, x0 = v.x - dir * 30, x1 = clamp(x0 - dir * (20 + Math.random() * 60) + (spread || 0), 20, W - 20);
      fallers.push({ x0, x1, y0: v.y + 16, y1: floorAt(x1), t: 0, ms: 3.2 + Math.random() * 1.2, r: 4, head: 2.4, tail: 42, points: 35, color: starColor(0.1), exhaust: true });
    };
    const number = (n) => n.toLocaleString('en-US');
    // The night's time, from 9 PM to 6 AM, and the minutes of it gone
    const nightMinutes = () => Math.floor(Math.min(1, night / NIGHT_SECONDS) * NIGHT_HOURS * 60);
    // A stretch of night, as "3 h", "45 min" or "1 h 47 min"
    const hoursMinutes = (m) => [Math.floor(m / 60) && `${Math.floor(m / 60)} h`, m % 60 && `${m % 60} min`].filter(Boolean).join(' ');
    const clock = () => {
      const at = (NIGHT_STARTS * 60 + nightMinutes()) % 1440, h = Math.floor(at / 60);
      return `${(h + 11) % 12 + 1}:${String(at % 60).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
    };
    // The stage's star and how many of its stars are caught, then the points, the lives and the time; shorter on a narrow banner.
    // Once the run is over, the line gives its result instead.
    const showScore = () => {
      if (ending) return;
      const S = STAGES[Math.min(stage, STAGES.length - 1)], name = stageName(Math.min(stage, STAGES.length - 1)), life = lives === 1 ? 'foxfire' : 'foxfires';
      score.textContent = box.width < 600
        ? `${name} ${got}/${POINTS}, ${number(points)}${box.width < 360 ? '' : ' points'}, ${lives} ${life}, ${clock()}`
        : `${name}: ${got} of ${POINTS} stars, ${number(points)} points, ${lives} ${life}, ${clock()}`;
    };
    const pop = (x, y, text, color, life) => pops.push({ x, y, age: 0, text, color, life: life || Math.max(0.9, 0.055 * text.length) });
    const shower = (x, y, count, color) => { for (let n = 0; n < count; n++) { const a = Math.random() * TAU, v = 50 + Math.random() * 130; spark(x, y, Math.cos(a) * v, Math.sin(a) * v, 0.55, 0.9 + Math.random(), color); } };
    // How tall the animal is now, as it grows (me.big)
    const tall = () => A.top * me.big;
    // What the bear can reach: more than its body, so catching feels generous, and more as it grows. Food is out of reach above a
    // fixed height (top), however big the animal, so food on a bridge stays out of reach from the ground.
    const touching = (x, y, r, top = A.reach.top * me.big) => (me.rolling
      ? Math.hypot(x - me.x, y - (me.y - A.lowReach.y * START)) < A.lowReach.r * START + r
      : x > me.x - A.reach.hw * me.big - r && x < me.x + A.reach.hw * me.big + r && y > me.y - top - r && y < me.y + r);
    // What a bee can sting: less than its body, so a near miss stays a miss, and more as it grows. Tucked or in a ball, the bear
    // is a smaller target.
    const stingable = (x, y) => {
      if (me.pouncing || me.power > 0) return false;
      if (me.rolling) return Math.hypot(x - me.x, y - (me.y - A.lowSting.y * START)) < A.lowSting.r * START;
      if (me.tuck > 0.5) return Math.hypot(x - me.x, y - (me.y - A.tuckSting.y * me.big)) < A.tuckSting.r * me.big;
      return Math.abs(x - me.x) < A.sting.hw * me.big && y > me.y - A.sting.top * me.big && y < me.y - 2;
    };
    const tier = () => (COMBO_TIERS.find(([n]) => combo >= n) || [0, 1])[1];
    // A catch adds to the combo, and its points are multiplied by it
    const award = (base, x, y, color, { before = '', after = '', note = '', life } = {}) => {
      const was = tier();
      combo += 1;
      comboLeft = COMBO_SECONDS;
      bestCombo = Math.max(bestCombo, combo);
      const m = tier(), worth = base * m;
      points += worth;
      pop(x, y, `${before ? `${before} ` : ''}+${number(worth)}${m > 1 ? ` ×${m}` : ''}${after ? ` ${after}` : ''}${note ? `, ${note}` : ''}`, color, life);
      if (m > was) {
        pop(me.x, me.y - tall() - 40, `Combo ×${m}!`, COMBO_COLORS[m], 1.6);
        sfx.tier(m);
      }
      showScore();
      return worth;
    };
    const comboEnds = (stung) => {
      if (!stung && combo >= COMBO_BONUS_FROM) {
        const bonus = combo * COMBO_BONUS;
        points += bonus;
        pop(me.x, me.y - tall() - 40, `Combo of ${combo}! +${number(bonus)}`, COMBO_COLORS[5], 2);
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
      me.snip = 0.25;
      // Revontulet, Finnish for the northern lights, means fox fires: the sparks from a running fox's tail
      if (A.foxFires && caught % FOX_FIRES_EVERY === 0) {
        points += FOX_FIRES_POINTS;
        counts.fires += 1;
        sfx.fires();
        pop(me.x, me.y - tall() - 14, `Fox fires! +${FOX_FIRES_POINTS}`, 'rgb(255,200,130)', 2);
        shower(me.x - me.face * 50, me.y - 34, 22, 'rgb(255,190,110)');
        if (options.surge) options.surge();
      }
      countStar(x, y, f.color);
      showScore();
    };
    // Each caught star counts toward the stage, and flies up to the big star to make one of its points. The seventh relights
    // the stage's star: on the animal's back at once, and in the sky when the big star gets there.
    const countStar = (x, y, color) => {
      if (ending || stage >= STAGES.length) return;
      got += 1;
      pieces.push({ s: stage, k: got - 1, color, from: { x, y }, age: 0, life: 0.55 });
      if (got >= POINTS) relight();
    };
    const relight = () => {
      const n = stage, i = order[n], [bx, by] = A.back[i];
      lit[i] = true;
      const bonus = RELIGHT_POINTS * (n + 1), gain = lives < LIVES;
      points += bonus;
      shower(me.x + bx * me.big * (A.sideways ? 1 : me.face), me.y + by * me.big, 18, 'rgb(255,240,200)');
      got = 0;
      stage += 1;
      // The last one brings the animal home, which says so itself
      if (stage >= STAGES.length) { leave('home', bonus); return; }
      if (gain) lives += 1;
      pop(me.x, me.y - tall() - 34, `${stageName(n)} relit! +${number(bonus)}${gain ? ' and a foxfire back' : ''}`, 'rgb(255,232,170)', 2.4);
      between = BREATHER;
      moveLedges();
      moveLog();
      // What the next stage brings comes soon after its card
      if (stage === BEES_FROM) { nextBee = 1.5; if (roofs.length) cabinHint(); }
      if (stage === HONEY_FROM) { nextPot = 2; nextPower = 10; }
      if (stage === VISITORS_FROM) { nextVisitor = 1; planeTurn = false; }
      // The next card comes as the big star nears its place
      showStage(1400);
    };
    // When the bees wake, a word about the cabin, if it's in view
    const cabinHint = () => {
      clearTimeout(hintTimer);
      hintTimer = setTimeout(() => {
        if (ending) return;
        hint.textContent = "Land on the cabin's roof to stoke its fire: smoke calms bees";
        hint.style.opacity = 1;
        hintTimer = setTimeout(() => { hint.style.opacity = 0; }, 6000);
      }, 3500);
    };
    // Bringing the Great Bear home unlocks the fox, and the fox the crab, whose stars appear in the sky as the animal goes home
    const unlockNext = (y) => {
      unlockedNow = A.unlocks;
      unlockAnimal(A.unlocks);
      drawSky(banner);
      showSkyLabel(banner, 6000, A.unlocks);
      pop(me.x, y, `You unlocked the ${ANIMALS[A.unlocks].short}!`, A.unlocks === 'crab' ? 'rgb(196,255,240)' : 'rgb(255,214,160)', 3.5);
      setTimeout(() => sfx.unlock(), 1300);
      shower(me.x, me.y - 40, 26, 'rgb(255,190,110)');
    };
    // The fox's dive, which is safe from bees, bats away any it meets, and on landing catches what is close by
    const startPounce = () => {
      me.pouncing = true;
      me.dash = 0;
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
      rings.push({ x: me.x, y: me.y - 8, age: 0, life: 0.42, r: A.pounce * me.big });
      for (let i = fallers.length - 1; i >= 0; i--) {
        const f = fallers[i], x = lerp(f.x0, f.x1, f.t), y = lerp(f.y0, f.y1, f.t);
        if (Math.hypot(x - me.x, y - (me.y - 20)) < A.pounce * me.big + f.r) { fallers.splice(i, 1); catchStar(f, x, y); }
      }
      for (let i = bees.length - 1; i >= 0; i--) {
        const b = bees[i];
        if (Math.hypot(b.x - me.x, b.y - (me.y - 20)) < A.pounce * me.big) { bees.splice(i, 1); swat(b); }
      }
    };
    // Bees cross at different heights, some to jump and some to roll under, faster each stage, and in the last stage some swoop
    // at where the bear was
    const sendBee = (kind) => {
      if (bees.length >= 12 && !kind) return;
      const hard = clamp((stage - BEES_FROM) / (STAGES.length - 1 - BEES_FROM), 0, 1);
      if (kind === 'swoop' || (!kind && stage >= SWOOP_FROM && Math.random() < SWOOP_SHARE)) {
        const x0 = Math.random() * W, x2 = clamp(me.x + (Math.random() < 0.5 ? -1 : 1) * (200 + Math.random() * 300), 0, W), tx = me.x, ty = me.y - 30;
        bees.push({ kind: 'swoop', x: x0, y: -16, age: 0, dir: 1, x0, x2, cx: 2 * tx - (x0 + x2) / 2, cy: 2 * ty + 16, dur: 2.8 + Math.random() * 1.2 });
      } else {
        const dir = Math.random() < 0.5 ? 1 : -1, x = dir > 0 ? -20 : W + 20;
        bees.push({ kind: 'cruise', x, y: 0, age: 0, dir, speed: 110 + Math.random() * 70 + 50 * hard, base: [24, 40, 62, 90][Math.floor(Math.random() * 4)], amp: 6 + Math.random() * 10, freq: 3 + Math.random() * 2, phase: Math.random() * TAU });
      }
    };
    const sendAngry = (x, y) => {
      swarms.push({ age: 0, stung: false });
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + (i - 1) * 0.9;
        bees.push({ kind: 'chase', x, y, age: 0, dir: 1, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170, ox: (i - 1) * 22, oy: (i - 1) * 12 });
      }
    };
    // A honey pot appears somewhere up high or along the ground, away from the bear, and doesn't wait long. on: the bridge it's on.
    const dropPot = () => {
      const spots = [...ledges.filter((l) => !l.fly).map((l) => ({ x: l.x, y: l.y - 14, on: l })), ...berries.filter((b) => b.y > planeY + 80 && !b.under).map((b) => ({ x: b.x + 30, y: floorAt(b.x + 30) - 15 }))];
      const far = spots.filter((s) => Math.abs(s.x - me.x) > 180), pick = (far.length ? far : spots)[Math.floor(Math.random() * (far.length || spots.length))];
      pots.push({ x: pick.x, y: pick.y, age: 0, life: 14, on: pick.on || null });
      shower(pick.x, pick.y, 10, 'rgb(255,214,120)');
    };
    const sendVisitor = (kind) => {
      const dir = Math.random() < 0.5 ? 1 : -1, plane = kind ? kind === 'plane' : (planeTurn = !planeTurn);
      visitors.push(plane
        ? { kind: 'plane', x: dir > 0 ? -60 : W + 60, y: planeY, vx: dir * PLANE_SPEED, vy: 0, w: 74, face: dir }
        : { kind: 'satellite', x: dir > 0 ? -20 : W + 20, y: 12 + Math.random() * 14, vx: dir * (155 + Math.random() * 50), vy: Math.random() * 5 });
    };
    // At three times its speed, the airliner breaks the sound barrier: the animal is thrown clear, the aurora surges, the engines
    // throw out a fan of stars, and the plane is gone. Nothing shakes, because a moving foreground can bring on motion sickness.
    const sonicBoom = (v) => {
      v.boomed = true;
      v.vx = v.face * PLANE_TOP * 1.5;
      counts.booms += 1;
      if (me.on === v) { me.on = null; me.ground = false; me.vy = -jumpV * 1.1; me.jumps = 1; me.dash = 0; }
      award(BOOM_POINTS, me.x, me.y - tall() - 20, 'rgb(232,238,255)', { before: 'Sonic boom!', life: 2.4 });
      rings.push({ x: v.x, y: v.y, age: 0, life: 0.8, r: 190, color: '#E8EEFF' });
      shower(v.x, v.y, 26, 'rgb(232,238,255)');
      for (let i = 0; i < 8; i++) shedStar(v, (i - 3.5) * 45);
      sfx.boom();
      if (options.surge) options.surge();
    };
    // A ridden airliner speeds up, sheds stars and leaves a contrail, and near an edge it turns around, until it breaks the sound
    // barrier. Once its rider has gone, it keeps its speed and flies off.
    const flyPlane = (v, dt) => {
      v.rider = Math.max(0, (v.rider || 0) - dt);
      if (v.boomed) return;
      const ridden = me.on === v && phase === 'play';
      if (v.turning) {
        // It keeps speeding up through a turn, so the sound barrier comes as soon on a narrow banner, with more turns
        if (ridden) v.turnSpeed = Math.min(PLANE_TOP, v.turnSpeed + PLANE_ACCEL * dt);
        v.vx = approach(v.vx, v.turning * v.turnSpeed, v.turnSpeed / 0.35 * dt);
        if (v.vx === v.turning * v.turnSpeed) v.turning = 0;
      } else if (v.rider > 0) {
        // Far enough out that, slowing into the turn, it stays in view
        const margin = 50 + Math.abs(v.vx) * 0.2;
        if ((v.vx > 0 && v.x > W - margin) || (v.vx < 0 && v.x < margin)) { v.turning = -Math.sign(v.vx); v.turnSpeed = Math.abs(v.vx); }
      }
      if (v.vx) v.face = Math.sign(v.vx);
      if (!ridden) return;
      const speed = Math.abs(v.vx);
      if (!v.turning) v.vx = v.face * Math.min(PLANE_TOP, speed + PLANE_ACCEL * dt);
      v.shed = (v.shed || 0) + dt * speed / PLANE_SPEED;
      if (v.shed >= EXHAUST_EVERY) { v.shed -= EXHAUST_EVERY; shedStar(v); }
      // A contrail in the aurora's colors, thicker the faster it flies
      if (Math.random() < 0.35 * speed / PLANE_TOP) spark(v.x - v.face * 48, v.y + 1 + (Math.random() - 0.5) * 6, -v.face * (20 + Math.random() * 30), (Math.random() - 0.5) * 16, 0.6, 0.8 + Math.random() * 0.6, SPARKS[Math.floor(Math.random() * SPARKS.length)]);
      if (!v.told && speed >= 2 * PLANE_SPEED) { v.told = true; pop(clamp(v.x, 70, W - 70), v.y - 74, 'Faster! Hold on…', 'rgb(255,214,170)', 1.6); }
      if (!v.turning && Math.abs(v.vx) >= PLANE_TOP) sonicBoom(v);
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
    // The fire stoked from the roof: the chimney's puff and sparks, as a click on the cabin sends outside the games, the cabin's
    // glow brightening for a moment, and a cloud of smoke that calms bees for SMOKE_SECONDS
    const stokeFire = () => {
      smokeLeft = SMOKE_SECONDS;
      fireReadyAt = me.time + STOKE_AGAIN;
      counts.stokes += 1;
      sfx.stoke();
      pop(me.x, overBadge(), 'Stoked! The smoke calms bees', 'rgb(236,228,214)', 2.4);
      banner.querySelectorAll('.bn-puff i').forEach((el, i) => {
        const dx = (0.8 + Math.random() * 0.5).toFixed(2), dy = (2.4 + Math.random() * 0.6).toFixed(2);
        el.animate([
          { opacity: 0, transform: 'translate(0, 0) scale(.6)' },
          { opacity: 0.75, transform: 'translate(.05cqw, -.45cqw) scale(1.3)', offset: 0.14 },
          { opacity: 0, transform: `translate(${dx}cqw, -${dy}cqw) scale(4.2)` }
        ], { duration: 2600 + i * 250, delay: i * 160, easing: 'cubic-bezier(.25,.6,.4,1)' });
      });
      banner.querySelectorAll('.bn-puff b').forEach((el, i) => {
        const dx = Math.random() * 0.8 - 0.25, dy = 0.9 + Math.random() * 0.9;
        el.animate([
          { opacity: 1, transform: 'translate(0, 0)' },
          { opacity: 0.8, transform: `translate(${(dx * 0.5).toFixed(2)}cqw, -${(dy * 0.55).toFixed(2)}cqw)`, offset: 0.45 },
          { opacity: 0, transform: `translate(${dx.toFixed(2)}cqw, -${dy.toFixed(2)}cqw)` }
        ], { duration: 900 + Math.random() * 700, delay: 60 + i * 70, easing: 'cubic-bezier(.15,.7,.35,1)' });
      });
      const cozy = banner.querySelector('.bn-cozy');
      if (cozy && !cozy.classList.contains('on')) {
        cozy.classList.add('on');
        setTimeout(() => cozy.classList.remove('on'), 1800);
      }
      shower(chimney.x, chimney.y - 4, 12, 'rgb(255,196,110)');
    };
    // Where the smoke reaches: a cloud above the chimney, leaning downwind as the chimney's wisp does, growing as it rises and
    // thinning away at the end
    const smokeZone = () => {
      if (smokeLeft <= 0) return null;
      const grown = clamp((SMOKE_SECONDS - smokeLeft) / 0.6, 0, 1) * clamp(smokeLeft / 1, 0, 1);
      return { x: chimney.x + 25, y: chimney.y - 57, r: 58 * grown };
    };
    // A bee calmed by the smoke forgets the animal and drifts off, up and away, fading
    const calm = (b) => {
      b.kind = 'calm';
      b.age = 0;
      b.vx = (Math.random() - 0.5) * 50;
      b.vy = -25 - Math.random() * 25;
      counts.calmed += 1;
    };
    // A bee that flies into the crab's shell bounces off it
    const bounce = (b) => {
      counts.bees += 1;
      award(SWAT_POINTS, b.x, b.y - 12, 'rgb(196,255,240)');
      sfx.bonk(1);
      shower(b.x, b.y, 8, 'rgb(196,255,240)');
      b.kind = 'down';
      b.vx = (Math.sign(b.x - me.x) || 1) * 160;
      b.vy = -260;
    };
    // Above the combo badge, which sits over the animal's head, and inside the banner
    const overBadge = () => Math.max(24, me.y - tall() - 58);
    // A full belly, from seven berries, gives back a life, or with every life lit is worth points. The crab molts then, growing
    // to what it has eaten, unless it's as big as it gets.
    const fullBelly = () => {
      belly = 0;
      counts.bellies += 1;
      sfx.belly();
      const molt = A.molts && me.fed > me.molted;
      if (molt) {
        me.molted = me.fed;
        me.molting = true;
        sfx.molt();
      }
      if (lives < LIVES) {
        lives += 1;
        pop(me.x, overBadge(), molt ? 'Full belly! Molted, and a foxfire back' : 'Full belly! A foxfire back', 'rgb(255,150,180)', 2.2);
        showScore();
      } else award(BELLY_POINTS, me.x, overBadge(), 'rgb(255,150,180)', { before: molt ? 'Full belly! Molted,' : 'Full belly!' });
    };
    const sting = (b) => {
      lives -= 1;
      // It shrinks by a few berries' worth, the crab too, which grows back only at its next molt
      me.fed = Math.max(0, me.fed - GROW_STING);
      me.molted = Math.min(me.molted, me.fed);
      swarms.forEach((s) => { s.stung = true; });
      comboEnds(true);
      sfx.sting();
      // One sting satisfies a swarm, so a mistake with the honey costs one life rather than all three
      if (b.kind === 'chase') bees.forEach((other) => { if (other.kind === 'chase') other.age = Math.max(other.age, chaseFor); });
      me.hurt = HURT_SECONDS;
      me.flash = 0.22;
      me.on = null;
      me.dash = 0;
      me.vx = (Math.sign(me.x - b.x) || 1) * 190;
      me.vy = -250;
      me.ground = false;
      shower(me.x, me.y - 35, 14, 'rgb(255,170,120)');
      pop(me.x, me.y - tall() - 10, '−1 foxfire', 'rgb(255,196,130)');
      showScore();
      if (lives <= 0) leave('stung');
    };
    const size = () => (me.rolling ? LOW : STAND);
    const overlaps = (l, x, y, s) => x + s.hw > l.x - l.w / 2 && x - s.hw < l.x + l.w / 2 && y > l.y && y - s.h < l.y + l.h;
    const canStand = () => !logs.some((l) => overlaps(l, me.x, me.y, STAND));
    const jump = (v) => {
      me.pouncing = false;
      // (A jump during a dash ends it but keeps its speed)
      me.dash = 0;
      me.vy = -v;
      me.ground = false;
      me.buffer = 0;
    };
    const update = (dt) => {
      me.time += dt;
      me.buffer -= dt;
      me.dashAsk -= dt;
      me.dashWait -= dt;
      me.coyote = me.ground ? COYOTE : me.coyote - dt;
      me.flip = Math.min(1, me.flip + dt / (FLIP * (me.moonTime > 0 ? 1.8 : 1)));
      // A flip is done tucked: in quickly at the start, and opening out for the last part of the turn
      me.tuck = approach(me.tuck, me.flip < TUCK_UNTIL ? 1 : 0, dt / (me.flip < TUCK_UNTIL ? 0.07 : 0.09));
      me.squash *= Math.exp(-dt * 11);
      me.curl = clamp(me.curl + (me.rolling ? dt : -dt) / 0.09, 0, 1);
      // Growing toward what it has eaten, or for the crab, what it had eaten when it last molted, with a little spring to it
      const grow = START * (1 + GROW_EACH * (A.molts ? Math.min(me.fed, me.molted) : me.fed));
      me.bigV += ((grow - me.big) * 240 - me.bigV * 22) * dt;
      me.big += me.bigV * dt;
      // How far along its growth it is, from 0 at the start to 1 fully grown, for the bear's belly and the fox's coat
      me.grown = clamp((me.big / START - 1) / (BIGGEST - 1), 0, 1);
      const steering = phase === 'play';
      // On a touch screen it runs by itself, except on the plane, where it rides; a tap jumps off
      const dir = !steering ? 0 : touchOnly ? (me.on ? 0 : me.autoDir) : (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      if (dir) me.face = dir;
      // Curling up and getting up, which needs room overhead; and asleep at dawn, curled up
      const wantsBall = (steering && (keys.down || swipeRoll)) || phase === 'sleep';
      if (A.pounce && wantsBall && steering && !me.ground && !me.rolling) {
        if (!me.pouncing && me.y < floorAt(me.x) - 20) startPounce();
      } else if (wantsBall && !me.rolling) {
        me.rolling = true;
        me.rollUntil = me.time + 0.3;
        me.flip = 1;
        if (me.ground && !me.tired && steering && !A.shell) {
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
      const top = (me.rolling ? (me.tired ? A.tired : A.roll) : A.run) * (1 + 0.8 * slope * dir) * (me.power > 0 ? POWER_SPEED : 1) * (me.rush > 0 ? Math.max(1, RUSH_TOP / A.run) : 1), accel = !me.ground ? A.airAccel : me.rolling ? A.rollAccel : A.accel;
      if (me.rolling && me.ground && !me.tired && !A.shell) me.vx += slope * 1100 * dt;
      const grip = !me.ground ? AIR_DRAG : me.rolling ? (me.tired ? 1100 : A.rollFriction) : A.friction;
      if (!dir) me.vx = approach(me.vx, 0, grip * dt);
      else if (Math.sign(me.vx) === dir && Math.abs(me.vx) > top) me.vx = approach(me.vx, dir * top, grip * dt);
      else me.vx = approach(me.vx, dir * top, accel * (Math.sign(me.vx) === -dir ? 1.6 : 1) * dt);
      // Dashing, asked for by a quick second press of ← or → or a sideways swipe: DASH_SPEED times a run's top speed, or more if
      // it's already going faster that way. Not curled up or pouncing, and once a jump in the air. It holds its speed, and in the
      // air its height, then eases back to a run, unless a jump takes the speed on.
      if (me.dash > 0 && (!steering || me.rolling || me.pouncing)) me.dash = 0;
      if (steering && me.dashAsk > 0 && me.dashWait <= 0 && !me.rolling && !me.pouncing && (me.ground || !me.airDashed)) {
        const d = me.dashAskDir, run = A.run * (me.power > 0 ? POWER_SPEED : 1) * (me.rush > 0 ? Math.max(1, RUSH_TOP / A.run) : 1);
        me.dashAsk = 0;
        me.dash = DASH_SECONDS;
        me.dashWait = DASH_SECONDS + DASH_AGAIN;
        me.dashDir = d;
        me.dashSpeed = Math.max(run * DASH_SPEED, Math.sign(me.vx) === d ? Math.abs(me.vx) : 0);
        me.face = d;
        if (!me.ground) { me.airDashed = true; me.vy = 0; }
        burst(me.x - d * 12, me.y - (me.ground ? 3 : tall() * 0.45), 8, 110, 0.4);
        sfx.dash();
      }
      if (me.dash > 0) {
        me.dash -= dt;
        me.vx = me.dashDir * me.dashSpeed;
        if (me.dash <= 0) me.vx = me.dashDir * Math.max(top, me.dashSpeed * 0.55);
      }
      // Jumping: a moment's grace after leaving an edge, and a jump pressed just before landing still counts
      if (steering && me.buffer > 0) {
        const launch = (me.moonTime > 0 ? MOON_LAUNCH : 1) * (me.rush > 0 ? RUSH_JUMP : 1);
        if (me.coyote > 0) {
          // On a touch screen, which can't steer, a jump from the plane goes off its back at a run. The plane flies near the top
          // of the banner, so the jump itself is short, and without the run the bear would land on it again.
          if (touchOnly && me.on) { me.autoDir = -(me.on.face || 1); me.vx = me.autoDir * A.run; }
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
          // (A crab doesn't turn somersaults)
          if (!me.rolling && !A.sideways) me.flip = 0;
          burst(me.x, me.y - 6, 16, 150, 0.55);
        }
      }
      let g = GRAVITY * (me.moonTime > 0 ? MOON_PULL : 1);
      if (me.vy > 0) g *= me.moonTime > 0 ? 1 : FALL_MORE;
      else if (!keys.jump && !touchOnly) g *= me.moonTime > 0 ? 1.5 : RELEASE_MORE;
      if (me.rolling && !me.ground && keys.down) g *= 1.3;
      if (me.pouncing) g *= 1.6;
      me.vy = me.dash > 0 && !me.ground ? 0 : Math.min(MAX_FALL, me.vy + g * dt);
      // Across, stopping at the banner's edges and the log
      const s = size();
      me.x += (me.vx + (me.on ? me.on.vx : 0)) * dt;
      for (const l of logs) {
        if (overlaps(l, me.x, me.y, s)) {
          me.x = me.vx > 0 ? l.x - l.w / 2 - s.hw : l.x + l.w / 2 + s.hw;
          me.vx = 0;
          me.dash = 0;
          if (touchOnly) me.autoDir = -me.autoDir;
        }
      }
      // (Far enough in that the head stays in the banner, at any size)
      const edge = A.edge * me.big;
      if (me.x < edge || me.x > W - edge) {
        me.x = clamp(me.x, edge, W - edge);
        me.vx = 0;
        me.dash = 0;
        if (touchOnly) me.autoDir = me.x < W / 2 ? 1 : -1;
      }
      // Down, landing on the ground, a ledge or the log, and bumping the log from under
      const was = me.y, wasGround = me.ground, fall = me.vy;
      me.y += me.vy * dt;
      // The top of the banner is as high as the bear goes, as tall as it is now
      const headroom = me.rolling ? LOW.h : tall();
      if (me.vy < 0 && me.y < headroom) { me.y = headroom; me.vy = 0; }
      me.ground = false;
      me.onFloor = false;
      me.on = null;
      if (me.vy >= 0) {
        // (The airliner carries the animal only during play, since it fades at the end, and a bridge only once it's in place)
        for (const l of [...ledges.filter((b) => !b.fly), ...logs, ...roofs, ...(phase === 'play' ? visitors.filter((v) => v.kind === 'plane' && !v.boomed) : [])]) {
          if (was <= l.y + 0.01 && me.y >= l.y && me.x + s.hw > l.x - l.w / 2 && me.x - s.hw < l.x + l.w / 2) {
            me.y = l.y;
            me.vy = 0;
            me.ground = true;
            if (l === roof && !wasGround && phase === 'play' && me.time >= fireReadyAt) stokeFire();
            if (l.kind === 'plane') {
              me.on = l;
              // While it has a rider, even one hopping on it, it turns at the edges
              l.rider = 1.2;
              if (!l.boarded && phase === 'play') {
                l.boarded = true;
                counts.rides += 1;
                award(PLANE_POINTS, me.x, me.y + 40, 'rgb(255,214,170)', { after: 'and air traffic control has questions' });
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
      // Air miles while riding, by the distance flown, so faster as the plane speeds up, totted up when the ride ends. A hop on
      // the plane doesn't end it.
      if (me.on && phase === 'play') {
        ridePlane = me.on;
        rideAir = 0;
        rideClock += dt * Math.abs(me.on.vx) / PLANE_SPEED;
        while (rideClock >= MILE_SECONDS) {
          rideClock -= MILE_SECONDS;
          rideMiles += MILE_POINTS;
          points += MILE_POINTS;
          if (rideMiles % 100 === 0) tone(note(19), 70, { type: 'sine', level: 0.04 });
          showScore();
        }
      } else if (rideMiles) {
        rideAir += dt;
        if (me.ground || rideAir > 0.8 || phase !== 'play' || !visitors.includes(ridePlane)) {
          counts.miles += rideMiles;
          pop(me.x, me.y - tall() - 14, `+${number(rideMiles)} air miles`, 'rgb(255,214,170)', 1.8);
          rideMiles = 0;
          rideClock = 0;
          ridePlane = null;
        }
      }
      if (me.ground) {
        me.jumps = 0;
        me.airDashed = false;
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
      if (me.ground && Math.random() < (me.rolling ? (me.tired || A.shell ? 0.03 * !A.shell : 0.32) : Math.abs(me.vx) >= A.run * 0.95 ? 0.08 : 0)) {
        spark(me.x - me.face * (me.rolling ? 10 : A.dust), me.y - Math.random() * 6, -me.vx * 0.12 + (Math.random() - 0.5) * 30, -18 - Math.random() * 34, 0.55, 0.8 + Math.random(), SPARKS[Math.floor(Math.random() * SPARKS.length)]);
      }
      if (phase === 'play') {
        playTime += dt;
        // Between stages, a breather: nothing new comes, and the night waits
        if (between > 0) between -= dt;
        else {
          night += dt;
          const S = STAGES[stage];
          nextStar -= dt;
          if (nextStar <= 0) { dropStar(); nextStar = S.star * (0.75 + Math.random() * 0.5) / density; }
          if (S.bee) {
            nextBee -= dt;
            if (nextBee <= 0) { sendBee(); nextBee = S.bee * (0.75 + Math.random() * 0.5) / density; }
          }
          if (stage >= HONEY_FROM) {
            nextPot -= dt;
            if (nextPot <= 0) { dropPot(); nextPot = 15 + Math.random() * 9; }
            nextPower -= dt;
            if (nextPower <= 0) { dropPower(); nextPower = 35 + Math.random() * 20; }
          }
          if (stage >= VISITORS_FROM) {
            nextVisitor -= dt;
            if (nextVisitor <= 0) { sendVisitor(); nextVisitor = 14 + Math.random() * 8; }
          }
          // The clock, a warning an hour before dawn, and dawn
          if (nightMinutes() !== shownMinute) { shownMinute = nightMinutes(); showScore(); }
          if (!warned && night >= NIGHT_SECONDS * (NIGHT_HOURS - 1) / NIGHT_HOURS) {
            warned = true;
            pop(me.x, me.y - tall() - 50, 'Dawn is coming!', 'rgb(200,212,255)', 2.6);
            sfx.dawn();
          }
          if (night >= NIGHT_SECONDS) leave('dawn');
        }
      }
      // Rising home, and asleep
      if (phase === 'home' && Math.random() < 0.5) spark(me.x + (Math.random() - 0.5) * 60, me.y - Math.random() * 50, (Math.random() - 0.5) * 30, -40 - Math.random() * 60, 0.8, 0.8 + Math.random() * 0.8, SPARKS[Math.floor(Math.random() * SPARKS.length)]);
      if (phase === 'sleep' && me.ground) {
        me.snore -= dt;
        if (me.snore <= 0) { me.snore = 0.7; pop(me.x + me.face * 16, me.y - 30, 'z', 'rgb(200,212,255)', 1.4); }
      }
      // The honey rush, trailing honey-gold sparks
      me.rush = Math.max(0, me.rush - dt);
      smokeLeft = Math.max(0, smokeLeft - dt);
      if (me.rush > 0 && Math.random() < 0.3) spark(me.x - me.face * A.reach.hw * me.big * 0.6, me.y - Math.random() * tall() * 0.7, -me.face * (30 + Math.random() * 40), -10 - Math.random() * 30, 0.5, 0.6 + Math.random() * 0.5, 'rgb(255,214,120)');
      // A dash leans into it, and leaves a trail: fading copies of the animal where it just was, and sparks streaming back
      me.lean = approach(me.lean, me.dash > 0 ? DASH_LEAN : 0, dt * DASH_LEAN / 0.06);
      me.trail.forEach((t) => { t.age += dt; });
      while (me.trail.length && me.trail[0].age >= DASH_TRAIL) me.trail.shift();
      if (me.dash > 0) {
        if (!me.trail.length || me.trail[me.trail.length - 1].age >= 0.03) me.trail.push({ x: me.x, y: me.y, age: 0 });
        if (Math.random() < 0.45) spark(me.x - me.dashDir * A.reach.hw * me.big * 0.5, me.y - Math.random() * tall() * 0.8, -me.dashDir * (50 + Math.random() * 70), (Math.random() - 0.5) * 24, 0.35, 0.7 + Math.random() * 0.6, SPARKS[Math.floor(Math.random() * SPARKS.length)]);
      }
      // The bouncing star
      me.power = Math.max(0, me.power - dt);
      if (me.power > 0 && Math.random() < 0.34) spark(me.x + (Math.random() - 0.5) * A.reach.hw * me.big * 1.6, me.y - Math.random() * tall(), (Math.random() - 0.5) * 40, -20 - Math.random() * 40, 0.6, 0.8 + Math.random() * 0.8, POWER_COLORS[Math.floor(Math.random() * POWER_COLORS.length)]);
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
          pop(me.x, me.y - tall() - 14, 'Invincible! Run into the bees', 'rgb(255,226,150)', 2.2);
          sfx.power();
          POWER_COLORS.forEach((color) => shower(s.x, s.y, 7, color));
        } else if (s.age >= POWER_LIFE) powers.splice(i, 1);
      }
      me.hurt = Math.max(0, me.hurt - dt);
      me.snip = Math.max(0, me.snip - dt);
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
      // Bridges on their way to new places, trailing sparks, and in place once their stars all get there
      ledges.forEach((l, n) => {
        if (!l.fly) return;
        l.fly.age += dt;
        if (l.fly.age < l.fly.life) {
          if (Math.random() < 0.2) {
            const stars = flyingStars(l, n), [x, y] = stars[Math.floor(Math.random() * stars.length)];
            spark(x, y, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, 0.45, 0.7 + Math.random() * 0.6, 'rgb(255,233,184)');
          }
          return;
        }
        l.fly = null;
        paintLedges();
        shower(l.x, l.y, 12, 'rgb(255,233,184)');
        berries.forEach((b) => { if (b.ledge === l && b.back) Object.assign(b, { on: true, grow: 0, back: false }); });
      });
      // The crab's old shells: one shed in the air, or on the airliner, drops to a bridge, the log or the ground, and each fades
      for (let i = sheds.length - 1; i >= 0; i--) {
        const s = sheds[i];
        s.age += dt;
        if (s.age >= SHED_SECONDS) { sheds.splice(i, 1); continue; }
        if (s.landed) continue;
        const was = s.y;
        s.vy = Math.min(MAX_FALL, s.vy + GRAVITY * dt);
        s.y += s.vy * dt;
        const on = [...ledges.filter((l) => !l.fly), ...logs].find((l) => was <= l.y + 0.01 && s.y >= l.y && Math.abs(s.x - l.x) < l.w / 2);
        if (on || s.y >= floorAt(s.x)) { s.y = on ? on.y : floorAt(s.x); s.landed = true; }
      }
      // Caught stars on their way up to the big star, each making a point of it as it arrives
      forgeAge += dt;
      for (let i = pieces.length - 1; i >= 0; i--) {
        const p = pieces[i], [x, y] = pieceAt(p);
        p.age += dt;
        if (Math.random() < 0.4) spark(x, y, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, 0.4, 0.7 + Math.random() * 0.6, `rgb(${p.color})`);
        if (p.age < p.life) continue;
        pieces.splice(i, 1);
        built[p.s][p.k] = p.color;
        shower(x, y, 6, `rgb(${p.color})`);
        sfx.point(p.k);
      }
      // With all seven points made, the big star sets off for its place in the constellation, and the next one begins
      while (forged < STAGES.length && built[forged].filter(Boolean).length === POINTS && !pieces.some((p) => p.s === forged)) {
        const to = order[forged];
        if (skyStars[to]) beams.push({ i: to, from: { x: forge.x, y: forge.y }, colors: built[forged].slice(), age: 0, hold: 0.3, life: 1.5 });
        else skyLit[to] = true;
        rings.push({ x: forge.x, y: forge.y, age: 0, life: 0.5, r: 44, color: '#FFE9B8' });
        sfx.relight(forged);
        forged += 1;
        forgeAge = 0;
      }
      // A finished big star on its way to its place in the sky
      for (let i = beams.length - 1; i >= 0; i--) {
        const b = beams[i], [x, y] = beamAt(b), to = skyStars[b.i];
        b.age += dt;
        if (Math.random() < 0.6) spark(x, y, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, 0.5, 0.8 + Math.random() * 0.8, SPARKS[Math.floor(Math.random() * SPARKS.length)]);
        if (b.age >= b.life) {
          beams.splice(i, 1);
          skyLit[b.i] = true;
          rings.push({ x: to.x, y: to.y, age: 0, life: 0.7, r: 34, color: '#FFE9B8' });
          shower(to.x, to.y, 16, 'rgb(255,240,200)');
          sfx.lit();
        }
      }
      // Alcor, for whoever spots it
      if (alcor && !alcor.got && stage === ALCOR_STAGE && phase === 'play' && touching(alcor.x, alcor.y, 5)) {
        alcor.got = true;
        counts.alcor += 1;
        caught += 1;
        award(ALCOR_POINTS, alcor.x, alcor.y + 46, 'rgb(232,238,255)', { before: 'Alcor!', after: 'for the eyesight test', life: 3 });
        sfx.alcor();
        shower(alcor.x, alcor.y, 16, 'rgb(232,238,255)');
        countStar(alcor.x, alcor.y, '232 238 255');
        showScore();
      }
      if (moon) {
        moon.rest = Math.max(0, moon.rest - dt);
        moon.flash = Math.max(0, moon.flash - dt);
        // From Mizar's stage on
        if (phase === 'play' && stage >= MOON_FROM && !moon.rest && touching(moon.x, moon.y, moon.r * 0.7, 66 * me.big)) {
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
          belly += 1;
          me.fed = Math.min(GROW_BERRIES, me.fed + 1);
          award(BERRY_POINTS, b.x, b.y - 10, 'rgb(255,130,165)', { note: belly < BELLY ? `${belly} of ${BELLY}` : '' });
          sfx.berry();
          shower(b.x, b.y, 7, 'rgb(255,110,150)');
          if (belly >= BELLY) fullBelly();
        }
      }
      // Honey is worth a lot, and gives a honey rush, but it brings angry bees
      for (let i = pots.length - 1; i >= 0; i--) {
        const p = pots[i];
        p.age += dt;
        if (phase === 'play' && touching(p.x, p.y, 7, 66)) {
          pots.splice(i, 1);
          counts.honey += 1;
          award(HONEY_POINTS, p.x, p.y - 16, 'rgb(255,214,120)', { after: 'and angry bees!' });
          me.rush = RUSH_SECONDS;
          pop(me.x, overBadge(), 'Honey rush! Run!', 'rgb(255,214,120)', 1.8);
          sfx.honey();
          sfx.rush();
          shower(p.x, p.y, 16, 'rgb(255,214,120)');
          sendAngry(p.x, p.y);
        } else if (p.age >= p.life) pots.splice(i, 1);
      }
      // Bees, and any the smoke calms
      const smoke = smokeZone();
      let calmedNow = 0;
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
        if (b.kind === 'calm') {
          b.x += (b.vx + Math.sin(b.age * 5 + i) * 18) * dt;
          b.y += b.vy * dt;
          if (b.age > 2.4 || b.y < -30) bees.splice(i, 1);
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
          // An angry swarm rises out of the pot and gathers for a moment, then chases, until it gives up and flies off
          if (b.age < CHASE_RISE) { const drag = Math.exp(-dt * 3); b.vx *= drag; b.vy *= drag; }
          else if (b.age < chaseFor && phase === 'play') {
            const dx = me.x + b.ox - b.x, dy = me.y - 32 + b.oy - b.y, d = Math.hypot(dx, dy) || 1;
            // It steers hard across but climbs and dives slowly, so a well-timed jump carries the animal over it
            b.vx += dx / d * 1000 * dt;
            b.vy = clamp(b.vy + dy / d * CHASE_CLIMB * dt, -CHASE_CLIMB_TOP, CHASE_CLIMB_TOP);
            const v = Math.hypot(b.vx, b.vy);
            if (v > CHASE_SPEED) { b.vx *= CHASE_SPEED / v; b.vy *= CHASE_SPEED / v; }
          } else b.vy -= 500 * dt;
          b.x += b.vx * dt;
          b.y += (b.vy + Math.sin(b.age * 19 + i) * 40) * dt;
          if (Math.abs(b.vx) > 8) b.dir = Math.sign(b.vx);
          gone = b.y < -30 || b.x < -40 || b.x > W + 40;
        }
        if (gone) bees.splice(i, 1);
        else if (smoke && phase === 'play' && Math.hypot(b.x - smoke.x, b.y - smoke.y) < smoke.r) { calm(b); calmedNow += 1; }
        else if (phase === 'play' && me.power > 0 && touching(b.x, b.y, 6)) knockOut(b);
        else if (phase === 'play' && me.pouncing && touching(b.x, b.y, 8)) {
          bees.splice(i, 1);
          swat(b);
        } else if (phase === 'play' && A.shell && me.rolling && Math.hypot(b.x - me.x, b.y - (me.y - 10)) < LOW.hw + 8) bounce(b);
        // (A swarm rising out of the pot, which the animal is touching, can't sting yet: until November 6 it stung at once, so honey
        // always cost a life)
        else if (phase === 'play' && me.hurt <= 0 && !(b.kind === 'chase' && b.age < CHASE_RISE) && stingable(b.x, b.y)) {
          bees.splice(i, 1);
          sting(b);
        }
      }
      if (calmedNow) {
        award(SWAT_POINTS * calmedNow, smoke.x, overBadge(), 'rgb(236,228,214)', { before: calmedNow > 1 ? 'Bees calmed' : 'Calmed' });
        sfx.calm();
      }
      // A swarm that gives up without a sting was escaped
      for (let i = swarms.length - 1; i >= 0; i--) {
        const s = swarms[i];
        s.age += dt;
        if (s.age < chaseFor) continue;
        swarms.splice(i, 1);
        if (!s.stung && phase === 'play') {
          counts.escapes += 1;
          award(ESCAPE_POINTS, me.x, overBadge(), 'rgb(255,214,120)', { before: 'Escaped the bees!', life: 2 });
          sfx.escape();
        }
      }
      // An airliner to ride, and a satellite, high up, worth a lot
      for (let i = visitors.length - 1; i >= 0; i--) {
        const v = visitors[i];
        if (v.kind === 'plane') flyPlane(v, dt);
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
      // The music picks up a little as the plane being ridden speeds up, up to 30% faster at the sound barrier, and turns to
      // bells while the animal is invincible, 20% faster again (at most 45% faster in all)
      if (music) {
        const p = ridePlane && !ridePlane.boomed && visitors.includes(ridePlane) ? ridePlane : null;
        music.star = me.power > 0 && phase === 'play';
        music.tempo = Math.min(1.45, (p ? 1 + 0.15 * Math.max(0, (p.turning ? p.turnSpeed : Math.abs(p.vx)) / PLANE_SPEED - 1) : 1) * (music.star ? STAR_TEMPO : 1));
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

    // One of the animal's stars, on its back: dim until relit, with the stage's own star brightening as its stars are caught
    const backStar = (x, y, i, size, twinkle) => {
      const glow = lit[i] ? 1 : !ending && stage < STAGES.length && i === order[stage] ? 0.15 + 0.85 * got / POINTS : 0;
      const r = size * (0.6 + 0.4 * glow) + Math.sin(me.time * 3 + i * 1.7) * twinkle * glow, was = o.globalAlpha;
      o.globalAlpha = was * (0.32 + 0.68 * glow);
      o.drawImage(starGlow, x - r, y - r, r * 2, r * 2);
      o.globalAlpha = was;
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
      // Fattening up, the belly rounds out, hanging lower from the top of the back, and the stars on its side go with it
      const fat = me.grown, round = ([x, y]) => [-6 + (x + 6) * (1 + 0.04 * fat), -56 + (y + 56) * (1 + 0.16 * fat)];
      const folded = () => {
        o.translate(-8, 0);
        o.scale(1 - 0.5 * tuck, 1);
        o.translate(8, 0);
        o.translate(-6, -56);
        o.scale(1 + 0.04 * fat, 1 + 0.16 * fat);
        o.translate(6, 56);
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
      BACK_LINES.forEach((name, i) => { const [x, y] = round(BACK_STARS[name]); if (i) o.lineTo(fold(x), y); else o.moveTo(fold(x), y); });
      o.stroke();
      Object.values(BACK_STARS).map(round).forEach(([x, y], i) => backStar(fold(x), y, i, 4.2, 0.7));
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
        const a = i * 2.4, d = r * (0.25 + 0.09 * i);
        backStar(Math.cos(a) * d, Math.sin(a) * d, order[i], 3.8, 0);
      }
      o.restore();
    };
    const paintFox = () => {
      const air = me.ground ? 0 : 1, stride = me.stride || 0, g = me.gait;
      const tuck = smooth(me.tuck), flat = smooth(me.curl), dive = smooth(me.dive), fold = (x) => -2 + (x + 2) * (1 - 0.5 * tuck);
      // Its winter coat, fuller as it grows: a bushier tail, a thicker ruff and a fluffier outline
      const coat = me.grown;
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
        const width = (f) => (1.2 + 8.8 * Math.sin(Math.PI * (0.03 + 0.97 * f) ** 0.72)) * (1 + 0.45 * coat) + (edge ? 1.6 : 0);
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
        o.lineWidth = edge ? 3 + 3 * coat : 0.01;
        o.fill(FOX_BODY);
        o.stroke(FOX_BODY);
        o.restore();
        if (tuck > 0) {
          o.beginPath();
          o.arc(-1, -26, 18 * tuck + (edge ? 1.5 : 0), 0, TAU);
          o.fill();
        }
        head();
        o.lineWidth = (edge ? 13.5 : 11) + 3 * coat;
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
      o.ellipse(fold(21), -24, 5.2 + 2.2 * coat, 8 + 2.6 * coat, 0, 0, TAU);
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
      ANIMALS.fox.back.forEach(([x, y], i) => (i ? o.lineTo(fold(x), y) : o.moveTo(fold(x), y)));
      o.stroke();
      ANIMALS.fox.back.forEach(([x, y], i) => backStar(fold(x), y, i, 3.3, 0.5));
      o.restore();
    };
    // The crab, from the front, low and wide: four legs a side, stepping in turn as it scuttles; two big claws, whose pincers
    // snap shut on a catch; a shell with Cancer's stars across it; and eyes on stalks, looking the way it's going. Pulling into
    // its shell, its legs, claws and eyes fold in and the shell settles to the ground.
    const paintCrab = () => {
      const air = me.ground ? 0 : 1, g = me.gait, step = me.stride || 0, shut = smooth(me.curl), open = 1 - shut;
      const bob = (-Math.abs(Math.sin(step * TAU * 2)) * 1.6 * g + Math.sin(me.time * 2.6) * 0.5 * (1 - g)) * open;
      const shellY = -15 + bob + shut * 7, look = clamp(me.vx / 200, -1, 1), snip = me.snip > 0 ? Math.sin(me.snip / 0.25 * Math.PI) : 0;
      o.lineCap = 'round';
      o.lineJoin = 'round';
      // Legs, each a hip, a knee and a foot
      o.strokeStyle = '#2E8C8A';
      o.lineWidth = 2.2;
      for (const side of [-1, 1]) {
        for (let n = 0; n < 4; n++) {
          const p = (step * 2 + n * 0.27 + (side > 0 ? 0.5 : 0)) % 1, lift = air ? 2.5 : Math.max(0, Math.sin(p * TAU)) * 4 * g;
          o.beginPath();
          o.moveTo(side * (9 + n * 4), shellY + 6);
          o.lineTo(side * (17 + n * 6) * (0.45 + 0.55 * open), shellY - 3 - n * 0.6 + shut * 4);
          o.lineTo(side * (20 + n * 6.5) * (0.35 + 0.65 * open), -lift * open - shut * 4);
          o.stroke();
        }
      }
      // Claws: an arm out and up from each side to a pincer, a palm with a fat lower jaw and a thinner finger, held a little apart
      // as it goes and snapping shut on a catch
      for (const side of [-1, 1]) {
        const hand = [side * 31 * (0.3 + 0.7 * open), shellY - 13 * open - 2], spread = (0.3 + 0.1 * Math.sin(me.time * 5)) * (1 - snip) * open, z = 0.5 + 0.5 * open;
        o.strokeStyle = '#3FA6A0';
        o.lineWidth = 3.4;
        o.beginPath();
        o.moveTo(side * 14, shellY + 1);
        o.lineTo(side * 26 * (0.4 + 0.6 * open), shellY - 2);
        o.lineTo(...hand);
        o.stroke();
        o.save();
        o.translate(...hand);
        o.scale(side * z, z);
        o.rotate(-0.55);
        o.fillStyle = '#7FE6D2';
        o.beginPath();
        o.ellipse(0, 0, 5, 4.2, 0, 0, TAU);
        o.fill();
        [[spread, 1.2, 6, 2.6], [-spread, -1.4, 5.4, 1.9]].forEach(([turn, y, rx, ry], n) => {
          o.save();
          o.translate(3, -n);
          o.rotate(turn);
          o.beginPath();
          o.ellipse(5, y, rx, ry, 0, 0, TAU);
          o.fill();
          o.restore();
        });
        o.restore();
      }
      // The shell, darker below, and Cancer's lines and stars across it
      const fill = o.createLinearGradient(0, shellY - 11, 0, shellY + 10);
      fill.addColorStop(0, '#B4FFEC');
      fill.addColorStop(0.5, '#4FC4BC');
      fill.addColorStop(1, '#2A6F86');
      o.fillStyle = fill;
      o.beginPath();
      o.ellipse(0, shellY, 24, 11 - shut, 0, 0, TAU);
      o.fill();
      o.strokeStyle = 'rgba(232,255,250,.5)';
      o.lineWidth = 0.6;
      o.beginPath();
      SKY_ANIMALS.crab.lines.forEach(([m, n]) => { o.moveTo(ANIMALS.crab.back[m][0], ANIMALS.crab.back[m][1] + bob + shut * 7); o.lineTo(ANIMALS.crab.back[n][0], ANIMALS.crab.back[n][1] + bob + shut * 7); });
      o.stroke();
      ANIMALS.crab.back.forEach(([x, y], i) => backStar(x, y + bob + shut * 7, i, 3.2, 0.5));
      // Eyes on stalks, which go in with the rest
      if (open > 0.05) {
        for (const side of [-1, 1]) {
          const tip = [side * 7 + look * 1.5, shellY - 8 - 9 * open];
          o.strokeStyle = '#3FA6A0';
          o.lineWidth = 1.8;
          o.beginPath();
          o.moveTo(side * 6, shellY - 8);
          o.lineTo(...tip);
          o.stroke();
          o.fillStyle = '#F2FFFC';
          o.beginPath();
          o.arc(tip[0], tip[1], 2.8 * open, 0, TAU);
          o.fill();
          o.fillStyle = '#123C44';
          o.beginPath();
          o.arc(tip[0] + look * 1.1, tip[1] + 0.3, 1.5 * open, 0, TAU);
          o.fill();
        }
      }
    };
    // An animal in the finale's parade, drawn as in a run, from me, which the run no longer needs. A flip turns forward, or
    // backward with spin -1.
    const paradeOne = (pc, which, alpha, light, spin) => {
      const a = ANIMALS[which], px = me.x * scale, py = me.y * scale, facing = a.sideways ? 1 : me.face;
      pc.globalCompositeOperation = 'lighter';
      pc.globalAlpha = alpha * 0.6;
      pc.drawImage(light, px - 110 * scale, py - 140 * scale, 220 * scale, 220 * scale);
      pc.globalCompositeOperation = 'source-over';
      o.setTransform(1, 0, 0, 1, 0, 0);
      o.clearRect(0, 0, off.width, off.height);
      o.setTransform(scale * facing, 0, 0, scale, OFF_X * scale, OFF_Y * scale);
      o.rotate(facing * me.tilt);
      if (me.flip < 1) {
        o.translate(...a.turnAt);
        o.rotate(smooth(me.flip) * TAU * spin);
        o.translate(-a.turnAt[0], -a.turnAt[1]);
      }
      if (which === 'fox') paintFox();
      else if (which === 'crab') paintCrab();
      else { o.translate(0, -8.5); paintBear(); }
      pc.globalAlpha = alpha;
      pc.shadowColor = a.shadow;
      pc.shadowBlur = 18 * scale;
      putAnimal(pc, me.x, me.y, 1);
      pc.shadowBlur = 0;
    };
    // A big star: seven points around a middle, each in the color of the star that made it and the rest outlined faintly, with
    // a glow that grows as it fills. A finished one (done) glows brightest, with a white middle.
    const bigStar = (cx, cy, size, colors, alpha, done) => {
      const R = forge.R * size, r = forge.r * size, made = colors.filter(Boolean).length / POINTS, g = R * (done ? 3.2 : 1.4 + 1.2 * made);
      ctx.globalAlpha = alpha * (done ? 1 : 0.2 + 0.6 * made);
      ctx.drawImage(skyGlow, cx - g, cy - g, g * 2, g * 2);
      ctx.lineWidth = 0.7;
      ctx.lineJoin = 'round';
      for (let k = 0; k < POINTS; k++) {
        const a = -Math.PI / 2 + k * TAU / POINTS, half = Math.PI / POINTS;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a - half) * r, cy + Math.sin(a - half) * r);
        ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        ctx.lineTo(cx + Math.cos(a + half) * r, cy + Math.sin(a + half) * r);
        ctx.closePath();
        if (colors[k]) {
          ctx.globalAlpha = alpha;
          ctx.fillStyle = `rgb(${colors[k]})`;
          ctx.fill();
        } else {
          ctx.globalAlpha = alpha * 0.4;
          ctx.strokeStyle = '#E8EEFF';
          ctx.stroke();
        }
      }
      if (done) {
        ctx.globalAlpha = alpha;
        ctx.drawImage(skyGlow, cx - r * 1.6, cy - r * 1.6, r * 3.2, r * 3.2);
      }
    };
    // The crab's old shell, from the crab as just drawn (before any flash of color), made pale, at the size it was
    const shed = () => {
      me.molting = false;
      const k = clamp(me.big, 1, ROOM), w = 180 * k * scale, c = canvas(w, w), x = c.getContext('2d');
      x.drawImage(off, (OFF_X - 90 * k) * scale, (OFF_Y - 110 * k) * scale, w, w, 0, 0, w, w);
      x.globalCompositeOperation = 'source-atop';
      x.fillStyle = 'rgba(214,255,246,.62)';
      x.fillRect(0, 0, c.width, c.height);
      sheds.push({ c, k, x: me.x, y: me.y, vy: 0, age: 0, landed: me.ground && !me.on });
      shower(me.x, me.y - 16 * k, 16, 'rgb(196,255,240)');
    };
    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, layer.width, layer.height);
      // Bridges on their way to new places, behind everything else here, as the ones in place are on their canvas
      if (ledges.some((l) => l.fly)) {
        ctx.save();
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.globalAlpha = 1;
        ledges.forEach((l, n) => { if (l.fly) paintLedge(ctx, flyingStars(l, n)); });
        ctx.restore();
      }
      // The animal's seven stars in their places in the sky: a faint ring where one is still dim, pulsing where the big star
      // being made will go, and a bright star once its big star has got there
      const skyAlpha = phase === 'in' ? smooth(clamp(phaseTime, 0, 1)) : phase === 'out' ? 1 - smooth(clamp(phaseTime / 0.9, 0, 1)) : 1;
      if (skyStars.length && skyAlpha > 0) {
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.strokeStyle = SKY_ANIMALS[kind] ? SKY_ANIMALS[kind].line : '#E8EEFF';
        ctx.lineWidth = 0.8;
        for (const [m, n] of skyLines) {
          const a = skyStars[m], b = skyStars[n];
          ctx.globalAlpha = skyAlpha * (inSky(m) && inSky(n) ? 0.55 : 0.16);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
        skyStars.forEach((s, i) => {
          if (inSky(i)) {
            const r = 6.5 + Math.sin(me.time * 2.6 + i * 1.3) * 0.8;
            ctx.globalAlpha = skyAlpha;
            ctx.drawImage(skyGlow, s.x - r, s.y - r, r * 2, r * 2);
            return;
          }
          const next = forged < STAGES.length && i === order[forged], pulse = next ? 0.5 + 0.5 * Math.sin(me.time * 4) : 0;
          ctx.globalAlpha = skyAlpha * (next ? 0.3 + 0.35 * pulse : 0.2);
          ctx.beginPath();
          ctx.arc(s.x, s.y, 4.6 + pulse, 0, TAU);
          ctx.stroke();
          ctx.globalAlpha = skyAlpha * 0.35;
          ctx.drawImage(skyGlow, s.x - 1.6, s.y - 1.6, 3.2, 3.2);
        });
        // Alcor, faint, beside Mizar
        if (alcor && !alcor.got && stage === ALCOR_STAGE && phase === 'play') {
          ctx.globalAlpha = 0.4 + 0.15 * Math.sin(me.time * 5.3);
          ctx.drawImage(skyGlow, alcor.x - 2.4, alcor.y - 2.4, 4.8, 4.8);
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      // The big star being made, fading in after the last one leaves; the stars flying up to it; and finished ones on their way
      if (skyAlpha > 0) {
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        if (forged < STAGES.length) bigStar(forge.x, forge.y, 1, built[forged], skyAlpha * smooth(clamp(forgeAge / 0.5, 0, 1)), false);
        for (const p of pieces) {
          const [x, y] = pieceAt(p);
          ctx.globalAlpha = skyAlpha;
          ctx.drawImage(starGlow, x - 5, y - 5, 10, 10);
          ctx.fillStyle = `rgb(${p.color})`;
          ctx.beginPath();
          ctx.arc(x, y, 1.6, 0, TAU);
          ctx.fill();
        }
        for (const b of beams) {
          const [x, y, t] = beamAt(b);
          bigStar(x, y, lerp(1, 0.3, t), b.colors, skyAlpha, true);
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
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
      const glowSize = (210 + Math.min(90, caught * 3)) * (0.7 + 0.3 * health) * me.big * scale;
      ctx.drawImage(glow, px - glowSize / 2, py - 30 * me.big * scale - glowSize / 2, glowSize, glowSize);
      ctx.globalAlpha = me.alpha * 0.6 * (1 - height);
      ctx.drawImage(glow, (me.x - 80 * me.big) * scale, (under - 9) * scale, 160 * me.big * scale, 18 * scale);
      ctx.globalCompositeOperation = 'source-over';
      // The plane and the satellite pass behind the bear. At the end, they fade, with the stars, bees and food, and on the way
      // home or to sleep, they fade first.
      const outFade = phase === 'out' ? clamp(1 - phaseTime / 0.5, 0, 1) : 1, leftover = phase === 'home' || phase === 'sleep' ? clamp(1 - phaseTime / 0.8, 0, 1) : ending === 'home' || ending === 'dawn' ? 0 : outFade;
      for (const v of visitors) {
        ctx.globalAlpha = leftover;
        if (v.kind === 'plane') {
          const dir = v.face;
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
      if (moon && phase === 'play' && stage >= MOON_FROM) {
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
      // The crab's old shells, behind it
      for (const s of sheds) {
        ctx.globalAlpha = leftover * 0.8 * (1 - smooth(clamp(s.age - (SHED_SECONDS - 1), 0, 1)));
        ctx.drawImage(s.c, (s.x - 90 * s.k) * scale, (s.y - 110 * s.k) * scale);
      }
      if (me.alpha > 0) {
        o.setTransform(1, 0, 0, 1, 0, 0);
        o.clearRect(0, 0, off.width, off.height);
        const sx = 1 + me.squash * 0.75, sy = 1 - me.squash;
        // (A crab faces the front, so it isn't mirrored when it changes direction)
        const facing = A.sideways ? 1 : me.face;
        // As big as it's grown, except that the bear's ball goes back to its size at the start, to fit under the log, though not
        // asleep
        const g = kind === 'bear' ? lerp(me.big, phase === 'sleep' ? me.big : START, smooth(me.curl)) : me.big;
        o.setTransform(scale * facing * sx * g, 0, 0, scale * sy * g, OFF_X * scale, OFF_Y * scale);
        // (Leaning into a dash: forward, or for the crab, which isn't mirrored, the way it dashes)
        o.rotate(facing * me.tilt + (A.sideways ? me.dashDir : 1) * me.lean);
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
        } else if (kind === 'crab') {
          paintCrab();
          // Molting: its old shell, as it is now, stays behind, pale and empty, and it steps out of it bigger
          if (me.molting) shed();
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
        // A dash's trail, faint copies fading where it just was
        if (me.trail.length) {
          ctx.globalCompositeOperation = 'lighter';
          for (const t of me.trail) {
            ctx.globalAlpha = me.alpha * 0.3 * (1 - t.age / DASH_TRAIL);
            putAnimal(ctx, t.x, t.y, g);
          }
          ctx.globalCompositeOperation = 'source-over';
        }
        // On the way home it glows brightest of all
        const homeward = phase === 'home' || (phase === 'out' && ending === 'home');
        ctx.globalAlpha = me.alpha * flicker * (0.7 + 0.3 * health);
        ctx.shadowColor = homeward ? 'rgba(255,244,214,.95)' : charged ? chargedColor : moonlit ? 'rgba(255,226,150,.95)' : A.shadow;
        ctx.shadowBlur = (homeward ? 34 : charged ? 26 : 6 + 14 * health) * scale;
        putAnimal(ctx, me.x, me.y, g);
        ctx.shadowBlur = 0;
        // Rolling energy, while it is in use or coming back
        if (me.energy < 1 && phase === 'play') {
          const bx = px - 17 * scale, by = py - (me.rolling ? LOW.h + 12 : tall() + 9) * scale;
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
        ctx.globalAlpha = leftover * Math.min(1, f.t * 9);
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
      // The stoked fire's smoke: soft puffs rising from the chimney, leaning downwind, growing and thinning as they go, over
      // where it calms bees
      if (smokeLeft > 0) {
        const env = clamp((SMOKE_SECONDS - smokeLeft) / 0.6, 0, 1) * clamp(smokeLeft / 1, 0, 1), t = SMOKE_SECONDS - smokeLeft;
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        for (let n = 0; n < 12; n++) {
          const f = (t * 0.4 + n / 12) % 1, x = chimney.x + f * 50 + Math.sin(f * 5 + n) * 5, y = chimney.y - 10 - f * 95, r = 10 + f * 34;
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, 'rgba(228,226,222,.75)');
          g.addColorStop(0.6, 'rgba(206,204,200,.3)');
          g.addColorStop(1, 'rgba(206,204,200,0)');
          ctx.globalAlpha = env * Math.sin(Math.PI * Math.min(1, f * 1.3)) * 0.95;
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, TAU);
          ctx.fill();
        }
      }
      for (const p of pots) {
        ctx.globalAlpha = leftover * Math.min(1, p.age * 3) * (p.life - p.age < 3 && Math.floor(p.age * 6) % 2 ? 0.45 : 1);
        stamp(potSprite, p.x, p.y);
      }
      const wing = Math.floor(me.time * 34) % 2;
      for (const b of bees) {
        ctx.globalAlpha = leftover * (b.kind === 'calm' ? Math.max(0, 1 - b.age / 2.4) : Math.min(1, b.age * 4));
        const look = BEES[b.kind === 'chase' && b.age < chaseFor ? 1 : 0][wing];
        if (b.kind === 'down') {
          // Knocked out, upside down
          ctx.setTransform(scale * b.dir, 0, 0, -scale, b.x * scale, b.y * scale);
          ctx.drawImage(look.c, -look.w / 2, -look.h / 2, look.w, look.h);
        } else stamp(look, b.x, b.y, b.dir);
      }
      for (const s of powers) {
        const look = POWERS[Math.floor(me.time * 7) % POWERS.length], turn = s.age * 2.6 * Math.sign(s.vx), c = Math.cos(turn) * scale, n = Math.sin(turn) * scale;
        ctx.globalAlpha = leftover * (POWER_LIFE - s.age < 3 && Math.floor(s.age * 7) % 2 ? 0.4 : 1);
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
        const m = tier(), x = clamp(me.x, 46, W - 46), y = Math.max(14, me.y - tall() - 24);
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
        ctx.strokeStyle = ring.color || '#FFD9A0';
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
      // The stars on their way down from the sky, dimming, or back, the relit ones bright
      if (phase === 'in' || phase === 'out') {
        const t = smooth(clamp(phaseTime / 1, 0, 1)), there = phase === 'in' ? t : 1 - t;
        skyStars.forEach((star, i) => {
          const [bx, by] = star.to, x = lerp(star.x, me.x + bx * (A.sideways ? 1 : me.face), there), y = lerp(star.y, me.y + by, there) - Math.sin(there * Math.PI) * (20 + i * 5), r = 7;
          ctx.globalAlpha = lit[i] ? 1 : lerp(1, 0.35, there);
          ctx.drawImage(starGlow, x - r, y - r, r * 2, r * 2);
        });
        ctx.globalAlpha = 1;
      }
    };

    // Starting and stopping
    if (!finaleOnly) skyStars.forEach((s) => { s.el.style.visibility = 'hidden'; });
    banner.classList.add('bn-bear-on');
    banner.classList.remove('bn-as-fox', 'bn-as-crab');
    if (kind !== 'bear') banner.classList.add(`bn-as-${kind}`);
    showSkyLabel(banner, 0, null);
    const labels = banner.querySelector('.bn-labels');
    const hint = labels.appendChild(Object.assign(document.createElement('span'), { className: 'bn-bear-hint', textContent: touchOnly ? A.taps : A.keys }));
    const quit = labels.appendChild(Object.assign(document.createElement('span'), { className: 'bn-bear-quit', textContent: 'Quit' }));
    const score = labels.appendChild(Object.assign(document.createElement('span'), { className: 'bn-bear-score' }));
    showScore();
    // Dawn: a glow like the banner's own before sunrise, behind the aurora and the forest, brightening over the end of the night
    const dawn = Object.assign(document.createElement('div'), { className: 'bn-bear-dawn' }), twilight = banner.querySelector('.bn-twilight');
    if (twilight) twilight.after(dawn); else banner.prepend(dawn);
    let dawnShown = 0;
    // A stage's card, as the shooting star game announces its showers: the goal at first, then which star is next, and what the
    // stage brings. A new card replaces any still showing.
    let cards = [];
    const card = (lines, color, delay, ms = 2800) => {
      cards.forEach((el) => el.remove());
      const el = labels.appendChild(Object.assign(document.createElement('div'), { className: 'bn-wave bn-bear-wave' }));
      el.style.setProperty('--c', color);
      el.append(...lines.map((text, i) => Object.assign(document.createElement(i % 2 ? 'span' : 'b'), { textContent: text })));
      el.animate([{ opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: ms, delay }).onfinish = () => el.remove();
      cards = [el];
    };
    const showStage = (delay) => {
      const says = stage === MOON_FROM && !moon ? 'No moon tonight' : (A.says && A.says[stage]) || STAGES[stage].says;
      card([stage ? `Star ${stage + 1} of 7` : 'Relight 7 stars before dawn', ...(A.names ? [A.names[stage]] : []), says], A.card, delay);
    };
    const soundSwitch = labels.appendChild(Object.assign(document.createElement('span'), { className: 'bn-bear-sound' }));
    // A speaker beside the words, with sound waves when on and crossed out when off, as in the shooting star game
    const showSound = (el = soundSwitch) => { el.innerHTML = `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M7.3 3.3L4 6H1.3v4H4l3.3 2.7z" fill="currentColor"/><path d="${soundIsOn ? 'M10.4 5.6a3.3 3.3 0 0 1 0 4.8M12.7 3.3a6.7 6.7 0 0 1 0 9.4' : 'M15 6l-4 4M11 6l4 4'}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>Sound: ${soundIsOn ? 'on' : 'off'}`; };
    showSound();
    wakeAudio();
    if (!finaleOnly) startMusic(kind);
    soundSwitch.addEventListener('click', (e) => {
      e.stopPropagation();
      soundIsOn = !soundIsOn;
      try { localStorage.setItem(SOUND_KEY, soundIsOn ? '1' : '0'); } catch (x) { /* blocked */ }
      wakeAudio();
      showSound();
      sfx.catch(1);
      if (soundIsOn) startMusic(kind); else stopMusic(0.2);
    });
    // The first stage's card, and then on a meteor shower's peak night, a card for that
    if (!finaleOnly) showStage(900);
    const peakTimer = peak && !finaleOnly ? setTimeout(() => { if (!ending) card(['Peak tonight', `The ${peak}`, 'Double points for stars'], '255 214 150', 0, 3200); }, 3900) : 0;
    // After the controls, on a touch screen how to dash, which doesn't fit beside them on a phone, and then what a run can bring
    const homeHint = () => {
      if (!A.unlocks || unlockedAnimals().includes(A.unlocks)) { hint.style.opacity = 0; return; }
      hint.textContent = A.homeHint;
      hintTimer = setTimeout(() => { hint.style.opacity = 0; }, 7000);
    };
    let hintTimer = finaleOnly ? 0 : setTimeout(() => {
      if (!touchOnly) { homeHint(); return; }
      hint.textContent = 'Swipe left or right to dash that way';
      hintTimer = setTimeout(homeHint, 4000);
    }, 8000);
    const typing = () => document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.querySelector('dialog[open]');
    const MAP = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowDown: 'down', s: 'down', S: 'down', ArrowUp: 'jump', w: 'jump', W: 'jump', ' ': 'jump' };
    let tapped = { k: null, at: 0 };
    const onKeyDown = (e) => {
      if (typing() || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') { e.preventDefault(); leave(); return; }
      const k = MAP[e.key];
      if (!k) return;
      e.preventDefault();
      if (k === 'jump' && !e.repeat) me.buffer = BUFFER;
      // A second press of the same arrow soon after the first asks for a dash, and a third starts over
      if ((k === 'left' || k === 'right') && !e.repeat) {
        const at = performance.now() / 1000;
        if (tapped.k === k && at - tapped.at < DASH_TAP) { me.dashAsk = BUFFER; me.dashAskDir = k === 'right' ? 1 : -1; tapped.k = null; } else tapped = { k, at };
      }
      keys[k] = true;
    };
    const onKeyUp = (e) => { const k = MAP[e.key]; if (k) keys[k] = false; };
    const letGo = () => { keys.left = keys.right = keys.down = keys.jump = false; };
    // On a touch screen the bear runs by itself and turns at each end: a tap jumps, after a short wait to tell it from a swipe
    let touch = null;
    const onDown = (e) => {
      if (e.pointerType !== 'touch') return;
      touch = { x: e.clientX, y: e.clientY, timer: setTimeout(() => { if (touch) { touch.timer = 0; me.buffer = BUFFER; keys.jump = true; } }, 70) };
    };
    // A swipe down rolls, and a swipe sideways dashes that way, turning first if need be
    const onMove = (e) => {
      if (!touch || !touch.timer) return;
      const down = e.clientY - touch.y, across = e.clientX - touch.x;
      if (down >= 14 && down >= Math.abs(across)) swipeRoll = true;
      else if (Math.abs(across) >= 18 && Math.abs(across) > down) {
        me.autoDir = Math.sign(across);
        me.dashAsk = BUFFER;
        me.dashAskDir = me.autoDir;
      } else return;
      clearTimeout(touch.timer);
      touch.timer = 0;
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
      stopMusic(0.2);
      clearTimeout(hintTimer);
      clearTimeout(peakTimer);
      cards.forEach((el) => el.remove());
      // Night comes back
      dawn.animate([{ opacity: dawnShown }, { opacity: 0 }], { duration: 2500, easing: 'ease-in-out' }).onfinish = () => dawn.remove();
      if (touch && touch.timer) clearTimeout(touch.timer);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', letGo);
      banner.removeEventListener('pointerdown', onDown);
      banner.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (points > best) { try { localStorage.setItem(A.bestKey, String(points)); } catch (e) { /* blocked */ } }
      [layer, levelLayer, logLayer, quit, soundSwitch, ...(result ? [] : [hint, score])].forEach((el) => el.remove());
      skyStars.forEach((s) => { s.el.style.visibility = ''; });
      banner.classList.remove('bn-bear-on', 'bn-as-fox', 'bn-as-crab');
      if (!result) { if (onEnd) onEnd(); return; }
      // The first time all three animals are home, the grand finale, in place of this run's credits
      if (finale) {
        score.style.visibility = 'hidden';
        hint.style.visibility = 'hidden';
        grandFinale(afterwards);
        return;
      }
      // A run worth remembering gets credits, as in the shooting star game, while the aurora surges
      if (caught >= 3 || points >= 300) {
        score.style.visibility = 'hidden';
        hint.style.visibility = 'hidden';
        rollCredits(afterwards);
      } else afterwards();
    };
    // The grand finale: fireworks rising from behind the forest and bursting in the aurora's colors and the animals', faster and
    // faster to a crescendo of gold at 12 s; then the three constellations blaze together, their lines drawn bright, the aurora
    // surges and credits rise. With sound on, Vivaldi's Spring plays, and its own Sound switch can turn it on. Bursts bloom and
    // fade rather than flash, and nothing shakes. A click ends it.
    const grandFinale = (done) => {
      const b = banner.getBoundingClientRect(), W2 = b.width, H2 = b.height, k2 = H2 / 216, ratio = Math.min(2, window.devicePixelRatio || 1);
      const sky = Object.assign(document.createElement('canvas'), { className: 'bn-fireworks', width: Math.ceil(W2 * ratio), height: Math.ceil(H2 * ratio) });
      const ground = banner.querySelector('.bn-ground');
      if (ground) ground.before(sky); else banner.append(sky);
      const c = sky.getContext('2d');
      // The three constellations, where they are in the sky
      const spot = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2 - b.left, r.top + r.height / 2 - b.top]; };
      const figures = [
        { stars: Object.keys(BACK_STARS).map((name) => banner.querySelector(`[data-star="${name}"]`)).filter(Boolean).map(spot), lines: dipperLine.slice(1).map((n, i) => [dipperLine[i], n]), color: '#C9D6FF' },
        ...['fox', 'crab'].map((other) => ({ stars: [...banner.querySelectorAll(`.bn-animal-sky .${other} [data-sky-star]`)].map(spot), lines: SKY_ANIMALS[other].lines, color: SKY_ANIMALS[other].line }))
      ].filter((f) => f.stars.length === 7);
      const glowDot = softDot(64, [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,248,230,.6)'], [1, 'rgba(255,240,210,0)']]);
      // The bear's blue and violet, the fox's orange, the crab's aqua, the aurora, and gold
      const PALETTES = [['#A9C1FF', '#D2B3FF', '#E8EEFF'], ['#FFC27A', '#FFE3B0', '#FFD9A0'], ['#9FF5DC', '#B4FFEC', '#7FE6D2'], ['#9FF5DC', '#A9C1FF', '#D2B3FF', '#FFB6E6'], ['#FFE9B8', '#FFD66B']];
      const rockets = [], bits = [], blooms = [];
      // The parade: the three walk in from the left in a line, the Great Bear leading, march across, turn around together, and
      // walk back to stand together in the middle, the crab, then the fox and the bear, facing each other. Then they jump in turn
      // while the credits rise. On a layer above the hills, and in front of the clumps of spruce, so none is ever hidden.
      const parade = addLayer(), pc = parade.getContext('2d'), speed = Math.max(90, (W * 0.8 + 60) / 9), turnAt = W * 0.8;
      const behind = [0, 145, 255], apart = Math.max(W * 0.12, 135), ends = [W / 2 - apart, W / 2, W / 2 + apart];
      banner.classList.add('bn-bear-finale');
      const marchers = ['bear', 'fox', 'crab'].map((which, i) => ({ which, i, light: softDot(256, ANIMALS[which].glow), stride: 0, tail: -0.55, snip: 0, gait: 0, end: ends[2 - i], hop: null, n: 0, standing: false }));
      const march = (m, dt) => {
        const tau = t - 0.8, out = (turnAt + 60) / speed, start = -60 - behind[m.i];
        let x = start + speed * Math.max(0, tau), face = 1, moving = tau >= 0;
        if (tau >= out) {
          x = turnAt - behind[m.i] - speed * (tau - out);
          face = -1;
          if (x <= m.end) { x = m.end; moving = false; face = m.which === 'bear' ? -1 : 1; }
        }
        // Jumps: on the march, the bear somersaults now and then and the fox hops, flipping every other time; standing together,
        // they jump in turn, the bear with a backflip and the fox a somersault, while the crab hops and snaps its claws. A jump
        // keeps its own height and time in the air to the end, and a flip the way it faced, so none is cut short or turned
        // around in the air when the parade turns or stops.
        // [how often, how high, how long in the air, which jumps flip: every one (1), every other (2) or none (0)]
        const standing = tau >= out && !moving;
        const [every, height, air, flips] = standing ? [[3.2, 44, 0.7, 1], [3.2, 52, 0.7, 1], [1.6, 12, 0.42, 0]][m.i] : [[3.8, 38, 0.66, 1], [2.2, 18, 0.5, 2], [1, 0, 1, 0]][m.i];
        const n = Math.floor((t + m.i * 1.07) / every);
        if (m.hop && (m.hop.age += dt) >= m.hop.air) m.hop = null;
        if (!m.hop && height && n > m.n && standing === m.standing) {
          m.hop = { age: 0, height, air, spin: flips && n % flips === 0 ? (standing && m.which === 'bear' ? -1 : 1) : 0 };
          if (m.which === 'crab') m.snip = 0.25;
        }
        Object.assign(m, { n, standing });
        const h = m.hop, p = h ? h.age / h.air : 0, up = h ? h.height * 4 * p * (1 - p) : 0, vy = h ? -h.height * 4 * (1 - 2 * p) / h.air : 0;
        const flip = h && h.spin ? clamp((p - 0.08) / 0.84, 0, 1) : 1;
        if (flip < 1) face = m.face;
        m.snip = Math.max(0, m.snip - dt);
        m.gait = lerp(m.gait, moving && !up ? 1 : 0, 1 - Math.exp(-dt * 10));
        if (moving) m.stride = (m.stride + speed * dt / ANIMALS[m.which].stride) % 1;
        m.tail = lerp(m.tail, up ? (vy > 0 ? 0.85 : -0.25) : moving ? 0.22 : -0.55, 1 - Math.exp(-dt * 9));
        // Tucked through a flip, in quickly at its start and opening out for the last part, as in a run
        const tuck = flip < 1 ? smooth(clamp(flip / 0.08, 0, 1)) * (1 - smooth(clamp((flip - TUCK_UNTIL) / 0.2, 0, 1))) : 0;
        Object.assign(m, { x, face, up, vy, moving, flip, tuck, spin: h && h.spin ? h.spin : 1, alpha: smooth(clamp((x + 60) / 40, 0, 1)) });
      };
      let t = 0, next = 0.4, shots = 0, then = performance.now(), going = true, blazed = false, credits = null, rise = null, skipHint = null;
      const launch = (shape) => {
        const x = W2 * (0.12 + Math.random() * 0.76);
        rockets.push({ x, top: H2 * (0.12 + Math.random() * 0.3), age: 0, life: 0.9 + Math.random() * 0.4, shape, colors: shape === 'willow' ? PALETTES[4] : PALETTES[shots++ % 4] });
      };
      // A burst: sparks flying out, and a soft bloom of light where it opens, which fades in half a second rather than flashing
      const burst = (r, y) => {
        const willow = r.shape === 'willow', ring = r.shape === 'ring', count = willow ? 90 : ring ? 64 : 70 + Math.floor(Math.random() * 30);
        for (let i = 0; i < count; i++) {
          const a = ring ? i / count * TAU : Math.random() * TAU, v = (ring ? 120 : 50 + Math.random() * 110) * k2 * (willow ? 0.8 : 1);
          bits.push({ x: r.x, y, px: r.x, py: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, age: 0, life: (willow ? 2.6 : 1.5) + Math.random() * 0.6, color: r.colors[i % r.colors.length], fall: (willow ? 70 : 40) * k2 });
        }
        blooms.push({ x: r.x, y, age: 0 });
        noise(260, 0.05, 900, 120);
      };
      // Its own Sound switch, since the run's has gone
      const switchEl = labels.appendChild(Object.assign(document.createElement('span'), { className: 'bn-bear-sound' }));
      showSound(switchEl);
      switchEl.addEventListener('click', (e) => {
        e.stopPropagation();
        soundIsOn = !soundIsOn;
        try { localStorage.setItem(SOUND_KEY, soundIsOn ? '1' : '0'); } catch (x) { /* blocked */ }
        wakeAudio();
        showSound(switchEl);
        if (soundIsOn) startMusic('spring'); else stopMusic(0.2);
      });
      wakeAudio();
      startMusic('spring');
      if (options.surge) options.surge();
      const best = (other) => { try { return Number(localStorage.getItem(ANIMALS[other].bestKey)) || 0; } catch (e) { return 0; } };
      const finish = () => {
        if (!going) return;
        going = false;
        banner.removeEventListener('click', skip, true);
        stopMusic(1.5);
        if (rise) rise.cancel();
        [credits, skipHint, switchEl].forEach((el) => el && el.remove());
        sky.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600 }).onfinish = () => sky.remove();
        parade.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600 }).onfinish = () => { parade.remove(); banner.classList.remove('bn-bear-finale'); };
        done();
      };
      // A click only skips it
      const skip = (e) => { e.stopPropagation(); e.preventDefault(); finish(); };
      banner.addEventListener('click', skip, true);
      skipHint = labels.appendChild(Object.assign(document.createElement('span'), { className: 'bn-skip', textContent: touchOnly ? 'Tap to skip' : 'Click to skip' }));
      const rollFinale = () => {
        const rows = [[allHome() ? 'All three are home' : 'Credits', true], [''], ...Object.values(ANIMALS).flatMap((a) => [[a.title, true], ...(best(a.short) ? [[`Best ${number(best(a.short))}`]] : [])]), [''], ['Music', true], ['Antonio Vivaldi'], ['Spring, from The Four Seasons'], [''], ['Thanks for playing', true]];
        credits = labels.appendChild(Object.assign(document.createElement('div'), { className: 'bn-credits bn-bear-credits' }));
        credits.replaceChildren(...rows.map(([text, head]) => (text ? Object.assign(document.createElement(head ? 'b' : 'span'), { textContent: text }) : document.createElement('i'))));
        const tall = credits.offsetHeight;
        rise = credits.animate([{ opacity: 1, transform: `translate(-50%, ${H2.toFixed(1)}px)` }, { opacity: 1, transform: `translate(-50%, ${(-tall).toFixed(1)}px)` }], { duration: (H2 + tall) / (H2 * 0.4) * 1000, easing: 'linear' });
        rise.onfinish = finish;
      };
      const tick = (now) => {
        if (!going) return;
        if (document.hidden) { finish(); return; }
        const dt = Math.min(0.05, (now - then) / 1000);
        then = now;
        t += dt;
        // Rockets come faster to the crescendo, then a few more under the credits
        if (t >= next) {
          if (t >= 12 && t < 13.6) { launch('willow'); next = t + 0.18; }
          else {
            launch(Math.random() < 0.25 ? 'ring' : 'peony');
            if (t < 12 && Math.random() < 0.25) launch('peony');
            next = t + (t < 12 ? lerp(0.9, 0.32, t / 12) : 1.2) * (0.8 + Math.random() * 0.4);
          }
        }
        if (t >= 14 && !blazed) { blazed = true; if (options.surge) options.surge(); rollFinale(); }
        for (let i = rockets.length - 1; i >= 0; i--) {
          const r = rockets[i];
          r.age += dt;
          if (r.age >= r.life) { rockets.splice(i, 1); burst(r, r.top); }
        }
        for (let i = blooms.length - 1; i >= 0; i--) { blooms[i].age += dt; if (blooms[i].age > 0.5) blooms.splice(i, 1); }
        for (let i = bits.length - 1; i >= 0; i--) {
          const p = bits[i], drag = Math.exp(-dt * 1.6);
          p.age += dt;
          if (p.age >= p.life) { bits.splice(i, 1); continue; }
          p.px = p.x;
          p.py = p.y;
          p.vx *= drag;
          p.vy = p.vy * drag + p.fall * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
        }
        c.setTransform(ratio, 0, 0, ratio, 0, 0);
        c.clearRect(0, 0, W2, H2);
        c.globalCompositeOperation = 'lighter';
        c.lineCap = 'round';
        // The three constellations, blazing together
        const blaze = smooth(clamp((t - 14) / 1.5, 0, 1));
        if (blaze > 0) {
          figures.forEach((f, n) => {
            c.strokeStyle = f.color;
            c.lineWidth = 1.4;
            c.globalAlpha = 0.75 * blaze;
            c.beginPath();
            f.lines.forEach(([m, o2]) => { c.moveTo(...f.stars[m]); c.lineTo(...f.stars[o2]); });
            c.stroke();
            f.stars.forEach(([x, y], i) => {
              const r = (9 + Math.sin(t * 3 + i * 1.7 + n) * 2) * k2;
              c.globalAlpha = blaze;
              c.drawImage(glowDot, x - r, y - r, r * 2, r * 2);
            });
          });
        }
        // Rockets, a bright head with a short trail, rising from behind the forest
        rockets.forEach((r) => {
          const f = 1 - (1 - r.age / r.life) ** 2, y = lerp(H2 * 0.95, r.top, f), trail = c.createLinearGradient(r.x, y, r.x, y + 16 * k2);
          trail.addColorStop(0, 'rgba(255,240,210,.9)');
          trail.addColorStop(1, 'rgba(255,240,210,0)');
          c.globalAlpha = 1;
          c.strokeStyle = trail;
          c.lineWidth = 1.6 * k2;
          c.beginPath();
          c.moveTo(r.x, y + 16 * k2);
          c.lineTo(r.x, y);
          c.stroke();
          c.drawImage(glowDot, r.x - 4 * k2, y - 4 * k2, 8 * k2, 8 * k2);
        });
        // Bursts: the bloom where each opened, and each spark a short streak from where it was, with a glow at its head, fading
        blooms.forEach((m) => {
          const r = (18 + 30 * m.age) * k2;
          c.globalAlpha = 0.5 * (1 - m.age / 0.5);
          c.drawImage(glowDot, m.x - r, m.y - r, r * 2, r * 2);
        });
        bits.forEach((p) => {
          const fade = (1 - p.age / p.life) ** 1.5, g = 3.2 * Math.max(0.7, k2);
          c.globalAlpha = fade;
          c.strokeStyle = p.color;
          c.lineWidth = 2 * Math.max(0.6, k2);
          c.beginPath();
          c.moveTo(p.px, p.py);
          c.lineTo(p.x, p.y);
          c.stroke();
          c.globalAlpha = fade * 0.8;
          c.drawImage(glowDot, p.x - g, p.y - g, g * 2, g * 2);
        });
        c.globalAlpha = 1;
        c.globalCompositeOperation = 'source-over';
        // The parade, in front of the clumps of spruce
        pc.setTransform(1, 0, 0, 1, 0, 0);
        pc.clearRect(0, 0, parade.width, parade.height);
        pc.globalAlpha = smooth(clamp((t - 0.8) / 0.5, 0, 1));
        pc.drawImage(foreLayer, 0, 0);
        pc.globalAlpha = 1;
        marchers.forEach((m) => {
          march(m, dt);
          if (m.alpha <= 0) return;
          Object.assign(me, { x: m.x, y: floorAt(m.x) - m.up, face: m.face, gait: m.gait, stride: m.stride, time: t + m.i, tuck: m.tuck, curl: 0, dive: 0, flip: m.flip, squash: 0, tail: m.tail, snip: m.snip, big: 1, grown: 0,
            vy: m.vy, vx: m.moving ? m.face * speed : 0, ground: !m.up, tilt: m.up ? 0 : Math.atan(slopeAt(m.x)) });
          paradeOne(pc, m.which, m.alpha, m.light, m.spin);
        });
        pc.globalAlpha = 1;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const rollCredits = (done) => {
      const h = banner.getBoundingClientRect().height, time = Math.round(playTime), left = counts.left;
      const rows = [...(newBest ? ['New best!', ''] : []), A.title, ending === 'home' ? `Home by ${clock()}` : `${lit.filter(Boolean).length} of 7 stars relit`, '',
        `${caught} ${caught === 1 ? 'star' : 'stars'} caught`, ...(counts.alcor ? ['Alcor spotted'] : []), ...(bestCombo >= 3 ? [`Longest combo ${bestCombo}`] : []), ...(counts.berries ? [`Berries ${counts.berries}`] : []), ...(counts.bellies ? [`Full bellies ${counts.bellies}`] : []), ...(counts.honey ? [`Honey pots ${counts.honey}`] : []), ...(counts.stokes ? [`Fires stoked ${counts.stokes}`] : []), ...(counts.calmed ? [`Bees calmed ${counts.calmed}`] : []), ...(counts.escapes ? [`Swarms escaped ${counts.escapes}`] : []),
        ...(counts.bees ? [`Bees bonked ${counts.bees}`] : []), ...(counts.satellites ? [`Satellites ${counts.satellites}`] : []), ...(counts.miles ? [`Air miles ${number(counts.miles)}`] : counts.rides ? [`Plane rides ${counts.rides}`] : []), ...(counts.booms ? [`Sonic booms ${counts.booms}`] : []),
        ...(counts.moons ? [`Moon gravity ${counts.moons}`] : []), ...(counts.fires ? [`Fox fires ${counts.fires}`] : []),
        ...(left ? [`Night left ${hoursMinutes(left)}`] : []), `Time ${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`, '', 'Final score', number(points), '', 'Foxfires', 'The aurora in Finnish is', 'revontulet, fox fires', '', 'Thanks for playing'];
      const heads = new Set(['New best!', ...Object.values(ANIMALS).map((a) => a.title), 'Final score', 'Foxfires']);
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
      // After the finale on its own there's no result to show
      if (finaleOnly) { hint.remove(); score.remove(); if (onEnd) onEnd(); return; }
      score.style.visibility = '';
      hint.style.visibility = '';
      if (soundIsOn && audio) setTimeout(() => { if (!current && audio) audio.suspend(); }, 2500);
      {
        linger([hint, score]);
        // For people with the review link, the shared high scores: any score opens them, a top ten one to enter initials, and
        // the line links to them
        if (window.auroraArcade) {
          window.auroraArcade.gameEnded(points, { game: 'bear', animal: kind }).then((shared) => {
            if (!shared || !score.isConnected) return;
            score.append(' ', Object.assign(document.createElement('span'), { textContent: 'High scores' }));
            score.classList.add('link');
            score.addEventListener('click', (e) => { e.stopPropagation(); window.auroraArcade.show('bear'); });
          });
        }
      }
      if (onEnd) onEnd();
    };
    // A run ends in one of four ways: home, with all seven stars relit; asleep at dawn; out of lives; or quit. Home and dawn have a
    // moment of their own before the stars go back to the sky.
    const leave = (why = 'quit', relit = 0) => {
      if (ending) return;
      ending = why;
      phase = why === 'home' ? 'home' : why === 'dawn' ? 'sleep' : 'out';
      phaseTime = 0;
      letGo();
      cards.forEach((el) => el.remove());
      const who = A.who, at = Math.max(me.y - tall(), 126);
      if (why === 'home') {
        // Each minute of night left is worth points, and the animal rises, glowing, as the aurora surges
        const left = NIGHT_HOURS * 60 - nightMinutes(), bonus = left * NIGHT_MINUTE_POINTS;
        points += bonus;
        counts.left = left;
        home = { y: me.y, rise: clamp(me.y - tall() - 24, 0, 90) };
        pop(me.x, at - 48, `${who} is home! +${number(relit)}`, 'rgb(255,232,170)', 3);
        if (bonus) pop(me.x, at - 24, `+${number(bonus)} for ${hoursMinutes(left)} of night left`, 'rgb(200,212,255)', 3);
        if (options.surge) options.surge();
        if (A.unlocks && !unlockedAnimals().includes(A.unlocks)) unlockNext(at - 72);
        finale = bringHome(kind);
      } else if (why === 'dawn') {
        pop(me.x, at - 30, `Dawn! ${who} curls up to sleep`, 'rgb(200,212,255)', 3);
      }
      // The music fades as the animal goes back to the sky
      stopMusic(0.9);
      // The result stays for a moment after the bear has gone back to the sky
      if (!points) return;
      result = true;
      newBest = best > 0 && points > best;
      if (why === 'home') sfx.home(); else if (why === 'dawn') sfx.sleep(); else if (newBest) sfx.best(); else sfx.over();
      const relitNow = lit.filter(Boolean).length, how = why === 'home' ? `Home by ${clock()} with ${number(points)} points` : `${why === 'dawn' ? 'Dawn came with ' : ''}${relitNow} of 7 stars relit and ${number(points)} points`;
      score.textContent = `${how}${newBest ? ', a new best!' : best ? `. Your best is ${number(Math.max(best, points))}.` : '.'}`;
      clearTimeout(hintTimer);
      const touchWord = touchOnly ? 'Tap' : 'Click';
      const next = unlockedNow && ANIMALS[unlockedNow].short;
      hint.textContent = unlockedNow ? `You unlocked the ${next}! ${touchWord} its stars, at the upper left, to play as the ${next}` : `${touchWord} ${A.again} to play again`;
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
      } else if ((phase === 'home' && phaseTime >= HOME_SECONDS) || (phase === 'sleep' && phaseTime >= SLEEP_SECONDS)) {
        // Then the stars go back to the sky
        phase = 'out';
        phaseTime = 0;
      } else if (phase === 'out') {
        me.alpha = 1 - smooth(clamp(phaseTime / 0.4, 0, 1));
        if (phaseTime >= 1) { cleanup(); return; }
      }
      while (acc >= STEP) { update(STEP); acc -= STEP; }
      // Rising home, and staying up while its stars go back to the sky
      if (home) { me.y = home.y - smooth(phase === 'home' ? clamp(phaseTime / HOME_SECONDS, 0, 1) : 1) * home.rise; me.vx = 0; me.vy = 0; }
      // Dawn's glow, over the end of the night
      const dawnNow = smooth(clamp((night / NIGHT_SECONDS - (1 - DAWN_GLOW)) / DAWN_GLOW, 0, 1));
      if (Math.abs(dawnNow - dawnShown) > 0.004) { dawnShown = dawnNow; dawn.style.opacity = dawnNow.toFixed(3); }
      draw();
      requestAnimationFrame(frame);
    };
    current = { leave };
    // The finale on its own: every star lit, and straight to it
    if (finaleOnly) { lit.fill(true); ending = 'home'; result = true; finale = true; cleanup(); return; }
    requestAnimationFrame(frame);
  };
  window.auroraBear = { start, showAnimals, animalAt, stop: () => current && current.leave() };
})();

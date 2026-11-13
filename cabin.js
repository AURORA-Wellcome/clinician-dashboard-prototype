// The cabin game, the banner's fourth: a click on the cabin stokes its fire and starts a winter. Winter's army, figures of
// snow and ice with eyes glowing ice blue, marches out of the forest along the ridge to put out the cabin's fire. Lanterns,
// fire pits and woodpiles built on rings along the ridge melt and slow it, a woodshed brings more wood, and a click on the
// cabin stokes the fire again, sending out a ring of warmth. In March, Old Man Winter comes himself. Keep the fire going till
// spring. index.html loads this the first time someone starts it.
//
// The spec is Clinicians/Dashboard/casual-games/Cabin game spec 2026-11-06.md, in the project folder. This is all four of its steps: the
// ridge and lanterns; the winter (the other buildings, the rest of the army, the cards and the endings); credits, high
// scores, sound and music; and star lanterns, then balance, with bots at three widths. The long winter (bead aurora-cw6) made
// it about ten minutes and added the cabin's wings, warm ground that spreads, beavers, stars called down, a star animal as a
// hero, sappers and scarves, the aurora as a last resort, and tonight's real moon and meteor showers.
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
  // side's spacing, the second missed by 3 px, and one lantern alone there let packs of runners through); and, with the mill,
  // the woodshed's place, SHED left of the cabin.
  const RINGS = 7, FIRST_RING = 0.6, RING_GAP = 0.55, EDGE = 0.2, RIGHT_RINGS = 2, RIGHT_FIRST = 0.5, RIGHT_GAP = 0.5, SHED = 0.3;
  // Warm ground: you can build only as far from the cabin as its warmth reaches, WARM_START banner heights at first, which with the
  // first addition to the cabin takes in the three nearest rings. Each stoke moves the edge WARM_STOKE farther (about one ring a month), each addition to the
  // cabin WARM_ADD, and a fire pit warms the ground WARM_PIT past itself, so fire pits are outposts. The army comes out of the
  // trees ENTRY_PAST beyond the edge, up to PATH out, so warmth that spreads gives it farther to walk. The edge only ever moves
  // outward, however the winter goes, since the spec ruled out darkness closing in on the cabin, on this page.
  const WARM_START = 1.25, WARM_STOKE = 0.07, WARM_ADD = 0.55, WARM_PIT = 0.6, WARM_MAX = 4.2, ENTRY_PAST = 1;
  // Wood: START_WOOD to begin with, a cord between months (CORD), and NEXT_WOOD for each second of a breather skipped, as
  // tower defense games reward calling a wave early. Each of the army melted is worth a little too (HOST, below).
  const START_WOOD = 100, CORD = 60, NEXT_WOOD = 3;
  // What can be built: what a ring takes is a lantern or a fire pit, and a smaller spot between rings a woodpile or a beavers'
  // lodge. needs: the addition to the cabin it needs, if any.
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
    lantern: { name: 'Lantern', levels: [{ cost: 40, reach: 0.5, melt: 0.7 }, { cost: 60, reach: 0.58, melt: 1.15 }, { cost: 90, reach: 0.66, melt: 1.8 }] },
    firepit: { name: 'Fire pit', needs: 'workshop', levels: [{ cost: 70, reach: 0.33, melt: 0.9 }, { cost: 100, reach: 0.4, melt: 1.4 }] },
    woodpile: { name: 'Woodpile', needs: 'workshop', levels: [{ cost: 25 }], alight: 40, burn: 20, slow: 0.5, after: 2, melt: 1.6, half: 0.07, tall: 8 },
    woodshed: { name: 'Woodshed', needs: 'mill', levels: [{ cost: 60 }], wood: 40 },
    lodge: { name: 'Beaver lodge', needs: 'mill', levels: [{ cost: 30 }, { cost: 45 }], half: 0.09, tall: 5 },
  };
  // What can be added to the cabin, between months: the first of its wings is free, and each one after costs more, so most
  // winters have two of the three. Each wing, and each bigger hearth, warms another stretch of ground (WARM_ADD); a bigger hearth
  // is offered only while there's ground still to warm.
  const WINGS = {
    workshop: { name: 'Workshop', does: 'Fire pits, woodpiles and scarves' },
    mill: { name: 'Mill', does: 'Beavers for more wood, and a woodshed' },
    telescope: { name: 'Telescope', does: 'Click the sky to call stars down' },
  };
  const WING_COSTS = [0, 150, 320], HEARTHS = [90, 180, 280];
  // Beavers gnaw logs by their lodge, GNAW wood a second and GNAW_FAR more for each banner height from the cabin, where the logs
  // are better; a second beaver makes it SECOND_BEAVER times as fast. The wood piles up, up to PILE_MAX, until a click brings it
  // in. Within SCARED banner heights of the army they stop and hide. Or they build a dam across the path over DAM_BUILD seconds,
  // which slows the army as a woodpile does, and meltwater from anything melted within POND_REACH fills its pond, to POND_FULL.
  // Opened, the dam sends a flood toward the forest at FLOOD_SPEED for FLOOD_RANGE banner heights, washing what it meets back
  // FLOOD_PUSH (Old Man Winter FLOOD_KING), at WASH_SPEED, taking FLOOD_HIT and leaving it staggered for WASHED seconds.
  const GNAW = 0.3, GNAW_FAR = 0.1, SECOND_BEAVER = 1.6, PILE_MAX = 14, SCARED = 0.35, DAM_BUILD = 6, POND_REACH = 0.6, POND_FULL = 40;
  const FLOOD_SPEED = 2.4, FLOOD_RANGE = 2.2, FLOOD_PUSH = 1.1, FLOOD_KING = 0.35, FLOOD_HIT = 0.8, WASH_SPEED = 2.2, WASHED = 2;
  // A lantern a sapper has iced over stays dark until clicked free; after ICE_WAIT seconds a beaver comes from the nearest lodge
  // that's gnawing, at BEAVER_RUN banner heights a second, and takes THAW_TIME seconds to free it, gnawing nothing meanwhile.
  const ICE_WAIT = 3, BEAVER_RUN = 1.3, THAW_TIME = 1.2;
  // With the telescope, a click on the sky calls a star down on the ridge below it: up to CALL_MAX to hand, one more every
  // CALL_EVERY seconds. It takes CALL_FALL seconds to fall and CALL_HIT times its star's heat and the month's toughness from what's within CALL_REACH
  // banner heights (a star's heat: see STARS), and staggers what's within CALL_STAGGER for CALL_WINDED seconds.
  const CALL_MAX = 3, CALL_EVERY = 10, CALL_FALL = 0.45, CALL_HIT = 3, CALL_REACH = 0.14, CALL_STAGGER = 0.3, CALL_WINDED = 2;
  // The aurora: it charges over AURORA_SECONDS while the army marches, and AURORA_PER_MELT more for each one melted. Called, it
  // comes down on the whole ridge AURORA_STRIKE seconds later, taking AURORA_HIT from the army and AURORA_KING of Old Man
  // Winter, and staggering what's left for AURORA_WINDED seconds. It shows for AURORA_SHOW seconds.
  const AURORA_SECONDS = 170, AURORA_PER_MELT = 0.003, AURORA_HIT = 10, AURORA_KING = 0.12, AURORA_WINDED = 3, AURORA_STRIKE = 0.5, AURORA_SHOW = 1.9;
  // Seven star lanterns on the seven left rings light the Big Dipper: DIPPER_AT seconds on, it takes DIPPER_HIT from the army and
  // DIPPER_KING of Old Man Winter, and is worth DIPPER_POINTS.
  const DIPPER_AT = 1.5, DIPPER_SHOW = 3.2, DIPPER_HIT = 30, DIPPER_KING = 0.2, DIPPER_POINTS = 1500;
  // Its figure, by star in the banner's order: Dubhe, Merak, Phecda, Megrez, Alioth, Mizar, Alkaid
  const DIPPER_LINES = [[6, 5], [5, 4], [4, 3], [3, 0], [0, 1], [1, 2], [2, 3]];
  // A scarf, knitted in the workshop, costs SCARF_COST wood and takes SCARF_EVERY seconds. The soldier nearest the cabin gets it,
  // turns round and marches against its old friends, melting what it meets at SCARF_MELT a second.
  const SCARF_COST = 8, SCARF_EVERY = 5, SCARF_MELT = 2.2;
  // Tonight's sky: a full moon (within FULL_MOON of it, as a share of its cycle) lets lanterns reach MOON_REACH times as far, and
  // a real meteor shower within a day of its peak brings falling stars SHOWER_STARS times as often.
  const FULL_MOON = 0.09, MOON_REACH = 1.12, SHOWER_STARS = 1.7;
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
    sapper: { health: 2, tall: 13, speed: 0.15, stride: 1.2, points: 40, wood: 3, lives: 1 },
    king: { health: 210, tall: 44, speed: 0.055, stride: 0.75, points: 2000, wood: 0, lives: 5 },
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
  const KING_AT = 30, RAISE = 0.6, RAISE_AFTER = 1.2, RAISE_EVERY = 2.5, KING_STOKE = 0.06;
  // A run is one winter, in five months, each opened by a card. seconds: how long the army keeps coming; every: seconds
  // between ranks, at its start and its end; brutes: the share of ranks' figures that are brutes; runners: the share of ranks
  // that are packs of runners; right: the share that come round the cabin from the right, where there's room; wraiths:
  // seconds between frost wraiths, at its start and its end; sappers: the share of ranks that are one frost sapper instead;
  // pace: how much faster the army moves than in November; tough: how much more melting it takes than in November; ranks:
  // the share that come two or three together, one behind another; snow: how thickly snow falls, as weather; news: what's
  // new, under the score as it begins; fact: a line after it.
  const MONTHS = [
    { name: 'November', tough: 1, says: 'First snow', seconds: 70, every: [4.2, 3], brutes: 0, runners: 0, sappers: 0, right: 0, wraiths: null, pace: 1, ranks: 0.12, snow: 0.3, news: '', fact: '' },
    { name: 'December', tough: 1.25, says: 'The longest night', seconds: 90, every: [2.6, 1.8], brutes: 0.15, runners: 0, sappers: 0, right: 0, wraiths: null, pace: 1.06, ranks: 0.2, snow: 0.45, news: 'Brutes are coming. Half melted, each cracks into two soldiers', fact: 'The winter solstice, around December 21, is the longest night of the year' },
    { name: 'January', tough: 1.75, says: 'Deep cold', seconds: 100, every: [1.65, 1.15], brutes: 0.3, runners: 0.25, sappers: 0.06, right: 0.25, wraiths: null, pace: 1.12, ranks: 0.25, snow: 0.6, news: 'They come from both sides now, with runners|Frost sappers ice over lanterns: click one to free it', fact: '−40°, where Fahrenheit and Celsius agree' },
    { name: 'February', tough: 2.55, says: 'The coldest night', seconds: 100, every: [1.2, 0.82], brutes: 0.4, runners: 0.2, sappers: 0.08, right: 0.3, wraiths: [5, 3.5], pace: 1.18, ranks: 0.3, snow: 0.8, news: 'Frost wraiths fly for the chimney. Stoking sends sparks at them', fact: '−81 °F at Snag, Yukon, on February 3, 1947, the coldest on record in Canada' },
    { name: 'March', tough: 3.6, says: 'The last storm', seconds: 90, every: [1.05, 0.72], brutes: 0.45, runners: 0.2, sappers: 0.08, right: 0.35, wraiths: [4.5, 3], pace: 1.24, ranks: 0.35, snow: 1, news: 'Old Man Winter is coming. Melt him and the winter breaks', fact: 'Hold on till spring' },
  ];
  // Within a month the army comes in swells, every SWELL seconds, thin and then thick, so there are moments to build and moments
  // to fight: the time between ranks is lerp(SWELL_THIN, SWELL_THICK, how far into the swell).
  const SWELL = 26, SWELL_THIN = 1.7, SWELL_THICK = 0.75;
  // Five lives, as in the other games. Each new month gives one back and is worth MONTH_POINTS for each month kept so far;
  // the thaw is worth THAW_POINTS for each life left, and a point for each piece of wood.
  const LIVES = 5, MONTH_POINTS = 500, THAW_POINTS = 2000;
  // Stoking the fire sends a ring of warmth STOKE_REACH banner heights out from the cabin over STOKE_SPREAD seconds, which
  // melts soldiers and runners outright and takes half from brutes. Then the fire needs STOKE_EVERY seconds to build back.
  // One of the army reaching the cabin makes the fire flare too, with a ring FLARE_REACH out, so a defense that gives way
  // loses its lives one at a time rather than all at once (in bot tests, a run that let snow through in March lost all five
  // within seconds).
  const STOKE_EVERY = 10, STOKE_REACH = 1, STOKE_SPREAD = 0.45, FLARE_REACH = 0.5;
  // For STOKE_GLOW seconds after a stoke every lantern burns STOKE_BRIGHT times as fast, since all of them stand on the fire's warm
  // ground, so that stoking matters all winter (in bot tests, a player who never stoked still kept 11 winters of 12).
  const STOKE_BRIGHT = 1.4, STOKE_GLOW = 5;
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
  // Each star is also a gemstone: in a lantern or in your animal its power is what it adds. burn: what it hits keeps burning for a
  // while afterward; wood: what it melts pays more wood; twin: it hits a second one at once; chain: its light runs on through a
  // group.
  const STARS = [
    { color: '255,164,124', points: 10, share: 30, heat: 1.1, power: 'burn', named: 'red' },
    { color: '255,202,150', points: 20, share: 25, heat: 1.2, power: 'burn', named: 'orange' },
    { color: '255,236,184', points: 30, share: 20, heat: 1.3, power: 'wood', named: 'yellow' },
    { color: '242,245,255', points: 50, share: 13, heat: 1.45, power: 'twin', named: 'white' },
    { color: '190,210,255', points: 80, share: 8, heat: 1.65, power: 'chain', named: 'pale blue' },
    { color: '150,180,255', points: 150, share: 4, heat: 2, power: 'chain', named: 'blue' },
  ];
  const POWER_SAYS = { burn: 'what it hits keeps burning', wood: 'what it melts pays more wood', twin: 'it hits two at once', chain: 'its light chains through a group' };
  const pickStar = () => {
    let roll = Math.random() * 100;
    for (let i = 0; i < STARS.length; i++) { roll -= STARS[i].share; if (roll < 0) return i; }
    return 0;
  };
  // A run with nothing built ends without a score after IDLE seconds with no input, or three times that once the cabin's
  // first addition is chosen, so a click meant only to stoke the fire costs nothing. Input is the pointer moving over the
  // banner, a click or tap on it, menus included, a finger dragging your animal or a key steering it, so someone reading the
  // menus or looking over the rings isn't hurried out (at first the seconds ran from the opening, however busy the player).
  // The army waits for the first lantern. A breather of BREATHER seconds comes between months, and the cabin's choice opens
  // CHOICE_AFTER seconds into it. The rings fade in over OPENING, and everything fades over FADE as a run ends. The thaw
  // holds SPRING_HOLD seconds before it does, and after the fire goes out it stays out OUT_DARK seconds, then relights with
  // a stoke, as in the shooting star game.
  const CHOICE_AFTER = 4, IDLE = 20, BREATHER = 20, OPENING = 0.8, FADE = 1.2, SPRING_HOLD = 3, OUT_DARK = 2.5;
  const BEST_KEY = 'aurora-cabin-best';
  // Until a winter has been kept in this browser, the army takes FIRST_WINTER as much melting from December on, Old Man Winter
  // included, since a first winter has a lot to learn. After that each winter kept adds TOUGHER, up to TOUGHEST
  // of the full table's strength, since an attentive player otherwise hardly ever loses. Tips come when what they're about first matters, each once in a browser
  // (TIPS_KEY), for TIP_SHOW milliseconds, on the hint's line when nothing else is using it, and never between months, when the
  // Next link has that line.
  const KEPT_KEY = 'aurora-cabin-kept', FIRST_WINTER = 0.8, TOUGHER = 0.15, TOUGHEST = 1.6, TIPS_KEY = 'aurora-cabin-tips', TIP_SHOW = 6000;
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
    // Wood brought in, the cabin added to, new ground warmed, a star called and landing, a dam built and opened, the aurora, a lantern
    // iced and freed, a scarf, and your animal's doings
    collect: () => [0, 80].forEach((delay) => tone(210, 70, { to: 140, type: 'square', level: 0.03, cutoff: 1200, delay })),
    wing: () => [0, 4, 7, 12].forEach((n, i) => tone(midiHz(67 + n), 240, { type: 'triangle', level: 0.05, delay: i * 80 })),
    warmed: () => tone(midiHz(76), 280, { to: midiHz(79), type: 'sine', level: 0.03 }),
    call: (which) => tone(midiHz(98 - which), 400, { to: midiHz(74), type: 'sine', level: 0.035 }),
    impact: () => { noise(230, 0.09, 3200, 300); tone(150, 200, { to: 60, type: 'sine', level: 0.06 }); },
    dam: () => [0, 110, 220].forEach((delay) => tone(130, 80, { to: 90, type: 'square', level: 0.03, cutoff: 800, delay })),
    flood: () => { noise(1300, 0.11, 400, 2400); noise(900, 0.06, 2400, 300, 600); },
    aurora: () => { noise(1600, 0.08, 300, 3600); [0, 7, 12, 16, 19].forEach((n, i) => tone(midiHz(60 + n), 1500, { type: 'sine', level: 0.03, attack: 0.3, delay: i * 90 })); },
    ice: () => { [0, 40, 90].forEach((delay) => noise(45, 0.05, 7000, 3000, delay)); tone(midiHz(88), 200, { to: midiHz(76), type: 'sine', level: 0.025 }); },
    free: () => { noise(160, 0.05, 2000, 5000); tone(midiHz(84), 180, { type: 'sine', level: 0.04 }); },
    scarf: () => [0, 3, 7].forEach((n, i) => tone(midiHz(76 + n), 170, { type: 'triangle', level: 0.04, delay: i * 70 })),
    roar: () => { tone(95, 520, { to: 58, type: 'sawtooth', level: 0.05, cutoff: 520 }); noise(420, 0.05, 700, 160); },
    pounce: () => noise(240, 0.06, 900, 3400),
    shell: () => [0, 50].forEach((delay) => tone(420, 40, { to: 300, type: 'square', level: 0.025, cutoff: 1800, delay })),
    level: () => [0, 4, 7, 12].forEach((n, i) => tone(midiHz(79 + n), 150, { type: 'sine', level: 0.045, delay: i * 55 })),
    heroDown: () => [7, 4, 0].forEach((n, i) => tone(midiHz(64 + n), 200, { type: 'sine', level: 0.04, delay: i * 90 })),
    heroBack: () => [0, 7].forEach((n, i) => tone(midiHz(72 + n), 200, { type: 'sine', level: 0.04, delay: i * 80 })),
    dipper: () => [0, 4, 7, 11, 14, 19, 24].forEach((n, i) => tone(midiHz(62 + n), 900, { type: 'triangle', level: 0.035, attack: 0.08, delay: i * 130 })),
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
.bn-cabin-score.link{pointer-events:auto;cursor:pointer}
.bn-cabin-menu{flex-wrap:wrap;justify-content:center;width:max-content;max-width:calc(100% - 8px)}
.bn-cabin-menu span.wide{display:flex;flex-direction:column;align-items:center;gap:4px;width:132px;white-space:normal;text-align:center;line-height:1.15}
.bn-cabin-menu span.wide b{font-weight:600}
.bn-cabin-menu span.wide small{font-size:.6875rem;opacity:.85}
.bn-cabin-pause{position:absolute;right:48px;top:0;padding:10px 6px 8px;font-size:.75rem;line-height:1;color:rgba(232,238,255,.9);text-shadow:0 0 4px #04071A,0 0 2px #04071A;white-space:nowrap;cursor:pointer;pointer-events:auto}
.bn-cabin-pause:hover{text-decoration:underline;text-underline-offset:2px}
.bn-cabin-hud{position:absolute;top:32px;display:flex;flex-direction:column;gap:2px;font-size:.75rem;line-height:1;color:rgba(232,238,255,.82);text-shadow:0 0 4px #04071A,0 0 2px #04071A;white-space:nowrap}
.bn-cabin-hud.left{left:12px;align-items:flex-start}
.bn-cabin-hud.right{right:12px;align-items:flex-end}
.bn-cabin-hud span{padding:2px 0}
.bn-cabin-hud span.act{color:rgba(255,226,170,1);cursor:pointer;pointer-events:auto}
.bn-cabin-hud span.act:hover{text-decoration:underline;text-underline-offset:2px}`;
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
  // A frost sapper: small and hooded, bent over a lump of ice it carries to a lantern
  const drawSapper = (g, phase) => {
    const step = 0.5 * Math.sin(phase);
    g.lineCap = 'round';
    limb(g, -0.2, -4.6, -step, 4.6, 1.6, SHADE);
    g.fillStyle = sideFill(g, -3, 3.2);
    g.beginPath();
    g.moveTo(-2.6, -3.6);
    g.quadraticCurveTo(-3, -9, -0.5, -12.8);
    g.quadraticCurveTo(2.6, -11.2, 3, -7.6);
    g.quadraticCurveTo(2.8, -5, 2.4, -3.6);
    g.closePath();
    g.fill();
    limb(g, 0.4, -4.6, step, 4.6, 1.6, SNOW);
    g.fillStyle = '#B4D9F4';
    jagged(g, [[3, -6.8], [4.8, -8.6], [6.6, -7.4], [6.9, -5.2], [5, -3.9], [3.2, -4.9]]);
    g.fillStyle = '#16204A';
    g.beginPath();
    g.ellipse(1.5, -9.7, 1.6, 1.5, 0, 0, TAU);
    g.fill();
    eye(g, 1.9, -9.8, 0.55);
    eye(g, 2.7, -9.7, 0.42);
  };
  // Each kind's drawing, its bounds around the feet in the scene's units (left, top, right, bottom), and where its eyes are,
  // for their glow. WALK_FRAMES poses make a full step of both legs.
  const FIGURES = {
    soldier: { draw: drawSoldier, box: [-5, -17.6, 6, 1.6], eyes: [2.6, -13.55] },
    brute: { draw: drawBrute, box: [-6.6, -24.8, 10.4, 2], eyes: [6.8, -18.3] },
    runner: { draw: drawRunner, box: [-4.6, -13, 7, 1.4], eyes: [4.7, -9.5] },
    sapper: { draw: drawSapper, box: [-4, -13.6, 7.6, 1.4], eyes: [2.3, -9.75] },
    king: { draw: drawKing, box: [-9.5, -45, 13.5, 2.4], eyes: [3.5, -34.8] },
  };
  const WALK_FRAMES = 8;
  // A beaver, drawn from the feet up, facing right: a flat tail, a round brown back, and its teeth
  const BEAVER_BOX = [-11.5, -7.6, 8.4, 0.8];
  const drawBeaver = (g, phase) => {
    const s = Math.sin(phase);
    g.lineCap = 'round';
    g.fillStyle = '#35241A';
    g.beginPath();
    g.ellipse(-8, -1.5 + s * 0.2, 3.2, 1.1, -0.25, 0, TAU);
    g.fill();
    limb(g, 2.2, -1.6, -s * 0.7, 1.6, 1.3, '#4A3322');
    limb(g, -3.4, -1.6, s * 0.7, 1.6, 1.3, '#4A3322');
    g.fillStyle = '#8A6238';
    g.beginPath();
    g.ellipse(-0.8, -3.3, 5.4, 3.1, 0, 0, TAU);
    g.fill();
    g.beginPath();
    g.ellipse(4.6, -4.6 + s * 0.35, 2.5, 2.1, 0, 0, TAU);
    g.fill();
    g.fillStyle = '#FFF1DC';
    g.fillRect(6.1, -3.6 + s * 0.35, 0.9, 1.3);
    g.fillStyle = '#17100A';
    g.beginPath();
    g.arc(5.3, -5.3 + s * 0.35, 0.45, 0, TAU);
    g.arc(3.1, -6.5 + s * 0.35, 0.5, 0, TAU);
    g.fill();
  };
  // The star animals, small enough for this ridge, in the colors the bear game gives them: far limbs in shade, a bright edge
  // around the body, and stars across the back, where it wears the stars it has caught too (gems, below)
  const backStars = (g, spots, color) => {
    g.fillStyle = color;
    for (const [x, y, r] of spots) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  };
  const drawHeroBear = (g, phase) => {
    const s = Math.sin(phase), bob = -Math.abs(s) * 0.5;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    limb(g, 8, -8.5 + bob, -s * 0.5, 8.5, 3.6, '#3C49A6');
    limb(g, -9, -9 + bob, s * 0.5, 9, 3.6, '#3C49A6');
    g.fillStyle = '#5166D6';
    g.strokeStyle = '#D5E3FF';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(-14, -7 + bob);
    g.quadraticCurveTo(-16, -17 + bob, -7, -19.5 + bob);
    g.quadraticCurveTo(2, -21.5 + bob, 9, -17.5 + bob);
    g.quadraticCurveTo(12, -20 + bob, 15, -17.6 + bob);
    g.lineTo(19.5, -14.2 + bob);
    g.quadraticCurveTo(19, -11.6 + bob, 15, -11.8 + bob);
    g.quadraticCurveTo(11.5, -9.5 + bob, 10, -6 + bob);
    g.quadraticCurveTo(-2, -4 + bob, -14, -7 + bob);
    g.closePath();
    g.fill();
    g.stroke();
    g.beginPath();
    g.arc(12.2, -19.6 + bob, 1.6, 0, TAU);
    g.fill();
    g.stroke();
    limb(g, 5, -7.5 + bob, s * 0.5, 7.5, 4, '#6F86E8');
    limb(g, -11, -8 + bob, -s * 0.5, 8, 4, '#6F86E8');
    g.fillStyle = '#10163F';
    g.beginPath();
    g.arc(15.4, -15.8 + bob, 0.65, 0, TAU);
    g.fill();
    backStars(g, [[-11, -14.5 + bob, 0.7], [-5, -17 + bob, 0.9], [0.5, -18 + bob, 0.7], [6, -16.5 + bob, 0.8]], '#F2F6FF');
  };
  const drawHeroFox = (g, phase) => {
    const s = Math.sin(phase), bob = -Math.abs(s) * 0.4;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    limb(g, 6, -6.5 + bob, -s * 0.6, 6.5, 1.8, '#94512A');
    limb(g, -7, -6.5 + bob, s * 0.6, 6.5, 1.8, '#94512A');
    g.fillStyle = '#E8915A';
    g.strokeStyle = '#FFE3C2';
    g.lineWidth = 0.7;
    g.beginPath();
    g.moveTo(-9, -10 + bob);
    g.quadraticCurveTo(-16, -13.5 + s + bob, -21.5, -9 + s * 1.6 + bob);
    g.quadraticCurveTo(-16, -5 + bob, -9, -7 + bob);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = '#FFF1DC';
    g.beginPath();
    g.ellipse(-20, -9.2 + s * 1.6 + bob, 2, 1.5, 0, 0, TAU);
    g.fill();
    g.fillStyle = '#E8915A';
    g.beginPath();
    g.moveTo(-10, -6.5 + bob);
    g.quadraticCurveTo(-11, -11.5 + bob, -5, -12 + bob);
    g.quadraticCurveTo(3, -12.6 + bob, 8, -11.6 + bob);
    g.lineTo(9.2, -17.2 + bob);
    g.lineTo(11.2, -14.6 + bob);
    g.lineTo(12.6, -16.4 + bob);
    g.lineTo(13.2, -13.4 + bob);
    g.lineTo(18, -10.8 + bob);
    g.quadraticCurveTo(15, -8.6 + bob, 11.5, -9 + bob);
    g.quadraticCurveTo(9.5, -6.8 + bob, 8.5, -5.6 + bob);
    g.quadraticCurveTo(-1, -4.4 + bob, -10, -6.5 + bob);
    g.closePath();
    g.fill();
    g.stroke();
    limb(g, 4, -6 + bob, s * 0.6, 6, 2, '#F0A06C');
    limb(g, -8, -6 + bob, -s * 0.6, 6, 2, '#F0A06C');
    g.fillStyle = '#2A1408';
    g.beginPath();
    g.arc(13.4, -12.2 + bob, 0.55, 0, TAU);
    g.arc(18, -10.8 + bob, 0.6, 0, TAU);
    g.fill();
    backStars(g, [[-6, -10.8 + bob, 0.6], [-1, -11.2 + bob, 0.7], [4, -11 + bob, 0.6]], '#FFF1DC');
  };
  const drawHeroCrab = (g, phase) => {
    const bob = Math.sin(phase * 2) * 0.35;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.strokeStyle = '#2E8C8A';
    g.lineWidth = 1.2;
    for (const side of [-1, 1]) {
      for (let n = 0; n < 3; n++) {
        const lift = Math.max(0, Math.sin(phase + n * 1.3 + (side > 0 ? 1.6 : 0))) * 1.4;
        g.beginPath();
        g.moveTo(side * (5 + n * 1.8), -7 + bob);
        g.lineTo(side * (11 + n * 2.2), -9.2 + bob - n * 0.2);
        g.lineTo(side * (13.5 + n * 2.4), -lift);
        g.stroke();
      }
      const hand = [side * 15, -15.5 + bob];
      g.strokeStyle = '#3FA6A0';
      g.lineWidth = 1.8;
      g.beginPath();
      g.moveTo(side * 7, -10 + bob);
      g.lineTo(side * 12.5, -10.5 + bob);
      g.lineTo(hand[0], hand[1]);
      g.stroke();
      g.fillStyle = '#7FE6D2';
      g.beginPath();
      g.moveTo(hand[0] - side * 1.6, hand[1] + 1);
      g.quadraticCurveTo(hand[0] + side * 3.6, hand[1] - 0.4, hand[0] + side * 2.2, hand[1] - 5);
      g.lineTo(hand[0] + side * 0.8, hand[1] - 2.2);
      g.lineTo(hand[0] - side * 1.4, hand[1] - 4.4);
      g.closePath();
      g.fill();
      g.strokeStyle = '#2E8C8A';
      g.lineWidth = 1.2;
    }
    g.fillStyle = '#3FA6A0';
    g.strokeStyle = '#A8F5E6';
    g.lineWidth = 0.8;
    g.beginPath();
    g.ellipse(0, -9.5 + bob, 9.5, 6, 0, 0, TAU);
    g.fill();
    g.stroke();
    g.strokeStyle = '#2E8C8A';
    g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(-1.8, -15 + bob);
    g.lineTo(-2.4, -17.6 + bob);
    g.moveTo(1.8, -15 + bob);
    g.lineTo(2.4, -17.6 + bob);
    g.stroke();
    backStars(g, [[-2.4, -18 + bob, 0.85], [2.4, -18 + bob, 0.85]], '#10211F');
    backStars(g, [[-5.5, -10.5 + bob, 0.6], [-1, -13 + bob, 0.7], [4.8, -11.5 + bob, 0.6]], '#EAFFFA');
  };
  // Your hero, a star animal from the bear game, which you unlock there. hp: how much it can take; speed: banner heights a second;
  // reach: how far it melts; melt: how fast; contact: how close the army touches it; stride: scene units for a full step; tall:
  // scene units; catch: how far off it catches a star that's falling; every: seconds between uses of its ability; gems: where a
  // caught star sits on it. The bear blocks the path, holding the army in the lanterns' light. The fox runs through the army,
  // hurting what it passes (through), pounces (pounceHit), and charges the aurora aurora times as fast. The crab catches stars
  // from well off, and pulls into its shell, where nothing hurts it and the army can't pass it.
  const HEROES = {
    bear: { who: 'The Great Bear', short: 'bear', does: 'Blocks the path, holding the army in your light', ability: 'Roar', every: 12, hp: 40, speed: 0.55, reach: 0.17, melt: 1.2, contact: 0.05, stride: 30, tall: 22, blocks: true, catch: 0.12, draw: drawHeroBear, box: [-18, -24, 22, 2], glow: '130,165,255', gems: [[-8, -15.5], [-1.5, -17.5], [5, -15.5]] },
    fox: { who: 'The Little Fox', short: 'fox', does: 'Runs through the army, and charges the aurora', ability: 'Pounce', every: 8, hp: 20, speed: 1.05, reach: 0.12, melt: 0.85, contact: 0.05, stride: 26, tall: 18, through: 0.7, pounceHit: 2.5, aurora: 2, catch: 0.12, draw: drawHeroFox, box: [-23, -19, 19, 1.6], glow: '255,180,110', gems: [[-5.5, -9.5], [-0.5, -9.8], [4.5, -9.5]] },
    crab: { who: 'The Crab', short: 'crab', does: 'Catches falling stars in its wide claws', ability: 'Shell', every: 11, hp: 30, speed: 0.6, reach: 0.15, melt: 1, contact: 0.06, stride: 18, tall: 16, catch: 0.32, shell: 4, draw: drawHeroCrab, box: [-21, -23, 21, 1.4], glow: '120,235,215', gems: [[-5, -8], [0, -7], [5, -8]] },
  };
  // It takes HERO_TOUCH a second from what's touching it, heals HEAL a second on warm ground with nothing touching it, and if it's
  // overrun rests at the cabin for REST seconds. It gains a level at each of XP_FOR's totals (what it melts: XP), each worth
  // LEVEL_POWER more melting and LEVEL_HP more it can take. It can wear GEM_SLOTS stars.
  const HERO_TOUCH = { soldier: 0.9, brute: 2.2, runner: 0.5, sapper: 0, king: 9 }, XP = { soldier: 1, runner: 1, sapper: 2, brute: 3, wraith: 2, king: 0 };
  const XP_FOR = [0, 14, 36, 70, 120, 190, 280], LEVEL_POWER = 0.18, LEVEL_HP = 0.15, REST = 12, HEAL = 1.5, GEM_SLOTS = 3;
  const heroLevelMax = XP_FOR.length;
  const unlockedAnimals = () => { try { return (localStorage.getItem('aurora-animals') || '').split(',').filter((a) => HEROES[a]); } catch (e) { return []; } };
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
      // A streak of the aurora coming down: soft at its sides, violet high up and pale green low
      curtain: (() => {
        const c = canvas(48, 128), g = c.getContext('2d'), fill = g.createLinearGradient(0, 0, 0, 128), sides = g.createLinearGradient(0, 0, 48, 0);
        fill.addColorStop(0, 'rgba(150,120,255,.12)');
        fill.addColorStop(0.5, 'rgba(130,255,210,.7)');
        fill.addColorStop(1, 'rgba(190,255,230,.95)');
        g.fillStyle = fill;
        g.fillRect(0, 0, 48, 128);
        sides.addColorStop(0, 'rgba(0,0,0,0)');
        sides.addColorStop(0.5, 'rgba(0,0,0,1)');
        sides.addColorStop(1, 'rgba(0,0,0,0)');
        g.globalCompositeOperation = 'destination-in';
        g.fillStyle = sides;
        g.fillRect(0, 0, 48, 128);
        return c;
      })(),
      // The eyes of a soldier won over, and your animal's own glow
      warmEyes: softDot(32, [[0, 'rgba(255,240,200,1)'], [0.25, 'rgba(255,190,110,.6)'], [1, 'rgba(255,190,110,0)']]),
      heroes: Object.fromEntries(Object.entries(HEROES).map(([kind, D]) => [kind, softDot(64, [[0, `rgba(${D.glow},.6)`], [0.45, `rgba(${D.glow},.18)`], [1, `rgba(${D.glow},0)`]])])),
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
    // Where the army comes from, which moves out as the ground warms, and the rings: on the left, and on the right from January
    // (from: the month, 0 for November)
    const entryX = () => Math.max(middle.x - Math.min(PATH, warmEdge + ENTRY_PAST) * H, -0.06 * H);
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
    // Halfway between the left rings, smaller spots for what stands low, woodpiles and beavers' lodges
    const lefts = rings.filter((r) => r.side === 'left');
    for (let i = 0; i + 1 < lefts.length; i++) {
      const x = (lefts[i].x + lefts[i + 1].x) / 2;
      rings.push({ side: 'gap', i, from: 0, x, y: groundAt(x), half: 0.13 * H, building: null });
    }
    const shedX = middle.x - SHED * H;
    rings.push({ side: 'shed', i: 0, from: 0, x: shedX, y: groundAt(shedX), half: 0.1 * H, building: null });
    const distOf = (ring) => Math.abs(ring.x - middle.x) / H;
    // Not places on the ridge: what the choice of an addition to the cabin, or of who comes to help, is attached to
    const cabinSpot = { side: 'cabin' }, heroSpot = { side: 'heroes' };
    // A lantern's lamp, above its ring, on a post POST units tall, and POST_STEP taller for each level; a fire's middle
    const POST = 15, POST_STEP = 2.5;
    const lampAt = (ring) => {
      const level = ring.building ? ring.building.level : 0;
      return { x: ring.x, y: ring.y - (POST + POST_STEP * level) * k };
    };
    const fireAt = (ring) => ({ x: ring.x, y: ring.y - 3 * k });

    // The army's figures at this banner's scale, drawn once for a run in each pose of a step
    const posesOf = (drawIt, [x0, y0, x1, y1]) => Array.from({ length: WALK_FRAMES }, (_, i) => {
      const scale = k * dpr, c = canvas((x1 - x0) * scale, (y1 - y0) * scale), g = c.getContext('2d');
      g.setTransform(scale, 0, 0, scale, -x0 * scale, -y0 * scale);
      drawIt(g, i / WALK_FRAMES * TAU);
      return c;
    });
    const frames = {};
    for (const [kind, F] of Object.entries(FIGURES)) frames[kind] = posesOf(F.draw, F.box);
    const beaverFrames = posesOf(drawBeaver, BEAVER_BOX);
    let heroFrames = null;
    // Snow falling as weather, more of it as the winter deepens; it plays no part in the game
    const weather = Array.from({ length: Math.round(clamp(W / 12, 30, 160)) }, () => ({ x: Math.random() * W, y: Math.random() * H, v: lerp(0.08, 0.2, Math.random()), size: lerp(0.8, 1.7, Math.random()), a: lerp(0.3, 0.75, Math.random()), seed: Math.random() * TAU }));

    // The canvas, in front of the forest and the cabin, as the bear game's is
    const layer = canvas(W * dpr, H * dpr), ctx = layer.getContext('2d');
    layer.className = 'bn-cabin-layer';
    banner.append(layer);
    banner.classList.add('bn-cabin-on', 'bn-burning');
    // A finger dragging your animal shouldn't scroll the page
    banner.style.touchAction = 'none';
    const setFire = () => banner.style.setProperty('--bn-fire', (Math.max(0, lives) / LIVES).toFixed(2));

    // The words: the score line, a hint, the Quit link, the next month's link, a ring's menu and the cards
    const labels = banner.querySelector('.bn-labels');
    const score = labels.appendChild(Object.assign(document.createElement('span'), { className: 'bn-cabin-score' }));
    const hint = labels.appendChild(Object.assign(document.createElement('span'), { className: 'bn-cabin-hint' }));
    const quit = labels.appendChild(Object.assign(document.createElement('span'), { className: 'bn-cabin-quit', textContent: 'Quit' }));
    const nextLink = labels.appendChild(Object.assign(document.createElement('span'), { className: 'bn-cabin-next' }));
    const menu = labels.appendChild(Object.assign(document.createElement('div'), { className: 'bn-cabin-menu' }));
    const soundSwitch = labels.appendChild(Object.assign(document.createElement('span'), { className: 'bn-cabin-sound' }));
    // Beside them, what can be done at any moment: stars and the aurora on the left, your animal and scarves on the right
    const hudLeft = labels.appendChild(Object.assign(document.createElement('div'), { className: 'bn-cabin-hud left' }));
    const hudRight = labels.appendChild(Object.assign(document.createElement('div'), { className: 'bn-cabin-hud right' }));
    const hudLine = (box, act) => {
      const el = box.appendChild(document.createElement('span'));
      el.hidden = true;
      el.addEventListener('click', (e) => { e.stopPropagation(); act(); });
      return el;
    };
    const starsLine = hudLine(hudLeft, () => {}), auroraLine = hudLine(hudLeft, () => callAurora());
    const abilityLine = hudLine(hudRight, () => useAbility()), scarfLine = hudLine(hudRight, () => knitScarf());
    const pauseLink = labels.appendChild(Object.assign(document.createElement('span'), { className: 'bn-cabin-pause', textContent: 'Pause' }));
    pauseLink.addEventListener('click', (e) => { e.stopPropagation(); if (!ending) togglePause(); });
    // Below this width the lines beside the score go under the hint and say less, and what rises from the cabin as a month
    // changes keeps to the left of them
    const narrow = W < 760, cabinPopX = W < 900 ? Math.min(middle.x, W - (narrow ? 191 : 221)) : middle.x;
    if (narrow) hudLeft.style.top = hudRight.style.top = W < 620 ? '62px' : '50px';
    if (W < 620) Object.assign(hint.style, { whiteSpace: 'normal', width: 'calc(100% - 24px)', textAlign: 'center', lineHeight: '1.2' });
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
    let hintTimers = [], hintFreeAt = 0;
    const say = (text, ms) => {
      hintTimers.forEach(clearTimeout);
      hintTimers = [];
      hint.textContent = text;
      hint.style.opacity = text ? 1 : 0;
      hintFreeAt = performance.now() + (text ? ms || 0 : 0);
      if (ms) hintTimers.push(setTimeout(() => { hint.style.opacity = 0; }, ms));
    };
    // Lines in turn, each when the last has had its time
    const sayInTurn = (lines, ms) => {
      const [first, ...rest] = lines.filter(Boolean);
      if (!first) return;
      say(first, ms);
      if (rest.length) {
        hintTimers.push(setTimeout(() => sayInTurn(rest, ms), ms + 900));
        hintFreeAt = performance.now() + (ms + 900) * rest.length + ms;
      }
    };

    // The state of a run
    const foes = [], drips = [], steam = [], bits = [], pops = [], warmth = [], remains = [], sparks = [], risers = [];
    let warmthId = 0;
    let wood = START_WOOD, points = 0, lives = LIVES, melted = 0, lost = 0, stoked = 0, built = 0;
    let phase = 'open', phaseTime = 0, time = 0, inputAt = 0, monthIndex = 0, monthTime = 0, nextRank = 0, nextWraith = 0, breatherLeft = 0;
    let fieldAlpha = 0, fadeFrom = 1, fadeFor = FADE, stokeAt = -Infinity, hover = null, menuFor = null, menuKey = '', preview = null;
    let king = null, kingCame = false, lastRaise = -Infinity, nudgeUntil = -Infinity, lastNudge = -Infinity, lastMeltSound = -Infinity, lastCrackSound = -Infinity, began = 0;
    // For the credits: the army melted by kind, what was built, woodpiles lit, months kept, and the king
    const counts = { soldier: 0, brute: 0, runner: 0, sapper: 0, wraith: 0, lantern: 0, firepit: 0, woodpile: 0, woodshed: 0, lodge: 0, alight: 0, kept: 0, king: false, stars: 0, gathered: 0, floods: 0, called: 0, auroras: 0, scarves: 0, freed: 0, dipper: false };
    // Stars falling toward the clearing, to catch for star lanterns, and whether the first one's hint has had its time
    const skyStars = [];
    let nextStar = FIRST_STAR, starHinted = false;
    // What the cabin has become, and how far its warmth reaches
    let warmEdge = WARM_START, wingCount = 0, hearthLevel = 0;
    const wings = { workshop: false, mill: false, telescope: false };
    // Stars to call down and those on their way; blasts of light and floods under way; beavers out freeing lanterns; the aurora;
    // the Big Dipper; your animal, and what's steering it
    let callCharges = 0, callTimer = CALL_EVERY, floodId = 0, aurora = 0, auroraFx = null, dipperFx = null, dipperDone = false, scarfAt = -Infinity;
    const strikes = [], blasts = [], floods = [], couriers = [];
    let hero = null, drag = null, skipClick = false, paused = false, heldPause = false, hudAt = 0, cabinChoiceAt = Infinity;
    const keysDown = new Set();
    // Tonight's sky, from the banner: a full moon, and a real meteor shower within a day of its peak
    const tonight = (() => {
      const found = { fullMoon: false, shower: null };
      try {
        const sky = options.sky && options.sky();
        if (!sky) return found;
        found.fullMoon = Math.abs(sky.moon - 0.5) < FULL_MOON;
        const now = new Date(), today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
        for (const s of sky.showers || []) for (const [m, d] of s.peaks) if (Math.abs(Date.UTC(now.getFullYear(), m - 1, d) - today) <= 864e5) found.shower = s.name;
      } catch (e) { /* the winter goes on without it */ }
      return found;
    })();
    const moonReach = tonight.fullMoon ? MOON_REACH : 1;
    let ending = null, result = false, running = true, last = performance.now();
    const best = (() => { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch (e) { return 0; } })();
    const wintersKept = (() => { try { return Number(localStorage.getItem(KEPT_KEY)) || 0; } catch (e) { return 0; } })();
    const winterScale = wintersKept ? Math.min(TOUGHEST, 1 + TOUGHER * wintersKept) : FIRST_WINTER;
    const toughNow = () => MONTHS[monthIndex].tough * (monthIndex ? winterScale : 1);
    // The month being played, or coming next during a breather
    const shownIndex = () => Math.min(MONTHS.length - 1, phase === 'breather' ? monthIndex + 1 : monthIndex);
    const showScore = () => {
      if (phase === 'open' && !built) return;
      score.textContent = `${W < 560 ? '' : `${MONTHS[shownIndex()].name}: `}${number(points)} points, ${number(wood)} wood, ${lives} ${lives === 1 ? 'foxfire' : 'foxfires'}`;
      renderMenu();
    };
    score.textContent = `Keep the fire going till spring${best ? `. Your best is ${number(best)}` : ''}`;
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
      return { kind, flies: false, dir: 1, x: 0, y: 0, lift: 0, r: 0.3 * K.tall * k, health: K.health * (kind === 'king' ? winterScale : toughNow()), max: K.health * (kind === 'king' ? winterScale : toughNow()), speed: K.speed * lerp(0.94, 1.06, Math.random()) * MONTHS[monthIndex].pace, phase: Math.random() * TAU, seed: Math.random() * TAU, born: time, rise: 0, heat: 0, dead: false, stoked: null, ...more };
    };
    // A rank comes out of the trees together, one behind another, or a pack of runners, from the left or round the cabin from
    // the right
    const spawnRank = (M) => {
      const dir = rightSide(M) ? -1 : 1, from = dir > 0 ? entryX() : rightEntry;
      if (Math.random() < M.sappers) { foes.push(makeWalker('sapper', { dir, x: from })); return 1; }
      const pack = Math.random() < M.runners, count = pack ? RUNNERS[0] + Math.floor(Math.random() * (RUNNERS[1] - RUNNERS[0] + 1)) : Math.random() < M.ranks ? (Math.random() < 0.6 ? 2 : 3) : 1;
      for (let n = 0; n < count; n++) {
        const kind = pack ? 'runner' : Math.random() < M.brutes ? 'brute' : 'soldier';
        foes.push(makeWalker(kind, { dir, x: from - dir * n * (pack ? 0.06 : 0.09) * H }));
      }
      return count;
    };
    // A frost wraith sets out above the trees for the chimney, weaving as it comes
    const spawnWraith = (M) => {
      const dir = rightSide(M) ? -1 : 1, x = dir > 0 ? entryX() : rightEntry, y = groundAt(x) - lerp(FLY[0], FLY[1], Math.random()) * H;
      const len = Math.hypot(chimney.x - x, chimney.y - y);
      foes.push({ kind: 'wraith', flies: true, dir, sx: x, sy: y, x, y, t: 0, len, r: WRAITH.size * k, angle: 0, health: WRAITH.health * toughNow(), max: WRAITH.health * toughNow(), speed: WRAITH.speed * MONTHS[monthIndex].pace, seed: Math.random() * TAU, born: time, heat: 0, dead: false, stoked: null });
    };
    const spawnKing = () => {
      kingCame = true;
      king = makeWalker('king', { x: entryX(), speed: HOST.king.speed });
      foes.push(king);
      card(['Old Man Winter', narrow ? 'Melt him' : 'Melt him and the winter breaks'], '200 236 255', 0, 3600);
      sfx.king();
    };
    // How near one is to putting out the fire: a walker by the ground between it and the cabin, a wraith by its way to the
    // chimney. Lanterns shine on the nearest.
    const nearness = (f) => (f.flies ? Math.hypot(f.x - chimney.x, f.y - chimney.y) : Math.abs(f.x - middle.x));
    // What a stars' power adds to wood, for what melted it
    const woodBonus = (by) => (hero && by === hero ? hero.gems.filter((g) => STARS[g].power === 'wood').length : by && by.kind === 'lantern' && by.star != null && STARS[by.star].power === 'wood' ? 1 : 0);
    // Anything melted charges the aurora, teaches your animal if it was near, and fills the ponds of dams close by
    const creditMelt = (f, K) => {
      aurora = Math.min(1, aurora + AURORA_PER_MELT * ((hero && hero.up && hero.def.aurora) || 1));
      if (hero && hero.up) {
        if (f.by === hero) gainXp(XP[f.kind] || 0);
        else if (Math.abs(f.x - hero.x) < 0.5 * H) gainXp((XP[f.kind] || 0) * 0.3);
      }
      if (f.flies) return;
      for (const ring of rings) {
        const b = ring.building;
        if (b && b.kind === 'lodge' && b.job === 'dam' && b.dam >= 1 && Math.abs(f.x - ring.x) <= POND_REACH * H) b.pond = Math.min(POND_FULL, b.pond + K.health);
      }
    };
    // Melted, one of the army slumps into a heap of snow and the light goes out of its eyes, or a wraith thins to nothing.
    // Near Old Man Winter, a walker rises again from its snow.
    const melt = (f, free = false) => {
      f.dead = true;
      const gy = groundAt(f.x) - (f.lift || 0);
      if (!free && !f.turned) {
        const K = f.flies ? WRAITH : HOST[f.kind];
        points += K.points;
        wood += K.wood + woodBonus(f.by);
        melted += 1;
        if (f.kind !== 'king') counts[f.kind] += 1;
        creditMelt(f, K);
        // (a hiss for each, but not so many at once that they pile up)
        if (time - lastMeltSound > 0.12) { lastMeltSound = time; if (f.flies) sfx.wraith(); else sfx.melt(); }
      }
      if (f.flies) {
        puffOfSteam(f.x, f.y, f.r * 1.6, 4);
      } else {
        const F = FIGURES[f.kind];
        puffOfSteam(f.x, f.y, f.r * 1.2);
        remains.push({ x: f.x, gy, w: 2.4 * f.r, age: 0, ex: f.x + f.dir * F.eyes[0] * k, ey: gy + F.eyes[1] * k * 0.62 });
        if (!free && !f.turned && king && f !== king && !king.dead && Math.abs(f.x - king.x) <= RAISE * H && time >= lastRaise + RAISE_EVERY) {
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
      wood += K.wood + woodBonus(f.by);
      creditMelt(f, K);
      spray(f.x, f.y, 14, '220,236,255');
      pop(f.x, f.y - 1.6 * f.r, `+${K.points}`, GOLD);
      counts.brute += 1;
      // (a crack for each, but not all at once, when the aurora or a stoke breaks a dozen in a moment)
      if (time - lastCrackSound > 0.12) { lastCrackSound = time; sfx.crack(); }
      for (const s of [-1, 1]) foes.push(makeWalker('soldier', { dir: f.dir, x: f.x + s * 0.035 * H, born: time - 1, stoked: stoke || null }));
      showScore();
    };
    const hurt = (f, amount, stoke, by) => {
      // (once a run is ending, nothing more happens to the army: an aurora on its way when the fire goes out mustn't bring a thaw)
      if (f.dead || ending) return;
      f.health -= amount;
      f.heat = 0.2;
      if (by) f.by = by;
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
    // What a spot can take, given what's been added to the cabin; whether its month has come for it (inSeason); whether the ground
    // there is warm; and so whether it can be built on
    const hasFor = (kind) => !BUILD[kind].needs || wings[BUILD[kind].needs];
    const kindsFor = (ring) => (ring.side === 'shed' ? ['woodshed'] : ring.side === 'gap' ? ['lodge', 'woodpile'] : ['lantern', 'firepit']).filter(hasFor);
    const inSeason = (ring) => ring.from <= shownIndex() && kindsFor(ring).length > 0;
    const warm = (ring) => distOf(ring) <= warmEdge + 1e-6;
    const warmGround = (x) => Math.abs(x - middle.x) <= warmEdge * H;
    const open = (ring) => inSeason(ring) && warm(ring);
    const build = (ring, kind) => {
      const cost = costOf(kind);
      if (wood < cost) { pop(ring.x, ring.y - 0.3 * H, `${BUILD[kind].name} needs ${cost} wood`, ICE); return; }
      wood -= cost;
      built += 1;
      ring.building = { kind, level: 0, spent: cost, target: null, second: null, at: time, flicker: Math.random() * TAU, burning: false, until: 0, out: 0, iced: false, beaver: false, job: 'gnaw', pile: 0, chew: 0, dam: 0, pond: 0, away: false, scared: false };
      sparkle(ring.x, kind === 'lantern' ? lampAt(ring).y : ring.y - 6 * k);
      counts[kind] += 1;
      if (kind === 'lantern') sfx.build(); else if (kind === 'firepit') sfx.fire(); else sfx.shed();
      if (kind === 'firepit') spreadWarmth(distOf(ring) + WARM_PIT);
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
      if (b.kind === 'lantern') sfx.upgrade(); else if (b.kind === 'lodge') sfx.shed(); else sfx.fire();
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
    // The ground warms outward, and never back
    const spreadWarmth = (to) => {
      const was = warmEdge;
      warmEdge = Math.min(WARM_MAX, Math.max(warmEdge, to));
      let reached = null;
      for (const ring of rings) {
        if (ring.side !== 'left' && ring.side !== 'gap') continue;
        const d = distOf(ring);
        if (d > was && d <= warmEdge) { sparkle(ring.x, ring.y - 4 * k); if (ring.side === 'left') reached = ring; }
      }
      if (reached && phase !== 'open') { pop(reached.x, reached.y - 0.3 * H, 'New ground warmed', GOLD); sfx.warmed(); }
    };
    // Adding to the cabin
    const addition = (x, y) => { sparkle(x, y); sparkle(x, y - 0.06 * H); };
    const addWing = (id) => {
      const cost = WING_COSTS[wingCount];
      if (wings[id] || wood < cost) return;
      wood -= cost;
      wings[id] = true;
      wingCount += 1;
      if (id === 'telescope') callCharges = CALL_MAX;
      spreadWarmth(warmEdge + WARM_ADD);
      addition(middle.x, middle.y - 0.1 * H);
      sfx.wing();
      closeMenu();
      if (phase === 'open') say(`${press} a ring near the cabin to build a lantern, ${costOf('lantern')} wood`);
      showScore();
    };
    const addHearth = () => {
      const cost = HEARTHS[hearthLevel];
      if (cost == null || wood < cost) return;
      wood -= cost;
      hearthLevel += 1;
      spreadWarmth(warmEdge + WARM_ADD);
      addition(chimney.x, chimney.y);
      sfx.wing();
      closeMenu();
      showScore();
    };
    const cabinOffers = () => [
      ...Object.keys(WINGS).filter((id) => !wings[id]).map((id) => ({ id, name: WINGS[id].name, does: WINGS[id].does, cost: WING_COSTS[wingCount], act: () => addWing(id) })),
      ...(hearthLevel < HEARTHS.length && wingCount && phase !== 'open' && rings.some((r) => inSeason(r) && !warm(r)) ? [{ id: 'hearth', name: 'Bigger hearth', does: 'Its warmth reaches a ring farther', cost: HEARTHS[hearthLevel], act: addHearth }] : []),
    ];
    // Who comes down from the sky to help, when more than one animal has been brought home in the bear game
    const heroChoices = () => ['bear', ...unlockedAnimals()].map((id) => ({ id, name: HEROES[id].who, does: HEROES[id].does, cost: null, act: () => { makeHero(id); openFirst(); } }));
    // Beavers: their wood brought in, and their job changed
    const collect = (ring) => {
      const b = ring.building, got = Math.floor(b.pile);
      if (got < 1) return false;
      b.pile -= got;
      wood += got;
      counts.gathered += got;
      pop(ring.x, ring.y - 0.3 * H, `+${got} wood`, GOLD);
      sfx.collect();
      showScore();
      return true;
    };
    const setJob = (ring, job) => {
      const b = ring.building;
      if (job === 'dam') { collect(ring); b.dam = 0; b.pond = 0; }
      b.job = job;
      sfx.dam();
      closeMenu();
      showScore();
    };
    // Opened, a dam sends what's behind it toward the forest
    const openDam = (ring) => {
      const b = ring.building;
      b.pond = 0;
      b.dam = 0;
      counts.floods += 1;
      floods.push({ id: ++floodId, x: ring.x, from: ring.x, left: FLOOD_RANGE * H });
      sfx.flood();
      pop(ring.x, ring.y - 0.3 * H, 'The dam is open!', ICE);
      closeMenu();
    };
    // A sapper ices a lantern over, and it stays dark until clicked free or a beaver comes
    const iceOver = (ring, f) => {
      const b = ring.building;
      b.iced = true;
      b.icedAt = time;
      b.target = b.second = null;
      f.dead = true;
      spray(ring.x, lampAt(ring).y, 10, '200,236,255');
      pop(ring.x, ring.y - 0.3 * H, 'Iced over!', ICE);
      sfx.ice();
    };
    const freeLantern = (ring) => {
      const b = ring.building;
      if (!b || !b.iced) return;
      b.iced = false;
      b.beaver = false;
      b.at = time;
      counts.freed += 1;
      puffOfSteam(ring.x, lampAt(ring).y, 0.04 * H, 3);
      sfx.free();
    };
    const sendBeaver = (ring, b) => {
      if (b.beaver || time < b.icedAt + ICE_WAIT) return;
      let from = null;
      for (const r of rings) {
        const l = r.building;
        if (l && l.kind === 'lodge' && l.job === 'gnaw' && !l.away && (!from || Math.abs(r.x - ring.x) < Math.abs(from.x - ring.x))) from = r;
      }
      if (!from) return;
      from.building.away = true;
      b.beaver = true;
      couriers.push({ home: from, to: ring, x: from.x, face: ring.x < from.x ? -1 : 1, going: true, wait: 0, step: 0 });
    };
    // What a star's color adds when it hits: burning on, a second one lit at once, or its light running on through a group
    const gemPower = (power, target, rate, by, dt, at, reach, n = 1) => {
      if (power === 'burn') target.burn = { until: time + 2, rate: rate * 0.35 * n, by };
      else if (power === 'twin') {
        let other = null;
        for (const f of foes) {
          if (f === target || f.dead || f.turned || f.rise) continue;
          if (Math.hypot(f.x - at.x, f.y - at.y) <= reach + f.r && (!other || nearness(f) < nearness(other))) other = f;
        }
        if (other) { hurt(other, rate * 0.7 * n * dt, null, by); if (by !== hero) by.second = other; }
      } else if (power === 'chain') {
        for (const f of foes) if (f !== target && !f.dead && !f.turned && !f.rise && !!f.flies === !!target.flies && Math.abs(f.x - target.x) < 0.15 * H) hurt(f, rate * 0.35 * n * dt, null, by);
      }
    };
    // A star called down, on the spot below the click
    const callDown = (x) => {
      if (!wings.telescope || phase !== 'month') return;
      if (callCharges < 1) { pop(x, Math.max(52, groundAt(x) - 0.5 * H), `Next star in ${Math.ceil(callTimer)} s`, ICE); return; }
      callCharges -= 1;
      counts.called += 1;
      const which = pickStar();
      strikes.push({ which, x, y0: -0.04 * H, y1: groundAt(x) - 3 * k, t: 0 });
      sfx.call(which);
    };
    const impact = (st) => {
      const hit = CALL_HIT * STARS[st.which].heat * toughNow();
      for (const f of [...foes]) {
        if (f.dead || f.turned) continue;
        const d = Math.abs(f.x - st.x);
        if (f.flies) { if (d <= CALL_REACH * H) hurt(f, hit, null, 'star'); continue; }
        if (d <= CALL_REACH * H + f.r) hurt(f, f === king ? hit * 0.5 : hit, null, 'star');
        if (!f.dead && d <= CALL_STAGGER * H) f.winded = Math.max(f.winded || 0, time + CALL_WINDED);
      }
      spray(st.x, st.y1, 14, STARS[st.which].color);
      puffOfSteam(st.x, st.y1, 0.05 * H, 3);
      blasts.push({ x: st.x, y: st.y1, age: 0, life: 0.45, reach: CALL_REACH * H, color: STARS[st.which].color });
      sfx.impact();
    };
    // The aurora, brought down on the whole ridge
    const callAurora = () => {
      if (aurora < 1 || phase !== 'month' || ending || paused) return;
      aurora = 0;
      counts.auroras += 1;
      auroraFx = { age: 0, hit: false };
      if (options.surge) options.surge();
      sfx.aurora();
    };
    // A scarf for the soldier nearest the cabin, which turns round and marches against its old friends
    const knitScarf = () => {
      if (!wings.workshop || phase !== 'month' || ending || paused || wood < SCARF_COST || time < scarfAt + SCARF_EVERY) return;
      const soldiers = foes.filter((f) => !f.dead && !f.turned && !f.rise && !f.wash && f.kind === 'soldier').sort((a, b) => nearness(a) - nearness(b));
      if (!soldiers.length) { pop(middle.x, middle.y - 0.3 * H, 'No soldier to give a scarf to', ICE); return; }
      const f = soldiers[0];
      wood -= SCARF_COST;
      scarfAt = time;
      counts.scarves += 1;
      f.turned = true;
      f.dir = -f.dir;
      f.health = f.max * 2;
      f.max *= 2;
      f.heat = 0;
      f.burn = null;
      sparkle(f.x, f.y);
      pop(f.x, f.y - 0.2 * H, 'Won over!', WARM);
      sfx.scarf();
      showScore();
    };
    // Seven star lanterns on the seven left rings, and the Big Dipper answers
    const dipperStars = () => {
      const b = banner.getBoundingClientRect();
      return [...banner.querySelectorAll('.bn-dipper-stars circle')].filter((c) => c.dataset.star !== 'North Star').map((c) => {
        const r = c.getBoundingClientRect();
        return { x: r.left + r.width / 2 - b.left, y: r.top + r.height / 2 - b.top };
      });
    };
    const checkDipper = () => {
      if (dipperDone) return;
      const seven = rings.filter((r) => r.side === 'left');
      if (seven.length < RINGS || !seven.every((r) => r.building && r.building.kind === 'lantern' && r.building.star != null)) return;
      dipperDone = true;
      counts.dipper = true;
      const stars = dipperStars();
      dipperFx = { age: 0, hit: false, stars, lamps: [...seven].sort((a, b) => a.x - b.x), order: stars.map((s, i) => i).sort((a, b) => stars[a].x - stars[b].x) };
      card(['The Big Dipper', 'Seven stars on the ridge'], '255 236 184', 0, 3600);
      sfx.dipper();
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
    // A choice of what to add to the cabin, or of who comes to help, over the cabin
    const choice = ({ name, does, cost }, act) => {
      const el = Object.assign(document.createElement('span'), { className: act ? 'wide' : 'wide off' });
      el.append(Object.assign(document.createElement('b'), { textContent: name }), Object.assign(document.createElement('small'), { textContent: cost == null ? does : `${does}. ${cost ? `${number(cost)} wood` : 'Free'}` }));
      el.addEventListener('click', (e) => { e.stopPropagation(); if (act) act(); });
      return el;
    };
    const renderChoices = (spot) => {
      const list = spot === heroSpot ? heroChoices() : cabinOffers(), short = H < 170, compact = short && phase === 'breather';
      const key = `${spot.side},${compact},${list.map((o) => `${o.id}:${o.cost == null || wood >= o.cost}`).join()}`;
      if (key === menuKey) return;
      menuKey = key;
      menu.replaceChildren(...(list.length ? list.map((o) => {
        const act = o.cost == null || wood >= o.cost ? o.act : null;
        return compact ? item(`${o.name}, ${number(o.cost)} wood`, act) : choice(o, act);
      }) : [item('The cabin is as grand as it gets', null)]));
      menu.style.display = '';
      hint.style.visibility = short ? 'hidden' : '';
      if (short) hudLeft.style.visibility = hudRight.style.visibility = 'hidden';
      if (phase === 'breather') cards.forEach((el) => el.remove());
      const half = menu.offsetWidth / 2;
      menu.style.left = `${clamp(middle.x, half + 4, W - half - 4).toFixed(1)}px`;
      menu.style.top = `${Math.max(menu.offsetHeight + 4, middle.y - cabinHit - 6).toFixed(1)}px`;
    };
    const renderMenu = () => {
      if (!menuFor) return;
      if (menuFor === cabinSpot || menuFor === heroSpot) { renderChoices(menuFor); return; }
      const ring = menuFor, b = ring.building;
      let key, items;
      if (!b) {
        const kinds = kindsFor(ring);
        key = `build,${kinds.map((kind) => wood >= costOf(kind)).join()}`;
        if (key === menuKey) return;
        items = () => kinds.map((kind) => item(`${BUILD[kind].name}, ${costOf(kind)} wood`, wood >= costOf(kind) ? () => build(ring, kind) : null, kind));
      } else {
        const next = BUILD[b.kind].levels[b.level + 1], back = Math.floor(b.spent / 2);
        key = `${b.kind},${b.level},${b.burning},${next ? wood >= next.cost : '-'},${wood >= BUILD.woodpile.alight},${back},${b.job},${Math.floor(b.pond / POND_FULL * 4)},${b.dam >= 1}`;
        if (key === menuKey) return;
        const down = item(`Take down, +${back} wood`, () => takeDown(ring));
        if (b.kind === 'lantern') items = () => [item(next ? `Upgrade, ${next.cost} wood` : 'As bright as it gets', next && wood >= next.cost ? () => upgrade(ring) : null), down];
        else if (b.kind === 'firepit') items = () => [item(next ? `Make it a bonfire, ${next.cost} wood` : 'A bonfire', next && wood >= next.cost ? () => upgrade(ring) : null), down];
        else if (b.kind === 'woodpile') items = () => (b.burning ? [item('Burning', null)] : [item(`Set alight, ${BUILD.woodpile.alight} wood`, wood >= BUILD.woodpile.alight ? () => setAlight(ring) : null), down]);
        else if (b.kind === 'lodge') {
          items = () => [
            item(b.job === 'gnaw' ? 'Build a dam' : 'Back to gnawing', () => setJob(ring, b.job === 'gnaw' ? 'dam' : 'gnaw')),
            ...(next ? [item(`A second beaver, ${next.cost} wood`, wood >= next.cost ? () => upgrade(ring) : null)] : []),
            ...(b.job === 'dam' ? [item(b.dam < 1 ? 'Building the dam' : b.pond >= POND_FULL ? 'Open the dam' : `Pond ${Math.floor(b.pond / POND_FULL * 4) * 25}% full`, b.pond >= POND_FULL ? () => openDam(ring) : null)] : []),
            down,
          ];
        } else items = () => [item(`${BUILD.woodshed.wood} more wood a month`, null), down];
      }
      menuKey = key;
      menu.replaceChildren(...items());
      menu.style.display = '';
      const half = menu.offsetWidth / 2, top = b && b.kind === 'lantern' ? lampAt(ring).y : ring.y - 12 * k;
      menu.style.left = `${clamp(ring.x, half + 4, W - half - 4).toFixed(1)}px`;
      menu.style.top = `${Math.max(menu.offsetHeight + 4, top - 0.08 * H).toFixed(1)}px`;
    };
    const openMenu = (ring) => { menuFor = ring; menuKey = ''; preview = null; renderMenu(); };
    const closeMenu = () => { menuFor = null; menuKey = ''; preview = null; menu.style.display = 'none'; hint.style.visibility = ''; hudLeft.style.visibility = hudRight.style.visibility = ''; };

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
      spreadWarmth(warmEdge + WARM_STOKE);
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
      const which = pickStar(), x0 = lerp(Math.max(0.12 * W, 130), Math.min(0.88 * W, W - 130 - 0.4 * H), Math.random()), x1 = x0 + (Math.random() < 0.5 ? -1 : 1) * lerp(0.15, 0.4, Math.random()) * H;
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

    // A star your animal catches stays with it, a gemstone it wears, unless it already wears three as hot
    const heroCatch = (st) => {
      if (st.caught || st.gone) return;
      const S = STARS[st.which];
      points += S.points;
      counts.stars += 1;
      sfx.star(st.which);
      pop(st.x, st.y - 0.06 * H, `+${S.points}`, `rgb(${S.color})`);
      st.caught = { ring: null, hero: true, x: st.x, y: st.y, t: 0 };
      showScore();
    };
    // Your animal: chosen before the winter starts, level by level stronger
    const heroMaxHp = () => hero.def.hp * (1 + LEVEL_HP * (hero.level - 1));
    const heroPower = () => 1 + LEVEL_POWER * (hero.level - 1);
    const heroMin = () => Math.max(8, 0.02 * W), heroMax = () => W - 8;
    const makeHero = (kind) => {
      const D = HEROES[kind];
      heroFrames = posesOf(D.draw, D.box);
      hero = { kind, def: D, x: middle.x - 0.42 * H, y: 0, r: 0.3 * D.tall * k, target: null, face: -1, level: 1, xp: 0, hp: D.hp, up: true, restUntil: 0, readyAt: 0, shellUntil: -Infinity, pounce: null, gems: [], phase: 0, moving: false, born: time, aim: null };
      hero.y = groundAt(hero.x) - 0.5 * D.tall * k;
    };
    const gainXp = (n) => {
      hero.xp += n;
      while (hero.level < heroLevelMax && hero.xp >= XP_FOR[hero.level]) {
        const was = heroMaxHp();
        hero.level += 1;
        hero.hp += heroMaxHp() - was;
        pop(hero.x, hero.y - 0.25 * H, `${hero.def.short[0].toUpperCase()}${hero.def.short.slice(1)}, level ${hero.level}`, `rgb(${hero.def.glow})`);
        sparkle(hero.x, hero.y);
        sfx.level();
      }
    };
    const heroRests = () => {
      hero.up = false;
      hero.restUntil = time + REST;
      hero.target = null;
      hero.pounce = null;
      spray(hero.x, hero.y, 16, hero.def.glow);
      pop(hero.x, hero.y - 0.25 * H, `Your ${hero.def.short} is warming up by the fire`, `rgb(${hero.def.glow})`);
      sfx.heroDown();
    };
    const useAbility = () => {
      if (!hero || !hero.up || phase !== 'month' || ending || paused || time < hero.readyAt) return;
      const D = hero.def;
      hero.readyAt = time + D.every;
      if (D.ability === 'Roar') {
        for (const f of [...foes]) {
          if (f.dead || f.turned || f.flies || Math.abs(f.x - hero.x) > 0.6 * H) continue;
          hurt(f, 1.2 * heroPower(), null, hero);
          if (!f.dead) f.winded = Math.max(f.winded || 0, time + 3);
        }
        blasts.push({ x: hero.x, y: hero.y, age: 0, life: 0.5, reach: 0.6 * H, color: D.glow });
        sfx.roar();
      } else if (D.ability === 'Pounce') {
        hero.pounce = { left: 0.9 * H, dir: hero.face };
        sfx.pounce();
      } else {
        hero.shellUntil = time + D.shell;
        sfx.shell();
      }
    };
    // Each frame: steering, what touches it, what it melts, and whether it's had enough
    const heroStep = (dt) => {
      if (!hero) return;
      const D = hero.def;
      if (!hero.up) {
        if (time < hero.restUntil) return;
        hero.up = true;
        hero.hp = heroMaxHp();
        hero.x = middle.x - 0.3 * H;
        hero.target = null;
        hero.born = time;
        hero.y = groundAt(hero.x) - 0.5 * D.tall * k;
        sparkle(hero.x, hero.y);
        sfx.heroBack();
        return;
      }
      const shelled = time < hero.shellUntil;
      hero.moving = false;
      let move = 0;
      if (hero.pounce) {
        const go = Math.min(hero.pounce.left, 3.6 * H * dt);
        move = hero.pounce.dir * go;
        hero.pounce.left -= go;
        if (hero.pounce.left <= 0) hero.pounce = null;
      } else if (!shelled) {
        const axis = (keysDown.has('right') ? 1 : 0) - (keysDown.has('left') ? 1 : 0), speed = D.speed * H;
        if (axis) { move = axis * speed * dt; hero.target = null; }
        else if (hero.target != null) {
          const d = hero.target - hero.x;
          move = Math.sign(d) * Math.min(Math.abs(d), speed * dt);
          if (Math.abs(d) < 1.5) hero.target = null;
        }
      }
      if (move) {
        const was = hero.x;
        hero.x = clamp(hero.x + move, heroMin(), heroMax());
        if (hero.x !== was) {
          hero.face = Math.sign(move);
          hero.phase += Math.abs(hero.x - was) / (D.stride * k) * TAU;
          hero.moving = true;
        }
        if (hero.pounce && (hero.x <= heroMin() || hero.x >= heroMax())) hero.pounce = null;
      }
      hero.y = groundAt(hero.x) - 0.5 * D.tall * k;
      // What's touching it hurts it, and it holds up what it blocks; the fox hurts what it runs through
      let touching = false, target = null, best = Infinity;
      const contact = D.contact * H, reach = D.reach * H, rate = D.melt * heroPower();
      for (const f of foes) {
        if (f.dead || f.flies || f.turned || f.rise || time - f.born < 0.25) continue;
        const near = Math.abs(f.x - hero.x) - f.r * 0.6;
        if (near <= contact) {
          touching = true;
          if (!shelled && !hero.pounce) hero.hp -= (HERO_TOUCH[f.kind] || 0) * dt;
          if ((D.blocks || shelled) && (hero.x - f.x) * f.dir > -contact) f.held = true;
          if (D.through && (hero.moving || hero.pounce) && time >= (f.foxAt || 0)) {
            f.foxAt = time + 0.45;
            hurt(f, (hero.pounce ? D.pounceHit : D.through) * heroPower(), null, hero);
          }
        }
        if (!f.dead && near <= reach && near < best) { best = near; target = f; }
      }
      hero.aim = target && !target.dead && !shelled ? target : null;
      if (hero.aim) {
        hurt(hero.aim, rate * dt, null, hero);
        const tally = {};
        hero.gems.forEach((g) => { tally[STARS[g].power] = (tally[STARS[g].power] || 0) + 1; });
        for (const [power, n] of Object.entries(tally)) gemPower(power, hero.aim, rate, hero, dt, hero, reach, n);
      }
      if (!touching && warmGround(hero.x)) hero.hp = Math.min(heroMaxHp(), hero.hp + HEAL * dt);
      if (hero.hp <= 0) heroRests();
    };
    // Soldiers won over march against the first of the army they meet, holding it up
    const scarfStep = (dt) => {
      for (const f of foes) {
        if (!f.turned || f.dead) continue;
        f.fighting = false;
        let foe = null, best = Infinity;
        for (const o of foes) {
          if (o.dead || o.turned || o.flies || o.rise) continue;
          const ahead = (o.x - f.x) * f.dir;
          if (ahead > -2 && ahead < f.r + o.r + 3 && ahead < best) { best = ahead; foe = o; }
        }
        if (!foe) continue;
        f.fighting = true;
        foe.held = true;
        hurt(foe, SCARF_MELT * dt, null, f);
        f.health -= (HERO_TOUCH[foe.kind] || 0.5) * 0.7 * dt;
        if (f.health <= 0) melt(f, true);
      }
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
      cabinChoiceAt = Infinity;
      if (menuFor === cabinSpot) closeMenu();
      if (i) sayInTurn([...MONTHS[i].news.split('|'), MONTHS[i].fact], 6000);
      else {
        card([MONTHS[0].name, MONTHS[0].says], '196 220 255', 100);
        const steer = !hero ? '' : touchOnly ? `Drag your ${hero.def.short} along the ridge to meet them` : `Steer your ${hero.def.short} with ← and →, or A and D, or by dragging it`;
        sayInTurn([wintersKept ? `You've kept ${number(wintersKept)} ${wintersKept === 1 ? 'winter' : 'winters'}, so this army is tougher` : '', `${press} the cabin to stoke: warmer ground, brighter lanterns`, steer,
          tonight.fullMoon ? 'A full moon tonight: your lanterns reach farther' : '', tonight.shower ? `The ${tonight.shower} are falling tonight, so more stars to catch` : ''], 6000);
      }
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
      pop(cabinPopX, middle.y - (narrow ? 0.3 : 0.42) * H, `${MONTHS[monthIndex].name} kept! +${number(gain)}`, GOLD);
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
      pop(cabinPopX, middle.y - (narrow ? 0.16 : 0.28) * H, `+${CORD + more} wood${back ? ' and a foxfire back' : ''}`, GOLD);
      // A soldier won over goes home to the trees
      for (const f of foes) if (f.turned && !f.dead) { f.dead = true; puffOfSteam(f.x, f.y, f.r * 1.2, 2); }
      const M = MONTHS[monthIndex + 1];
      card([M.name, M.says], '196 220 255', narrow ? 1400 : 600);
      // Between months is when the cabin can be added to. The choice opens by itself, if anything can be afforded, once the next
      // month's card has gone and the points for this one have faded, so it doesn't lie on top of them. The Next link has the
      // hint's line to itself.
      say('');
      cabinChoiceAt = time + CHOICE_AFTER + (narrow ? 0.8 : 0);
      updateNext();
      nextLink.style.display = '';
      musicNow();
      showScore();
    };
    const thaw = () => {
      phase = 'spring';
      phaseTime = 0;
      try { localStorage.setItem(KEPT_KEY, String(wintersKept + 1)); } catch (e) { /* blocked */ }
      const forLives = THAW_POINTS * Math.max(0, lives);
      points += forLives + wood;
      card(['Spring!', 'The fire kept all winter'], '159 245 220', 300, 3400);
      say('');
      pop(cabinPopX, middle.y - 0.28 * H, `+${number(forLives)} for ${lives} ${lives === 1 ? 'foxfire' : 'foxfires'} left`, GOLD);
      if (wood) pop(cabinPopX, middle.y - 0.14 * H, `+${number(wood)} for wood left`, GOLD);
      if (options.surge) options.surge();
      counts.kept += 1;
      musicNow();
      showScore();
    };

    // Input
    const typing = () => (document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) || document.querySelector('dialog[open]');
    const where = (e) => { const b = banner.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
    const onCabin = (p) => Math.hypot(p.x - middle.x, p.y - middle.y) < cabinHit;
    // Of the spots a point is over, the nearest, so the smaller spots between rings can be picked
    const spotAt = (p, can) => {
      let got = null, best = Infinity;
      for (const r of rings) {
        if (!can(r) || p.y <= r.y - 0.36 * H || p.y >= r.y + 0.14 * H) continue;
        const d = Math.abs(p.x - r.x);
        if (d < r.half && d < best) { best = d; got = r; }
      }
      return got;
    };
    const starAt = (p) => skyStars.find((st) => !st.caught && !st.gone && Math.hypot(p.x - st.x, p.y - st.y) < Math.max(18, STAR_HIT * H));
    const onHero = (p) => !!hero && hero.up && Math.abs(p.x - hero.x) < Math.max(22, 0.12 * H) && p.y > groundAt(hero.x) - 0.3 * H && p.y < groundAt(hero.x) + 0.12 * H;
    const pick = (p) => {
      const star = starAt(p);
      if (star) return { star };
      if (onCabin(p)) return { cabin: true };
      const ring = spotAt(p, open);
      if (ring) return { ring };
      const cold = spotAt(p, (r) => inSeason(r) && !warm(r));
      return cold ? { cold } : null;
    };
    // The first choices, before the winter starts: who comes to help, if there's a choice, and the cabin's first addition
    const openFirst = () => {
      say(`Winter's army is coming for the fire. ${hero ? 'Choose what to add to the cabin first' : 'Who comes down from the sky to help?'}`);
      openMenu(hero ? cabinSpot : heroSpot);
    };
    const onClick = (e) => {
      if (skipClick) { skipClick = false; return; }
      if (ending || paused || phase === 'spring' || menu.contains(e.target) || e.target === quit || e.target === nextLink) return;
      const p = where(e), got = pick(p), was = menuFor;
      closeMenu();
      if (!got) {
        // A click on the sky calls a star down, unless it only closed a menu
        if (!was && p.y < groundAt(p.x) - 0.36 * H) callDown(p.x);
        return;
      }
      if (got.star) { catchStar(got.star); return; }
      if (got.cabin) {
        if (phase === 'month') stokeFire();
        else if (phase === 'open') { if (was !== cabinSpot && was !== heroSpot) openFirst(); }
        else if (was !== cabinSpot) openMenu(cabinSpot);
        return;
      }
      if (got.cold) { pop(got.cold.x, got.cold.y - 0.3 * H, 'Too cold to build here yet. Stoke the fire', ICE); return; }
      if (phase === 'open' && !(hero && wingCount)) { openFirst(); return; }
      const ring = got.ring, b = ring.building;
      if (b && b.iced) { freeLantern(ring); return; }
      if (b && b.kind === 'lodge' && b.job === 'gnaw' && collect(ring)) return;
      if (b && b.kind === 'lodge' && b.job === 'dam' && b.pond >= POND_FULL) { openDam(ring); return; }
      if (was === ring) return;
      if (b) { openMenu(ring); return; }
      const kinds = kindsFor(ring);
      if (kinds.length === 1) build(ring, kinds[0]); else openMenu(ring);
    };
    // Dragging your animal: a press on it that moves more than a little steers it, and isn't a click
    const onDown = (e) => {
      if (ending || paused || !onHero(where(e))) return;
      drag = { id: e.pointerId, x0: where(e).x, moved: false };
    };
    // Input for IDLE (above): a mouse or pen moving over the banner, or a finger dragging your animal, but not a finger passing
    // over it
    const onMove = (e) => {
      if (drag && e.pointerId === drag.id) {
        inputAt = time;
        const at = where(e).x;
        if (!drag.moved && Math.abs(at - drag.x0) > 6) {
          drag.moved = true;
          try { banner.setPointerCapture(e.pointerId); } catch (x) { /* gone already */ }
        }
        if (drag.moved) { if (hero) hero.target = clamp(at, heroMin(), heroMax()); return; }
      }
      if (e.pointerType === 'touch' || ending) return;
      inputAt = time;
      const p = where(e);
      hover = pick(p);
      banner.style.cursor = hover ? 'pointer' : onHero(p) ? 'grab' : '';
    };
    const onUp = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (drag.moved) { skipClick = true; setTimeout(() => { skipClick = false; }, 60); }
      drag = null;
    };
    const onLeave = () => { hover = null; };
    // Any click or tap on the banner is input for IDLE (above), menus and links included, so this listens before their own
    // handlers, which stop clicks there
    const onAnyClick = () => { inputAt = time; };
    const onKey = (e) => {
      if (typing() || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        if (menuFor) closeMenu(); else leave('quit');
      } else if (e.code === 'Space') {
        // The space bar stokes, and never scrolls the page during a run
        e.preventDefault();
        if (!ending && !paused && phase !== 'open') stokeFire();
      } else if (e.key === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        keysDown.add('left');
        inputAt = time;
      } else if (e.key === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        keysDown.add('right');
        inputAt = time;
      } else if (e.code === 'KeyQ') useAbility();
      else if (e.code === 'KeyR') callAurora();
      else if (e.code === 'KeyF') knitScarf();
      else if (e.code === 'KeyP' && !ending) togglePause();
    };
    const onKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.code === 'KeyA') keysDown.delete('left');
      if (e.key === 'ArrowRight' || e.code === 'KeyD') keysDown.delete('right');
    };
    const onBlur = () => keysDown.clear();
    // A long winter shouldn't be lost to a glance at another tab, so hiding the tab or scrolling the banner away pauses it
    const setPaused = (on) => {
      if (on === paused) return;
      paused = on;
      drag = null;
      keysDown.clear();
      if (audio && soundIsOn) { if (on) audio.suspend(); else audio.resume(); }
    };
    const togglePause = () => {
      heldPause = !heldPause;
      setPaused(heldPause);
      pauseLink.textContent = heldPause ? 'Go on' : 'Pause';
    };
    const onHidden = () => {
      if (!document.hidden) return;
      if (ending) cleanup(); else setPaused(true);
    };
    const onQuit = (e) => { e.stopPropagation(); leave('quit'); };
    const onNext = (e) => {
      e.stopPropagation();
      if (phase !== 'breather' || paused) return;
      const s = Math.max(1, Math.ceil(breatherLeft));
      wood += s * NEXT_WOOD;
      pop(cabinPopX, middle.y - 0.28 * H, `+${s * NEXT_WOOD} wood`, GOLD);
      startMonth(monthIndex + 1);
    };
    banner.addEventListener('click', onAnyClick, true);
    banner.addEventListener('click', onClick);
    banner.addEventListener('pointerdown', onDown);
    banner.addEventListener('pointermove', onMove);
    banner.addEventListener('pointerup', onUp);
    banner.addEventListener('pointercancel', onUp);
    banner.addEventListener('pointerleave', onLeave);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
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
      heldPause = false;
      setPaused(false);
      phase = 'end';
      phaseTime = 0;
      fadeFrom = fieldAlpha;
      fadeFor = why === 'out' ? FADE * 1.4 : why === 'spring' ? FADE * 1.6 : FADE * 0.6;
      closeMenu();
      hintTimers.forEach(clearTimeout);
      nextLink.remove();
      quit.remove();
      hudLeft.remove();
      hudRight.remove();
      pauseLink.remove();
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
        ...(counts.runner ? [`Runners melted ${counts.runner}`] : []), ...(counts.sapper ? [`Sappers melted ${counts.sapper}`] : []), ...(counts.wraith ? [`Frost wraiths ${counts.wraith}`] : []), ...(counts.king ? ['Old Man Winter melted'] : []), '',
        ...(hero ? [`${HEROES[hero.kind].who}, level ${hero.level}`] : []), ...Object.keys(wings).filter((id) => wings[id]).map((id) => `The ${WINGS[id].name.toLowerCase()}`), ...(hearthLevel ? [`Bigger hearths ${hearthLevel}`] : []), '',
        ...(counts.lantern ? [`Lanterns lit ${counts.lantern}`] : []), ...(counts.firepit ? [`Fire pits ${counts.firepit}`] : []),
        ...(counts.alight ? [`Woodpiles burned ${counts.alight}`] : counts.woodpile ? [`Woodpiles ${counts.woodpile}`] : []), ...(counts.woodshed ? ['A woodshed'] : []),
        ...(counts.lodge ? [`Beaver lodges ${counts.lodge}`] : []), ...(counts.gathered ? [`Wood they gnawed ${number(counts.gathered)}`] : []), ...(counts.floods ? [`Floods ${counts.floods}`] : []),
        ...(counts.called ? [`Stars called down ${counts.called}`] : []), ...(counts.auroras ? [`Auroras ${counts.auroras}`] : []), ...(counts.scarves ? [`Scarves ${counts.scarves}`] : []), ...(counts.dipper ? ['The Big Dipper blazed'] : []),
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
      banner.removeEventListener('click', onAnyClick, true);
      banner.removeEventListener('click', onClick);
      banner.removeEventListener('pointerdown', onDown);
      banner.removeEventListener('pointermove', onMove);
      banner.removeEventListener('pointerup', onUp);
      banner.removeEventListener('pointercancel', onUp);
      banner.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onHidden);
      quit.removeEventListener('click', onQuit);
      nextLink.removeEventListener('click', onNext);
      cards.forEach((el) => el.remove());
      [layer, menu, nextLink, quit, hudLeft, hudRight, pauseLink, ...(result ? [] : [score, hint])].forEach((el) => el.remove());
      banner.classList.remove('bn-cabin-on');
      banner.style.cursor = '';
      banner.style.touchAction = '';
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

    // The lines beside the score, at a few times a second: what's to hand, and what can be clicked now
    const setLine = (el, text, active) => {
      if (el.textContent !== text) el.textContent = text;
      if (el.hidden !== !text) el.hidden = !text;
      if (el.classList.contains('act') !== active) el.classList.toggle('act', active);
    };
    const renderHud = () => {
      if (time < hudAt) return;
      hudAt = time + 0.12;
      const keyName = (key) => (touchOnly ? '' : ` (${key})`), ready = phase === 'month', started = phase !== 'open';
      setLine(starsLine, !wings.telescope || !started ? '' : callCharges ? (narrow ? `Stars ${callCharges}` : `Stars to call: ${callCharges} of ${CALL_MAX}`) : `Next star in ${Math.ceil(callTimer)} s`, false);
      setLine(auroraLine, !started ? '' : aurora >= 1 ? `Call the aurora${keyName('R')}` : `Aurora ${Math.floor(aurora * 100)}%`, aurora >= 1 && ready);
      if (hero && started) {
        const D = hero.def, name = D.short[0].toUpperCase() + D.short.slice(1), wait = Math.ceil(hero.readyAt - time);
        const who = narrow ? '' : `${name}, level ${hero.level}: `;
        setLine(abilityLine, !hero.up ? `${name} warming up, ${Math.ceil(hero.restUntil - time)} s` : wait > 0 ? `${who}${D.ability} in ${wait} s` : `${who}${D.ability}${keyName('Q')}`, hero.up && wait <= 0 && ready);
      } else setLine(abilityLine, '', false);
      if (wings.workshop && started) {
        const wait = Math.ceil(scarfAt + SCARF_EVERY - time);
        setLine(scarfLine, wait > 0 ? `Scarf in ${wait} s` : `Scarf, ${SCARF_COST} wood${keyName('F')}`, wait <= 0 && wood >= SCARF_COST && ready);
      } else setLine(scarfLine, '', false);
    };
    // Tips, each when what it's about first matters, and only once in this browser
    const tipsSeen = new Set((() => { try { return (localStorage.getItem(TIPS_KEY) || '').split(',').filter(Boolean); } catch (e) { return []; } })());
    const tips = [];
    let tipAt = 0;
    const tip = (id, text) => { if (!tipsSeen.has(id) && !tips.some((t) => t.id === id)) tips.push({ id, text }); };
    const considerTips = () => {
      if (phase !== 'month' || time < tipAt) return;
      tipAt = time + 0.5;
      const marching = foes.filter((f) => !f.dead && !f.turned && !f.flies), has = (kind) => rings.some((r) => r.building && r.building.kind === kind);
      const who = hero ? hero.def.short : '', say2 = (key, label, what) => (touchOnly ? `Tap ${label} at the top ${what}` : `Press ${key} ${what}`);
      if (wings.mill && !has('lodge') && wood >= costOf('lodge') && rings.some((r) => r.side === 'gap' && open(r) && !r.building)) tip('lodge', `The smaller spots take beavers' lodges. ${press} one to build it`);
      if (rings.some((r) => r.building && r.building.kind === 'lodge' && r.building.job === 'gnaw' && r.building.pile >= 3)) tip('collect', `${press} a lodge to bring in its wood`);
      if (wings.mill && monthIndex >= 1 && has('lodge')) tip('dam', `A lodge's menu can set its beaver to build a dam, then flood the army`);
      if (wings.telescope && callCharges && marching.some((f) => warmGround(f.x))) tip('sky', `${press} the sky to call a star down on that spot`);
      if (wings.workshop && !has('firepit') && wood >= costOf('firepit')) tip('pit', 'Rings can now take fire pits, which warm the ground around them');
      if (wings.workshop && monthIndex >= 1 && !has('woodpile') && wood >= costOf('woodpile')) tip('pile', 'The smaller spots take woodpiles, which slow the army');
      if (wings.workshop && wood >= SCARF_COST && time >= scarfAt + SCARF_EVERY && marching.some((f) => f.kind === 'soldier' && nearness(f) < 1.2 * H)) tip('scarf', say2('F', 'Scarf', 'to give the nearest soldier a scarf and turn it'));
      if (monthIndex >= 1 && has('lantern') && wood >= BUILD.lantern.levels[1].cost) tip('upgrade', `${press} a lantern to make it brighter`);
      if (hero && hero.up && time >= hero.readyAt && marching.filter((f) => Math.abs(f.x - hero.x) < 0.5 * H).length >= 2) tip('ability', say2('Q', hero.def.ability, `for your ${who}'s ${hero.def.ability.toLowerCase()}`));
      if (aurora >= 1) tip('aurora', say2('R', 'its line', 'to bring the aurora down'));
      if (counts.stars >= 1 && hero && !hero.gems.length && skyStars.some((st) => !st.caught && !st.gone)) tip('wear', `Stand your ${who} under a falling star and it keeps the star`);
      if (rings.some((r) => r.building && r.building.iced)) tip('iced', `${press} an iced lantern to free it`);
      if (!tips.length || performance.now() < hintFreeAt) return;
      const next = tips.shift();
      tipsSeen.add(next.id);
      try { localStorage.setItem(TIPS_KEY, [...tipsSeen].join(',')); } catch (e) { /* blocked */ }
      say(next.text, TIP_SHOW);
    };
    const update = (dt) => {
      time += dt;
      phaseTime += dt;
      const M = MONTHS[monthIndex];
      if (phase === 'open') {
        fieldAlpha = smooth(clamp(phaseTime / OPENING, 0, 1));
        if (!built && time - inputAt > (wingCount ? IDLE * 3 : IDLE)) { leave('idle'); return; }
      } else if (phase === 'month') {
        fieldAlpha = 1;
        monthTime += dt;
        if (monthTime < M.seconds) {
          nextRank -= dt;
          if (nextRank <= 0) {
            const count = spawnRank(M);
            const swell = 0.5 + 0.5 * Math.sin(TAU * monthTime / SWELL - Math.PI / 2);
            nextRank = lerp(M.every[0], M.every[1], monthTime / M.seconds) * lerp(0.75, 1.25, Math.random()) * (count > 1 ? 1.4 : 1) * lerp(SWELL_THIN, SWELL_THICK, swell);
          }
          nextWraith -= dt;
          if (nextWraith <= 0 && M.wraiths) {
            spawnWraith(M);
            nextWraith = lerp(M.wraiths[0], M.wraiths[1], monthTime / M.seconds) * lerp(0.8, 1.2, Math.random());
          }
        }
        if (monthIndex === MONTHS.length - 1 && !kingCame && monthTime >= KING_AT) spawnKing();
        nudge(false);
        if (monthTime >= M.seconds && !foes.some((f) => !f.turned && !f.dead) && !risers.length && (monthIndex < MONTHS.length - 1 || kingCame)) endMonth();
      } else if (phase === 'breather') {
        breatherLeft -= dt;
        if (time >= cabinChoiceAt) {
          cabinChoiceAt = Infinity;
          if (!menuFor && cabinOffers().some((o) => wood >= o.cost)) openMenu(cabinSpot);
        }
        if (breatherLeft <= 0) startMonth(monthIndex + 1); else updateNext();
      } else if (phase === 'spring') {
        if (phaseTime > SPRING_HOLD) leave('spring');
      } else if (phase === 'end') {
        fieldAlpha = fadeFrom * (1 - smooth(clamp(phaseTime / fadeFor, 0, 1)));
        if (phaseTime >= fadeFor) { cleanup(); return; }
      }
      const playing = phase === 'month' || phase === 'breather';
      // The stars coming to hand, and the aurora charging
      if (wings.telescope && playing && callCharges < CALL_MAX) { callTimer -= dt; if (callTimer <= 0) { callCharges += 1; callTimer = CALL_EVERY; } }
      if (phase === 'month') aurora = Math.min(1, aurora + dt / AURORA_SECONDS);
      renderHud();
      considerTips();
      // The buildings at work: lanterns shine on the one nearest the cabin within their reach, fire pits melt all of the
      // army on the ground near them, and burning woodpiles burn down
      for (const ring of rings) {
        const b = ring.building;
        if (!b) continue;
        if (b.kind === 'woodpile' && b.burning && time >= b.until && !b.out) b.out = time;
        if (b.out && time - b.out > 1.6) { ring.building = null; if (menuFor === ring) closeMenu(); continue; }
        if (!playing) continue;
        if (b.kind === 'lodge') {
          if (b.job === 'dam') b.dam = Math.min(1, b.dam + dt / DAM_BUILD);
          else {
            b.scared = foes.some((f) => !f.dead && !f.flies && !f.turned && Math.abs(f.x - ring.x) < SCARED * H);
            if (!b.scared && !b.away && b.pile < PILE_MAX) {
              b.pile = Math.min(PILE_MAX, b.pile + (GNAW + GNAW_FAR * distOf(ring)) * (b.level ? SECOND_BEAVER : 1) * dt);
              b.chew += dt;
            }
          }
        } else if (b.kind === 'lantern') {
          if (b.iced) { b.target = b.second = null; sendBeaver(ring, b); continue; }
          const L = BUILD.lantern.levels[b.level], lamp = lampAt(ring), reach = L.reach * H * moonReach;
          const onKing = !!king && !king.dead && Math.hypot(king.x - lamp.x, king.y - lamp.y) <= reach + king.r;
          let target = onKing ? king : null;
          for (const f of foes) {
            if (onKing || f.dead || f.rise || f.turned || time - f.born < 0.25 || (target && nearness(f) >= nearness(target))) continue;
            if (Math.hypot(f.x - lamp.x, f.y - lamp.y) <= reach + f.r) target = f;
          }
          b.target = target;
          b.second = null;
          if (target) {
            const S = b.star != null ? STARS[b.star] : null, rate = L.melt * (S ? S.heat : 1) * (time < stokeAt + STOKE_GLOW ? STOKE_BRIGHT : 1);
            hurt(target, rate * dt, null, b);
            if (S) gemPower(S.power, target, rate, b, dt, lamp, reach);
          }
        } else if (b.kind === 'firepit') {
          const F = BUILD.firepit.levels[b.level], fire = fireAt(ring), reach = F.reach * H;
          for (const f of foes) if (!f.dead && !f.flies && !f.rise && !f.turned && Math.hypot(f.x - fire.x, f.y - fire.y) <= reach + f.r) hurt(f, F.melt * dt, null, b);
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
            if (f.dead || f.turned || f.stoked === w.id || Math.hypot(f.x - middle.x, f.y - middle.y) > reach) continue;
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
      // Your animal and those won over by a scarf go first, since both can hold the army up
      for (const f of foes) f.held = false;
      if (playing || phase === 'open') heroStep(dt);
      if (playing) scarfStep(dt);
      // The army marches along the ridge toward the cabin, slowed where it clambers over a woodpile or a dam, and holds where it is as
      // a run ends; wraiths fly for the chimney
      for (let i = foes.length - 1; i >= 0; i--) {
        const f = foes[i];
        if (f.dead) { foes.splice(i, 1); continue; }
        f.heat = Math.max(0, f.heat - dt);
        if (f.burn) {
          if (time >= f.burn.until) f.burn = null;
          else if (playing) { hurt(f, f.burn.rate * dt, null, f.burn.by); if (f.dead) continue; }
        }
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
        // Washed back by a flood
        if (f.wash) {
          const left = f.wash.to - f.x, go = Math.min(Math.abs(left), WASH_SPEED * H * dt);
          f.x += Math.sign(left) * go;
          f.lift = 0;
          f.y = groundAt(f.x) - 0.5 * K.tall * k;
          if (Math.abs(left) <= go + 0.5) { f.wash = null; f.winded = Math.max(f.winded || 0, time + WASHED); }
          continue;
        }
        // Clambering over a woodpile or a dam, slowly, and burning while it does if the pile is alight
        let lift = 0, slow = 1;
        for (const ring of rings) {
          const b = ring.building;
          if (!b || b.out) continue;
          const pile = b.kind === 'woodpile', dam = b.kind === 'lodge' && b.job === 'dam' && b.dam >= 1;
          if (!pile && !dam) continue;
          const S = BUILD[b.kind], half = S.half * H, dx = (f.x - ring.x) / half;
          if (Math.abs(dx) >= 1) continue;
          lift = Math.max(lift, S.tall * k * (1 - dx * dx));
          slow = BUILD.woodpile.slow;
          f.winded = time + BUILD.woodpile.after;
          if (pile && b.burning && playing && !f.turned) hurt(f, BUILD.woodpile.melt * dt);
        }
        if (f.dead) continue;
        if (f.winded > time) slow = BUILD.woodpile.slow;
        f.lift = lift;
        if (playing && !f.rise && !f.held && !f.fighting) {
          const step = f.speed * slow * H * dt;
          f.x += f.dir * step;
          f.phase += step / (K.stride * K.tall * k) * TAU;
        }
        f.y = groundAt(f.x) - lift - 0.5 * K.tall * k;
        // Melting, it drips and steams
        if (f.heat > 0.1 && Math.random() < dt * 6) drips.push({ x: f.x + (Math.random() - 0.5) * f.r, y: f.y, vy: 0, floor: groundAt(f.x) });
        if (f.heat > 0.1 && Math.random() < dt * 2) steam.push({ x: f.x, y: f.y - f.r, r: f.r * 0.6, vx: 0, age: 0, life: 0.6 });
        // A sapper ices over the first lantern it comes to, and a soldier won over goes home to the trees
        if (f.kind === 'sapper' && playing) {
          for (const ring of rings) {
            const b = ring.building;
            if (b && b.kind === 'lantern' && !b.iced && Math.abs(f.x - ring.x) < 0.05 * H) { iceOver(ring, f); break; }
          }
          if (f.dead) continue;
        }
        if (f.turned) {
          if (f.dir < 0 ? f.x < entryX() - 0.12 * H : f.x > rightEntry + 0.12 * H) f.dead = true;
          continue;
        }
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
          nextStar = lerp(STAR_EVERY[0], STAR_EVERY[1], Math.random()) / (tonight.shower ? SHOWER_STARS : 1);
        }
      }
      for (let i = skyStars.length - 1; i >= 0; i--) {
        const st = skyStars[i];
        if (st.caught) {
          const c = st.caught;
          c.t += dt / 0.6;
          if (c.t >= 1) {
            const S = STARS[st.which];
            if (c.ring && c.ring.building && c.ring.building.kind === 'lantern') {
              c.ring.building.star = st.which;
              c.ring.building.at = time;
              sparkle(c.ring.x, lampAt(c.ring).y);
              pop(c.ring.x, c.ring.y - 0.3 * H, `A ${S.named} star: ${POWER_SAYS[S.power]}`, `rgb(${S.color})`);
              sfx.starlit();
              checkDipper();
            } else if (c.hero && hero) {
              // Worn by your animal, in place of a cooler one if it already wears as many as it can
              if (hero.gems.length < GEM_SLOTS) hero.gems.push(st.which);
              else {
                const coolest = hero.gems.reduce((low, g, n) => (STARS[g].heat < STARS[hero.gems[low]].heat ? n : low), 0);
                if (S.heat > STARS[hero.gems[coolest]].heat) hero.gems[coolest] = st.which;
              }
              pop(hero.x, hero.y - 0.25 * H, `A ${S.named} star: ${POWER_SAYS[S.power]}`, `rgb(${S.color})`);
              sparkle(hero.x, hero.y);
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
        // Your animal catches one that's coming down near it
        if (st.t > 0.8 && hero && hero.up && Math.abs(hero.x - st.x) <= hero.def.catch * H) { heroCatch(st); continue; }
        if (st.t >= 1) st.gone = dt;
      }
      // Stars called down, landing
      for (let i = strikes.length - 1; i >= 0; i--) {
        const st = strikes[i];
        st.t += dt / CALL_FALL;
        if (st.t >= 1) { strikes.splice(i, 1); if (playing) impact(st); }
      }
      for (let i = blasts.length - 1; i >= 0; i--) { blasts[i].age += dt; if (blasts[i].age >= blasts[i].life) blasts.splice(i, 1); }
      // Floods running toward the forest, washing back what they meet
      for (let i = floods.length - 1; i >= 0; i--) {
        const w = floods[i], go = FLOOD_SPEED * H * dt;
        w.x -= go;
        w.left -= go;
        if (playing) {
          for (const f of [...foes]) {
            if (f.dead || f.flies || f.turned || f.wash || f.washed === w.id || Math.abs(f.x - w.x) > 0.07 * H + go) continue;
            f.washed = w.id;
            hurt(f, FLOOD_HIT, null, 'flood');
            if (f.dead) continue;
            f.wash = { to: Math.max(entryX(), f.x - (f === king ? FLOOD_KING : FLOOD_PUSH) * H) };
            spray(f.x, f.y, 4, '190,220,255');
          }
        }
        if (Math.random() < dt * 40) spray(w.x, groundAt(w.x) - 2, 1, '190,220,255');
        if (w.left <= 0 || w.x < 0) floods.splice(i, 1);
      }
      // Beavers running out to free an iced lantern, and home again
      for (let i = couriers.length - 1; i >= 0; i--) {
        const c = couriers[i], lodge = c.home.building, b = c.to.building;
        if (!lodge || lodge.kind !== 'lodge') { couriers.splice(i, 1); if (b && b.beaver) b.beaver = false; continue; }
        if (!playing) continue;
        const stillIced = b && b.kind === 'lantern' && b.iced;
        if (c.going && !stillIced) c.going = false;
        const goal = c.going ? c.to.x : c.home.x, left = goal - c.x;
        if (Math.abs(left) > 1) {
          const go = Math.min(Math.abs(left), BEAVER_RUN * H * dt);
          c.x += Math.sign(left) * go;
          c.face = Math.sign(left);
          c.step += dt * 14;
        } else if (c.going) {
          c.wait += dt;
          if (c.wait >= THAW_TIME) { freeLantern(c.to); c.going = false; }
        } else {
          lodge.away = false;
          couriers.splice(i, 1);
        }
      }
      // The aurora coming down, and the Big Dipper answering
      if (auroraFx) {
        auroraFx.age += dt;
        if (!auroraFx.hit && auroraFx.age >= AURORA_STRIKE) {
          auroraFx.hit = true;
          for (const f of [...foes]) {
            if (f.dead || f.turned) continue;
            hurt(f, f === king ? AURORA_KING * f.max : AURORA_HIT * toughNow(), null, 'aurora');
            if (!f.dead) f.winded = Math.max(f.winded || 0, time + AURORA_WINDED);
          }
        }
        if (auroraFx.age > AURORA_SHOW) auroraFx = null;
      }
      if (dipperFx) {
        dipperFx.age += dt;
        if (!dipperFx.hit && dipperFx.age >= DIPPER_AT) {
          dipperFx.hit = true;
          points += DIPPER_POINTS;
          pop(W / 2, 0.5 * H, `The Big Dipper blazes! +${number(DIPPER_POINTS)}`, GOLD);
          for (const f of [...foes]) if (!f.dead && !f.turned) hurt(f, f === king ? DIPPER_KING * f.max : DIPPER_HIT * toughNow(), null, 'dipper');
          showScore();
        }
        if (dipperFx.age > DIPPER_SHOW) dipperFx = null;
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
        ctx.arc(lamp.x, lamp.y, BUILD.lantern.levels[level].reach * H * moonReach, 0, TAU);
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
      ctx.fillStyle = b.iced ? '#2A3A66' : b.star != null ? `rgb(${STARS[b.star].color})` : '#FFE7B0';
      ctx.fillRect(lamp.x - gw / 2, lamp.y - gh, gw, gh);
      if (b.iced) {
        ctx.globalAlpha = A * 0.9;
        ctx.fillStyle = 'rgb(206,232,255)';
        ctx.beginPath();
        ctx.moveTo(lamp.x - gw / 2 - 2.4 * k, lamp.y + 1.4 * k);
        ctx.lineTo(lamp.x - gw / 2 - 1.2 * k, lamp.y - gh - 2.4 * k);
        ctx.lineTo(lamp.x + 0.6 * k, lamp.y - gh - 3.4 * k);
        ctx.lineTo(lamp.x + gw / 2 + 1.8 * k, lamp.y - gh - 1.8 * k);
        ctx.lineTo(lamp.x + gw / 2 + 2.6 * k, lamp.y + 1.6 * k);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgb(140,180,235)';
        ctx.fillRect(lamp.x - gw / 2, lamp.y - gh * 0.8, gw, gh * 0.55);
      }
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
    // A beavers' lodge, a mound of sticks. Gnawing, it has a log beside it that shrinks and is replaced, its beaver at it unless the
    // army is near, and the wood it's brought so far stacked up on the other side. Damming, the logs are across the path, with
    // the pond rising behind them.
    const drawLodge = (ring, b, A) => {
      const x = ring.x, y = ring.y, [x0, y0, x1, y1] = BEAVER_BOX;
      if (b.job === 'dam') {
        const half = BUILD.lodge.half * H, built = smooth(clamp(b.dam, 0, 1)), full = b.pond / POND_FULL;
        if (full > 0) {
          ctx.globalAlpha = A * (full >= 1 ? 0.75 + 0.2 * Math.sin(time * 6) : 0.65);
          ctx.fillStyle = 'rgb(112,160,232)';
          ctx.beginPath();
          ctx.ellipse(x + half + 0.05 * H, y + 0.5, (0.04 + 0.08 * full) * H, (1 + 2.2 * full) * k, 0, 0, TAU);
          ctx.fill();
        }
        ctx.globalAlpha = A;
        ctx.fillStyle = '#4A3322';
        ctx.fillRect(x - half * built, y - 5 * k * built, 2 * half * built, 5 * k * built + 0.5);
        ctx.fillStyle = '#7A5530';
        for (let i = 0; i < 5; i++) {
          const lx = x - half * built + (i + 0.5) * 2 * half * built / 5;
          ctx.beginPath();
          ctx.ellipse(lx, y - 1.5 * k * built, 1.4 * k, 1.2 * k * built, 0, 0, TAU);
          ctx.ellipse(lx + k, y - 3.8 * k * built, 1.3 * k, 1.1 * k * built, 0, 0, TAU);
          ctx.fill();
        }
      }
      ctx.globalAlpha = A;
      ctx.fillStyle = '#2E2016';
      ctx.beginPath();
      ctx.moveTo(x - 7 * k, y + 0.5);
      ctx.quadraticCurveTo(x - 4 * k, y - 8.6 * k, x + k, y - 8.2 * k);
      ctx.quadraticCurveTo(x + 6 * k, y - 7.2 * k, x + 7.5 * k, y + 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#7A5530';
      ctx.lineWidth = Math.max(0.7, 0.8 * k);
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (const [a, c, d, e] of [[-6, -1, -1, -7], [-3, -6.4, 3, -5], [-5, -3.4, 2, -1.2], [5.8, -1, 0, -7.4], [-1, -3.6, 5, -2]]) {
        ctx.moveTo(x + a * k, y + c * k);
        ctx.lineTo(x + d * k, y + e * k);
      }
      ctx.stroke();
      if (b.job !== 'gnaw') return;
      const eaten = (b.chew % 7) / 7, logAt = x + 16 * k, len = (6.5 - 4 * eaten) * k;
      ctx.fillStyle = '#5A3D22';
      ctx.beginPath();
      ctx.ellipse(logAt, y - 1.7 * k, len, 1.8 * k, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#9C7448';
      ctx.beginPath();
      ctx.ellipse(logAt - len + 0.6 * k, y - 1.7 * k, 1.1 * k, 1.6 * k, 0, 0, TAU);
      ctx.fill();
      if (!b.scared && !b.away) {
        ctx.save();
        ctx.translate(logAt - len - 7.5 * k, y + 0.5);
        ctx.drawImage(beaverFrames[Math.floor(time * 11) % WALK_FRAMES], x0 * k, y0 * k, (x1 - x0) * k, (y1 - y0) * k);
        ctx.restore();
      }
      // The wood brought so far, and a warm glint when there's some to bring in
      const logs = Math.min(4, Math.ceil(b.pile / (PILE_MAX / 4)));
      ctx.fillStyle = '#6B4A28';
      for (let i = 0; i < logs; i++) {
        const lx = x - 11.5 * k + (i < 3 ? i * 2.5 * k : 2.5 * k), ly = y - 1.4 * k - (i < 3 ? 0 : 2.5 * k);
        ctx.beginPath();
        ctx.arc(lx, ly, 1.35 * k, 0, TAU);
        ctx.fill();
      }
      if (b.pile >= 1) {
        ctx.globalCompositeOperation = 'lighter';
        glowAt(look.pool, x - 9 * k, y - 2 * k, 0.05 * H, A * (b.pile >= PILE_MAX ? 0.75 + 0.2 * Math.sin(time * 6) : 0.35));
        ctx.globalCompositeOperation = 'source-over';
      }
    };
    // The warm ground, from the cabin out to where its warmth has reached
    const drawWarmGround = (A) => {
      if (A <= 0) return;
      const left = Math.max(0, middle.x - warmEdge * H), right = Math.min(W, middle.x + Math.min(warmEdge, RIGHT_FIRST + RIGHT_GAP + 0.2) * H);
      const span = Math.max(1, right - left), s = Math.min(0.4, 0.14 * H / span), heat = ctx.createLinearGradient(left, 0, right, 0);
      heat.addColorStop(0, 'rgba(255,176,100,0)');
      heat.addColorStop(s, 'rgba(255,176,100,.42)');
      heat.addColorStop(1 - s, 'rgba(255,176,100,.42)');
      heat.addColorStop(1, 'rgba(255,176,100,0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = A * 0.5;
      ctx.strokeStyle = heat;
      ctx.lineWidth = Math.max(2.5, 4 * k);
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let x = left; ; x += 10) {
        const px = Math.min(x, right), y = groundAt(px) + 1.5;
        if (x === left) ctx.moveTo(px, y); else ctx.lineTo(px, y);
        if (px >= right) break;
      }
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    };
    // What's been added to the cabin, drawn onto it: a workshop's lean-to on the gable end, a mill wheel by the wall, a telescope
    // on the roof, and a taller chimney for each bigger hearth
    const drawAdditions = (A) => {
      if (A <= 0 || (!wingCount && !hearthLevel)) return;
      const unit = CABIN.k * k;
      ctx.globalAlpha = A;
      ctx.lineCap = 'round';
      if (wings.workshop) {
        poly([[14, 0.6], [14, -8.8], [24.5, -5.4], [24.5, 0.6]]);
        ctx.closePath();
        ctx.fillStyle = '#0E1430';
        ctx.fill();
        poly([[13.2, -9.6], [25.5, -5.6], [25.5, -4.3], [13.2, -8.2]]);
        ctx.closePath();
        ctx.fillStyle = '#05091E';
        ctx.fill();
        const glass = onCabinAt(17.6, -4.4);
        ctx.fillStyle = `rgba(255,196,120,${(0.72 + 0.2 * Math.sin(time * 6)).toFixed(2)})`;
        ctx.fillRect(glass.x, glass.y, 3.2 * unit, 2.4 * unit);
        const pipe = onCabinAt(21, -6.4), tip = onCabinAt(21, -11.2);
        ctx.strokeStyle = '#3B3F4E';
        ctx.lineWidth = Math.max(1, 1.1 * unit);
        ctx.beginPath();
        ctx.moveTo(pipe.x, pipe.y);
        ctx.lineTo(tip.x, tip.y);
        ctx.stroke();
      }
      if (wings.mill) {
        const hub = onCabinAt(-18, -4.6), r = 4.8 * unit;
        ctx.strokeStyle = '#6B4A28';
        ctx.lineWidth = Math.max(1, 0.9 * unit);
        ctx.beginPath();
        ctx.arc(hub.x, hub.y, r, 0, TAU);
        for (let i = 0; i < 4; i++) {
          const a = time * 0.7 + i * Math.PI / 4;
          ctx.moveTo(hub.x - Math.cos(a) * r, hub.y - Math.sin(a) * r);
          ctx.lineTo(hub.x + Math.cos(a) * r, hub.y + Math.sin(a) * r);
        }
        ctx.stroke();
      }
      if (wings.telescope) {
        const foot = onCabinAt(2.2, -15.2), mid = onCabinAt(2.6, -18.6), low = onCabinAt(-1.8, -16.4), high = onCabinAt(7.6, -23.4);
        ctx.strokeStyle = '#6B5A3A';
        ctx.lineWidth = Math.max(0.8, 0.6 * unit);
        ctx.beginPath();
        ctx.moveTo(foot.x - 2 * unit, foot.y);
        ctx.lineTo(mid.x, mid.y);
        ctx.lineTo(foot.x + 2.4 * unit, foot.y);
        ctx.stroke();
        ctx.strokeStyle = '#D9C69A';
        ctx.lineWidth = Math.max(1.4, 1.5 * unit);
        ctx.beginPath();
        ctx.moveTo(low.x, low.y);
        ctx.lineTo(high.x, high.y);
        ctx.stroke();
        ctx.globalCompositeOperation = 'lighter';
        glowAt(look.glow, high.x, high.y, 3.4 * unit, A * (0.5 + 0.25 * Math.sin(time * 3)));
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = A;
      }
      if (hearthLevel) {
        const top = CHIMNEY[1] - hearthLevel * 2.4;
        poly([[-10.4, CHIMNEY[1] + 2], [-10.4, top], [-6.8, top], [-6.8, CHIMNEY[1] + 2]]);
        ctx.closePath();
        ctx.fillStyle = '#2A2E44';
        ctx.fill();
        poly([[-11, top], [-11, top - 1.1], [-6.2, top - 1.1], [-6.2, top]]);
        ctx.closePath();
        ctx.fillStyle = '#3B3F4E';
        ctx.fill();
      }
    };
    // A flood running along the ridge toward the forest, a crest of foam ahead of it
    const drawFloods = (A) => {
      for (const w of floods) {
        const tail = Math.min(w.from, w.x + 0.9 * H), water = ctx.createLinearGradient(w.x, 0, Math.max(tail, w.x + 1), 0);
        water.addColorStop(0, 'rgba(206,232,255,.95)');
        water.addColorStop(0.2, 'rgba(130,175,240,.8)');
        water.addColorStop(1, 'rgba(110,160,235,0)');
        ctx.globalAlpha = A;
        ctx.strokeStyle = water;
        ctx.lineWidth = 6 * k;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let x = w.x; ; x += 8) {
          const px = Math.min(x, tail), y = groundAt(px) - 1.5 * k;
          if (x === w.x) ctx.moveTo(px, y); else ctx.lineTo(px, y);
          if (px >= tail) break;
        }
        ctx.stroke();
        ctx.fillStyle = 'rgb(232,244,255)';
        ctx.beginPath();
        ctx.ellipse(w.x, groundAt(w.x) - 4 * k, 3.4 * k, 4.4 * k, 0, 0, TAU);
        ctx.fill();
      }
    };
    const drawCouriers = (A) => {
      const [x0, y0, x1, y1] = BEAVER_BOX;
      for (const c of couriers) {
        ctx.save();
        ctx.translate(c.x, groundAt(c.x) + 0.5);
        ctx.scale(c.face, 1);
        ctx.globalAlpha = A;
        ctx.drawImage(beaverFrames[Math.floor(c.step) % WALK_FRAMES], x0 * k, y0 * k, (x1 - x0) * k, (y1 - y0) * k);
        ctx.restore();
      }
    };
    // Your animal, the stars it wears, its shell if it's pulled in, and how much it can still take
    const drawHero = (A) => {
      if (!hero || !hero.up) return;
      const D = hero.def, gy = groundAt(hero.x) + 0.5, [x0, y0, x1, y1] = D.box, shown = A * clamp((time - hero.born) / 0.5, 0, 1);
      if (shown <= 0.01) return;
      const flip = hero.kind === 'crab' ? 1 : hero.face;
      ctx.globalCompositeOperation = 'lighter';
      glowAt(look.heroes[hero.kind], hero.x, hero.y, D.tall * k * 1.5, shown * 0.6);
      if (hero.aim && !hero.aim.dead) {
        ctx.globalAlpha = shown * 0.55;
        ctx.strokeStyle = `rgb(${D.glow})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(hero.x, hero.y);
        ctx.lineTo(hero.aim.x, hero.aim.y);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.save();
      ctx.translate(hero.x, gy);
      ctx.scale(flip, 1);
      ctx.globalAlpha = shown;
      ctx.drawImage(heroFrames[((Math.floor(hero.phase / TAU * WALK_FRAMES) % WALK_FRAMES) + WALK_FRAMES) % WALK_FRAMES], x0 * k, y0 * k, (x1 - x0) * k, (y1 - y0) * k);
      ctx.restore();
      ctx.globalCompositeOperation = 'lighter';
      hero.gems.forEach((g, i) => glowAt(look.stars[g], hero.x + flip * D.gems[i][0] * k, gy + D.gems[i][1] * k, 5.5 * k * (0.9 + 0.15 * Math.sin(time * 5 + i)), shown));
      ctx.globalCompositeOperation = 'source-over';
      if (time < hero.shellUntil) {
        ctx.globalAlpha = shown * 0.8;
        ctx.strokeStyle = 'rgb(168,245,230)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(hero.x, gy, 18 * k, 15 * k, 0, Math.PI, TAU);
        ctx.stroke();
      }
      const left = clamp(hero.hp / heroMaxHp(), 0, 1);
      if (left < 0.995) {
        const w = 0.15 * H, y = gy + y0 * k - 5;
        ctx.globalAlpha = shown * 0.85;
        ctx.fillStyle = 'rgba(6,13,38,.7)';
        ctx.fillRect(hero.x - w / 2, y, w, 2.5);
        ctx.fillStyle = `rgb(${D.glow})`;
        ctx.fillRect(hero.x - w / 2, y, w * left, 2.5);
      }
    };
    // In the sky: stars called down, what they and your animal set off, the aurora coming down and the Big Dipper answering
    const drawSkyFx = (A) => {
      for (const st of strikes) {
        const S = STARS[st.which], t = clamp(st.t, 0, 1), y = lerp(st.y0, st.y1, t * t), tail = ctx.createLinearGradient(0, y, 0, y - 0.5 * H);
        tail.addColorStop(0, `rgba(${S.color},.85)`);
        tail.addColorStop(1, `rgba(${S.color},0)`);
        ctx.globalAlpha = A;
        ctx.strokeStyle = tail;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(st.x, y);
        ctx.lineTo(st.x, y - 0.5 * H);
        ctx.stroke();
        glowAt(look.stars[st.which], st.x, y, 10 * k, A);
      }
      for (const b of blasts) {
        const t = b.age / b.life;
        ctx.globalAlpha = A * (1 - t);
        ctx.strokeStyle = `rgba(${b.color},.85)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, b.reach * (0.3 + 0.7 * t), b.reach * 0.32 * (0.3 + 0.7 * t), 0, 0, TAU);
        ctx.stroke();
      }
      if (auroraFx) {
        const envelope = Math.sin(Math.PI * clamp(auroraFx.age / AURORA_SHOW, 0, 1)), bottom = H * smooth(clamp(auroraFx.age / AURORA_STRIKE, 0, 1)), step = Math.max(8, 0.07 * H), wide = 0.34 * H;
        for (let x = -wide, n = 0; x < W + wide; x += step, n += 1) {
          ctx.globalAlpha = Math.max(0, A * envelope * (0.14 + 0.1 * Math.sin(n * 1.3 + time * 5) + 0.08 * Math.sin(n * 0.37 - time * 3)));
          ctx.drawImage(look.curtain, x, 0, wide, bottom);
        }
      }
      if (dipperFx && dipperFx.stars.length) {
        const { age, stars, lamps, order } = dipperFx, show = clamp(age / 0.6, 0, 1) * clamp((DIPPER_SHOW - age) / 0.6, 0, 1);
        ctx.globalAlpha = A * show;
        ctx.strokeStyle = 'rgb(255,236,184)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (const [a, b] of DIPPER_LINES) { ctx.moveTo(stars[a].x, stars[a].y); ctx.lineTo(stars[b].x, stars[b].y); }
        ctx.stroke();
        stars.forEach((s) => glowAt(look.glow, s.x, s.y, 16 * k, A * show));
        order.forEach((which, i) => {
          const s = stars[which], lamp = lampAt(lamps[i]), run = (age - 0.35 - i * 0.12) / 0.5;
          if (run <= 0) return;
          const along = Math.min(1, run);
          ctx.globalAlpha = A * show * along;
          ctx.strokeStyle = 'rgba(255,226,170,.7)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(lerp(s.x, lamp.x, along), lerp(s.y, lamp.y, along));
          ctx.stroke();
        });
      }
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
      glowAt(f.turned ? look.warmEyes : look.eyes, f.x + f.dir * F.eyes[0] * k * wide, gy + F.eyes[1] * k * tall, (f.kind === 'king' ? 5.6 : f.kind === 'brute' ? 4.4 : 3.6) * k, shown * (0.8 + 0.2 * Math.sin(time * 5 + f.seed)));
      ctx.globalCompositeOperation = 'source-over';
      // A soldier won over wears a scarf, its end blowing out behind
      if (f.turned) {
        const nx = f.x + f.dir * 0.9 * k, ny = gy - 11.6 * k * tall;
        ctx.globalAlpha = shown;
        ctx.strokeStyle = '#E8644A';
        ctx.lineCap = 'round';
        ctx.lineWidth = Math.max(1.2, 1.6 * k);
        ctx.beginPath();
        ctx.moveTo(nx - f.dir * 2.6 * k, ny);
        ctx.lineTo(nx + f.dir * 2.6 * k, ny);
        ctx.moveTo(nx - f.dir * 2.2 * k, ny);
        ctx.quadraticCurveTo(nx - f.dir * 5 * k, ny + (0.6 + Math.sin(time * 9 + f.seed)) * k, nx - f.dir * 7.4 * k, ny + (1.4 + 1.2 * Math.sin(time * 7 + f.seed)) * k);
        ctx.stroke();
      }
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
      const A = fieldAlpha, chosen = (menuFor && menuFor.x != null && menuFor) || (hover && hover.ring);
      drawWarmGround(A);
      // The spots still free, faint on the ground: warm where the cabin's warmth has reached and frosted beyond, so you can see what's
      // to come; the smaller spots once the cabin has what they take, and the right side's from January
      for (const ring of rings) {
        if (ring.building || !inSeason(ring)) continue;
        const on = chosen === ring, cold = !warm(ring), rx = (ring.side === 'left' || ring.side === 'right' ? 0.07 : 0.05) * H, ry = rx * 0.3;
        ctx.globalAlpha = A * (on ? 0.85 : cold ? 0.18 : 0.45);
        ctx.strokeStyle = on ? 'rgb(255,226,180)' : cold ? 'rgb(170,196,240)' : 'rgb(255,222,176)';
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
        if (!b || b.kind === 'woodshed' || b.kind === 'lodge' || b.iced || (b.kind === 'woodpile' && !b.burning)) continue;
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
        else if (b.kind === 'lodge') drawLodge(ring, b, A);
        else drawWoodshed(ring, b, A);
      }
      drawAdditions(A);
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
      drawFloods(A);
      drawCouriers(A);
      drawHero(A);
      // Stars falling toward the clearing, each a glow in its color with a faint tail behind it, and caught ones flying to their
      // lanterns
      ctx.globalCompositeOperation = 'lighter';
      for (const st of skyStars) {
        const S = STARS[st.which];
        if (st.caught) {
          const c = st.caught, to = c.ring ? lampAt(c.ring) : c.hero && hero ? hero : { x: c.x, y: c.y - 0.3 * H }, t = smooth(clamp(c.t, 0, 1));
          const x = lerp(c.x, to.x, t), y = lerp(c.y, to.y, t) - Math.sin(Math.PI * t) * 0.12 * H;
          glowAt(look.stars[st.which], x, y, 4.5 * k * (1 - 0.3 * t), A * (c.ring || c.hero ? 1 : 1 - t));
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
        if (b.kind === 'lantern' && b.iced) continue;
        if (b.kind === 'lantern') {
          const lamp = lampAt(ring);
          if (b.second && !b.second.dead && A > 0) {
            ctx.globalAlpha = A * f * 0.7;
            ctx.strokeStyle = 'rgba(255,214,150,.6)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(lamp.x, lamp.y - 2 * k);
            ctx.lineTo(b.second.x, b.second.y);
            ctx.stroke();
          }
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
          glowAt(look.glow, lamp.x, lamp.y - 2.5 * k, (9.5 + 3.5 * b.level) * k * (1 + 0.5 * clamp(stokeAt + STOKE_GLOW - time, 0, 1)), A * 0.9 * f);
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
      drawSkyFx(A);
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
        if (hover.cabin && phase === 'breather') label('Add to the cabin', middle.x, middle.y - cabinHit - 8, 'rgb(255,226,190)');
        else if (hover.cabin && phase !== 'open' && time - stokeAt > 1.2) {
          const wait = Math.ceil(stokeAt + STOKE_EVERY - time);
          label(wait > 0 ? `Stoke again in ${wait} s` : 'Stoke the fire', middle.x, middle.y - cabinHit - 8, 'rgb(255,226,190)');
        } else if (hover.cold) {
          label('Too cold to build here yet', hover.cold.x, hover.cold.y - 0.3 * H, 'rgb(206,226,255)');
        } else if (hover.ring && hover.ring.building && hover.ring.building.iced) {
          label(`${press} to free it`, hover.ring.x, hover.ring.y - 0.3 * H, 'rgb(206,226,255)');
        } else if (hover.ring && hover.ring.building && hover.ring.building.kind === 'lodge') {
          const b = hover.ring.building;
          if (b.job === 'gnaw' && b.pile >= 1) label(`${press} to bring in ${Math.floor(b.pile)} wood`, hover.ring.x, hover.ring.y - 0.3 * H, 'rgb(255,226,190)');
          else if (b.job === 'dam' && b.pond >= POND_FULL) label(`${press} to open the dam`, hover.ring.x, hover.ring.y - 0.3 * H, 'rgb(190,220,255)');
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
      if (paused) label(touchOnly ? 'Paused' : 'Paused. Press P to go on', W / 2, H * 0.45, 'rgb(232,238,255)');
      ctx.globalAlpha = 1;
    };

    const frame = (now) => {
      if (!running) return;
      const b = banner.getBoundingClientRect();
      if (Math.abs(b.width - W) > 0.5) { ending = ending || 'gone'; cleanup(); return; }
      if (document.hidden || b.bottom < 0) {
        if (ending) { cleanup(); return; }
        setPaused(true);
      } else if (!heldPause) setPaused(false);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!paused) {
        update(dt);
        if (!running) return;
        draw();
      } else if (heldPause) draw();
      requestAnimationFrame(frame);
    };
    // The opening: who comes to help, if more than one animal has been brought home, and the cabin's first addition
    if (!unlockedAnimals().length) makeHero('bear');
    openFirst();
    current = { leave };
    requestAnimationFrame((now) => { last = now; frame(now); });
  };

  window.auroraCabin = { start, stop: () => current && current.leave('quit') };
})();

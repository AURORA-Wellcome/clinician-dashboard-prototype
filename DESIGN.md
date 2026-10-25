# AURORA dashboard design rules

The rules every mockup screen follows. Give this file, and the reference screenshots, to any person or AI model working on the design, at the start of every session.

**Status:** draft for clinician working group (CWG) review. Checked against the clinical planning notes (`Notes/Clinical/`) on 2026-10-23. Applied in `AURORA Dashboard v2.dc.html` on 2026-10-24, after an independent review. The section styles (Plain or Distinct) were added the same day for the CWG to compare. The type rules (principle 9 and Type) followed a review of published usability guidance, also on 2026-10-24. v3, which applies the theoretical model, was added the same day; its differences are in the v3 section.

## Principles

1. **One question per page.**
   - **Caseload:** *which of my patients need attention, and in what order?*
   - **Patient page:** *how is this patient doing, and what has changed?* This page merges v1's patient detail and session prep, following the group's "one simple page" (16 July). It prints as the session brief.
   - **Patient handout:** *what would the patient want to know?* Plain language, no model internals.
   - Anything that doesn't serve the page's question moves elsewhere.
2. **Say it once.** Units, scales and rules appear once per page, in an ⓘ tooltip or the footer, never on each row or header. AI labelling is the exception and follows the source rule under Components.
3. **Colour means status, nothing else.** All data is in neutral ink. Colour appears only for:
   - the four statuses (safety flag, worse than baseline, stable or better, too few check-ins);
   - a change of 5 or more points from the patient's baseline.
   
   Decorative or "category" colour is not allowed. Faint tints of the status colours may mark a status group or a flagged tile (see Section styles). The neutral `tint` is a surface, not a colour cue.
4. **Whitespace before borders.** Separate things with space and alignment. Panels hold groups of content; no bordered chips or pills anywhere.
5. **Status is always triple-encoded** as shape + colour + word: ■ Safety flag, ▲ Worse than baseline, ● Stable or better, ◐ Too few check-ins. This survives colour blindness and greyscale printing. Every shape must differ: v1's octagon for crisis looked like a circle at 10 px.
6. **Safety flags lead, but the dashboard is not a crisis channel.**
   - Under the safety design agreed on 19 October, the study team reviews AI-detected risk and emails the clinician if it is urgent. Risk information doesn't reach the treating clinician in real time (13 August).
   - Safety flags come first: first group in the caseload, first tile on the patient page.
   - They are dated and in the `safety` colour, and they say who has or hasn't reviewed them.
   - Never imply that no email means safe: PHQ-9 item 9 answers arrive without study-team review.
   - No banners, pop-ups or Respond buttons.
7. **Show detail on demand.** Overview rows show the few things needed to decide. Explanation lives in ⓘ, hover, or the next page: the drill-down clinicians asked for (16 July).
8. **Describe; suggest only softly and on demand.**
   - Say what changed ("What changed", "Worse than baseline", "Few check-ins").
   - Never tell clinicians which technique or treatment to use ("Act now", "Next step: assess adherence", "Switch medication").
   - The source is clinical planning, 16 July:
     - Clinicians "don't want to be told what to do", but naming an issue as one that "might be worth addressing" is acceptable.
     - The study team proposed recommendations with a "why" the clinician can open, audit and disagree with, and suggested exploring with clinicians how far recommendations should go.
   - The theoretical model includes a clinical support layer ("recommended next steps"), so how far to go is an open question for the working group (bead aurora-04b).
   - *Corrected 2026-10-24:* an earlier version of this principle also banned "Worth discussing", which goes further than the 16 July discussion did.
9. **Readable at arm's length, at a glance.** Size text for the oldest clinician who will use the dashboard, glancing at a laptop between sessions, and for the patient reading the handout. Usability guidance agrees: Nielsen Norman Group says to "use a reasonably large default font size and allow users to change the font size", because what counts as tiny grows with age.
   - Body text is 17 px. Nothing on screen is smaller than 15 px, and 15 px is only for text a clinician can skip.
   - Safety wording is never in the smallest size.
   - When something doesn't fit, cut words rather than shrink the text, on screen and on paper.
   - Clinicians can enlarge the text: sizes are in rem, and the pages still work at 200% zoom.
   - The sizes, and where they come from, are under Type.

## Word budget

Interface words are labels, headers, notes and buttons, not patient data.

| Page | Interface words, max |
|---|---|
| Caseload | 40 |
| Patient page | 80 |
| Patient handout | Plain language for the patient; no limit, no model internals |

- **Flag text:** at most 4 words, starting with the signal: "Few check-ins", "Reports stopping sertraline (AI)", "PHQ-9 item 9 = 2".
- **Note after the flag:** a muted note after "·" may add time or review status ("· not reviewed · Aug 10").
- **When text doesn't fit,** cut words; don't shrink the text below the sizes under Type.

## Tokens

Use these and nothing else. Any new value has to be added here first.

**Type.** Typeface: **Source Sans 3**, with a system-ui fallback. It has an open licence and tabular figures. Self-host it in production.

Source Sans 3 runs small: its x-height is 0.49 of the font size, against 0.52 for Arial, and the US Web Design System (USWDS) scales it up by 1.06 to match other typefaces. The sizes below allow for this; if the typeface changes, re-derive them from its x-height. Sizes are set in rem (1 rem is 16 px by default), so a clinician's browser text-size setting applies.

| Token | Screen size / line height | Print (session brief) | Weight | Use |
|---|---|---|---|---|
| `text-sm` | 15 / 21 px (0.9375 rem) | 9 / 12 pt | 400, 600 | text a clinician can skip: column headers, sources, dates, chart key; nothing smaller |
| `text-md` | 17 / 24 px (1.0625 rem) | 10 / 13.5 pt | 400, 600 | body, table cells, safety notes, footers |
| `text-lg` | 21 / 28 px (1.3125 rem) | 12 / 16 pt | 400, 600 | section titles, secondary tile values, handout text |
| `text-xl` | 32 / 40 px (2 rem) | 18 / 22 pt | 600 | page title; the one hero number per page (the severity estimate) |

- **Chart text** scales with the chart, so its size is set per window width to stay at about 15–17 px. It is set larger in narrow windows, so zooming in enlarges it. In print the chart runs the full page width rather than being squeezed, so its labels stay at 9 pt.
- **Print:** nothing on paper is below 8 pt. If the brief doesn't fit one page, cut content rather than shrink it.
- **Patient handout** prints in clear print, 14 pt body text (clear-print guidance asks for 12 pt minimum, 14 pt preferred), not on the brief's scale.
- **Line length:** prose runs to about 70 characters a line at most (USWDS: 45–90, aiming for 66). Footers are capped at 70 characters.
- **Narrow windows and zoom:** below 60 rem, caseload flags move to a second line, the tiles go 2 × 2 and the patient page is one column. Reflow down to 320 px (WCAG 1.4.10) is a production task.
- **Where the numbers come from:** USWDS asks for at least an effective 16 px for most text, about 17 px in Source Sans, and smaller sizes only "sparingly". GOV.UK and the NHS use 19 px body text and 16 px small text. Microsoft's Fluent uses 14 px for dense app screens. The EU minimum for medicine leaflets is 9 pt.
- **Earlier sizes:** v2 first used 13 / 15 / 19 / 30 px, printing at 7.9 / 9 / 10.5 / 16.5 pt, with chart labels at 6.7 pt and the handout at 10.5 pt. Half the patient page's words were at 13 px. These sizes stay behind the review strip's Text switch for comparison.

Two weights only, 400 and 600. Numbers always use `font-variant-numeric: tabular-nums`.

**Spacing.** 4, 8, 12, 16, 20, 24, 32, 40, 48 px. Table rows are 40 px. Page gutter is 24 px; the content column is at most 70 rem (1120 px) wide on every page.

**Shape.** Radius 6 px for panels and buttons; no other radii. One hairline border colour. No shadows except on popovers. The 3 px status edge (see Section styles) is a border, even where it is drawn as an inset.

**Colour.** Status hues come from the Okabe–Ito colour-blind-safe palette.

| Token | Value | Use |
|---|---|---|
| `ink` | `#1F2A33` | primary text, all data values |
| `ink-muted` | `#5B6B78` | secondary text (passes AA on white) |
| `line` | `#E3E7EA` | the only border / divider colour |
| `surface` | `#FFFFFF` | panels |
| `page` | `#F7F8FA` | background |
| `hover` | `#F2F5F7` | row and button hover |
| `accent` | `#0072B2` | links, buttons, focus ring |
| `safety` | `#C0271A` | safety flags only: marker and text (5.9:1 on white) |
| `worse` | `#D55E00` | worse-than-baseline marker, threshold line |
| `stable` | `#009E73` | stable-or-better marker |
| `nodata` | `#768692` | too-few-check-ins marker |
| `worse-text` | `#9C4400` | worse-than-baseline words, changes of +5 or more (AA on white) |
| `stable-text` | `#00795A` | stable-or-better words, changes of −5 or more (AA on white) |
| `nodata-text` | `#4C6272` | too-few-check-ins words (AA on white) |
| `ai-series` | `#C67F00` | AI estimate line in charts only, never text |
| `ai-band` | `rgba(198,127,0,.16)` | uncertainty band around the AI estimate |
| `line-strong` | `#C5CDD4` | chart axis, severity scale track, empty check-in dots; never a border |
| `tint` | `#EEF2F6` | neutral card behind the goals, and day headers in the caseload (distinct style) |
| `safety-tint` | `rgba(192,39,26,.06)` | flagged Safety tile, Safety flag group band |
| `worse-tint` | `rgba(213,94,0,.07)` | Worse than baseline group band |
| `nodata-tint` | `rgba(118,134,146,.09)` | Too few check-ins group band |
| `stable-tint` | `rgba(0,158,115,.07)` | Stable or better group band |
| `worse-zone` | `rgba(213,94,0,.06)` | chart shading above the deterioration line (baseline + 5 in v2, + 6 in v3) |
| `expected` | `rgba(91,107,120,.12)` | v3: expected range in the first 3 months of care (chart and key) |

The striped "Review controls" strip is scaffolding for reviewers. Its colours are exempt.

## Components

- **Status marker:** the shape in the status colour plus the word in its `-text` colour, with no box or background. The base hues (`worse`, `stable`, `nodata`) are for shapes and lines only, because they fail AA contrast as small text.
- **Change:** a signed number after the value ("21 +9"), measured from the patient's own baseline. It is coloured (`worse-text` or `stable-text`, weight 600) only when it is 5 or more points; otherwise muted. Don't use ▲▼ arrows: the triangle is already the worse-than-baseline status shape.
- **Uncertainty:** "± 4", or the clipped range ("range 22–27") when the interval runs past the 0–27 scale.
- **Caseload order:**
  - **By next visit** (the default): one group per day. Each day has a full-width header giving the full date ("Thursday, August 13"), "Today" or "Tomorrow" where it applies, and the number of visits; "Not scheduled" comes last. The date is in the header, so the rows show only the time, under the column heading "Time". Safety-flagged patients come first, in a Safety flag group pinned above the day headers; no day header covers those rows, so each gives the visit date above the time.
  - Day headers are neutral, because colour means status. In the distinct style they sit on the neutral `tint`, with no edge.
  - **Grouped by status:** Safety flag, Worse than baseline, Too few check-ins, Stable or better, with patients in visit order within each group.
- **Caseload columns:** the column you look patients up by comes first, then the rest in order of importance.
  - **Grouped by status:** Patient (with the status shape), Next visit (the order within each group), Severity, Check-ins, Flag.
  - **By next visit:** Time, Patient, Status, Severity, Check-ins, Flag. Time comes first, as in a day schedule. The Status column (shape and word) stands in for the status groups.
  - Severity and Check-ins sit together, because check-ins say how far to trust the estimate.
  - Flag is last: it is the longest column, and it is empty for stable patients, so a blank never splits a row.
  - Numbers line up by place value: severity, change and check-in counts sit in fixed-width, right-aligned slots. Dates and times are left-aligned.
- **Row peek:** resting the pointer on a caseload row for about 0.4 s, or reaching it with Tab, opens a card under the row (above it for the last three rows). It shows what the row can't:
  - a small trend over the same span as the patient page, using the chart's encodings: AI estimate and band, PHQ-9 dots, dotted baseline, dashed baseline + 5, and a zero line. It uses the full 0–27 scale, so cards compare across patients.
  - severity with its uncertainty and baseline;
  - the latest PHQ-9 with its date and band;
  - item 9 across all PHQ-9s, in `safety` when the latest answer is above 0;
  - what changed, up to three items.

  Behaviour:
  - Once a card is open, moving to another row switches it in about 0.1 s, and leaving the list closes it.
  - The card stays open while the pointer is on it, clicking it opens the patient, and Escape closes it.
  - Screen readers hear the card's contents when a row gets keyboard focus.
- **Rows are links:** Tab reaches each row, and Enter opens the patient.
- **Check-ins:** the count is always shown. Below 9 of 12 it is bold ink, not coloured, because colour is reserved for status.
- **Times:**
  - 12-hour by default ("2:00 PM"). Clinicians can switch to 24-hour ("14:00") under Time format in the account menu, under their name at top right; in production the choice is saved with their account.
  - Every clock time follows the setting: visits, safety reviews, sources.
  - Dates put the month first, US style: "Thu, Aug 13", or "Thu, Aug 13, 2:00 PM" with a time. A space that can't break joins the time to AM or PM.
  - The patient's own words are quoted as written ("waking at 4 am").
- **Buttons:**
  - Secondary actions (Print, Patient handout) are text buttons in `accent`, with no border.
  - A solid `accent` button is reserved for a page's single primary action; the current pages have none.
  - No outlined buttons.
  - Caseload rows have no action buttons: the whole row opens the patient.
- **Safety flag:**
  - It is the first tile on the patient page, with the marker and text in `safety`.
  - It is the first group in the caseload in either order: grouped by status, or pinned above the day headers by next visit.
  - It shows the criterion that raised it, its review status and the date: "Safety review: moderate risk · today 9:40 AM", "PHQ-9 item 9 = 2 · not reviewed · Aug 10". Clinicians want to know the thresholds behind an output (Rai et al. 2025, doi:10.2196/78757).
  - Its notes, such as review status, are `text-md`: safety wording is never in the smallest size.
  - The footer, also `text-md`, says that item 9 answers appear without study-team review.
  - The wording follows the IRB safety text.
- **AI label (source rule):** label AI-derived values at the smallest unit where the source is uniform:
  - once in the header of an all-AI column;
  - on each item where AI and non-AI items mix (flags, changes, chart events);
  - on each value where an AI estimate sits next to a measured score (patient page).
  
  Use quiet "(AI)" text, never a pill, plus one Model Facts link per page. *(Recommended; CWG/IRB to confirm.)*
- **Chart:**
  - The y axis is the PHQ-9 scale, 0–27, with numeric ticks. Don't label severity bands next to lines, because baseline lines then read as severity cut-offs.
  - The AI estimate is a line in `ai-series` with an `ai-band` uncertainty band. The patient's PHQ-9 answers are ink dots.
  - Each check-in's own estimate is a small, faint `ai-series` dot. The line is the smoothed estimate, which the status rules read, so one high or low reading doesn't change a patient's status. *(Mock data: the scatter follows the detection-latency simulation's assumptions, day-to-day change plus each reading's error, so most readings land within about 4 points of the line. To confirm with Deliberate AI and the WP3 idiographic study.)*
  - Baseline is dotted and baseline + 5 is dashed in `worse`, each labelled at the line end.
  - Item 9 answers are numbers under the PHQ-9 dates, in bold `safety` when above 0. Don't use badges.
  - Reported events are dashed verticals labelled with their source, e.g. "(AI)". The label sits right of the line, or left of it when it would run off the chart.
  - The time axis runs from when the patient joined, up to 12 weeks.
  - In the distinct style, the area above baseline + 5 is shaded in `worse-zone`.
  - **Hover readout:** it moves one day at a time. Pointing anywhere over the chart shows a guide line, a ring on the trend line (and on the dot, on a PHQ-9 day), and a small card:
    - the date;
    - the AI estimate with its uncertainty, read off the trend line;
    - whether that day's check-in was completed (with that reading's own estimate), missed, or not scheduled;
    - on a PHQ-9 day, the PHQ-9 with its severity band (or "not completed"), and item 9, in `safety` when above 0;
    - any reported event that day.

    PHQ-9 and event days pull the pointer from one day either side, so the dots stay easy to hit.
  - Between the weekly estimates, the line and so the readout are interpolated. Whether AI-COA reports a smoothed estimate, one per check-in, or both is to confirm with Deliberate AI.
  - The card is a popover, so it may have a shadow, and its text is `text-sm`. It flips to the left of the guide line in the right part of the chart.
  - The readout also works from the keyboard:
    - Tab to the chart;
    - the arrow keys move a day, and Shift + arrow or Page Up/Page Down a week;
    - Home and End go to the ends, and Escape closes the card.

    Screen readers hear each day as it is chosen.
  - Hover only adds detail. Anything a clinician needs for safety stays visible without it: item 9 answers remain printed under the chart.
- **Icons:** one set, [Lucide](https://lucide.dev) (ISC licence): line icons with stroke 1.75, in `ink-muted`.
  - Size: 16 px, or 20 px in the patient handout.
  - Meaning: an icon says what kind of signal or goal something is:
    - medication (pill bottle)
    - sleep (moon)
    - activity (footprints)
    - work (briefcase)
    - exercise (dumbbell)
    - check-ins (speech bubble)
    - questionnaire (clipboard)
    - study-team safety review (shield)
    - scheduling (calendar)
  - Never use icons for urgency (the status shapes and colour do that), never colour them, and never show one alone. Each sits next to its text and is hidden from screen readers.
  - At most one icon per row or item.
  - Used in: caseload flags, "What changed" items (in a left gutter), chart events and goals.
  - No emoji, illustrations or decorative graphics.
  - The capsule "pill" icon was replaced by the pill bottle because at 16 px it read as a hyperlink symbol.
- **Discussed checkbox:** "Discussed AURORA data with the patient at this visit". This feeds the discussion-rate measure in the supervisor A&F playbook.
- **ⓘ tooltip:** the place for scales, thresholds and definitions. The page draws it; don't use the browser's `title` tooltip, which appears only after a delay and never by keyboard or touch.
  - The ⓘ is a button. Pointing at it, or reaching it with Tab, opens the tip at once.
  - A click or tap keeps the tip open, with the ⓘ in `ink`. A second click, Escape, or a click elsewhere closes it. This is how it works on touch screens.
  - The tip stays open while the pointer is on it. Only one is open at a time.
  - It is a popover, like the row peek: a shadow, `text-sm`, at most 22 rem wide, under the icon and kept 12 px inside the window. A rule in several parts gets a bold lead line and one line per part.
  - The ⓘ is drawn at text size, but its hit area is 24 × 24 px (the WCAG 2.2 minimum target size).
  - Screen readers hear the tip as the button's description. Tips don't print.
  - The check-in dots have the same tip, for the pointer only, because the count and note beside them say the same in words.
- **Section styles** *(under review: the review strip switches between Plain and Distinct)*. Plain stacks every section in one column, as white panels on the grey page. Distinct makes each section recognisable at a glance:
  - **Summary band:** the patient's name, next visit and the four tiles sit on a full-width white band. Details follow on the grey page.
  - **Tile graphics** repeat a number that is already shown; they never add new data.
    - Severity: a 0–27 scale bar under the hero number, with unlabelled ticks at 5, 10, 15 and 20. The baseline is a dotted tick, and the AI estimate is an `ai-series` dot on its `ai-band` range.
    - Check-ins: 12 dots, filled when completed, oldest on the left. They are hidden from screen readers, because the count says the same.
  - **Flagged Safety tile:** `safety-tint` background with a 3 px `safety` edge on the left.
  - **Two-column middle:** "What changed" beside the goals, which sit on a `tint` card with each status on its own line. The trend runs full width below.
  - **Chart zone:** see Chart.
  - **Caseload group bands:** each status group header sits on its status tint, with a 3 px edge in the status colour. Day headers (By next visit) sit on the neutral `tint`, with no edge.
  - Printing keeps the two-column middle and still fits one page. Tints print only when the browser prints background graphics, so no tint may carry meaning alone: the shape, colour and word still do.

## v3: changes from the theoretical model *(under review)*

`AURORA Dashboard v3.dc.html` applies:
- the theoretical model (`Theoretical model/AURORA_theoretical_model_v2.pdf` and the foundations doc);
- the off-track rules in `Study design/Measurement/AURORA_additional_data_collection.md` §5–6.

v2 stays as built, so the working group can compare the two. Where v3 differs from v2, these rules apply to it.

**Trend statuses.** There are five, still triple-encoded. A safety flag outranks the trend in the caseload, and the patient page shows both.

| Status | Shape | Colour | Rule |
|---|---|---|---|
| Safety flag | ■ square | `safety` | unchanged |
| Worse than baseline | ▲ triangle | `worse` | 6 or more above baseline, at any time |
| Not improving | ▬ flat bar | `worse` | under 3 months in care: above the expected range two weeks running, after a 4-week grace period. From 3 months: 10 or more two weeks running |
| Too few check-ins | ◐ half circle | `nodata` | no AI estimate, and the PHQ-9 fallback hasn't fired |
| On track | ● circle | `stable` | none of the above (was "Stable or better") |

- **The rules run on the AI estimate.** This was decided on 24 October: the PHQ-9 is mainly for validation, and the simulation puts the AI flag about a week earlier.
- **PHQ-9 fallback:** in this trial only, when check-ins are too few for an estimate, the same rules run on the PHQ-9. The flag says so ("Still symptomatic (PHQ-9)"), and every flag's source is logged (bead aurora-dey).
- **Time in care** comes from the baseline treatment-history item (§6), plus time since enrollment.
- **Placeholders:** the thresholds (6, 10, 4 weeks and the expected range) hold until they are set from the estimate's measured reliability.
- **Colour and shape:** "Not improving" shares the `worse` colours, because both statuses are off track. The flat bar stands for a flat trajectory.

**Patient page.**
- **Status line:** under the next-visit line, it gives the status, its source and the time in care, with the rule in an ⓘ tooltip.
- **Tile order:** the patient's PHQ-9 comes first and at the same size as the AI estimate, so the estimate reads as an adjunct to the patient's account, not its arbiter. This follows the model's "feeling believed" node, where displacement is the evidenced risk.
- **Disagreement:** when the PHQ-9 and the estimate differ, the callout puts the patient's account first: "The estimate supplements the patient's own account; it doesn't replace it."

**Chart.** It draws the rule that applies:
- baseline + 6, always;
- the expected range (`expected`), while the patient is in the first 3 months of care;
- a "10: symptomatic" line, once the persistence rule fires.

**Drivers panel.** On demand under the trend:
- **Content:** sleep, activity and contact from phone sensing, on the trend's weeks. Each measure's usual level is dotted, and event lines run through.
- **Colour:** ink only, because colour means status.
- **Wording:** the note says these are possible contributors, not causes. This is the model's claim discipline for "shared understanding of symptom drivers".
- **Print:** the panel is not printed.

**Open decisions:**
- suggestions for off-track patients (aurora-04b);
- a supervisor view (aurora-2q1);
- between-visit outreach for off-track flags (aurora-12g);
- the logging spec (aurora-1w3).

## Refined look *(v3, under review)*

A polish pass, switched under Review options (Look: Current or Refined; deep link `&look=refined`). Beauty here comes from calm and precision, not decoration: fewer colours on screen at once, a clearer type hierarchy, softer structure, and one focal point per page.
- **Colour:** status words are in `ink`; the shape keeps the status colour. Safety wording stays in `safety`. Shape, colour and word all remain. *(Amends the Status marker rule if adopted.)*
- **Type:** the patient's name is tracked in slightly (−0.01 em); tile numbers are weight 500, tracked in −0.02 em; group and day headers are in sentence case at `text-md`; section headings have 48 px above them.
- **Structure:** the patients list, What changed and the trend chart sit on a soft two-layer shadow instead of a border, with 10 px corners. Chart gridlines are lighter, as is the uncertainty band. Print keeps plain borders. *(Amends "shadows only on popovers" if adopted.)*
- **Human touch:** an initials avatar (48 px circle) sits beside the name on the patient page, on screen only. Not photos: AURORA doesn't collect them, and they would raise privacy questions.
- **Chart:** a dot marks the latest estimate. (A "Today" mark doesn't fit: the chart ends at the last weekly estimate.)
- **Motion:** row hover eases in; peek cards, readouts and ⓘ tips fade in over 0.12 s, and only when the reduced-motion setting is off.
- **Greeting band** (Patients page only; switchable, `&hero=0` hides it): "Good morning, Dr Okafor", then the date, visits today or tomorrow, and patients with a safety flag. Two soft aurora curtains in pale blue and violet sit at the right, fading out before the text. Cool hues only, because warm hues and greens mean status; no animation; not printed. It is the one exception to "no decorative graphics".
- **New values,** to add to Tokens if adopted: avatar `#E4EBF4` with `#3D4B57` text; curtains `#8FB0EE` and `#B3A2EA`; gridlines `#EEF1F4`; card shadow `0 1px 2px rgba(16,24,40,.05), 0 4px 12px rgba(16,24,40,.05)`.

## Procedure for each redesign round

1. **Audit content** for the page against its question: keep, move or cut. Get CWG decisions on flagged items. Audits quote the planning meetings, so they stay out of this public repo.
2. **Restyle one page at a time**, using only these tokens.
3. **Screenshot loop.** Serve the repo folder (`python3 -m http.server 8767`) and take headless Chrome screenshots at 1400 px wide.
   - v2 supports deep links, e.g. `AURORA%20Dashboard%20v2.dc.html#view=patient&p=delgado` or `#view=list&order=status`. Add `&style=plain` or `&style=distinct` for the section style, `&text=current` for the earlier text sizes, `&clock=24` for 24-hour times, and `&icons=0` to hide icons.
   - Check the printed patient page is one page (`--print-to-pdf`).
   - Save before/after shots to `design/screenshots/` with dated names.
4. **Independent critique.** Give a second model, or a fresh agent, only the screenshots and this file, and ask what to remove. The Gemini CLI on this Mac needs `GOOGLE_CLOUD_PROJECT` set before it will run.
5. **Checks:** word count per page, distinct colours and distinct font sizes, all within the budgets above.
   - For type, serve the repo and open `design/type-check.html`. It lists the words at each rendered size, and marks anything below 15 px in red.
   - Print sizes are set in pt in the print CSS. Check every printed page still fits one page.
   - Check the caseload and patient page in a window 700 px wide, which is how a laptop looks at 200% zoom.
6. **CWG 5-second test.** Show the screen for 5 seconds and ask "who needs attention first?", then "what does +9 mean?"

### Review checklist
- [ ] Can the page's question be answered in 5 seconds?
- [ ] Interface words within budget?
- [ ] Every explanation appears once?
- [ ] Colour used only for status and changes of 5 or more?
- [ ] No bordered chips or pills?
- [ ] Only token sizes, colours, spacing?
- [ ] Status shape + colour + word on every status, with four distinct shapes?
- [ ] Change marks don't reuse status shapes?
- [ ] Safety flags first, dated, with review status, and nothing implying "no email means safe"?
- [ ] Labels describe what changed, not what to do?
- [ ] Icons only show the kind of signal, muted, one per item, always beside text?
- [ ] Tints only in status colours, plus the neutral goals card? Does every tile graphic repeat a number already shown?
- [ ] Printed patient page fits on one page?
- [ ] Body text 17 px, nothing on screen below 15 px, and 15 px only for text a clinician can skip?
- [ ] Safety wording at body size or larger?
- [ ] Prose lines at most about 70 characters?
- [ ] Printed brief at 10 pt body and 9 pt notes, nothing below 8 pt? Printed handout at 14 pt?
- [ ] Caseload and patient page still usable at 200% zoom?
- [ ] Every clock time follows the time-format setting (12-hour by default), and every date puts the month first?
- [ ] Caseload numbers line up by place value, with dates and times left-aligned?
- [ ] Hover readouts also work by keyboard and are announced, and nothing safety-relevant appears only on hover?
- [ ] No browser `title` tooltips? Every ⓘ opens at once by pointer, Tab or tap, and Escape closes it?

## Prompt template for AI design work

> Attached: `DESIGN.md`, the current screenshot of page {X}, and reference screenshots. The page answers one question: "{question}".
> First, **without editing**, list every element you would remove or move and why, judged against that question and the word budget. Then wait for my approval.
> After approval, change only {named elements}, using only tokens from DESIGN.md. Do not add new elements, colours, sizes or explanatory text. Then screenshot the result and report it against the review checklist.

## Reference screenshots *(to collect)*

Put 2–3 images in `design/references/`. Candidates:
- NHS design system (nhs.uk/design-system): table and summary-list patterns;
- GOV.UK design system;
- a well-regarded product dashboard, such as Linear or Stripe.

Pick for restraint and table design, not decoration.

# AURORA dashboard design rules

The rules every mockup screen follows. Give this file, and the reference screenshots, to any person or AI model working on the design, at the start of every session.

**Status:** draft for clinician working group (CWG) review.

- 2026-10-23: checked against the clinical planning notes (`Notes/Clinical/`).
- 2026-10-24: applied in `AURORA Dashboard v2.dc.html`, after an independent review. The section styles (Plain or Distinct) were added for the CWG to compare, and the type rules (principle 9 and Type) followed a review of published usability guidance. v3, which applies the theoretical model, was added too; its differences are in the v3 section.
- 2026-10-25: v3's check-in page was added as a draft. Distinct sections and the larger text were settled, and the Refined look became v3's default.
- 2026-10-26: v3 changed after the first review notes: footers, day headers, the greeting band, Print, the discussion tick boxes, visits on the chart and the handout's note about the check-ins.

## Principles

1. **One question per page.**
   - **Caseload:** *which of my patients need attention, and in what order?*
   - **Patient page:** *how is this patient doing, and what has changed?* This page merges v1's patient detail and session prep, following the group's top priority on July 16, "one simple page". It prints as the session brief.
   - **Patient handout:** *what would the patient want to know?* Plain language, no model internals.
   - **Check-in** (v3, draft): *what happened at this check-in, and how much weight should I give it?* It is detail on demand: nothing on it is needed for the 3-minute workflow the protocol describes.
   - **Site PI page** (v3, draft): *which of my site's clinicians need a call or support?*
   - **Site settings** (v3, draft): *what does the site set for everyone?*
   - **Your settings** (v3, draft): *how do I want AURORA to reach me, and how do patients see my name?*
   - **Welcome** (v3, draft): *what do I need to set before my first patient, and what happens next?*
   - Anything that doesn't serve the page's question moves elsewhere.
2. **Say it once.** Units, scales and rules appear once per page, in an ⓘ tooltip or the footer, never on each row or header. AI labeling is the exception and follows the source rule under Components.
3. **Color means status, nothing else.** All data is in neutral ink. Color appears only for:
   - the four statuses (safety flag, worse than baseline, stable or better, too few check-ins);
   - a change of 5 or more points from the patient's baseline.
   
   Decorative or "category" color is not allowed. *(The Refined look proposes one exception: the drivers panel's three cool identity hues; see Refined look.)* Faint tints of the status colors may mark a status group or a flagged tile (see Section styles). The neutral `tint` is a surface, not a color cue.
4. **Whitespace before borders.** Separate items with space and alignment. Panels hold groups of content. No bordered chips or pills (small rounded labels) anywhere.
5. **Status is always triple-encoded** as shape + color + word: ■ Safety flag, ▲ Worse than baseline, ● Stable or better, ◐ Too few check-ins for a status ("Too few check-ins" until a review note of October 30). This survives color blindness and grayscale printing. Every shape must differ: v1's octagon for crisis looked like a circle at 10 px.
6. **Safety flags lead, but the dashboard is not a crisis channel.**
   - Under the safety design agreed on October 19, the study team reviews AI-detected risk and emails the clinician if it is urgent. Risk information doesn't reach the treating clinician in real time (August 13).
   - Safety flags come first: first group in the caseload, first tile on the patient page. The schedule view varies this: by next visit, the visits set the order, and a flag shows on its patient’s row under their visit day (see Caseload order). The list without visit dates, which most sites will use, keeps flags first.
   - They are dated and in the `safety` color, and they say who has or hasn't reviewed them.
   - Never imply that no email means safe: PHQ-9 item 9 answers arrive without study team review.
   - No banners, pop-ups or Respond buttons.
7. **Show detail on demand.** Overview rows show the few things needed to decide. Explanation lives in ⓘ, hover, or the next page: the drill-down clinicians asked for (July 16).
8. **Describe; suggest only softly and on demand.**
   - Say what changed ("What changed", "Worse than baseline", "Few check-ins").
   - Never tell clinicians which technique or treatment to use ("Act now", "Next step: assess adherence", "Switch medication").
   - The source is clinical planning, July 16:
     - Clinicians "don't want to be told what to do", but naming an issue as one that "might be worth addressing" is acceptable.
     - The study team proposed recommendations with a "why" the clinician can open, audit and disagree with, and suggested exploring with clinicians how far recommendations should go.
   - The theoretical model includes a clinical support layer ("recommended next steps"), so how far recommendations should go is an open question for the working group (bead aurora-04b).
   - **Safety flags are the exception.** A safety flag shows the protocol's response steps: what the study team did, what the clinician is asked to do and by when, and the site's crisis contacts.
     - These are the study's procedure, set for each review outcome by the IRB safety text, not AI advice. The same steps go in the email.
     - Clinicians ask for this: in focus groups on suicide-risk models, hospital providers named clear workflows and training among what would help (Bentley et al. 2022, doi:10.2196/30946).
     - Until the IRB safety text is written, the check-in page shows example wording, marked as such (bead aurora-c6i).
   - *Corrected 2026-10-24:* an earlier version of this principle also banned "Worth discussing", which goes further than the July 16 discussion did.
9. **Readable at arm's length, at a glance.** Size text for the oldest clinician who will use the dashboard, glancing at a laptop between sessions, and for the patient reading the handout. Usability guidance agrees: Nielsen Norman Group says to "use a reasonably large default font size and allow users to change the font size", because what counts as tiny grows with age.
   - Body text is 17 px. Nothing on screen is smaller than 15 px, and 15 px is only for text a clinician can skip.
   - Safety wording is never in the smallest size.
   - When something doesn't fit, cut words rather than shrink the text, on screen and on paper.
   - Clinicians can enlarge the text: sizes are in rem, and the pages still work at 200% zoom.
   - The sizes, and where they come from, are under Type.
10. **Open and close from the same place.** A control that opens something also closes it, from the same spot, so opening and closing take no pointer travel (Fitts's law: the time to hit a target grows with its distance).
   - ⓘ tips, the drivers panel and the Notes button all toggle in place; the Notes button reads "Close notes" while the panel is open.
   - Escape closes too, and a second way to close, such as a × in the panel, is fine.
   - Dialogs that cover the page, such as Model Facts, are the exception: they close from their own button, Escape, or a click outside.

## Word budget

Interface words are labels, headers, notes and buttons, not patient data.

| Page | Interface words, max |
|---|---|
| Caseload | 40 |
| Patient page | 80 |
| Patient handout | Plain language for the patient; no limit, no model internals |
| Check-in (v3, draft) | 100, not counting the safety steps, whose wording is the protocol's |
| Site PI page (v3, draft) | 80 |

- **Flag text:** at most 4 words, starting with the signal: "Few check-ins", "Reports stopping sertraline (AI)", "PHQ-9 item 9 = 2".
- **Note after the flag:** a muted note after a comma may add time or review status (", not reviewed, Aug 10").
- **When text doesn't fit,** cut words; don't shrink the text below the sizes under Type.

## Language

- **American English** in everything a person reads: the interface, the patient handout, the landing page, these docs and code comments. For example: color, gray, center, behavior, labeled, license, toward, and -ize endings (summarize, prioritize).
- **Dates and times** are US style too: see Times under Components.
- **Sentence case** for labels and the short notes under tile values: "Severe range", "Enough for the AI severity estimate". All lowercase reads as unprofessional (review notes, November 1).
- **Name the estimate in full:** "the AI severity estimate" in running text (notes, tips, the callout, the greeting), never just "the estimate" or "the AI estimate", which don't say what is estimated (review notes, November 1). Labels beside a Severity heading can stay short ("Severity (AI estimate)", a table's "no estimate"), and the patient handout keeps its plain "estimate from your check-ins".
- **No human verbs for statuses, estimates, flags or the AI.** They don't "take in", "notice", "think" or "know" anything. Say precisely what a thing is calculated from or shows: the AI severity estimate is calculated from a patient's check-ins; the status comes from the estimate's trend, or from the PHQ-9 when check-ins are too few; safety flags come from the study team's review. Prefer "calculated from" to the vaguer "based on" (November 1).
- **No middle dots (·)** anywhere in the dashboard, or, from November 5, in the banner's games, where Chris finds they read as machine-written:
  - in the games, a score line's parts are set apart by commas ("Dubhe: 3 of 7 stars, 1,230 points, 5 lives, 9:18 PM"), and results and messages are sentences or phrases ("Home by 4:12 AM with 12,340 points, a new best!", "Dubhe relit! +250 and a life back");
  - a note follows its text after a comma ("Safety review: moderate risk, today 9:40 AM");
  - a PHQ-9 score's band goes in parentheses, with its range ("20 (severe, 20 to 27)"). Ranges are named for the PHQ-9 only, never the AI estimate, since they were set for PHQ-9 totals;
  - separate facts on one line are set apart by space, and screen readers hear a comma between them;
  - places use ›, as in the breadcrumb ("Landing page › Headline" in the review notes).
- **Other languages** follow their own conventions. The patient handout can print in Spanish, which uses usted, lowercase weekdays and the day before the month ("10 ago").
  - **The clinician's name:** Spanish titles show gender (Dr., Dra.), so each clinician writes how patients see their name, in each language, on Your settings. Until they do, Spanish says "su terapeuta, E. Okafor".
  - **Register:** the mock check-in voice says tú. An app in tú and a clinic handout in usted is a common split, but it should be a deliberate choice (bead aurora-18y).
  - **The check-ins** are "conversaciones con AURORA", never bare "sus conversaciones", which could read as the patient's own phone calls. The app, its notifications, the consent form and the handout should use the same term.
- **Written quotations** keep their original spelling: the titles of papers and guidance, passages quoted from them, and names of organizations.
- **Quotes from meetings** use American spelling. Speech has no spelling: a transcript's spelling comes from the transcription software, not the speaker. The transcripts themselves stay as recorded.
- **Hyphens only where a phrase would misread without one:** "AI-detected risk" ("AI detected risk" reads as a sentence), "self-harm", "FDA-qualified". Pairs of nouns stay open: "study team review", not "study-team review". Unneeded hyphens make text read as if AI wrote it. American spelling also closes some compounds: "cutoff", not "cut-off".
- **Lines and zones are named for what they mean,** in the words of the status they start, not their arithmetic: the line where Worse than baseline begins is labeled Worse than baseline.
- **Don't call the AI estimate's changes "reliable".** In measurement, a reliable change is one bigger than the measure's own error, and that error hasn't been measured for the estimate yet. To a reader, the word can also sound like "confirmed". The study design's "reliable deterioration" (the PHQ-9 rising 6 or more) appears on screen as Worse than baseline.

## Tokens

Use these and nothing else. Any new value has to be added here first.

**Type.** Typeface: **Source Sans 3**, with a system-ui fallback. It has an open license and tabular figures. Self-host it in production.

Source Sans 3 runs small: its x-height (the height of a lowercase x) is 0.49 of the font size, against 0.52 for Arial. The US Web Design System (USWDS) scales it up by 1.06 to match other typefaces. The sizes below allow for this; if the typeface changes, re-derive them from its x-height. Sizes are set in rem (1 rem is 16 px by default), so a clinician's browser text-size setting applies.

| Token | Screen size / line height | Print (session brief) | Weight | Use |
|---|---|---|---|---|
| `text-sm` | 15 / 21 px (0.9375 rem) | 9 / 12 pt | 400, 600 | text a clinician can skip: column headers, sources, dates, chart key; nothing smaller |
| `text-md` | 17 / 24 px (1.0625 rem) | 10 / 13.5 pt | 400, 600 | body, table cells, safety notes, footers |
| `text-lg` | 21 / 28 px (1.3125 rem) | 12 / 16 pt | 400, 600 | section titles, secondary tile values, handout text |
| `text-xl` | 32 / 40 px (2 rem) | 18 / 22 pt | 600 | page title; the one hero number per page (the severity estimate) |

- **Chart text** scales with the chart, so its size is set per window width to stay at about 15–17 px. It is set larger in narrow windows, so zooming in enlarges it. In print the chart runs the full page width rather than being squeezed, so its labels stay at 9 pt.
- **Print:** nothing on paper is below 8 pt. If the brief doesn't fit one page, cut content rather than shrink it.
- **Patient handout** prints in clear print, with 14 pt body text, not on the brief's scale. Clear-print guidance asks for 12 pt minimum, 14 pt preferred.
- **Line length:** prose runs to about 70 characters a line at most (USWDS: 45–90, aiming for 66). Footers span the content width in two blocks side by side, each capped at 70 characters a line, so they line up with the panels above; in narrow windows the blocks stack.
- **Narrow windows and zoom:** below 60 rem, caseload flags move to a second line, the tiles go 2 × 2 and the patient page is one column. Reflow down to 320 px (WCAG 1.4.10) is a production task.
- **Where the numbers come from:** USWDS asks for at least an effective 16 px for most text, about 17 px in Source Sans, and smaller sizes only "sparingly". GOV.UK and the NHS use 19 px body text and 16 px small text. Microsoft's Fluent uses 14 px for dense app screens. The EU minimum for medicine leaflets is 9 pt.
- **Earlier sizes:** v2 first used 13 / 15 / 19 / 30 px, printing at 7.9 / 9 / 10.5 / 16.5 pt, with chart labels at 6.7 pt and the handout at 10.5 pt. Half the patient page's words were at 13 px. They were offered behind the review strip's Text switch until the larger text was settled on October 25.

Two weights only, 400 and 600. Numbers always use `font-variant-numeric: tabular-nums`.

**Spacing.** 4, 8, 12, 16, 20, 24, 32, 40, 48 px. Table rows are 40 px. Page gutter is 24 px; the content column is at most 70 rem (1120 px) wide on every page.

**Shape.** Radius 6 px for panels and buttons; no other radii. One hairline border color. No shadows except on popovers. The 3 px status edge (see Section styles) is a border, even where it is drawn as an inset.

**Color.** Status hues come from the Okabe–Ito color-blind-safe palette.

| Token | Value | Use |
|---|---|---|
| `ink` | `#1F2A33` | primary text, all data values |
| `ink-muted` | `#5B6B78` | secondary text (passes AA on white) |
| `line` | `#E3E7EA` | the only border / divider color |
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
| `tint` | `#EEF2F6` | neutral card behind the goals and the check-in page's signals, and the check-in page's Awaiting review panel; day headers in the caseload (distinct style); the summary point or transcript passage a link has just opened |
| `safety-tint` | `rgba(192,39,26,.06)` | flagged Safety tile, Safety flag group band |
| `worse-tint` | `rgba(213,94,0,.07)` | Worse than baseline group band |
| `nodata-tint` | `rgba(118,134,146,.09)` | Too few check-ins for a status group band |
| `stable-tint` | `rgba(0,158,115,.07)` | Stable or better group band |
| `worse-zone` | `rgba(213,94,0,.06)` | chart shading above the deterioration line (baseline + 5 in v2, + 6 in v3) |
| `expected` | `rgba(91,107,120,.12)` | v3: expected range in the first 3 months of care (chart and key) |

The striped "Review controls" strip is scaffolding for reviewers. Its colors are exempt, as are the hatched notes on the check-in page that mark what waits on a decision.

## Components

- **Status marker:** the shape in the status color plus the word in its `-text` color, with no box or background. The base hues (`worse`, `stable`, `nodata`) are for shapes and lines only, because they fail AA contrast as small text.
- **Change:** a signed number after the value ("21 +9"), measured from the patient's own baseline. It is colored (`worse-text` or `stable-text`, weight 600) only when it is 5 or more points; otherwise muted. Don't use ▲▼ arrows: the triangle is already the worse-than-baseline status shape.
- **Uncertainty:** "± 4", or the clipped range ("range 22–27") when the interval runs past the 0–27 scale.
- **Caseload order:**
  - **Visit dates** (v3, from October 26): AURORA isn't assumed to link to a site's EHR, so by default the caseload doesn't know when patients' next visits are (bead aurora-8ok). Without them, patients are grouped by status, by last name within each group. There is no Time or Next visit column, the greeting band doesn't count visits, the patient page has no next-visit line and no Visits row on the chart, and the handout says "your next appointment" rather than a day. The review strip's Visit dates switch (or `&dates=1`) shows a site that has them, from its EHR or from patients reporting their next visit in check-ins; the list can then also run by next visit.
  - **By next visit** (with visit dates, their default): one group per day, with a "Not scheduled" group last. Each day has a full-width header giving the full date, after "Today" or "Tomorrow" where it applies ("Tomorrow, Thursday, August 13"). Day headers carry no count: the greeting band already counts today’s and tomorrow’s study visits, and where flagged patients appear only in the top group, a day’s count disagrees with its rows (review note, October 26). The date is in the header, so the rows show only the time, under the column heading "Time". Safety-flagged patients sit under their visit day like everyone else, flagged in place by their status and flag, so the list reads as a schedule and each day lists everyone coming in (from October 27, from a clinician’s review note). This varies principle 6: the list without visit dates, the one most sites will use, keeps flags first, and a clinician’s study patients fit on a screen or two. Not scheduled has no times, so it runs by status, flags first. The review strip’s Safety flags switch shows the other placements the CWG is asked about: a Safety flag group pinned above the day headers, whose rows show their visit date above the time, either instead of the day (`&flagged=pinned`, the design before October 27) or as well (`&flagged=both`).
  - Day headers are neutral, because color means status. In the distinct style they sit on the neutral `tint`, with no edge.
  - **Grouped by status:** Safety flag, Worse than baseline, Too few check-ins for a status, Stable or better, with patients in visit order within each group, or by last name without visit dates.
- **Caseload columns:** the column you look patients up by comes first, then the rest in order of importance.
  - **Grouped by status:** Patient (with the status shape), Next visit (the order within each group; only with visit dates), Severity, AURORA check-ins, Flag.
  - **By next visit:** Time, Patient, Status, Severity, AURORA check-ins, Flag. Time comes first, as in a day schedule. The Status column (shape and word) stands in for the status groups.
  - Severity and Check-ins sit together, because check-ins say how far to trust the estimate.
  - Flag is last: it is the longest column, and it is empty for stable patients, so a blank never splits a row.
  - Numbers line up by place value: severity, change and check-in counts sit in fixed-width, right-aligned slots. Dates and times are left-aligned.
- **Row peek:** resting the pointer on a caseload row for about 0.4 s, or reaching it with Tab, opens a card under the row (above it for the last three rows). It shows what the row can't:
  - a small trend over the same span as the patient page, drawn the same way as its chart: AI estimate and band, PHQ-9 dots, dotted baseline, dashed baseline + 5, and a zero line. It uses the full 0–27 scale, so cards can be compared across patients.
  - severity with its uncertainty and baseline;
  - the latest PHQ-9 with its date and band;
  - item 9 across all PHQ-9s, in `safety` when the latest answer is above 0;
  - what changed, up to three items.

  Behavior:
  - Once a card is open, moving to another row switches it in about 0.1 s, and leaving the list closes it.
  - The card stays open while the pointer is on it, clicking it opens the patient, and Escape closes it.
  - Screen readers hear the card's contents when a row gets keyboard focus.
- **Rows are links:** Tab reaches each row, and Enter opens the patient.
- **Check-ins:** the count is always shown, as "10 of 12", since "10/12" can read as a date. The column and the tile say "AURORA check-ins", because in the EHR "checked in" means arriving for an appointment; the program's name says which check-ins these are, as the handout's "check-ins with AURORA" does (review notes, October 30 and November 1; "Check-ins done" for a day in between). Below 9 of 12 it is bold ink, not colored, because color is reserved for status.
- **Times:**
  - 12-hour by default ("2:00 PM"). Clinicians can switch to 24-hour ("14:00") under Times on Your settings, which opens from their name at top right. In production, the choice is saved with their account.
  - Every clock time follows the setting: visits, safety reviews, sources.
  - Dates put the month first, US style: "Thu, Aug 13", or "Thu, Aug 13, 2:00 PM" with a time. A space that can't break joins the time to AM or PM.
  - The patient's own words are quoted as written ("waking at 4 am").
- **Buttons:**
  - Secondary actions (Patient handout, Print, Alerts) are text buttons in `accent`, with no border. Print carries the printer icon, in the button's color.
  - A solid `accent` button is reserved for a page's single primary action. Welcome's "Go to your patients" is the only one so far.
  - No outlined buttons.
  - Caseload rows have no action buttons: the whole row opens the patient.
- **Breadcrumbs:** the top bar shows where you are: "Patients › M. Delgado › Patient handout". Pages above this one are links in `accent`, like every other link, with an underline on hover; the current page is `ink`, weight 600. Separators are a muted ›. On phones (below 32rem) the top bar wraps to two rows, the brand and account and then the breadcrumb, which drops the current page when the page has a visible title saying it. No back-arrow icon: it would double up with the separators, and the link color is the standard cue. The current page carries its page icon (see Icons).
- **Links:** anything clickable looks clickable and is reachable with Tab. Links that act on the page, rather than going to an address, are buttons styled as links.
- **Safety flag:**
  - It is the first tile on the patient page, with the marker and text in `safety`.
  - It is the first group in the caseload grouped by status. By next visit, it shows on the patient’s row under their visit day (see Caseload order).
  - It shows the criterion that raised it, its review status and the date: "Safety review: moderate risk, today 9:40 AM", "PHQ-9 item 9 = 2, not reviewed, Aug 10". Clinicians want to know the thresholds behind an output (Rai et al. 2025, doi:10.2196/78757).
  - Its notes, such as review status, are `text-md`: safety wording is never in the smallest size.
  - The footer, also `text-md`, says that item 9 answers appear without study team review.
  - The wording follows the IRB safety text.
  - In v3, a flagged tile has a "Protocol steps" link. It goes to the check-in page for the day the flag was raised, which opens on the review record and the response steps. Moderate risk isn't emailed, so the steps must be one click from the flag.
  - **Record what you did** (v3, draft, from October 27; bead aurora-khx): a link under Protocol steps opens a short dialog: what the clinician did about the flag and when they first reached the patient. The actions are placeholders until the safety pathway is set (November 2). Saved, the record shows on the tile ("Recorded: Called or messaged the patient; contact Aug 12, 10:30 AM"), and the link becomes "Change what you recorded".
    - Only the dashboard arm has it (decided October 27): it is part of the intervention, so it isn't compared across arms.
    - It records after the fact, so it isn't a Respond button (principle 6), and the dialog says it doesn't replace the protocol's steps or the patient's record.
    - The flag keeps its status: whether a record should change how a flag shows waits on the pathway, because "handled" could falsely reassure a backup recipient.
    - The same link, with the record once there is one, follows the protocol steps on the check-in page of the day the flag was raised.
    - It doesn't print, and it is logged without free text (`safety_action_recorded`).
- **AI label (source rule):** label AI-derived values at the smallest unit where the source is uniform:
  - once in the header of an all-AI column;
  - on each item where AI and non-AI items mix (flags, changes, chart events);
  - on each value where an AI estimate sits next to a measured score (patient page).
  
  Use quiet "(AI)" text, never a pill, plus one Model Facts link per page. *(Recommended; CWG/IRB to confirm.)*
- **Chart:**
  - The y axis is the PHQ-9 scale, 0–27, with numeric ticks. Don't label severity bands next to lines, because baseline lines then read as severity cutoffs.
  - The AI estimate is a line in `ai-series` with an `ai-band` uncertainty band. The patient's PHQ-9 answers are ink dots.
  - The AI severity estimate at each check-in, as the key calls it (review notes, October 30 and November 1), is a small, faint `ai-series` dot. The line is the smoothed estimate, which the status rules read, so one high or low reading doesn't change a patient's status. *(Mock data: as the detection-latency simulation assumes, the scatter combines day-to-day change with each reading's error, so most readings land within about 4 points of the line. To be confirmed with Deliberate AI and the WP3 idiographic study.)*
  - Baseline is dotted and baseline + 5 (+ 6 in v3) is dashed in `worse`, each labeled at the line end. v2 labels the dashed line "Baseline + 5"; v3 labels it with the status it starts, Worse than baseline.
  - The dashed line's label has an ⓘ explaining why the line stands out. It says that the line is where Worse than baseline begins, measured from the patient's own baseline, so it is not a severity cutoff, and that its number is a placeholder. The label is drawn in HTML over the chart, so that it can hold the ⓘ button, and is sized to match the chart's own labels. In v3 it takes two lines in the label column, with its last word kept on the same line as the ⓘ. The ⓘ doesn't print.
  - Item 9 answers are numbers under the PHQ-9 dates, in bold `safety` when above 0. Don't use badges.
  - Reported events are dashed verticals labeled with their source, e.g. "(AI)". The label sits right of the line, or left of it when it would run off the chart.
  - **Visits** (v3, with visit dates only): past clinic visits are short `ink-muted` marks in a Visits row under the plot, above item 9, so clinicians can read the check-ins against the sessions (review note, October 26). The readout names a visit and its time ("Visit, 2:00 PM", with the calendar icon). *(Mock data: each patient's usual slot, weekly or every 2 weeks, back to when they joined. Where visit dates come from is still open, bead aurora-8ok.)*
  - The time axis runs from when the patient joined, up to 12 weeks.
  - In the distinct style, the area above baseline + 5 is shaded in `worse-zone`.
  - **Hover readout:** it moves one day at a time. Pointing anywhere over the chart shows a guide line, a ring on the trend line (and on the dot, on a PHQ-9 day), and a small card:
    - the date;
    - the AI estimate with its uncertainty, read off the trend line;
    - whether that day's check-in was completed (with that reading's own estimate), missed, or not scheduled;
    - on a PHQ-9 day, the PHQ-9 with its severity band (or "not completed"), and item 9, in `safety` when above 0;
    - any reported event that day.

    The readout snaps to a PHQ-9 or event day from one day either side, so the dots stay easy to hit.
  - **Opening a check-in** (v3): on a day with a completed check-in, the card ends "Click to open the check-in". A click opens it, and so does Enter from the keyboard readout.
  - Between the weekly estimates, the line and so the readout are interpolated. Whether AI-COA reports a smoothed estimate, one per check-in, or both is to confirm with Deliberate AI.
  - The card is a popover, so it may have a shadow, and its text is `text-sm`. It flips to the left of the guide line in the right part of the chart.
  - The readout also works from the keyboard:
    - Tab to the chart;
    - the arrow keys move a day, and Shift + arrow or Page Up/Page Down a week;
    - Home and End go to the ends, and Escape closes the card.

    Screen readers hear each day as it is chosen.
  - Hover only adds detail. Anything a clinician needs for safety stays visible without it: item 9 answers are always shown under the chart.
- **Icons:** one set, [Lucide](https://lucide.dev) (ISC license): line icons with stroke 1.75, in `ink-muted`.
  - Size: 16 px, or 20 px in the patient handout.
  - Meaning: an icon says what kind of signal or goal something is:
    - medication (pill bottle)
    - sleep (moon)
    - activity (footprints)
    - work (briefcase)
    - exercise (dumbbell)
    - check-ins (speech bubble)
    - questionnaire (clipboard)
    - study team safety review (shield)
    - scheduling (calendar)
    - family, relationships and contact (people; v3 check-in page and drivers panel)
    - the clinician's own notes (a notebook with a pen, beside the Your notes heading; review note, November 1)
  - Never use icons for urgency (the status shapes and color do that), never color them, and never show one alone. Each sits next to its text and is hidden from screen readers.
  - **Two action icons,** the exceptions to Meaning: the printer beside Print (review note, October 26), and the person with a gear beside the clinician's name at top right, which opens Your settings in one click (October 27). Each takes its button's color, so the button reads as one control.
  - **Page icons** (wayfinding, from October 27, from a review note): the current page's name in the breadcrumb has its page's icon: people for Patients, a person for a patient, a page for the handout, a speech bubble for a check-in (as for check-ins elsewhere), a building for the site PI page, a gear for site settings, a person with a gear for Your settings, an arrow into a door for Welcome. Muted, 16 px, hidden from screen readers, and one per top bar, so the rule of one icon per row holds. People also marks family, relationships and contact (see Meaning), but here the page's name beside it says which.
  - At most one icon per row or item.
  - Used in: caseload flags, "What changed" items (in a left gutter), chart events and the readout's visits, goals, the drivers panel's titles, the greeting band's visits (Refined look), the Print buttons, the clinician's name at top right and the Your notes heading.
  - No emoji, illustrations or decorative graphics. The exceptions are the brand mark (below), the greeting band in the Refined look, and the patient handout's header.
  - **Landing banner:** outside the dashboard, the landing page opens with a banner. It sets the stage on a page where nobody is working, and it moves calmly but visibly. `design/landing/banner_gen.py` draws it as SVG layers.
    - **Scene:** a night sky with aurora curtains over a low horizon of boreal forest: black spruce on two ridges, as in northern Canada, with a log cabin in a clearing. The sky holds tonight's moon and the Big Dipper. The forest and cabin are anchored to the bottom of the banner, so a wide screen crops sky rather than forest.
    - **Time of day** (from November 1): the sky follows the viewer's clock, though it stays a night sky at every hour. A blue glow lights the horizon from just before sunset and fades over the next 1.75 hours, and a paler one rises before sunrise. Sunset and sunrise are reckoned roughly, for 45 degrees north, plus an hour on daylight saving time. Around midnight the aurora is brighter and greener, strongest at 1 AM, and it surges more often. From 11 PM to 5 AM the cabin's fire burns low. The page checks the clock every five minutes. `?at=2026-11-24T22:30` on the page's address shows another date and time, for review.
    - **Aurora:** the curtains drift (26 and 34 s) and sway, their rays leaning and lengthening (11 and 15 s). The sway only ever lengthens the curtains, so it never uncovers the top edge. Three ray patterns cross-fade every few seconds, and the bright lower edge pulses. Patches of natural green, violet and magenta wander along the main curtain, brightening and fading. As in strong displays, the magenta is a pink border along the lower edge and a faint orchid in the upper rays.
      - **Surges** (from November 1): now and then the aurora surges, as in a substorm. For about 14 s the main curtain brightens and greens over a bright pink lower edge, its rays shimmer three times faster, and it ripples. The first surge comes about a minute after the page opens, then one every 2.5 to 5 minutes, more often around midnight, and none while the tab is hidden.
    - **Stars:** a few accent stars twinkle. Now and then a shooting star glides across the sky. Three take turns, about every 10 s, each for about 2.5 s, so they never cross together. One in three heads right, the others left.
      - **The Big Dipper and the North Star** (from November 1), at the upper left, where the sky above the curtains is clearest. The Dipper's shape is true, as the sky is turned at some hour, never mirrored, and brighter stars are larger. The North Star lies on the line through the two pointer stars, as in the sky, but nearer: 2.2 times the pointers' spacing rather than about 5.3, so the whole figure fits above the curtains. Pointing near them draws the Dipper's lines, a dashed line from the pointers to the North Star, and their names. Clicking or tapping the Dipper starts the bear game (below).
    - **Moon** (from November 1; its real face from November 2): tonight's moon, with its real face, in its real phase. The face comes from NASA's Lunar Reconnaissance Orbiter maps (`design/landing/moon_gen.py`), so the maria, the highlands, the craters and the rays around Tycho are the real ones. The page lights it for the date. The footer credits NASA's Scientific Visualization Studio, as it asks.
      - **Phase:** calculated from the moon's and sun's motions, within about half an hour of published times. An average lunar month can be most of a day off: on the evening of November 2 it gave 44% lit rather than 37%. It is hidden within about a day of new moon.
      - **Light:** flat when full, with no shading toward the limb, as in the sky, and fading toward the terminator, where the real terrain catches the light. The relief is exaggerated so it shows at this size, the steepest slopes least: at full strength, crater rims looked like cracks. The moon is lit on the right while waxing and on the left while waning, as seen from the northern hemisphere, and the light comes from a little below level, since at night the sun is below the horizon. The face is turned 20 degrees counterclockwise, as the moon looks low in the east.
      - **Color** (from November 2): pale gold, since about 12 degrees above the horizon, where it sits, its light passes through almost five times as much air as from overhead, which scatters away much of the blue. Clear air would make it cream and haze a deeper gold; properly orange takes haze or a place within about 5 degrees of the horizon. The maria are a warm gray-brown, solid rather than see-through, because blending with the blue behind them turned them olive. The glare is warm too.
      - **Earthshine:** beside a thin crescent, the dark part glows faintly, and the maria show in it.
      - **Glare:** soft and long, stronger the more is lit. It gathers around the lit part and lies over the dark part, as in the sky, but under the lit part, so it doesn't wash out the maria.
      - **Place and size:** at the upper right, drawn about seven times its true size for this wide view, a prominent part of the sky (since November 2). It is in its own layer above the curtains, because the aurora's light adds to the moon's rather than blocking it. With the curtains drawn in front, it looked dull. Stars stay at least a moon's width from its limb, wherever a narrow or wide banner moves it, since its glare would wash them out. The page hides any that close, except the Big Dipper's, which are never that near.
    - **Narrow and wide screens:** a narrow banner crops the scene at the sides and a wide one at the top, so the Big Dipper and the moon move in just enough to stay in view.
    - **Airliner:** every 5 minutes or so, an airliner crosses slowly (about 2¼ to 2½ minutes), alternating direction, so it is in the sky about half the time. From November 5 it is a small drawing rather than a point of light, with lit windows, up to a third of the banner's height across (about 70 px at 1440 px). It looks smaller in proportion to its distance, down to about a third of that near the banner's edges, and it turns to follow its path, nose up as it rises from the horizon and down as it sinks. Crossing in 45 to 50 s, as it did until November 2, was too fast: at its fastest it moved more than twice as fast as the satellite. It is now slower than the satellite throughout, though still 7 to 10 times an airliner's real speed on these paths, so the movement shows. Its red beacon and a white strobe blink in turn, as an airliner's lights look from the ground (since November 1; before that, only the beacon): the beacon flashes every 2.4 s, with a faint steady red between, and the strobe flashes white halfway between, more briefly and a little less brightly, so the two look about as bright over the aurora. Each light flashes less often than on a real airliner, so the banner stays calm: a flash every 0.6 s, with each light at 1.2 s, was too frequent (November 1). It flies straight and level, which in this wide view traces an arc: it rises from one side, is highest, fastest and brightest where it passes nearest, then sinks toward the horizon. `banner_gen.py` computes the path.
    - **Satellite** (from November 1): every 170 s, a satellite, without the plane's blinking, crosses in a straight line for about half a minute. From November 5 it is a small drawing with solar panels rather than a point of light, about a sixth of the banner's height across (about 36 px at 1440 px). It fades as it passes into the earth's shadow. It is far beyond the aurora, so it passes behind the curtains.
    - **Cabin:** off to the right, three-quarters on, with its long side turned toward the middle of the scene. Banners narrower than about 430 px don't show it. Its one window is lit warm, with a slow, faint flicker of firelight. The roof has a faint rim of skylight, and a thin wisp of chimney smoke rises and bends downwind. The smoke and firelight are laid over the drawing in its own units (`.bn-scene`). From 11 PM to 5 AM, by the viewer's clock, the fire burns low: the window dims to embers, with a slower flicker.
    - **Pointer and touch:** with the reduced-motion setting, none of these happen.
      - Stars near a mouse or pen pointer brighten with a soft sparkle. Each sparkle rises over about half a second and fades over a second. At most one starts every 90 ms, and none is cut short. A tap makes the three stars nearest it sparkle (from November 1).
      - The treetops below a sparkling star catch a little silvery light, more for a brighter star lower in the sky. The glow is masked to the forest's silhouette, so only the trees catch it, never the sky.
      - The curtains ease a little toward the pointer for depth (over 1.4 s) and drift back over 2.4 s when it leaves. The stars and the forest stay put, because a moving foreground can bring on motion sickness.
      - Pointing at the cabin warms it: its window's light spreads and brightens, and more of it falls on the ground (up over 0.6 s, fading over 1.2 s). The pointer shows that the cabin can be clicked.
      - Clicking or tapping the cabin stokes its fire (from November 1): a puff of smoke and a few sparks rise from the chimney, and the window flares. Late at night, when the fire has burned low, it burns bright again for half a minute.
      - Pointing near the Big Dipper shows its lines and names (above), and the pointer shows that it can be clicked. Clicking or tapping it starts the bear game (below).
      - **Lighting the moon** (from November 2): the pointer is the sun. Over the moon's middle it is full, and farther out it is lit from that side, thinning to a crescent at the edge of the clear sky around it, with shadows moving across the real terrain and the glare following. A label gives tonight's phase, how much is lit and the next full moon, and says "Tonight" because the moon on screen may be lit differently. On leaving, the light eases back to tonight's in under a second. Clicking or tapping the moon plays a month of phases in five seconds, with the dates, and then shows tonight's label, which is how a touch screen gets it. During a game, the moon ignores the pointer. While it is lit this way, a canvas takes the place of its image, so it can change every frame; the rest of the time nothing about the moon runs.
      - **Catching shooting stars** (from November 2): clicking or tapping the sky starts a small game in the spirit of Missile Command. Each click sends a spark up from the chimney (from the forest when a narrow banner crops the cabin), and it blooms where you clicked. A shooting star that touches a bloom bursts for points.
        - **Stars:** color follows speed: slow stars are orange, then pale yellow and white, and the fastest are green and violet. This is the game's own convention, since the sources checked don't give each shower a typical color. Size varies separately, from thin streaks to thick fireballs, and faster stars have longer tails. A slow, large star scores as little as 10 points and a fast, small one up to 150. A larger star is a little easier to catch, and it throws more shards when it bursts.
        - **Showers** (from November 5): the stars come in waves named for real meteor showers, each announced by a title card in the pixel font. They run from slowest to fastest, from the Southern Taurids at 27 km/s to the Leonids at 71 km/s (entry speeds from Wikipedia's list of meteor showers, which cites the International Meteor Organization), and a wave's stars take their speed from its shower, with a little spread. The first wave has 7 stars and each later one has one more, up to 15. As in a real shower, a wave's stars fan out from one point high above the banner, its radiant. On a shower's peak night, by the viewer's date, that shower opens the game with a "Peak tonight" card and its stars score double. The dates are from the American Meteor Society's 2026-27 calendar and stay fixed in the code, though real peaks can move by a day or so from year to year. How often a shower's stars are large is a choice for the game, leaning toward showers known for fireballs, such as the Taurids.
        - **Chains** (from November 5): a burst throws off a smaller bloom in the star's color, which can catch stars nearby, and so on for up to four steps, each reaching a little less far. The multiplier climbs with each star along a chain, so one well placed click can clear a flurry. So that chains happen, some stars fall in flurries of two to four, more often as the game goes on.
        - **Reward:** a caught star flares where it was, in its color, and stays there twinkling for the rest of the game, so the sky fills with the stars you caught. Those within a moon's width of the moon don't stay, to keep the sky around it clear. They fade after the game.
        - **Scoring:** the points rise from where a star bursts, in its color. Each further star in a chain multiplies its points by 2, 3 and so on. A line at the top shows the points and the lives left, and says when you pass your best score.
        - **Past scores:** they are saved automatically and compared when a game ends ("1,430 points, your 3rd best of 12 games. Your best is 3,400."). They stay in the browser's local storage rather than a cookie, because a cookie would go to the server with every request and nothing needs to. They don't follow someone to another browser or device.
        - **High scores** (from November 2): the ten best scores among everyone with the review link, in the style of an arcade's table, set under the banner's own sky: the aurora's colors, tonight's moon as drawn for the banner, and the treeline. The title is arcade chrome in a pixel font, the rows sweep from gold through the aurora's colors, and they come in one by one when the table opens. A score in the top ten opens the table to enter up to three initials, which the browser remembers for next time. From November 5, any other game with points opens it too, a moment after the result line, with the score and the score to beat ("Your score: 1,230", and under it "Beat 2,450 for the top 10"), as a reason to play again, unless another game has started by then. A Play again button starts the same game, and has the focus when the table opens at the end of a game. The result line links to the table as well. A player can add a site when saving, and the site shows beside the initials, with a line such as "MGH holds 3 of the top 10" once a site has at least two entries. It compares sites within the top ten rather than by totals, because only top ten scores are saved, and totals would favor larger sites. The table is only for people with the review link, like the notes, so the public doesn't see reviewers' initials and has no way to write to the Firebase project that holds the notes. Without the link, or if Firebase can't be reached, the game keeps its scores in the browser only.
        - **Pace:** stars come gradually faster and more often for as long as the game lasts, from one every 1.6 s toward one every 0.32 s, about half way there after 35 s, with a pause of about 3 s between waves. A flurry delays what follows it, by half the usual gap for each star after the first, so the sky doesn't fill faster than chains can clear it. Later waves bring the faster showers, so fast stars grow more common.
        - **Landings:** a star that gets through lands with a flash in its color, behind the forest, so the trees show against it, and the treetops catch the light. A ring spreads along the ground, debris flies in arcs and smoke rises. A larger star makes a bigger flash and more debris, and a faster one throws it higher. A landing near the cabin stirs its fire, and an ember stays glowing where each star fell until the game's stars fade. The banner doesn't shake, because a moving foreground can bring on motion sickness.
        - **The cabin** (from November 5): the window, its light on the ground, the hearth and the smoke dim with each life lost, so the stakes show in the scene, and the last life puts the fire out. It stays out through the credits, or for 2.5 s after a game without them, and then relights with a stoke. About one flurry in six heads for the cabin, and a star landing within 16% of the banner's height of it is a direct hit, which costs two lives. When a narrow banner crops the cabin, nothing aims for it and there are no direct hits.
        - **Visitors** (from November 5): one crosses the sky every 13 to 22 s or so, the first after 9 to 14 s, a satellite and an airliner in either order and then a golden comet. A bloom touching the satellite, high in the sky, is worth 500 points. A bloom touching the airliner, with its blinking lights, costs a life, as a landing does, and the cabin dims, whether the bloom was aimed or thrown off by a chain: the point is to be careful around airliners. The line is "−1 life, and air traffic control has questions". Until November 5 it cost 150 points, which hardly mattered. From November 5, it then ducks, banks hard and climbs out of the sky in about 2 s, so the near miss shows in the scene. It doesn't crash: a passenger jet brought down by something fired from the ground would recall real ones, and in the bear game the airliner is something to ride. One that gets across without a bloom touching it is worth 100 ("Smooth flight! +100", from November 5), as a reason to hold fire while it's overhead, and the credits count them. The comet is worth 300, surges the aurora and bursts every star in the sky for its own points, without a multiplier. The credits count all three.
        - **Sound** (from November 5): off by default, with a small "Sound: off" switch at the bottom right during a game and its credits, which the browser remembers. A speaker beside the words, crossed out when off and with sound waves when on, makes it easier to spot, and the words are 13 px, as in the bear game's score line. Nothing starts until it is turned on, and the tones are made in the browser, with no files to load. Catches rise in pitch along a chain, a landing is a low rumble, and waves, visitors, the end of a game and a new best each have a short sound. The audio rests 2 s after a game. Levels were measured rather than judged by ear: the loudest sample in a test game was about 0.3 of full scale.
        - **Music** (from November 5): with sound on, an original tune plays during a game, written for it rather than taken from another: arcade music for a sky under fire, 16 bars in D minor at 132 beats a minute, about 29 s before it repeats, with a driving triangle bass, a quiet square-wave arpeggio through each chord, a soft triangle melody over it and drums. Each wave plays it 3% faster, up to 18%. It fades in over 2.5 s and out over about a second as the game ends, and the Sound switch starts and stops it. At its own output, measured as for the bear game's tunes (below), its typical peaks were 0.033 of full scale and its loudest 0.069.
        - **Ending:** you have five lives, lost to landings and to the airliner, and the game ends when they are gone. Three was too few: a new player could be out within about 15 s, before the pace picks up. A game left alone ends in about 10 s, without a score, so an accidental click costs little. It also ends if the banner is scrolled away, the tab is hidden or the window is resized.
        - **The top score in the sky** (from November 5): for people with the review link, the top score's initials appear as a constellation in the clear sky between the Big Dipper and the moon, right of the middle, about a fifth of the banner's height. Stars sit where each letter's strokes turn, a little off true so they look like stars, in the same places for everyone, and the sky's own stars inside it stay hidden so the letters stay clean. When the page opens, its lines show for 6 s, with "CJK lights the sky with 4,640 points. Click to challenge", which also tells colleagues the game exists; after that, only the stars stay, and pointing near them brings the lines and the line of text back. Beating the score redraws it. It uses the existing high scores, with no new data stored. Where it would be under 20 px tall, as with three wide letters on a 320 px phone, it doesn't appear, because it couldn't be read.
        - **Finale** (from November 2): after a game with at least three stars caught, the stars join into a constellation, by the shortest lines, leaving out any that would cross the moon, and it gets a name from the forest, larger for more stars: The Firefly, The Snow Hare, The Lynx, The Great Owl, The Moose and others. The aurora surges, and credits with the game's numbers rise from behind the trees, in the pixel font. It lasts about 9 s, and a click or tap skips it. Then the high scores open, for a top ten score. A game with fewer stars caught ends simply, since it may have been an accident.
        - **Around it:** the usual shooting stars, plane and satellite and the Big Dipper's lines stay out of the way during a game, so anything crossing the sky is in play. Outside one, clicking the cabin does what it always did, the Big Dipper starts the bear game, and note taking takes its clicks first.
      - **The bear game** (from November 5): clicking or tapping the Big Dipper starts a second game, a platformer. The Dipper's seven stars leave the sky and come down as the Great Bear, glowing, with the stars on its back as in the sky, the bowl on its hip and the handle along its spine, to run, jump and roll across the landscape. They come down dim, and the game is to relight them before dawn (below). They go back to the sky at the end. Its code is in `bear.js`.
        - **Seven stars, one night** (from November 5): a run is one night, in seven stages, one for each of the Dipper's stars, in the order of their Greek letters: Dubhe, Merak, Phecda, Megrez, Alioth, Mizar and Alkaid, so the bowl fills first and then the handle. While the stars are down, the Dipper stays in the sky as a faint outline, with a ring where each star belongs. Each stage asks for seven falling stars (from November 5; before, 5 in the first and up to 9 in the last). Each one caught flies up to a big star with seven points, taking shape in a clear part of the sky between the middle and the moon, and becomes one of its points, in the caught star's own color, so the big star is made of the stars caught for it, and each point rings a note a step higher than the last. Meanwhile the stage's star brightens on the bear's back, and its ring in the sky pulses. The seventh relights it: on the bear's back at once, and in the sky when the finished big star has flashed and flown across to its place, shrinking to a star's size, which takes about 2 s, during the breather. Then the lines to its neighbors brighten, and the next big star's outline appears. The stage is worth 250 points for each star relit so far, so 250 for Dubhe and 1,750 for Alkaid, and gives back a life, up to five. A card in the pixel font opens each stage, as the meteor showers do in the shooting star game, with the star's name and what the stage brings. The first says "Relight 7 stars before dawn". Between stages comes a breather of 2.5 s, when nothing new arrives and the night waits. This gives the bear game what the shooting star game had and it lacked: a goal, a measure of how far a run got ("5 of 7 stars relit") and a way to win.
        - **One new thing a stage:** the game's parts come one at a time, rather than all at once: stars and berries (Dubhe); the log, with a berry under it, for rolling (Merak), after which it lies somewhere new each stage (below); bees (Phecda); honey and the bouncing star (Megrez); the airliner and the satellite (Alioth); moon gravity (Mizar); and bees that swoop (Alkaid). Each stage's card says what it brings ("Roll under the log", "Bump the moon"), which replaces the old hint about the moon, and when the moon isn't up, Mizar's card says "No moon tonight". Each stage also brings stars more often, and more of them fast, from one every 1.1 s, mostly slow, to one every 0.75 s, and bees from one every 5 s to one every 2.6 s, faster each stage. This replaces a ramp over the run's time that a player couldn't see.
        - **The log moves** (from November 5): it isn't there in the first stage, and from Merak's on it lies somewhere new each stage, so each stage's ground is a little different. At the start of a stage it fades out where it was and in somewhere else, chosen as it appears, away from the animal and any honey pot, and its two berries go with it, the one underneath ripe again. It goes only where the spruce clumps in front leave it in view, clear of the cabin and the banner's edges, at least 150 units from its other places: three on a wide banner and one or two on a phone. Where there's room, it keeps out from under the low bridges, but on most banners two of the three places are partly under one, which reads as a log with a bridge over it. With nowhere else free, it stays where it is. It has a canvas of its own, so a move changes only that canvas's opacity.
        - **Dawn:** the night runs from 9 PM to 6 AM in 150 s of play, not counting the breathers, and the score line gives the time ("Mizar: 3 of 7 stars, 4,230 points, 4 lives, 3:42 AM", shorter on a narrow banner). Over its last 40%, from 2:24 AM, a pale glow like the banner's own before sunrise brightens behind the aurora and the forest, and "Dawn is coming!" appears at 5 AM. So a missed star costs time, and so does every extra: riding the airliner to the sound barrier takes about 11 s of night. The glow is a layer of its own whose opacity alone changes, and it fades as the run ends. In tests, bots that went for every star got home in 72 to 91 s of night, and bots that missed a third of the bees and ignored nearly half the stars in 94 to 141 s, at any width of banner, and with seven stars a stage, in 70 to 88 s and 100 to 112 s; people place themselves less well, so most should see dawn coming, and some meet it. The fox paces the same.
        - **Endings:** home, dawn, five stings, or quitting. With all seven relit, the animal goes home: it rises, glowing brighter, its stars go back to their places, the aurora surges, and each minute of night left is worth 10 points. The result line says when it got home ("Home by 4:12 AM with 12,340 points"). If dawn comes first, it curls up to sleep in the forest until tomorrow night ("Dawn came with 5 of 7 stars relit and 6,780 points"). The credits give the time home or the stars relit, and the night left. Bees, falling stars and the airliner fade as the animal goes home or to sleep, and the airliner no longer carries it.
        - **Alcor:** during Mizar's stage, Alcor, Mizar's faint companion and a traditional test of eyesight, shows beside it in the sky, dimly. Catching it is worth 500 points and counts toward the stage, and the credits say "Alcor spotted". Nothing points it out. It sits on the same side of Mizar as in the sky, at the angle the two stars' real positions give from the line to Alkaid, but 9 units out, far more than its true distance, at which it would be lost in Mizar's glow. It appears only in the bear's runs.
        - **A still view:** the banner is the level, and it never scrolls or shakes, because a moving foreground can bring on motion sickness. The ground is the near ridge, where the trees stand and the cabin sits, with bridges of stars to land on from below and a fallen log that only a ball fits under, which comes in Merak's stage and lies somewhere new in each stage after (above). A low hill and clumps of spruce in front of the bear give depth, and they stand still too. Distances scale with the banner's height, so it plays the same at any size.
        - **Controls:** ← and → (or A and D) run. ↑, W or Space jumps, and a second press in the air is a double jump. ↓ (or S) rolls into a ball, faster and low enough for the log, on energy that lasts about a second and comes back in about four; without it, the bear can stay curled up but only crawls. Esc or the Quit link ends a run. On a touch screen the bear runs by itself and turns at each end, a tap jumps and a swipe down rolls. The game takes keys only during a run, and not while someone is typing or a dialog is open.
        - **Points:** stars fall to be caught, the faster and smaller worth more, 10 to 150, as in the shooting star game, and double on a meteor shower's peak night. Lingonberries, which grow on the floor of a northern forest, are worth 25: along the ground, on the bridges, on the log and one under it, which only a ball can reach. A honey pot is worth 150, but it brings angry bees. Boarding the airliner is worth 100, and riding it earns air miles (below). The satellite, high up, is worth 500. Catches within 2.2 s of each other build a combo that multiplies their points, ×2 from the 3rd and up to ×5 from the 15th, and a combo of 5 or more pays a bonus when it ends. Relighting a star and getting home are worth points too (above), so how far a run gets counts for more than any one extra.
        - **Bees and lives:** bees come from Phecda's stage on, crossing at different heights, some to jump and some to roll under, faster each stage, and in Alkaid's stage some swoop at where the bear was. Five stings end a run, as in the shooting star game; three felt hard. Relighting a star gives one back. One sting satisfies a swarm, so a mistake with the honey costs one life, and a sting breaks the combo. The bear's light on the trees grows with each star caught and fades with each sting.
        - **The airliner:** riding it earns air miles by the distance flown, 5 points every quarter second at its usual speed. The longer the ride, the faster it flies, and while it has a rider it turns around at the banner's edges rather than flying off. At three times its speed, in about 11 s on any banner, it breaks the sound barrier: 500 points, the aurora surges and a pale ring spreads, the animal is thrown clear and the plane is gone. Nothing shakes. Its engines shed slow stars that drift down behind it, below the deck and out of a rider's reach, so catching them means jumping off, and the sonic boom throws out a fan of eight. On a touch screen the animal stands still on the plane rather than running off it, and a tap jumps off its back.
        - **Now and then:** a star bounces along the hills, and catching it makes the animal invincible for 8 s and a little quicker, able to run into the bees for points, more for each in a row. If the moon is up, bumping it from below, from Mizar's stage on, brings moon gravity, a third of normal, for longer the more of the moon is lit. The real moon's is a sixth, which would carry jumps out of a banner this short.
        - **The fox:** bringing the Great Bear home unlocks the fox. Until November 5, catching 20 stars in one run did, but every test bot managed that, so it was hardly a goal. Its face appears as stars left of the Big Dipper as the bear goes home, with "Click to play as the Little Fox", and clicking them starts the game as the fox. A fox's run has the same seven stages, relighting the seven stars of its face, from an ear around to the other cheek, which its cards and score line number ("Star 3 of 7"), since they have no names. It is quicker and jumps higher, a smaller target that also catches less. ↓ in the air is a nose-first pounce, which is safe from bees, bats them away for points and catches what is close by when it lands; on the ground, ↓ slides. Every 10th star sets off fox fires, 250 points and an aurora surge: the Finnish word for the northern lights, revontulet, means fox fires, from folk tales of a fox whose tail throws sparks into the sky. Unlocked animals stay in the browser, like past scores, so they don't follow someone to another browser or device.
        - **The crab** (from November 5, a first version): bringing the fox home unlocks the crab. Its constellation is Cancer, drawn from its stars' real positions, north up and never mirrored, as an upside-down Y, with Praesepe, the Beehive Cluster, as a little clump of faint stars between the two Aselli, the donkeys at its manger. It sits left of the fox's face, the two side by side left of the Big Dipper, each a little smaller on a narrow banner, with its own label, "Click to play as the Crab", which shows when pointing near it. Its stages relight Cancer's stars by their Greek letters, so its cards and score line name them: Acubens, Tarf, Asellus Borealis, Asellus Australis, Tegmine and Iota Cancri, and last Praesepe, "The Beehive Cluster". The crab is aqua starlight, a cool color, with Cancer's stars across its shell, and it faces the front: it scuttles sideways and never turns around, and it doesn't somersault on a double jump. It's low and wide, so it walks under the log ("Walk under the log"), and it jumps short, reaching the low bridges with a double jump but the high one only with moon gravity or from the airliner. Its claws catch wider than any other animal's but not as high, and they snap shut on a catch. ↓ pulls it into its shell: there it can't move, even downhill, but bees that fly into it bounce off, for 25 points each, and none can sting it. Most cruising bees pass over it, so its dangers are the lowest bees, swoops and angry swarms. In tests, bots got it home in 77 to 109 s of night, about as the other animals.
        - **The grand finale** (from November 5): the first time all three animals have been brought home in a browser, in any order, the run that completes them ends with a finale in place of its credits. Unlocking an animal doesn't count, so a fox unlocked under the old 20-star rule still needs the bear brought home; the browser keeps the list (`aurora-homes`). Fireworks rise from behind the forest, on a canvas between the sky and the hills, and burst into sprays and rings in the bear's blue and violet, the fox's orange, the crab's aqua and the aurora's colors, coming faster for 12 s, to a crescendo of gold willows. Meanwhile the three animals parade along the ridge, each glowing in its own color with all seven stars lit: they walk in from the left in a line, the Great Bear leading, the Little Fox trotting and now and then hopping, and the Crab scuttling sideways at the back, march across, turn around together, and walk back to stand in the middle, the crab, then the fox and the bear facing each other, where they hop in turn under the credits and the crab snaps its claws. They walk in front of the clumps of spruce, not behind them as in a run, so none is ever hidden, and the credits stay above them. Then the three constellations blaze together, the Big Dipper, the fox's face and Cancer, their lines drawn bright, the aurora surges, and credits rise: "All three are home", each animal with its best score, and the music's credit. With sound on, Vivaldi's Spring plays, and the finale has its own Sound switch, since the run's has gone. Bursts bloom and fade over a second or two, with a soft glow where each opens; nothing flashes the whole banner, which matters for people sensitive to flashing light, and nothing shakes. A click skips it, and it ends after about 21 s with the run's result line, as other runs do. It costs about 32 to 34% of one core while it plays, with the parade, against 24 to 26% without it, measured as for the games (below).
        - **Secrets** (from November 5): the finale can also be played on demand, outside a game: with the Konami code, the classic arcade cheat (↑ ↑ ↓ ↓ ← → ← → B A), on a keyboard, or with three clicks or taps on the North Star within a second and a half, on any screen. The North Star winks at each click, which hints that something is there, and a click on it no longer starts the bear game, though anywhere else on the Big Dipper still does. Played this way, the credits begin "Credits" unless all three animals really are home, an animal not yet played has no best score, and no result line or high scores follow, since no game was played. Like the games, the secrets don't exist with the reduced-motion setting.
        - **Ending:** a run with at least 3 stars or 300 points gets credits, as in the shooting star game, while the aurora surges, and a click skips them. The result line gives the time home or the stars relit (above), the points and that animal's best, kept in the browser, and says what to click to play again. A run also ends if the banner is scrolled away, the tab is hidden or the window is resized.
        - **High scores:** for people with the review link, the bear game has its own table of the ten best runs, in the same arcade style, with "Bear game" under the title and the animal played beside the site. As in the shooting star game, every run with points ends with it: a top ten run to enter initials, any other with the score to beat, and Play again starts another run as the same animal. The result line links to it too.
        - **Sound:** tones like the shooting star game's, with the same setting and the same speaker switch at the bottom right during a run, off by default. A relit star rings a rising chord, higher each stage, and a chime when its light reaches the sky; two low notes warn of dawn; and going home has a fanfare, and falling asleep a few falling notes.
        - **Music** (from November 5): with sound on, an original tune in the style of classic platform games plays during a run, written for the game rather than taken from another. A square-wave lead plays over a triangle bass and soft drums, 16 bars in A minor at 144 beats a minute, about 27 s before it repeats, and up to 30% faster while the airliner being ridden speeds up. It fades in over 2.5 s and out as the animal leaves. It sits under the effects: in a test, its typical peaks were 0.04 to 0.07 of full scale and its loudest 0.31, against 0.17 for the shooting star game's effects. At full strength its first notes came through at up to 0.68, as the output's compressor settled, hence the fade-in and the lower level.
          - **The fox's tune** (from November 5): each animal has its own. The fox's is bright, silly dance-pop in the spirit of "What Does the Fox Say?", but not its tune, which is someone else's: 16 bars in G major at 128 beats a minute, about 30 s, with a kick on every beat, claps on the second and fourth, open hats between, a filtered saw bass pumping on the offbeats, and a bouncy square-wave lead over G, D, Em and C. In its second half come yips, quick squeaks that slide up into the note, for the fox's calls. The bear keeps the tune above.
          - **Spring** (from November 5): for the grand finale, the opening of Vivaldi's Spring, from The Four Seasons (1725), long in the public domain, made here like the other tunes: its tune, a saw softened by a low-pass filter, as strings, then the same again softer as an echo, as Vivaldi wrote it, over a bass driving in eighths and a harpsichord's chords on the beat, at 100 beats a minute, by sixteenth note. It was written down from the music as remembered, so it may differ from the score in details of rhythm. At its own output its typical peaks were 0.020 and its loudest 0.059.
          - **The crab's tune** (from November 5): calypso, 16 bars in F major at 112 beats a minute, about 34 s, with a bass on a 3-3-2 rhythm (root, root and fifth), a lead like a steel drum, a sine with a fainter octave over it, quick to fade, a soft kick on the beat, a rim on the offbeats of the 3-3-2 and a shaker on every eighth. At its own output its typical peaks were 0.025 and its loudest 0.086, after the kick, bass and lead were turned down from a first loudest of 0.109.
          - **Levels and clicks** (November 5): measured at each tune's own output, in windows of 20 ms over 15 s of play, the typical peak (the median) was 0.036 of full scale for the bear's tune, 0.017 for the fox's, whose lead and bass leave more gaps, and 0.033 for the shooting star game's, and the loudest 0.069, 0.080 and 0.069. Measuring them found clicks in every note and sound effect of both games until then: a gain starts at full strength, and a sound can start a fraction of a sample before its gain is turned down, so its first sample came through at up to half of full scale, often enough to make the compressor pump. Each gain now starts silent.
        - **Around it:** during a run, the usual shooting stars, plane and satellite stay out of the way, and the banner's clicks belong to the game. With the reduced-motion setting there is no game.
    - **Color:** the banner is the one place green appears outside a status. It is a picture of the sky, on a page with no patient data, while the dashboard keeps to cool hues because green means "on track" there. Its only reds are the airliner's beacon, a small point of light that moves and blinks, so it reads as a light in the sky rather than a status, and during the bear game the lingonberries, a pinkish red that reads as fruit. Its warm colors are the cabin's lamplight and the chimney's sparks, plainly firelight; the moon, pale gold as a low moon is; during the shooting star game, the sparks' blooms, the landings, the slow stars, the golden comet and the short messages about lost lives and points; during the bear game, the slow stars, the honey pots, the amber bees, the fox and its fox fires, and the messages about points; and for people with the review link, the pale gold stars of the top score's initials. Warm hues signal status in the dashboard, but here, as with the green, they are part of a picture of the sky. The twilight glows, the bear game's dawn, the satellite, the bear's blue and violet glow and the crab's aqua are cool.
    - **Cost:** only transforms and opacity animate, so the work falls mostly to the graphics process. Measured on November 5, as CPU in percent of one core, in Chrome on an M2 Ultra at 1440 px on a high-resolution screen: about 10 with the banner idle and in view, nearly all of it the aurora's curtains; about 27 with the pointer moving across the sky or during a game; about 23 during the credits; and about 37 while the pointer lights the moon. With it scrolled away, when its animations pause and no surge starts, it was about 0.3 when measured on November 2. These leave out the graphics chip's own work, and an older laptop will show higher percentages. A surge adds one layer's opacity and position for 14 s. The time of day is set when the page opens and every five minutes. The moon is lit in a small canvas when the page opens, in about 5 ms, and again only when its phase has changed enough to show, about every 1.5 hours. Its textures add about 15 KB to the page. The shooting star game runs a frame loop only while it is being played, and it too animates only transforms and opacity. The bear game draws each frame in a canvas, also only during a run: about 26 to 27 while it is played, measured on November 5. Its stages, with the Dipper's outline, the light of relit stars and the dawn, add about 1: in three runs of each with a bot playing the first half minute, 23 to 25, against 22 to 24 for the version before them. The dawn is a layer whose opacity alone changes. Its code, about 100 KB (30 KB compressed), loads only when someone first starts it, or when the page opens in a browser that has unlocked an animal, to draw that animal's stars. Its music's notes are scheduled every 80 ms and play on the browser's audio thread. With the reduced-motion setting, nothing moves, but the sky still follows the clock and shows the moon's phase.
  - **The aurora motif** carries the banner's colors through the landing page:
    - a soft glow of blue-violet, violet and a little teal behind the latest version's screenshot;
    - a blue-violet-to-violet gradient on the latest version's badge and the How to review step numbers;
    - a closing band of night over the spruce treeline, under a thin aurora line.
  - **In the dashboard,** the motif is only a thin blue-violet-to-violet line under the top bar and the greeting band's curtains (Refined look), and the patient handout's header strip. It never uses green, magenta or warm colors there, and it never appears in charts, statuses or the printed brief. (The drivers panel's hues in the Refined look come from the same cool range, but they are identity colors, not the motif.) Text never sits on a gradient, and motion stays in the banner.
  - The capsule "pill" icon was replaced by the pill bottle because at 16 px it read as a hyperlink symbol.
- **Brand mark:** a 24 px rounded square in a blue-to-violet gradient (`#2E6FD6` to `#7B5CC9`) with two level white aurora ribbons, the lower one shorter and fainter. It sits beside the AURORA wordmark in the top bar (v3 and the landing page) and is the browser-tab icon (`favicon.svg`). Cool hues only, like the greeting band, so it never reads as a status. The ribbons stay level: a rising line would read as rising severity, and two identical waves as "≈".
  - **Tagline** (from October 27): pointing at the mark or the wordmark shows "Rich context, shared understanding", in a popover styled like the ⓘ tips, in v3 and on the landing page. It echoes the name (Adaptive Understanding through Real-time Observation, Reporting, and Assistance) and the shared understanding that routine outcome monitoring works toward, and it promises no results, since the trial is testing them. It is branding, not information, so pointing alone shows it and screen readers skip it. Nothing a clinician needs may go in it.
- **Discussed checkbox** (v2): "Discussed AURORA data with the patient at this visit", at the foot of the patient page. This feeds the discussion-rate measure in the supervisor audit-and-feedback (A&F) playbook.
- **Discussion tick boxes** (v3, from October 26): at the foot of the patient page's summary band, "Today:" with two tick boxes, "The patient brought up their AURORA data" and "I brought up their AURORA data". Once either is ticked, an optional three-line box asks for the "Patient's reaction" (draft, from October 27; first labeled "What the patient made of it", on one line, until review notes of November 1): the patient's own reading of their data, which the clinical group asked to record. Each names what was brought up, not "it" (review note, October 27), and "Today" is what a tick records, since the dashboard doesn't know visit dates. They replace v2's checkbox: the clinical group's dashboard suggestions (August 31) asked to record who raised the measures, and the review notes asked for a more prominent place. Either tick counts as discussed for the A&F playbook's discussion rate, and the logging spec records which (bead aurora-1w3). Each patient keeps its own ticks. Not printed. They save as soon as they're ticked, which a quiet "Saved, in Your notes" confirms, and they show in Your notes as today's entry (review note, October 30).
- **Alerts about one patient** (v3, draft, from October 27): Alerts, beside Print on the patient page, opens a small panel under it, which closes from the same button, Escape or a click elsewhere.
  - Between visits, the clinician can ask for an email or a text the day something new is flagged for this patient (a new status or a new safety flag), or keep the default on Your settings ("text me if something comes up", clinical planning, October 26).
  - Emails and texts say only that something is waiting, never the patient's name.
  - The button names the choice ("Alerts: email"), and Your settings lists the patients with their own alerts.
  - A draft until the study decides on outreach between visits (bead aurora-12g). Changes are logged (`setting_changed`).
- **Your notes** (v3, draft, from October 27, from the clinical group's suggestions): a section under the trend on the patient page for the clinician's own impressions (under Goals until November 1, which left a gap under What changed).
  - Notes are dated, newest first ("Today" for today's), on `tint` like the goals, with a box and Save note under them.
  - Each note can be edited, which marks it "edited" with the date, or deleted after a "Delete this note?" check (review note, October 30).
  - Today's ticks, and the patient's reaction, show as today's entry, "from the Today ticks". They change with the ticks, not in the list (review note, October 30: where do they go?). The heading makes no claim about who sees them until the data flow below is decided; then it can say.
  - They don't print: the session brief stays one page, and a printout can be left where others see it.
  - Clinical free text, so where notes are kept, who else may read them (a supervisor, bead aurora-2q1) and whether the study uses them wait on the data flow and the consent form (bead aurora-hv1). A scaffold note says so. The logging spec records only that a note was saved.
- **ⓘ tooltip:** the place for scales, thresholds and definitions. The page draws it; don't use the browser's `title` tooltip, which appears only after a delay and never by keyboard or touch.
  - The ⓘ is a button. Pointing at it, or reaching it with Tab, opens the tip at once.
  - A click or tap keeps the tip open, with the ⓘ in `ink`. A second click, Escape, or a click elsewhere closes it. This is how it works on touch screens.
  - The tip stays open while the pointer is on it. Only one is open at a time.
  - It is a popover, like the row peek: a shadow, `text-sm`, at most 22 rem wide, under the icon and kept 12 px inside the window. A rule in several parts gets a bold lead line and one line per part.
  - The ⓘ is drawn at text size, but its hit area is 24 × 24 px (the WCAG 2.2 minimum target size).
  - Screen readers hear the tip as the button's description. Tips don't print.
  - The check-in dots have the same tip, for the pointer only, because the count and note beside them say the same in words.
- **Section styles:** Distinct, settled on October 25, 2026, along with the larger text and the icons. The alternatives were clearly weaker: the Plain style (one column of white panels), the smaller text used earlier, and no icons. They are no longer offered for review, so reviewers can save their attention for open questions. Distinct makes each section recognizable at a glance:
  - **Summary band:** the patient's name, next visit and the four tiles sit on a full-width white band. Details follow on the gray page.
  - **Tile graphics** repeat a number that is already shown; they never add new data.
    - Severity: a 0–27 scale bar under the hero number, with unlabeled ticks at 5, 10, 15 and 20. The baseline is a dotted tick, and the AI estimate is an `ai-series` dot on its `ai-band` range.
    - Check-ins: 12 dots, filled when completed, oldest on the left. They are hidden from screen readers, because the count says the same.
      In v3, a filled dot opens its check-in, for the pointer only. "Latest check-in" under the tile does the same from the keyboard, and the chart reaches any day.
  - **Flagged Safety tile:** `safety-tint` background with a 3 px `safety` edge on the left.
  - **Two-column middle:** "What changed" beside the goals, which sit on a `tint` card with each status on its own line, The trend runs full width below, then Your notes in the left column.
  - **Chart zone:** see Chart.
  - **Caseload group bands:** each status group header sits on its status tint, with a 3 px edge in the status color. Day headers (By next visit) sit on the neutral `tint`, with no edge.
  - **Sorting** (from October 27, from a review note): the Patient and Severity headings sort the caseload: once (last name A to Z; severity highest first), then reversed, then back to the groups: by status, or by visit day where the list runs by next visit. Safety flags stay first in every order (principle 6). Everyone else forms one list under a header that names the order, with a link back to the groups. Choosing an order in the review strip’s List switch also ends the sort. Severity sorts by the AI estimate, with patients who have none last either way. It is a convenience, not a status, so the caseload opens grouped by status. The heading shows ▲ or ▼, and the order goes in the address (`&sort=name` or `&sort=sev`, `&rev=1` reversed).
  - Printing keeps the two-column middle and still fits one page. Tints print only when the browser prints background graphics, so no tint may carry meaning alone: the shape, color and word still do.

## v3: changes from the theoretical model *(under review)*

`AURORA Dashboard v3.dc.html` applies:
- the theoretical model (`Theoretical model/AURORA_theoretical_model_v2.pdf` and the foundations doc);
- the off-track rules in `Study design/Measurement/AURORA_additional_data_collection.md` §5–6.

v2 stays as built, so the working group can compare the two. Where v3 differs from v2, these rules apply to it.

**Trend statuses.** There are five, still triple-encoded. A safety flag outranks the trend in the caseload, and the patient page shows both.

| Status | Shape | Color | Rule |
|---|---|---|---|
| Safety flag | ■ square | `safety` | unchanged |
| Worse than baseline | ▲ triangle | `worse` | 6 or more above baseline, at any time |
| Not improving | ▬ flat bar | `worse` | under 3 months in care: above the expected range for 2 weeks in a row, after a 4-week grace period. From 3 months: 10 or more for 2 weeks in a row |
| Too few check-ins for a status | ◐ half circle | `nodata` | no AI estimate, and the PHQ-9 fallback hasn't fired |
| On track | ● circle | `stable` | none of the above (was "Stable or better") |

- **The rules run on the AI estimate.** This was decided on October 24, because the PHQ-9 is mainly for validation and the detection-latency simulation puts the AI flag about a week ahead of a PHQ-9 flag.
- **PHQ-9 fallback:** in this trial only, when check-ins are too few for an estimate, the same rules run on the PHQ-9. The flag says so ("Still symptomatic (PHQ-9)"), and every flag's source is logged (bead aurora-dey).
- **Time in care** comes from the baseline treatment-history item (§6), plus time since enrollment.
- **Placeholders:** the thresholds (6, 10, 4 weeks and the expected range) hold until they are set from the estimate's measured reliability.
- **Color and shape:** "Not improving" shares the `worse` colors, because both statuses are off track. The flat bar stands for a flat trajectory.

**Patient page.**
- **Status line:** under the next-visit line, it gives the status, its source and the time in care, with the rule in an ⓘ tooltip.
- **Improving** (good news, noticed): for a patient On track whose AI estimate has come down steadily, the status line adds "improving for 11 weeks", and the caseload's Flag column says "Improving for 11 weeks (AI)".
  - Rule (mock, to set with the estimate's measured reliability): the longest span of 4 or more weeks, ending now, with no weekly rise of more than 1 point and a net fall of 3 or more.
  - In `ink`, never a status color: it is a note, not a status. Never shown beside a flag of any kind, so it can't soften one.
  - It describes; it doesn't tell the clinician what to do (principle 8).
- **Tile order:** the patient's PHQ-9 comes first and at the same size as the AI estimate, so the estimate reads as an adjunct to the patient's account, not its arbiter. This follows the model's "feeling believed" node, where the evidenced risk is that the estimate displaces the patient's account.
  - For the CWG (from October 27; bead aurora-dar), the review strip's First number puts the AI estimate's tile first (`&lead=ai`): the status is based on the estimate, and later versions may have no PHQ-9. The tiles keep the same size either way, and the page draws the moved tile in its new place, so screen readers and Tab follow the order on screen. The "feeling believed" reason above is the case against it.
- **PHQ-9 ranges** (from October 27): wherever a PHQ-9 score's band is named, its range follows (see Language). The PHQ-9 tile's band has an ⓘ listing all five (0 to 4 minimal, 5 to 9 mild, 10 to 14 moderate, 15 to 19 moderately severe, 20 to 27 severe; Kroenke, Spitzer and Williams, 2001), and Model Facts says the ranges are for the PHQ-9 only. From a review note asking what Mild, Moderate and Severe mean. The caseload's Severity ⓘ lists them too, for reference beside the estimate's scale, without naming a range for any estimate (review note, October 27).
- **Answers by question** (from October 27): a link under the PHQ-9 tile, like Model Facts and Latest check-in under theirs, opens a dialog with the patient's answer to each question in the latest PHQ-9, highest first, beside the PHQ-9 before. Each answer has its words (Not at all, Several days, More than half the days, Nearly every day); a positive item 9 has the safety square; the total ends the list with its range. The questions are shortened from the PHQ-9's own wording. Mock answers spread each total over the first eight questions by the patient's own mix of symptoms, and item 9 keeps its recorded answer. Whether clinicians want it, and whether the highest-scoring questions belong on the page itself, is a question for the working group (Questions tab).
- **Disagreement:** when the PHQ-9 and the estimate differ, the callout puts the patient's account first: "The estimate supplements the patient's own account; it doesn't replace it."

**Chart.** It draws the rule that applies:
- baseline + 6, always;
- the expected range (`expected`), while the patient is in the first 3 months of care;
- a "10: symptomatic" line, once the persistence rule fires.

**Drivers panel.** On demand under the trend:
- **Content:** sleep, activity and contact from phone sensing, on the trend's weeks. Each measure's usual level is dotted, and event lines run through.
- **Pointing:** pointing at the trend or the panel marks that week on each measure, and the values at the right switch to it under "Week of Jul 13" ("Latest week" at rest). Sensing is weekly, so a day shows the week it falls in. The trend's readout adds the week's sensing for screen readers, and a click opens a completed check-in, as on the trend.
- **Color:** ink in the Original look. The Refined look gives each measure its own cool hue (see Refined look).
- **Wording:** the panel's ⓘ, beside Hide sleep, activity and contact, says where the measures come from and that they are possible contributors, not causes. It was a paragraph above the charts until a review note of October 30 (say it once, in an ⓘ). This is the model's claim discipline for "shared understanding of symptom drivers".
- **Print:** the panel is not printed.

**Open decisions:**
- suggestions for off-track patients (aurora-04b);
- a supervisor view (aurora-2q1);
- between-visit outreach for off-track flags (aurora-12g);
- the logging spec (aurora-1w3);
- what clinicians may see of check-in conversations (aurora-3yt);
- the wording of the safety response steps (aurora-c6i).

**Check-in page** *(draft)*. `#view=checkin&p=delgado&d=2026-08-10`. The spec is in the project folder (`Clinicians/Dashboard/Check-in detail view spec 2026-10-25.md`). What clinicians may see of the conversations waits on the IRB, so a hatched note at the top says the page is a draft. Only the review strip's seven examples have written conversations.
- **Opens from:**
  - the trend chart (see Chart);
  - the Check-ins tile's dots and its "Latest check-in" link;
  - the Safety tile's "Protocol steps" link (see Safety flag);
  - What changed items that cite a check-in, which open it at the summary point that cites the passage.
- **Moving around:** the breadcrumb reads "Patients › M. Delgado › Check-in, Mon, Aug 10". Previous and Next step through the patient's check-ins. They stay in the same place on every check-in, and are disabled, not removed, at either end.
- **Summary band:**
  - the title ("Check-in on Monday, August 10"), then the patient, the time, the length and the language, set apart by space;
  - below them, two columns on the same grid as the sections underneath: the safety block on the left in every state, and the estimates on the right, so the estimates stay in place as the clinician steps from one check-in to the next;
  - the estimates as a small table: the patient's same-day PHQ-9 first, then this check-in's estimate, the trend that day with its uncertainty, and the baseline. Labels and sources are muted, and all four values are the same size (`text-lg`, 600), so a single reading never outranks the trend. There is no scale or band drawn around them: "inside the band" would read as "consistent", and the estimate's error hasn't been measured;
  - a note under them saying which number counts ("The patient's status is based on the trend, not single check-ins"), and anything in the recording that weakens this estimate ("Less certain than usual: the patient's face was in view 40% of the time", "No estimate: the check-in ended after 1 minute").
- **Safety block,** always in the same place, in one of four states:
  - **Reviewed:**
    - the review record: "Safety review: moderate risk", then who reviewed it and when on a muted line, as on the patient page's tile, and what was found, worded only as far as the record supports ("no plan or intent mentioned");
    - the patient's words;
    - what was done ("Crisis contacts were shown during the check-in. The study team has not contacted the patient");
    - then the protocol's response steps.
  - **PHQ-9 item 9 above 0:** the answer and its frequency, "The study team doesn't review item 9 answers", item 9 at each PHQ-9, whether the conversation was flagged, and the steps.
  - **Awaiting review:** a neutral panel on `tint` with the shield icon, not the safety color, because no one has judged the risk yet. It gives the time the review is due and says "Until then, no email doesn't mean no risk". The summary and transcript are held until the review, so the page never becomes a way around it; What came up says so, once, and the transcript section is left out. Whether a pending review should also show on the patient page and caseload is still open; for now, the mockup shows it only on this page.
  - **Nothing flagged:** "Nothing in this check-in was flagged for study team review. The AI can miss risk", in muted text, never "No risk". A check-in that ended early says so.
  - A positive item 9 the same day always shows, whatever else the block holds.
  - **Record what you did** follows the steps on the check-in that raised the patient's flag (see Safety flag).
  - **Steps,** until the IRB safety text exists: example wording, with the timing and the site's number for urgent risk left as blanks ("[time set in the protocol]") rather than guessed from the calendar, so they can't read as advice.
- **What came up:** the AI summary, labeled once in the heading. Each point has its topic icon, one sentence, and a muted "New", "Life event" or "New life event" where they apply. Under it, the patient's words in quotation marks, at body size in `ink`, because the patient's account comes first, with a "transcript" link to the passage set off by space (on the topic's line when there are no quoted words); then, on its own line, an AI translation when the check-in wasn't in English. The AI's own sentences don't name third parties.
- **Signals** (right column, on `tint`): symptoms that differ from the patient's usual (AI; "None differ from usual" when none do), and phone sensing as that week's daily average against the usual level, in aligned columns, with a link to the weekly trend. A single day against "usual" would invite over-reading.
- **Transcript** (left column, under What came up, beside the links that open it): collapsed under "Show transcript", which becomes "Hide transcript" in the same place. Opening it is logged. Speakers are "AURORA" and "Patient". A reviewed flagged passage is marked ■ Flagged in `safety`, and lines not in English carry their AI translation.
- **Footer:** the dashboard isn't monitored in real time; the study team reviews flagged check-ins within one business day and emails you if the risk is urgent; AI summaries and translations can be wrong, and the patient's own account comes first.
- **Not printed** with the session brief, and not part of the patient handout.

**Patient handout.** A page to go through with the patient, then print. Its question is "what would the patient want to know?" It uses plain words, at about a 6th-to-8th-grade reading level, and the brand's blue-violet rather than status colors, so nothing on it reads as a judgment.
- **Before you print** (on screen only): a tick box for each topic, to leave out anything the patient wouldn't want on paper; on the full handout, a tick box for the lines to fill in, off by default; and a reminder to read the handout through, because parts of it are written by AI. Moving to another patient or page clears the name, ticks, language and edits.
- **Editing** (from October 26): the clinician can change any line written by AI, or print the handout as it is; printing stays one click (clinical planning, October 26).
  - **Edit the wording**, beside Print, turns the AI-written lines into text boxes in place: the summary, What's going well and Things to talk about. The goals stay as the patient wrote them, and the fixed wording (crisis line, the note about the check-ins) stays as the protocol sets it.
  - The button reads Done editing while editing, and the panel counts the edited lines, with Restore the AI wording to undo them. Edits are for that printout only, like the name.
  - In another language, editing happens in the English the clinician reads, and the edited lines are translated for the printout, as the lines about the patient already are. The mockup can't translate, so it says so above the Spanish handout.
  - Edits are logged (bead aurora-1w3), and the protocol's description of the handout must allow them (bead aurora-ubn).
- **Language:** the handout prints in the language the patient chose for check-ins (Spanish for A. Fernández in the mock). The clinician can switch to English to read it through, so both versions must say the same things: the study's translators write the fixed wording, and lines about the patient are translated from the English the clinician reads, not written separately. The panel stays in English. The mockup's Spanish is a draft, labeled as one.
- **Content, in order:**
  - a soft aurora strip at the top right, beside the AURORA mark and clear of the title, then the greeting;
  - a short summary in plain words. It describes symptoms ("more symptoms than usual for you"), never whether the weeks were harder or easier, which is for the clinician and patient to talk through (review note, October 27);
  - What's going well: check-ins done, goals with better days, and lower questionnaire scores when they've come down;
  - the goals as cards, in the patient's words;
  - Your scores over the last few weeks ("How your weeks have gone" until October 27, from the same review note): a simple line of the patient's own PHQ-9 answers, not the AI estimate, with the PHQ-9's scale on its side (0 to 27) and each point's score above it, as on the simple handout (from October 27, as review notes asked), and its ends labeled "More symptoms" and "Fewer symptoms" (Spanish "Más síntomas" and "Menos síntomas"), on two lines each so they fit beside the scale. They say what a higher score means rather than judging how the weeks went, which is for the clinician and patient to talk through (review note, October 27). For the CWG (bead aurora-dar), the review strip's Chart can show the AI estimate instead, weekly from the patient's first week on the same scale, with every other week dated (`&hom=ai`), or both, the estimate as an amber line under the questionnaires' points, with a key (`&hom=both`). The note under the chart and its description for screen readers follow. The simple handout stays on the PHQ-9, because it names ranges, which are for PHQ-9 totals only;
  - Things to talk about at the next visit;
  - only when Before you print's Lines to fill in is ticked: a line for something the patient would like to add, and Your next step, with lines to fill in together. Off by default, from a review note of October 27 (keep it simple, and useful across services and countries); the tick stays set from one patient to the next, as a preference;
  - If things get hard: the site's crisis line, from the site settings, and 988 at US sites only (example wording until the protocol sets it). Each site supplies its line in each language as a whole phrase, because Spanish changes the words around a number ("al 024", "a la línea…");
  - About your check-ins (draft wording until the consent form sets it). It doesn't remind patients that they can stop: the consent form covers that, and a reminder on every printout was felt unhelpful (review note, October 26; bead aurora-ubn);
  - a privacy line.
- **Printout rules.** The protocol and consent forms still need to describe the handout (bead aurora-ubn).
  - Nothing that identifies the patient: no full name, date of birth, study ID, medical record number, address or site. No name either: the patient or clinician can write one in by hand (the first name field went on October 27, from a review note: keep it simple). How names reach the dashboard at all is still open (bead aurora-il5).
  - Nothing about safety flags, PHQ-9 item 9 or transcripts.
  - No AI numbers or labels, and time spans stated plainly ("in the last 2 weeks").
  - Nothing that reads as blame: "You did 9 of 12 check-ins", not "you missed 3".
  - A privacy line: "This page is about your care. Keep it somewhere private."
- **Print:** clear print at 14 pt, on two pages at most. The clinician's panel and the draft labels don't print.
- **Simple** (review option, from October 27): the review strip's Handout switch (Full, Simple; `&ho=simple`) shows the simpler handout three review notes asked for.
  - **What it keeps:** the title "Your questionnaire scores", without a name; the patient's PHQ-9 scores on the PHQ-9's own 0 to 27 scale, each point with its score and the five ranges named lightly at the side, in plain words under a Symptom level caption (very low, low, medium, high, very high: the PHQ-9's minimal to severe, from a review note of October 27). The dashboard keeps the PHQ-9's own names for clinicians, and the Before you print panel maps one to the other; then things to talk about, with no lines to fill in; then the crisis line and the privacy line.
  - **What it drops:** the summary, What's going well, the goals, the next step and the note about the check-ins.
  - **Layout:** things to talk about go below the chart, not beside it, so the chart keeps print-sized labels.
  - **Spanish** names the levels in Spanish (muy bajo to muy alto, under Nivel de síntomas). The working group chooses between the two handouts (Questions tab; bead aurora-sk9).

**Site PI page** *(draft, from October 26)*. `#view=site`. The engagement plan's monitoring, made visible to the site PI: *which of my site's clinicians need a call or support?*
- **Top:** the site; its study clinicians, and how many have the dashboard; patients enrolled; and when the quarterly group case consultation is due.
- **Clinicians:** one row each, from both groups.
  - Enrollment (weeks since randomization, patients) shows for everyone, because recruitment is the same in both arms.
  - Dashboard use (sessions per patient and discussions recorded, last 4 weeks) shows only for clinicians with the dashboard; the others show a dash.
  - **Step due:** where the engagement plan sets one, worded as the plan's step, not as advice: "No patients by week 4, the plan asks for a call from you or a champion"; "2 off-track flags unopened for over a week, the facilitator follows up".
  - Clinicians with a step due come first, then by surname.
- **Never on this page:** patient names, patient outcomes of any kind, or comparisons between clinicians with and without the dashboard. The plan sends differences between arms to the steering committee, and with a few clinicians per site they would mean nothing.
- **Safety reviews:** a placeholder until the study's safety procedure is set (bead aurora-c6i).
- In ink, without status colors, because color means a patient's status.
- *(Mock data: Site 03, with Dr. Okafor and three other fictional clinicians.)*

**Site settings** *(draft, from October 26)*. `#view=settings`, from Site settings on the PI page.
- **Languages** for check-ins and handouts. The study team adds one once its translations are certified.
- **Crisis line:** the sentence the handout gives under If things get hard, in each language, written whole.
- **Number for urgent risk:** what the safety steps tell a clinician to call.
- **Study clinicians:** the roster, which the study team keeps.
- The mockup doesn't save, but the handout and the check-in page's safety steps use the settings until the page is reloaded, so reviewers can see what they change.
- Each clinician's own settings are on Your settings (below).

**Your settings** *(draft, from October 27)*. `#view=account`. The clinician's name at top right opens it in one click; the name carries the page's icon, a person with a gear, and there is no menu.
- **What can be a setting:** how and when AURORA reaches a clinician, and how patients see their name. Never what the dashboard shows, such as the look, which number comes first, the chart's dots or the greeting's line: those are decided once with the CWG, so the intervention is the same for every clinician in the trial. The page's footer says so.
- **Alerts:**
  - The study team's safety email is always on, because the safety procedure requires it. A clinician can add a text message, which says only that an alert is waiting.
  - How they hear between visits that a patient has gone off track: only on the dashboard (the default), a weekly email, or an email the day it happens. Emails link to the dashboard and don't name patients.
  - A draft until the study decides on outreach between visits (bead aurora-12g) and the safety pathway (bead aurora-c6i). Alerts about one patient are set from that patient's page (see Alerts about one patient), and listed here.
- **Your name on handouts:** one field per site language, written to follow "with" or "con", with the handout's line under it as it will read.
- **Patients list:** the order the list opens in: grouped by status (by visit day where the site has visit dates), or sorted by last name or by severity. A heading sort changes only the list in view.
- **Patient handouts:** which handout opens, full or simple. A draft: a setting only if the CWG keeps both.
- **Times:** 12-hour or 24-hour.
- A choice applies at once, without moving the page. Changes are logged (`setting_changed`), and the footer says they're recorded. The study team goes through the page with each clinician at onboarding (bead aurora-o5n).
- The mockup doesn't save, but the dashboard and handouts use the settings until the page is reloaded.

**Welcome** *(draft, from October 27)*. `#view=welcome`: the first page after a clinician's first sign-in (bead aurora-o5n; the whole flow is in `Clinician onboarding workflow` in the project's Clinicians folder).
- Only clinicians in the AURORA arm have the dashboard during the trial, so nothing on Welcome may touch recruitment: no prompt to refer patients, no targets, no praise for enrolling. Recruitment support is the same in both arms and happens outside the dashboard (engagement plan, section 4).
- Two things that can't wait: how patients see the clinician's name on handouts, and the safety alert channel (the email always on, a text optional). Everything else takes its default and lives on Your settings.
- What happens next: the site's facilitator goes through the dashboard with the clinician on their first patient's page (the plan's just-in-time walkthrough).
- "Go to your patients" is the page's one action, as a solid `accent` button, and opens the empty caseload.
- **No patients yet:** before the first patient, the list says so, and what happens when the first one joins, with no prompt to recruit. The greeting band keeps only the greeting and the date. The review strip's Caseload switch shows it (`&empty=1`).

## Refined look *(v3, the default since 2026-10-25; under review)*

A polish pass. Since 2026-10-25 it has been v3's default look; the review strip's Look switch still offers the Original look (deep link `&look=current`). Beauty here comes from calm and precision, not decoration: fewer colors on screen at once, a clearer type hierarchy, softer structure, and one focal point per page.
- **Color:** status words are in `ink`; the shape keeps the status color. Safety wording stays in `safety`. Shape, color and word all remain. *(Amends the Status marker rule if adopted.)*
- **Type:** the patient's name is tracked in slightly (−0.01 em); tile numbers are weight 500, tracked in −0.02 em; group and day headers are in sentence case at `text-md`; section headings have 48 px above them.
- **Structure:** the patients list, What changed and the trend chart sit on a soft two-layer shadow instead of a border, with 10 px corners. Chart gridlines are lighter, as is the uncertainty band. Print keeps plain borders. *(Amends "shadows only on popovers" if adopted.)*
- **Human touch:** an initials avatar (48 px circle) sits beside the name on the patient page, on screen only. Not photos: AURORA doesn't collect them, and they would raise privacy questions.
- **Chart:** a dot marks the latest estimate. (A "Today" mark doesn't fit: the chart ends at the last weekly estimate.)
- **Motion:** row hover eases in; peek cards, readouts and ⓘ tips fade in over 0.12 s. Motion with meaning:
  - **Name to title:** opening a patient from the list morphs the name in the row into the page title (0.34 s, View Transitions where the browser has them), and back again from the breadcrumb. The rest of the page cross-fades quickly (0.18 s). It keeps the clinician's eye on the patient across the change of page.
  - **Trend draw-in:** on the patient page the smoothed line draws itself in once (0.7 s), the band and check-in dots fade in, and the end dot appears last. The drivers panel's lines draw in the same way when it opens.
  - All motion is off when the reduced-motion setting is on, in the Original look, and in print.
- **Drivers panel:** each measure has its icon (moon, footprints, people) and its own cool hue: night indigo for sleep, daylight blue for activity, violet for contact. The hues only say which measure is which. Warm hues and greens mean status and amber is the AI estimate, so these stay cool. They pass the data-viz palette checks for small multiples: color-blind separation across all pairs (worst ΔE 15, target 8), the normal-vision floor (19, floor 15) and 3:1 contrast on white. The lines are smooth but never overshoot a week's value (monotone curves), and a soft wash fills the gap between each line and its usual level. Each title sits on its own line above its chart, so the chart keeps the trend's left edge and the weeks line up. *(Amends the drivers panel's ink-only rule if adopted.)*
- **Greeting band** (Patients page only; the review strip's Greeting switch or `&hero=0` hides it):
  - **Content:** "Good morning, Dr. Okafor", then the date; where visit dates are known, the study visits today or tomorrow, with the calendar icon ("3 study visits tomorrow", since clinicians also see patients who aren't in AURORA); then one short line about the clinician's own work in AURORA.
  - **The line** (from October 26, for review): positive and descriptive, to encourage the work without telling clinicians what to do (principle 8). Each line changes over time, so the band stays worth reading rather than becoming wallpaper (habituation), and each informs rather than pressures: feedback that feels controlling undermines the motivation it's meant to support (self-determination theory). The review strip's Greeting line switch previews each, or none. *(Mock numbers.)*
    - "Your patients completed 107 check-ins in the last 2 weeks", with the check-ins icon, then "Each patient's AI severity estimate below is calculated from their check-ins". The first credits the patients' effort (reciprocity); the second says the check-ins are already used, so 107 doesn't read as 107 to review (review note, October 30). It names the mechanism precisely, "calculated from" rather than "based on", and gives the estimate no human verbs.
    - "You looked at 11 of your 12 patients' pages this week". Reviewing is the first step the A&F playbook measures. It counts reviews as the logging spec defines them (a patient's page with at least 10 seconds of active use), so the line and the trial's review measure agree, and opening a page just to move the number doesn't count. In production it shows only when the share is high, so the greeting never scolds; gaps are for the monthly supervision report. Plain information, no praise: feedback about the self rather than the task can lower performance (feedback intervention theory).
    - "You looked at each patient with a new flag within 3 days this month": the engagement plan's timely flag response, shown only when true.
    - "AURORA clinicians looked at their patients' pages 1,240 times this month": belonging to a group (unity), with a number that moves. Never patient or enrollment counts (recruitment must be the same in both arms), and never a site's own numbers, which would single out colleagues.
    - A tip, in a clinician's first month, such as "Tip: the Patient and Severity headings sort this list".
    - "You're one of 40 AURORA clinicians in 8 countries" stays in the switch for comparison. It barely changes, so it isn't in the proposed rotation.
    - Long lines wrap when a row can't hold them; short facts move whole to the next row. The check-ins line's second sentence sits on a line of its own under the others, so the band's text column, and the art beside it, keep their width.
    - In production, one line a day, rotating among those that apply. Which line each clinician saw is logged (bead aurora-1w3).
  - **Never in the greeting:**
    - comparisons with other clinicians: the monthly A&F report compares each clinician with the top quarter of peers, through their supervisor, and with one to three clinicians per site, a site norm would single out colleagues;
    - patient outcomes, which the A&F playbook keeps out of feedback;
    - anything about enrolling patients or keeping them in the study: the engagement plan keeps recruitment the same in both arms, and only the dashboard arm sees this;
    - praise for the discussion tick boxes, which feed the discussion rate, so praise would invite over-reporting;
    - badges, streaks or celebration. Safety flags aren't repeated here: without visit dates their group comes first, just below, and a second red mark so close would compete with it. By next visit, each flag is on its patient’s row in the schedule. Space separates the facts, not middle dots, and screen readers hear them as sentences.
  - **Layout:** the text starts where the list's does (a 1 px transparent border and 20 px of padding). The art takes its own column to the right of the text: at most 28rem wide, anchored right, fading in over 8rem, and hidden below 52rem, so text never sits on it. On phones (below 32rem) the date shortens to "Wed, Aug 12", so the band stays two lines; screen readers still hear the full date.
  - **Art:** two soft aurora curtains in pale blue and violet, the violet one feathering in behind the blue. Their lower edges are level and undulate gently: edges that rose across the band would read as a worsening trend, in a dashboard where a rising line means worse. Static rays were tried and dropped, because on a white band they read as a blurred bar chart.
  - **Time of day:** the curtains are shorter and paler in the morning and longer and deeper toward evening, but never heavier. Each hour's opacities keep the darkest pixel near 1.8:1 against white.
  - They use cool hues only, because warm hues and greens mean status. The band doesn't animate and isn't printed. It is the one exception to "no decorative graphics" in the dashboard itself.
- **New values,** to add to Tokens once the CWG confirms the look: avatar `#E4EBF4` with `#3D4B57` text; curtains `#A9C4F3` at 100% and `#CABEF2` at 85% (morning), `#8FB0EE` at 70% and `#B3A2EA` at 60% (afternoon), `#6F8EE2` at 44% and `#9682DE` at 37% (evening), in an art column at most 28rem wide that fades in over 8rem; band breakpoints 52rem (no art) and 32rem (short date); drivers `#2C4F94` (sleep), `#2DA1C2` (activity) and `#8254EE` (contact), washes at 12% opacity; gridlines `#EEF1F4`; card shadow `0 1px 2px rgba(16,24,40,.05), 0 4px 12px rgba(16,24,40,.05)`.

## Procedure for each redesign round

1. **Audit content** for the page against its question: keep, move or cut. Get CWG decisions on flagged items. Audits quote the planning meetings, so they stay out of this public repo.
2. **Restyle one page at a time**, using only these tokens.
3. **Screenshot loop.** Serve the repo folder (`python3 -m http.server 8767`) and take headless Chrome screenshots at 1400 px wide.
   - v2 and v3 support deep links, e.g. `AURORA%20Dashboard%20v2.dc.html#view=patient&p=delgado` or `#view=list&order=status`. Add `&clock=24` for 24-hour times. (Links that still carry `&style=`, `&text=` or `&icons=` are ignored: those choices are settled.)
   - Check the printed patient page is one page (`--print-to-pdf`).
   - Save before/after shots to `design/screenshots/` with dated names.
4. **Independent critique.** Give a second model, or a fresh agent, only the screenshots and this file, and ask what to remove. The Gemini CLI needs a Gemini API key.
5. **Checks:** word count per page, distinct colors and distinct font sizes, all within the budgets above.
   - For type, serve the repo and open `design/type-check.html`. It lists the words at each rendered size, and marks anything below 15 px in red.
   - Print sizes are set in pt in the print CSS. Check every printed page still fits one page.
   - Check the caseload and patient page in a window 700 px wide, which is how a laptop looks at 200% zoom.
6. **CWG 5-second test.** Show the screen for 5 seconds and ask "who needs attention first?", then "what does +9 mean?"

### Review checklist
- [ ] Can the page's question be answered in 5 seconds?
- [ ] Interface words within budget?
- [ ] Every explanation appears once?
- [ ] Color used only for status and changes of 5 or more?
- [ ] No bordered chips or pills?
- [ ] Only token sizes, colors, spacing?
- [ ] Status shape + color + word on every status, with four distinct shapes?
- [ ] Change marks don't reuse status shapes?
- [ ] Safety flags first, dated, with review status, and nothing implying "no email means safe"?
- [ ] Labels describe what changed, not what to do? The one exception is a safety flag's response steps: do they come from the protocol text, never the AI, and say so?
- [ ] Icons only show the kind of signal, muted, one per item, always beside text?
- [ ] Tints only in status colors, plus the neutral goals card? Does every tile graphic repeat a number already shown?
- [ ] Printed patient page fits on one page?
- [ ] Body text 17 px, nothing on screen below 15 px, and 15 px only for text a clinician can skip?
- [ ] Safety wording at body size or larger?
- [ ] Prose lines at most about 70 characters?
- [ ] Printed brief at 10 pt body and 9 pt notes, nothing below 8 pt? Printed handout at 14 pt?
- [ ] Caseload and patient page still usable at 200% zoom?
- [ ] Every clock time follows the time-format setting (12-hour by default), and every date puts the month first?
- [ ] American English spelling throughout (color, gray, center, labeled), outside written quotations?
- [ ] Caseload numbers line up by place value, with dates and times left-aligned?
- [ ] Hover readouts also work by keyboard and are announced, and nothing safety-relevant appears only on hover?
- [ ] No browser `title` tooltips? Every ⓘ opens at once by pointer, Tab or tap, and Escape closes it?
- [ ] Does every control that opens something close it from the same place?
- [ ] Does everything clickable look clickable, and can Tab reach it?

## Prompt template for AI design work

> Attached: `DESIGN.md`, the current screenshot of page {X}, and reference screenshots. The page answers one question: "{question}".
> First, **without editing**, list every element you would remove or move and why, judged against that question and the word budget. Then wait for my approval.
> After approval, change only {named elements}, using only tokens from DESIGN.md. Do not add new elements, colors, sizes or explanatory text. Then screenshot the result and report it against the review checklist.

## Reference screenshots *(to collect)*

Put 2–3 images in `design/references/`. Candidates:
- NHS design system (nhs.uk/design-system): table and summary-list patterns;
- GOV.UK design system;
- a well-regarded product dashboard, such as Linear or Stripe.

Pick for restraint and table design, not decoration.

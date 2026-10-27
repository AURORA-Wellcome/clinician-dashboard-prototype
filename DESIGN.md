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
   - Anything that doesn't serve the page's question moves elsewhere.
2. **Say it once.** Units, scales and rules appear once per page, in an ⓘ tooltip or the footer, never on each row or header. AI labeling is the exception and follows the source rule under Components.
3. **Color means status, nothing else.** All data is in neutral ink. Color appears only for:
   - the four statuses (safety flag, worse than baseline, stable or better, too few check-ins);
   - a change of 5 or more points from the patient's baseline.
   
   Decorative or "category" color is not allowed. *(The Refined look proposes one exception: the drivers panel's three cool identity hues; see Refined look.)* Faint tints of the status colors may mark a status group or a flagged tile (see Section styles). The neutral `tint` is a surface, not a color cue.
4. **Whitespace before borders.** Separate items with space and alignment. Panels hold groups of content. No bordered chips or pills (small rounded labels) anywhere.
5. **Status is always triple-encoded** as shape + color + word: ■ Safety flag, ▲ Worse than baseline, ● Stable or better, ◐ Too few check-ins. This survives color blindness and grayscale printing. Every shape must differ: v1's octagon for crisis looked like a circle at 10 px.
6. **Safety flags lead, but the dashboard is not a crisis channel.**
   - Under the safety design agreed on October 19, the study team reviews AI-detected risk and emails the clinician if it is urgent. Risk information doesn't reach the treating clinician in real time (August 13).
   - Safety flags come first: first group in the caseload, first tile on the patient page.
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
   - The account menu, ⓘ tips, the drivers panel and the Notes button all toggle in place; the Notes button reads "Close notes" while the panel is open.
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
- **No middle dots (·)** anywhere in the dashboard:
  - a note follows its text after a comma ("Safety review: moderate risk, today 9:40 AM");
  - a PHQ-9 score's band goes in parentheses, with its range ("20 (severe, 20 to 27)"). Ranges are named for the PHQ-9 only, never the AI estimate, since they were set for PHQ-9 totals;
  - separate facts on one line are set apart by space, and screen readers hear a comma between them;
  - places use ›, as in the breadcrumb ("Landing page › Headline" in the review notes).
- **Other languages** follow their own conventions. The patient handout can print in Spanish, which uses usted, lowercase weekdays and the day before the month ("10 ago").
  - **The clinician's name:** Spanish titles show gender (Dr., Dra.), so the real handout needs each clinician's own choice of how to be named. Until then the mockup says "su terapeuta, E. Okafor".
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
| `nodata-tint` | `rgba(118,134,146,.09)` | Too few check-ins group band |
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
  - **By next visit** (with visit dates, their default): one group per day, with a "Not scheduled" group last. Each day has a full-width header giving the full date, after "Today" or "Tomorrow" where it applies ("Tomorrow, Thursday, August 13"). Day headers carry no count: the greeting band already counts today’s and tomorrow’s study visits, and where flagged patients appear only in the top group, a day’s count disagrees with its rows (review note, October 26). The date is in the header, so the rows show only the time, under the column heading "Time". Safety-flagged patients come first, in a Safety flag group pinned above the day headers. No day header covers those rows, so each of them shows its visit date above the time. Each flagged patient is also listed under their visit day, with their status, so a day lists everyone coming in (from October 27, from a clinician’s review note). The review strip’s Safety flags switch shows the other placements the CWG is asked about: the top group only (as before), or under their day only (`&flagged=pinned` or `&flagged=day`).
  - Day headers are neutral, because color means status. In the distinct style they sit on the neutral `tint`, with no edge.
  - **Grouped by status:** Safety flag, Worse than baseline, Too few check-ins, Stable or better, with patients in visit order within each group, or by last name without visit dates.
- **Caseload columns:** the column you look patients up by comes first, then the rest in order of importance.
  - **Grouped by status:** Patient (with the status shape), Next visit (the order within each group; only with visit dates), Severity, Check-ins, Flag.
  - **By next visit:** Time, Patient, Status, Severity, Check-ins, Flag. Time comes first, as in a day schedule. The Status column (shape and word) stands in for the status groups.
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
- **Check-ins:** the count is always shown. Below 9 of 12 it is bold ink, not colored, because color is reserved for status.
- **Times:**
  - 12-hour by default ("2:00 PM"). Clinicians can switch to 24-hour ("14:00") with the Time format setting in the account menu, which opens from their name at top right. In production, the choice is saved with their account.
  - Every clock time follows the setting: visits, safety reviews, sources.
  - Dates put the month first, US style: "Thu, Aug 13", or "Thu, Aug 13, 2:00 PM" with a time. A space that can't break joins the time to AM or PM.
  - The patient's own words are quoted as written ("waking at 4 am").
- **Buttons:**
  - Secondary actions (Print, Patient handout) are text buttons in `accent`, with no border. Print carries the printer icon, in the button's color.
  - A solid `accent` button is reserved for a page's single primary action; the current pages have none.
  - No outlined buttons.
  - Caseload rows have no action buttons: the whole row opens the patient.
- **Breadcrumbs:** the top bar shows where you are: "Patients › M. Delgado › Patient handout". Pages above this one are links in `accent`, like every other link, with an underline on hover; the current page is `ink`, weight 600. Separators are a muted ›. On phones (below 32rem) the top bar wraps to two rows, the brand and account and then the breadcrumb, which drops the current page when the page has a visible title saying it. No back-arrow icon: it would double up with the separators, and the link color is the standard cue. The current page carries its page icon (see Icons).
- **Links:** anything clickable looks clickable and is reachable with Tab. Links that act on the page, rather than going to an address, are buttons styled as links.
- **Safety flag:**
  - It is the first tile on the patient page, with the marker and text in `safety`.
  - It is the first group in the caseload in either order: grouped by status, or pinned above the day headers by next visit, where the patient is also listed under their visit day.
  - It shows the criterion that raised it, its review status and the date: "Safety review: moderate risk, today 9:40 AM", "PHQ-9 item 9 = 2, not reviewed, Aug 10". Clinicians want to know the thresholds behind an output (Rai et al. 2025, doi:10.2196/78757).
  - Its notes, such as review status, are `text-md`: safety wording is never in the smallest size.
  - The footer, also `text-md`, says that item 9 answers appear without study team review.
  - The wording follows the IRB safety text.
  - In v3, a flagged tile has a "Protocol steps" link. It goes to the check-in page for the day the flag was raised, which opens on the review record and the response steps. Moderate risk isn't emailed, so the steps must be one click from the flag.
- **AI label (source rule):** label AI-derived values at the smallest unit where the source is uniform:
  - once in the header of an all-AI column;
  - on each item where AI and non-AI items mix (flags, changes, chart events);
  - on each value where an AI estimate sits next to a measured score (patient page).
  
  Use quiet "(AI)" text, never a pill, plus one Model Facts link per page. *(Recommended; CWG/IRB to confirm.)*
- **Chart:**
  - The y axis is the PHQ-9 scale, 0–27, with numeric ticks. Don't label severity bands next to lines, because baseline lines then read as severity cutoffs.
  - The AI estimate is a line in `ai-series` with an `ai-band` uncertainty band. The patient's PHQ-9 answers are ink dots.
  - Each check-in's own estimate is a small, faint `ai-series` dot. The line is the smoothed estimate, which the status rules read, so one high or low reading doesn't change a patient's status. *(Mock data: as the detection-latency simulation assumes, the scatter combines day-to-day change with each reading's error, so most readings land within about 4 points of the line. To be confirmed with Deliberate AI and the WP3 idiographic study.)*
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
  - Never use icons for urgency (the status shapes and color do that), never color them, and never show one alone. Each sits next to its text and is hidden from screen readers.
  - **One action icon:** the printer beside Print, the exception to Meaning. It takes the button's color, so the button reads as one control (review note, October 26).
  - **Page icons** (wayfinding, from October 27, from a review note): the current page's name in the breadcrumb has its page's icon: a list for Patients, a person for a patient, a page for the handout, a speech bubble for a check-in (as for check-ins elsewhere), a building for the site PI page, a gear for site settings. Muted, 16 px, hidden from screen readers, and one per top bar, so the rule of one icon per row holds. Not people for the caseload: people already means family and contact.
  - At most one icon per row or item.
  - Used in: caseload flags, "What changed" items (in a left gutter), chart events and the readout's visits, goals, the drivers panel's titles, the greeting band's visits (Refined look) and the Print buttons.
  - No emoji, illustrations or decorative graphics. The exceptions are the brand mark (below), the greeting band in the Refined look, and the patient handout's header.
  - **Landing banner:** outside the dashboard, the landing page opens with a banner. It sets the stage on a page where nobody is working, and it moves calmly but visibly. `design/landing/banner_gen.py` draws it as SVG layers.
    - **Scene:** a night sky with aurora curtains over a low horizon of boreal forest: black spruce on two ridges, as in northern Canada, with a log cabin in a clearing. The forest and cabin are anchored to the bottom of the banner, so a wide screen crops sky rather than forest.
    - **Aurora:** the curtains drift (26 and 34 s) and sway, their rays leaning and lengthening (11 and 15 s). The sway only ever lengthens the curtains, so it never uncovers the top edge. Three ray patterns cross-fade every few seconds, and the bright lower edge pulses. Patches of natural green, violet and magenta wander along the main curtain, brightening and fading. As in strong displays, the magenta is a pink border along the lower edge and a faint orchid in the upper rays.
    - **Stars:** a few accent stars twinkle. Now and then a shooting star glides across the sky. Three take turns, about every 10 s, each for about 2.5 s, so they never cross together. One in three heads right, the others left.
    - **Airliner:** every 100 s or so, a far-off airliner crosses (45 to 50 s), alternating direction. Only its red beacon shows: a flash every 1.2 s and a faint steady light between. It flies straight and level, which in this wide view traces an arc: it rises from one side, is highest, fastest and brightest where it passes nearest, then sinks toward the horizon. `banner_gen.py` computes the path.
    - **Cabin:** off to the right, three-quarters on, with its long side turned toward the middle of the scene. Banners narrower than about 430 px don't show it. Its one window is lit warm, with a slow, faint flicker of firelight. The roof has a faint rim of skylight, and a thin wisp of chimney smoke rises and bends downwind. The smoke and firelight are laid over the drawing in its own units (`.bn-scene`).
    - **Pointer:** these effects need a mouse or pen. Nothing happens on touch or with the reduced-motion setting.
      - Stars near the pointer brighten with a soft sparkle. Each sparkle rises over about half a second and fades over a second. At most one starts every 90 ms, and none is cut short.
      - The treetops below a sparkling star catch a little silvery light, more for a brighter star lower in the sky. The glow is masked to the forest's silhouette, so only the trees catch it, never the sky.
      - The curtains ease a little toward the pointer for depth (over 1.4 s) and drift back over 2.4 s when it leaves. The stars and the forest stay put, because a moving foreground can bring on motion sickness.
      - Pointing at the cabin warms it: its window's light spreads and brightens, and more of it falls on the ground (up over 0.6 s, fading over 1.2 s).
    - **Color:** the banner is the one place green appears outside a status. It is a picture of the sky, on a page with no patient data, while the dashboard keeps to cool hues because green means "on track" there. Its only red is the plane's beacon, a 2.5 px point that moves and blinks, so it reads as a light in the sky rather than a status. Its only warm color is the cabin's lamplight, plainly a light in a window.
    - **Cost:** only transforms and opacity animate, so the banner costs the browser almost nothing. With the reduced-motion setting, it doesn't move.
  - **The aurora motif** carries the banner's colors through the landing page:
    - a soft glow of blue-violet, violet and a little teal behind the latest version's screenshot;
    - a blue-violet-to-violet gradient on the latest version's badge and the How to review step numbers;
    - a closing band of night over the spruce treeline, under a thin aurora line.
  - **In the dashboard,** the motif is only a thin blue-violet-to-violet line under the top bar and the greeting band's curtains (Refined look), and the patient handout's header strip. It never uses green, magenta or warm colors there, and it never appears in charts, statuses or the printed brief. (The drivers panel's hues in the Refined look come from the same cool range, but they are identity colors, not the motif.) Text never sits on a gradient, and motion stays in the banner.
  - The capsule "pill" icon was replaced by the pill bottle because at 16 px it read as a hyperlink symbol.
- **Brand mark:** a 24 px rounded square in a blue-to-violet gradient (`#2E6FD6` to `#7B5CC9`) with two level white aurora ribbons, the lower one shorter and fainter. It sits beside the AURORA wordmark in the top bar (v3 and the landing page) and is the browser-tab icon (`favicon.svg`). Cool hues only, like the greeting band, so it never reads as a status. The ribbons stay level: a rising line would read as rising severity, and two identical waves as "≈".
  - **Tagline** (from October 27): pointing at the mark or the wordmark shows "Rich context, shared understanding", in a popover styled like the ⓘ tips, in v3 and on the landing page. It echoes the name (Adaptive Understanding through Real-time Observation, Reporting, and Assistance) and the shared understanding that routine outcome monitoring works toward, and it promises no results, since the trial is testing them. It is branding, not information, so pointing alone shows it and screen readers skip it. Nothing a clinician needs may go in it.
- **Discussed checkbox** (v2): "Discussed AURORA data with the patient at this visit", at the foot of the patient page. This feeds the discussion-rate measure in the supervisor audit-and-feedback (A&F) playbook.
- **Discussion tick boxes** (v3, from October 26): at the foot of the patient page's summary band, "Today:" with two tick boxes, "The patient brought up their AURORA data" and "I brought up their AURORA data". Each names what was brought up, not "it" (review note, October 27), and "Today" is what a tick records, since the dashboard doesn't know visit dates. They replace v2's checkbox: the clinical group's dashboard suggestions (August 31) asked to record who raised the measures, and the review notes asked for a more prominent place. Either tick counts as discussed for the A&F playbook's discussion rate, and the logging spec records which (bead aurora-1w3). Each patient keeps its own ticks. Not printed.
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
  - **Two-column middle:** "What changed" beside the goals, which sit on a `tint` card with each status on its own line. The trend runs full width below.
  - **Chart zone:** see Chart.
  - **Caseload group bands:** each status group header sits on its status tint, with a 3 px edge in the status color. Day headers (By next visit) sit on the neutral `tint`, with no edge.
  - **Sorting** (from October 27, from a review note): the Patient and Severity headings sort the caseload: once (last name A to Z; severity highest first), then reversed, then back to the status groups. Safety flags stay first in every order (principle 6). Everyone else forms one list under a header that names the order, with Group by status to go back. Severity sorts by the AI estimate, with patients who have none last either way. It is a convenience, not a status, so the caseload opens grouped by status. The heading shows ▲ or ▼, and the order goes in the address (`&sort=name` or `&sort=sev`, `&rev=1` reversed).
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
| Too few check-ins | ◐ half circle | `nodata` | no AI estimate, and the PHQ-9 fallback hasn't fired |
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
- **PHQ-9 ranges** (from October 27): wherever a PHQ-9 score's band is named, its range follows (see Language). The PHQ-9 tile's band has an ⓘ listing all five (0 to 4 minimal, 5 to 9 mild, 10 to 14 moderate, 15 to 19 moderately severe, 20 to 27 severe; Kroenke, Spitzer and Williams, 2001), and Model Facts says the ranges are for the PHQ-9 only. From a review note asking what Mild, Moderate and Severe mean.
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
- **Wording:** the note says these are possible contributors, not causes. This is the model's claim discipline for "shared understanding of symptom drivers".
- **Print:** the panel is not printed.

**Open decisions:**
- suggestions for off-track patients (aurora-04b);
- a supervisor view (aurora-2q1);
- between-visit outreach for off-track flags (aurora-12g);
- the logging spec (aurora-1w3);
- what clinicians may see of check-in conversations (aurora-3yt);
- the wording of the safety response steps (aurora-c6i).

**Check-in page** *(draft)*. `#view=checkin&p=delgado&d=2026-08-10`. The spec is in the project folder (`Clinicians/Check-in detail view spec 2026-10-25.md`). What clinicians may see of the conversations waits on the IRB, so a hatched note at the top says the page is a draft. Only the review strip's seven examples have written conversations.
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
  - **Steps,** until the IRB safety text exists: example wording, with the timing and the site's number for urgent risk left as blanks ("[time set in the protocol]") rather than guessed from the calendar, so they can't read as advice.
- **What came up:** the AI summary, labeled once in the heading. Each point has its topic icon, one sentence, and a muted "New", "Life event" or "New life event" where they apply. Under it, the patient's words in quotation marks, at body size in `ink`, because the patient's account comes first, with a "transcript" link to the passage set off by space (on the topic's line when there are no quoted words); then, on its own line, an AI translation when the check-in wasn't in English. The AI's own sentences don't name third parties.
- **Signals** (right column, on `tint`): symptoms that differ from the patient's usual (AI; "None differ from usual" when none do), and phone sensing as that week's daily average against the usual level, in aligned columns, with a link to the weekly trend. A single day against "usual" would invite over-reading.
- **Transcript** (left column, under What came up, beside the links that open it): collapsed under "Show transcript", which becomes "Hide transcript" in the same place. Opening it is logged. Speakers are "AURORA" and "Patient". A reviewed flagged passage is marked ■ Flagged in `safety`, and lines not in English carry their AI translation.
- **Footer:** the dashboard isn't monitored in real time; the study team reviews flagged check-ins within one business day and emails you if the risk is urgent; AI summaries and translations can be wrong, and the patient's own account comes first.
- **Not printed** with the session brief, and not part of the patient handout.

**Patient handout.** A page to go through with the patient, then print. Its question is "what would the patient want to know?" It uses plain words, at about a 6th-to-8th-grade reading level, and the brand's blue-violet rather than status colors, so nothing on it reads as a judgment.
- **Before you print** (on screen only): an optional first name, which isn't saved; a tick box for each topic, to leave out anything the patient wouldn't want on paper; and a reminder to read the handout through, because parts of it are written by AI. Moving to another patient or page clears the name, ticks, language and edits.
- **Editing** (from October 26): the clinician can change any line written by AI, or print the handout as it is; printing stays one click (clinical planning, October 26).
  - **Edit the wording**, beside Print, turns the AI-written lines into text boxes in place: the summary, What's going well and Things to talk about. The goals stay as the patient wrote them, and the fixed wording (crisis line, the note about the check-ins) stays as the protocol sets it.
  - The button reads Done editing while editing, and the panel counts the edited lines, with Restore the AI wording to undo them. Edits are for that printout only, like the name.
  - In another language, editing happens in the English the clinician reads, and the edited lines are translated for the printout, as the lines about the patient already are. The mockup can't translate, so it says so above the Spanish handout.
  - Edits are logged (bead aurora-1w3), and the protocol's description of the handout must allow them (bead aurora-ubn).
- **Language:** the handout prints in the language the patient chose for check-ins (Spanish for A. Fernández in the mock). The clinician can switch to English to read it through, so both versions must say the same things: the study's translators write the fixed wording, and lines about the patient are translated from the English the clinician reads, not written separately. The panel stays in English. The mockup's Spanish is a draft, labeled as one.
- **Content, in order:**
  - a soft aurora strip at the top right, beside the AURORA mark and clear of the title, then the greeting;
  - a short summary in plain words;
  - What's going well: check-ins done, goals with better days, and the questionnaires if they show things getting easier;
  - the goals as cards, in the patient's words;
  - How your weeks have gone: a simple line of the patient's own PHQ-9 answers, not the AI estimate, with the PHQ-9's scale on its side (0 to 27) and each point's score above it, as on the simple handout (from October 27, as review notes asked), and "Harder" and "Easier" kept at its ends;
  - Things to talk about at the next visit, with a line to add their own;
  - Your next step, with lines to fill in together;
  - If things get hard: the site's crisis line, from the site settings, and 988 at US sites only (example wording until the protocol sets it). Each site supplies its line in each language as a whole phrase, because Spanish changes the words around a number ("al 024", "a la línea…");
  - About your check-ins (draft wording until the consent form sets it). It doesn't remind patients that they can stop: the consent form covers that, and a reminder on every printout was felt unhelpful (review note, October 26; bead aurora-ubn);
  - a privacy line.
- **Printout rules.** The protocol and consent forms still need to describe the handout (bead aurora-ubn).
  - Nothing that identifies the patient: no full name, date of birth, study ID, medical record number, address or site. A first name appears only if the clinician adds it when printing; otherwise the patient can write it in. How names reach the dashboard at all is still open (bead aurora-il5).
  - Nothing about safety flags, PHQ-9 item 9 or transcripts.
  - No AI numbers or labels, and time spans stated plainly ("in the last 2 weeks").
  - Nothing that reads as blame: "You did 9 of 12 check-ins", not "you missed 3".
  - A privacy line: "This page is about your care. Keep it somewhere private."
- **Print:** clear print at 14 pt, on two pages at most. The clinician's panel and the draft labels don't print.
- **Simple** (review option, from October 27): the review strip's Handout switch (Full, Simple; `&ho=simple`) shows the simpler handout three review notes asked for.
  - **What it keeps:** the title "Your questionnaire scores", without a name; the patient's PHQ-9 scores on the PHQ-9's own 0 to 27 scale, each point with its score and the five ranges named lightly at the side, in plain words under a Symptom level caption (very low, low, medium, high, very high: the PHQ-9's minimal to severe, from a review note of October 27). The dashboard keeps the PHQ-9's own names for clinicians, and the Before you print panel maps one to the other; then things to talk about, with no lines to fill in; then the crisis line and the privacy line.
  - **What it drops:** the summary, What's going well, the goals, the next step, the note about the check-ins, and the first name field before printing.
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
- Each clinician's own preferences belong on a clinician settings page (bead aurora-454), set up during onboarding (bead aurora-o5n).

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
  - **The line** (from October 26, for review): positive and descriptive, to encourage the work without telling clinicians what to do (principle 8). The review strip's Greeting line switch previews each, or none. *(Mock numbers.)*
    - "Your patients completed 107 check-ins in the last 2 weeks", with the check-ins icon. It credits the patients' effort (reciprocity).
    - "You opened 11 of your 12 patients' pages this week". Reviewing is the first step the A&F playbook measures. In production this line shows only when the share is high, so the greeting never scolds; gaps are for the monthly supervision report.
    - "You're one of 40 AURORA clinicians in 8 countries": belonging to a group (unity).
    - In production, one line a day, rotating among those that apply. Which line each clinician saw is logged (bead aurora-1w3).
  - **Never in the greeting:**
    - comparisons with other clinicians: the monthly A&F report compares each clinician with the top quarter of peers, through their supervisor, and with one to three clinicians per site, a site norm would single out colleagues;
    - patient outcomes, which the A&F playbook keeps out of feedback;
    - anything about enrolling patients or keeping them in the study: the engagement plan keeps recruitment the same in both arms, and only the dashboard arm sees this;
    - praise for the discussion tick boxes, which feed the discussion rate, so praise would invite over-reporting;
    - badges, streaks or celebration. Safety flags aren't repeated here: their group is pinned first, just below, and a second red mark so close would compete with it. Space separates the facts, not middle dots, and screen readers hear them as sentences.
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
4. **Independent critique.** Give a second model, or a fresh agent, only the screenshots and this file, and ask what to remove. The Gemini CLI on this Mac needs `GOOGLE_CLOUD_PROJECT` set before it will run.
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

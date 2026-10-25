# What changed in each version

Three versions are kept side by side so the working group can compare them; the landing page links to all three. The rules they follow are in [DESIGN.md](DESIGN.md).

## v3: progress-focused

`AURORA Dashboard v3.dc.html`, October 24, 2026, with additions on October 25.

v2, changed to follow the theoretical model (`Theoretical model/` in the project folder) and the off-track rules in `Study design/Measurement/AURORA_additional_data_collection.md`. The rules are in the v3 section of DESIGN.md.
- **Off-track flag:** a two-branch flag on the AI estimate. "Not improving" (▬) is a new status for patients who aren't improving early in care, or who remain symptomatic after 3 months; "Stable or better" becomes "On track". In this trial only, when check-ins are too few for an estimate, the flag falls back on the PHQ-9 and says so.
- **Status line:** the patient page states the trend status, its source and the time in care.
- **Tile order:** the patient's PHQ-9 comes first and at the same size as the AI estimate.
- **Chart:** it draws the rule that applies: baseline + 6 always, plus the expected range early in care or, once the persistence rule fires, the "10: symptomatic" line. The baseline + 6 line is labeled with the status it starts, Worse than baseline, and has an ⓘ saying why it stands out.
- **Drivers panel:** "Show sleep, activity and contact" opens phone-sensing measures on the trend's weeks.
- **Mock patients:** two new ones, `haddad` (early in care, not improving) and `novak` (the PHQ-9 fallback).
- **Refined look** (the default since October 25): status words in ink with colored shapes, finer type, soft shadows, an initials avatar, a dot on the latest estimate, quick fade-ins, and a greeting band on the Patients page, with soft aurora art that follows the time of day. Opening a patient morphs the name into the page title, and the trend line draws in; motion is off with the reduced-motion setting. The review strip's Look switch still offers the Original look.
- **Improving:** a patient on track whose estimate has come down steadily gets a quiet note, "Improving for 11 weeks (AI)", in the caseload and on the status line.
- **Review strip:** settings are grouped with short labels (Page, List, Look, and Greeting on the Refined Patients page). Section style, text size and icons are settled (Distinct, Larger, on), so they are no longer switches.
- **Check-in page** (draft, October 25): what happened at one check-in, and how much weight to give it. It opens from the trend chart (click a day with a check-in, or press Enter in the keyboard readout), from the Check-ins tile (a filled dot, or Latest check-in), from the Safety tile's "What the protocol asks" link, and from What changed items that cite one.
  - **Content:** the safety status first, with the protocol's response steps in example wording (timing and the site's number left blank); this check-in's estimate beside the trend, with a note when the recording weakens it; an AI summary of what came up, with the patient's own words; symptoms and that week's phone sensing; and the transcript, collapsed. Previous and Next step through the patient's check-ins.
  - **Draft:** what clinicians may see of the conversations waits on an IRB decision, so the page is labeled as a draft, and only the examples have written conversations.
  - **Examples:** the review strip's Example group opens seven states: worsening, a reviewed safety flag, a check-in awaiting review, a PHQ-9 item 9 answer, Spanish with translation, a routine check-in, and one too short for an estimate.

## v2: redesign

`AURORA Dashboard v2.dc.html`, October 24, 2026.

The redesign, built to the rules in DESIGN.md. It has three pages:
- **Caseload:** by next visit (the default), with a header for each day, or grouped by status. Safety-flagged patients come first in both.
- **Patient page:** patient detail and session prep merged into one page, which prints as the one-page session brief.
- **Patient handout:** a plain-language page for the patient.

What changed from v1:
- Safety flags follow the October 19 safety design: no crisis banner or Respond buttons.
- HAM-D is removed, pending `aurora-bxi`.
- MRN, diagnosis code and medication list are removed, because AURORA won't have EHR data.
- The text describes what changed rather than prescribing actions.
- The mock data has 10 patients, with visits spread over two weeks.
- Muted line icons mark the kind of signal (medication, sleep, check-ins, and so on). The icons are from [Lucide](https://lucide.dev), under the ISC license.
- **Distinct** sections add a white summary band on the patient page, small graphics in the severity and check-in tiles, a tinted Safety tile when there is a flag, "What changed" beside the goals, a shaded zone on the chart above baseline + 5, and tinted status bands on the caseload. Distinct was settled on October 25, and the one-column **Plain** style is no longer offered.
- **Larger** text follows the type rules in DESIGN.md: 17 px body text, nothing below 15 px, safety wording at body size, and print sizes of at least 9 pt (the handout prints at 14 pt). It is settled, and the earlier, smaller scale is no longer offered.
- On the patients list, resting on a row for a moment shows a peek card: a small trend, severity with its uncertainty and baseline, the latest PHQ-9, item 9, and what changed. Rows are reachable by Tab, and Enter opens the patient.
- The ⓘ icons open their explanation at once, when pointed at or reached by Tab, instead of the browser's delayed tooltip. A click or tap keeps it open; Escape or a click elsewhere closes it.
- On the patient page, pointing at the trend chart shows each day's values: the AI estimate and range, whether that day's check-in was done and what it estimated, the PHQ-9 and item 9 on PHQ-9 days, and any event. From the keyboard, Tab to the chart and use the arrow keys (Shift for a week at a time). In the mock data, check-ins are expected Monday to Saturday, so 12 in 14 days. The last 14 days match each patient's check-in dots, and earlier days follow the same rate.
- The trend chart draws each check-in's own AI estimate as a faint dot around the smoothed line, with the day-to-day scatter the detection-latency simulation assumes. The status rules read the line.
- Times are 12-hour by default ("2:00 PM"). Clinicians can switch to 24-hour in the account menu under their name, at top right. This setting is part of the design, not a review control.

## v1: clinical

`AURORA Dashboard Clinical.dc.html`, August to September 2026.

The first mockup, with a clinical/EHR look. It has three views (caseload triage, patient detail and session prep), each with four review variants you switch between from the review strip at the top.

## Landing page

`index.html` links to all three versions.

- **Headline:** it asks a question in the spirit of motivational interviewing ("What would you want to know before each session?"). The introduction offers the mockups as our answer so far and asks what we've missed.
- **Banner** (since October 25): the page opens with a slowly moving aurora banner. Moving a mouse over it makes nearby stars sparkle and eases the aurora slightly toward the pointer, for depth.
- **Links** (since October 25): each version's heading is a link, and every version's review strip has an "All versions" link back to the landing page.
- **Notes:** a Leave notes step explains that shared notes need the private review link, and offers a dialog to enter its access code. The mockups' Notes panel has the same dialog. Notes can be left on the landing page itself as well as in the mockups.
- **Order:** How to review comes straight after v3. The earlier versions sit below it, oldest first, in a quieter "How we got here" section.

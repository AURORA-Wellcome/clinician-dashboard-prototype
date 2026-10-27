# What changed in each version

Three versions are kept side by side so the working group can compare them; the landing page links to all three. The rules they follow are in [DESIGN.md](DESIGN.md).

## v3: progress-focused

`AURORA Dashboard v3.dc.html`, October 24, 2026, with additions from October 25 to 27.

v2, changed to follow the theoretical model (`Theoretical model/` in the project folder) and the off-track rules in `Study design/Measurement/AURORA_additional_data_collection.md`. The rules are in the v3 section of DESIGN.md.
- **Off-track flag:** a two-branch flag on the AI estimate. "Not improving" (▬) is a new status for patients who aren't improving early in care, or who remain symptomatic after 3 months; "Stable or better" becomes "On track". In this trial only, when check-ins are too few for an estimate, the flag falls back on the PHQ-9 and says so.
- **Status line:** the patient page states the trend status, its source and the time in care.
- **Tile order:** the patient's PHQ-9 comes first and at the same size as the AI estimate.
- **Chart:** it draws the rule that applies: baseline + 6 always, plus the expected range early in care or, once the persistence rule fires, the "10: symptomatic" line. The baseline + 6 line is labeled with the status it starts, Worse than baseline, and has an ⓘ saying why it stands out.
- **Drivers panel:** "Show sleep, activity and contact" opens phone-sensing measures on the trend's weeks. Since October 25, each measure has its icon and its own cool hue in the Refined look, with a smooth line and a soft wash showing how far it has moved from its usual level. Pointing at either chart shows that week's values in the panel.
- **Mock patients:** two new ones, `haddad` (early in care, not improving) and `novak` (the PHQ-9 fallback).
- **Refined look** (the default since October 25): status words in ink with colored shapes, finer type, soft shadows, an initials avatar, a dot on the latest estimate, quick fade-ins, and a greeting band on the Patients page, with soft aurora art that follows the time of day. The band was revised on October 25: level curtains in a column of their own, clear of the text; the visits with a calendar icon; no repeated safety count, since that group is pinned just below; and two lines on a phone. Opening a patient morphs the name into the page title, and the trend line draws in; motion is off with the reduced-motion setting. The review strip's Look switch still offers the Original look.
- **Improving:** a patient on track whose estimate has come down steadily gets a quiet note, "Improving for 11 weeks (AI)", in the caseload and on the status line.
- **No middle dots** (October 25): notes follow a comma, values' bands go in parentheses, and separate facts are set apart by space, in the dashboard and the review notes. On phones the top bar wraps to two rows.
- **Review strip:** settings are grouped with short labels (Page, List, Look, and Greeting on the Refined Patients page). Section style, text size and icons are settled (Distinct, Larger, on), so they are no longer switches.
- **Patient handout** (redesigned, October 25): a page to go through with the patient, then print. It opens with what's going well, shows the goals as cards and a simple line of the patient's own questionnaire answers, lists things to talk about, and leaves lines for a next step to fill in together. It also has the site's crisis line and a short note about the check-ins, both in draft wording. Before printing, the clinician can add a first name, which isn't saved, and untick any topic; both clear when the clinician moves to another patient. The printout carries no identifiers and nothing about safety flags, item 9 or transcripts (DESIGN.md, Patient handout). It prints in the patient's language: A. Fernández's is in Spanish (a draft translation), and the clinician can switch to English to read it through.
- **Check-in page** (draft, October 25): what happened at one check-in, and how much weight to give it. It opens from the trend chart (click a day with a check-in, or press Enter in the keyboard readout), from the Check-ins tile (a filled dot, or Latest check-in), from the Safety tile's "What the protocol asks" link, and from What changed items that cite one.
  - **Content:** the safety status first, with the protocol's response steps in example wording (timing and the site's number left blank); this check-in's estimate beside the trend, with a note when the recording weakens it; an AI summary of what came up, with the patient's own words; symptoms and that week's phone sensing; and the transcript, collapsed. Previous and Next step through the patient's check-ins.
  - **Draft:** what clinicians may see of the conversations waits on an IRB decision, so the page is labeled as a draft, and only the examples have written conversations.
  - **Examples:** the review strip's Example group opens seven states: worsening, a reviewed safety flag, a check-in awaiting review, a PHQ-9 item 9 answer, Spanish with translation, a routine check-in, and one too short for an estimate.
  - **Revised layout** (October 25): two columns at the top, safety on the left in every state and the estimates on the right as a small table, so they stay in place from one check-in to the next. The reviewer and time sit on a muted line under a safety heading; Awaiting review is a neutral panel that says once what is held; translations have their own line; the phone-sensing table is aligned; and the transcript sits under What came up.
- **After the first review notes** (October 26): changes from the reviewers' notes and the clinical planning meeting the same day.
  - **Patients page:** the footer spans the list's full width, in two blocks. Day headers no longer show a count, which disagreed with the rows below when a visit was pinned under Safety flag. The greeting band says "3 study visits tomorrow", since clinicians also see patients who aren't in AURORA.
  - **Patient page:** "AURORA data at this visit" moves up to the foot of the summary band, as two tick boxes, "The patient raised it" and "I raised it", as the clinical group's dashboard suggestions asked; each patient keeps its own ticks. Print has a printer icon. The trend chart shows past clinic visits as marks in a Visits row under the plot, and the readout names a visit and its time.
  - **Model Facts:** the text no longer runs out of the box.
  - **Patient handout:** the note about the check-ins no longer reminds patients that they can stop, in English or Spanish.
  - **Visit dates:** the caseload no longer assumes them, because AURORA isn't assumed to link to a site's EHR. By default, patients are grouped by status, by last name within each group, with no Time or Next visit column; the greeting band no longer counts visits; and the patient page has no next-visit line and no Visits row on the chart. The review strip's new Visit dates switch shows a site that has them, from its EHR or from patients reporting their next visit in check-ins.
  - **Greeting line:** the greeting ends with a short, positive line about the clinician's own work in AURORA: their patients' check-ins (the default), the patient pages they opened this week, or that they're one of the AURORA clinicians. Never comparisons with other clinicians, outcomes or enrollment; DESIGN.md gives the reasons. The review strip's Greeting line switch previews each, and the Questions tab asks the group how it feels.
  - **Editable handout:** Edit the wording, beside Print, turns the AI-written lines (the summary, What's going well, Things to talk about) into text boxes in place; the goals stay as the patient wrote them. Editing is optional, edits are for that printout only, and Restore the AI wording undoes them. For a handout in another language, editing happens in English and the edited lines are translated. Without visit dates, the handout says "your next appointment" rather than a day.
  - **Site PI page and site settings** (draft): for the site PI, which clinicians need a call or support. One row per study clinician, with enrollment for everyone, dashboard use for those with the dashboard, and the engagement plan's step where one is due. No patient names, outcomes or comparisons between the groups. Site settings hold the languages, the crisis line in each language, the number for urgent risk and the roster; the handout and the check-in page use them. The review strip's Page switch reaches both.
  - **Questions for the working group:** the Notes panel has a Questions tab, with sixteen questions across the pages, drawn from the group's open decisions and the review notes. Answers are shared like notes, and others' answers to a question appear once you've given yours.
- **Plainer wording** (October 27, from review notes): the patient page's tick boxes read "Today:", then "The patient brought up their AURORA data" and "I brought up their AURORA data", instead of "it". The Safety tile's link and the check-in page's steps heading say "Protocol steps".
- **Tagline** (October 27): pointing at the AURORA mark or wordmark shows "Rich context, shared understanding". The landing page shows it the same way.
- **PHQ-9 ranges and answers** (October 27, from review notes): wherever a PHQ-9 score's band is named, its range follows ("12 (moderate, 10 to 14)"), and the PHQ-9 tile's band has an ⓘ listing all five. Answers by question, under the PHQ-9 tile, opens the patient's answer to each question, highest first, beside the PHQ-9 before. Model Facts says the ranges are for the PHQ-9 only.
- **Simple handout** (October 27, from review notes, for review): the review strip's Handout switch shows a simpler handout beside the full one. It has the PHQ-9 scores on their own scale with the ranges named in plain words (very low to very high, rather than minimal to severe), things to talk about, the crisis line and the privacy line, and no name, summary, goals or lines to fill in. The Questions tab asks which handout the group would give patients.
- **Scores on the full handout's chart** (October 27, from review notes): How your weeks have gone shows the PHQ-9's scale on its side, 0 to 27, and each point's score, with Harder and Easier kept at its ends. The note under it and its description for screen readers give the scores.

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

The first mockup had a clinical, EHR-style look, with three views (caseload triage, patient detail and session prep), each with four review variants that the review strip at the top switches between.

## Landing page

`index.html` links to all three versions.

- **Headline:** it asks a question in the spirit of motivational interviewing ("What would you want to know before each session?"). The introduction offers the mockups as our answer so far and asks what we've missed.
- **Banner** (since October 25): the page opens with a slowly moving aurora banner. Moving a mouse over it makes nearby stars sparkle and eases the aurora slightly toward the pointer, for depth.
- **Links** (since October 25): each version's heading is a link, and every version's review strip has an "All versions" link back to the landing page.
- **Notes:** a Leave notes step explains that shared notes need the private review link, and offers a dialog to enter its access code. The mockups' Notes panel has the same dialog. Notes can be left on the landing page itself as well as in the mockups.
- **Tagline** (October 27): pointing at the AURORA mark shows "Rich context, shared understanding", as in v3.
- **Order:** How to review comes straight after v3. The earlier versions sit below it, oldest first, in a quieter "How we got here" section.

## All pages

- **Open tabs pick up new versions** (October 26): a reviewer who comes back to a mockup or the landing page after a new version has been published gets it without reloading, on the same page and patient. If they're partway through a note or the handout, a bar offers Reload instead. MAINTAINING.md has the details.
- **See others' notes first** (October 27): where others' notes are hidden until you add one, the Notes panel offers "Show them now". It helps on a second computer or browser, where the page can't tell you've added notes before. The browser remembers the choice, and a line in the panel turns it off again. Answers to the questions still appear once you've given yours.

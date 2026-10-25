# AURORA clinician dashboard — UI mockups

Interactive HTML mockups for the AURORA clinician dashboard, prepared for clinician working group (CWG) review.

## Viewing

Open any `.dc.html` file in a browser; there is no build step. Three versions are kept side by side so the group can compare them. `index.html` links to all three, with a short description of each, and each version's review strip has a quiet **All versions** link back to it. It is also the landing page of the published site, https://aurora-wellcome.github.io/clinician-dashboard-prototype/, which updates when `main` is pushed.

### v3: `AURORA Dashboard v3.dc.html`

v2 changed to follow the theoretical model (`Theoretical model/`) and the off-track rules in `Study design/Measurement/AURORA_additional_data_collection.md`. The rules are in the v3 section of `DESIGN.md`.
- **Off-track flag:** a two-branch flag on the AI estimate. "Not improving" (▬) is a new status for patients who aren't improving early in care, or who remain symptomatic after 3 months; "Stable or better" becomes "On track". In this trial only, when check-ins are too few for an estimate, the flag falls back on the PHQ-9 and says so.
- **Status line:** the patient page states the trend status, its source and the time in care.
- **Tile order:** the patient's PHQ-9 comes first and at the same size as the AI estimate.
- **Chart:** it draws the rule that applies (baseline + 6, the expected range early in care, or the 10 line).
- **Drivers panel:** "Show sleep, activity and contact" opens phone-sensing measures on the trend's weeks.
- **Mock patients:** two new ones, `haddad` (early in care, not improving) and `novak` (the PHQ-9 fallback). Add `&drivers=1` to a link to open the drivers panel.
- **Refined look (the default since October 25):** status words in ink with coloured shapes, finer type, soft shadows, an initials avatar, a dot on the latest estimate, quick fade-ins, and a greeting band with soft aurora art on the Patients page that follows the time of day. Opening a patient morphs the name into the page title, and the trend line draws in; motion is off with the reduced-motion setting. Details are in `DESIGN.md`. The review strip's Look switch still offers the Original look: add `&look=current` to a link, and `&hero=0` to hide the greeting band.
- **Improving:** a patient on track whose estimate has come down steadily gets a quiet note, "Improving for 11 weeks (AI)", in the caseload and on the status line.
- **Review strip:** v3's settings are grouped with short labels (Page, List, Look, and Greeting on the Refined Patients page). Section style, text size and icons are settled (Distinct, Larger, on), so they are no longer switches.
- **Check-in page (draft):** what happened at one check-in, and how much weight to give it. It opens from the trend chart (click a day with a check-in, or press Enter in the keyboard readout), from the Check-ins tile (a filled dot, or Latest check-in), from the Safety tile's "What the protocol asks" link, and from What changed items that cite one.
  - **Content:** the safety status first, with the protocol's response steps in example wording (timing and the site's number left blank); this check-in's estimate beside the trend, with a note when the recording weakens it; an AI summary of what came up, with the patient's own words; symptoms and that week's phone sensing; and the transcript, collapsed. Previous and Next step through the patient's check-ins.
  - **Draft:** what clinicians may see of the conversations waits on an IRB decision, so the page is labelled as a draft, and only the examples have written conversations.
  - **Examples:** the review strip's Example group opens seven states: worsening, a reviewed safety flag, a check-in awaiting review, a PHQ-9 item 9 answer, Spanish with translation, a routine check-in, and one too short for an estimate.

### v2: `AURORA Dashboard v2.dc.html`

The redesign, built to the rules in `DESIGN.md`. It has three pages:
- **Caseload:** by next visit (the default), with a header for each day, or grouped by status. Safety-flagged patients come first in both.
- **Patient page:** patient detail and session prep merged into one page, which prints as the one-page session brief.
- **Patient handout:** a plain-language page for the patient.

What changed from v1:
- Safety flags follow the 19 October safety design: no crisis banner or Respond buttons.
- HAM-D is removed, pending `aurora-bxi`.
- MRN, diagnosis code and medication list are removed, because AURORA won't have EHR data.
- The text describes what changed rather than prescribing actions.
- The mock data has 10 patients, with visits spread over two weeks.
- Muted line icons mark the kind of signal (medication, sleep, check-ins, and so on). The icons are from [Lucide](https://lucide.dev), under the ISC licence.
- **Distinct** sections (settled on October 25; the one-column **Plain** style is no longer offered) add a white summary band on the patient page, small graphics in the severity and check-in tiles, a tinted Safety tile when there is a flag, "What changed" beside the goals, a shaded zone on the chart above baseline + 5, and tinted status bands on the caseload.
- **Larger** text (settled; the earlier, smaller scale is no longer offered) follows the type rules in `DESIGN.md`: 17 px body text, nothing below 15 px, safety wording at body size, and print sizes of at least 9 pt (the handout prints at 14 pt).
- On the patients list, resting on a row for a moment shows a peek card: a small trend, severity with its uncertainty and baseline, the latest PHQ-9, item 9, and what changed. Rows are reachable by Tab, and Enter opens the patient.
- The ⓘ icons open their explanation at once, when pointed at or reached by Tab, instead of the browser's delayed tooltip. A click or tap keeps it open; Escape or a click elsewhere closes it.
- On the patient page, pointing at the trend chart shows each day's values: the AI estimate and range, whether that day's check-in was done and what it estimated, the PHQ-9 and item 9 on PHQ-9 days, and any event. From the keyboard, Tab to the chart and use the arrow keys (Shift for a week at a time). In the mock data, check-ins are expected Monday to Saturday, so 12 in 14 days. The last 14 days match each patient's check-in dots, and earlier days follow the same rate.
- The trend chart draws each check-in's own AI estimate as a faint dot around the smoothed line, with the day-to-day scatter the detection-latency simulation assumes. The status rules read the line.
- Times are 12-hour by default ("2:00 PM"). Clinicians can switch to 24-hour in the account menu under their name, at top right. This setting is part of the design, not a review control.

Deep links open a specific page:
- `#view=patient&p=delgado`
- `#view=list&order=status`
- `#view=handout&p=delgado`
- `#view=checkin&p=delgado&d=2026-08-10` (v3: one check-in; without `&d=`, the patient's example or latest check-in)
- Add `&clock=24` for 24-hour times. Older links' `&style=`, `&text=` and `&icons=` settings are ignored.

Patient ids: `osei`, `whitfield`, `delgado`, `fernandez`, `nguyen`, `mensah`, `santoso`, `kaur`, `brooks`, `ortiz`.

### v1: `AURORA Dashboard Clinical.dc.html`

The earlier version, with a clinical/EHR look. It has three views (A · Caseload triage, B · Patient detail, C · Session prep), each with four review variants you switch between from the scaffold strip at the top.

## Review notes

Reviewers can pin notes to any part of the v2 and v3 mockups. Click **Notes** at bottom right, then **Add a note**, then the part of the page the note is about. A note can be marked as an idea, problem, question or like, and others can reply, +1 or resolve it.
- **Who sees what:** reviewers see others' notes on a page once they have added one there, so the first notes don't steer the rest. The facilitator link shows every note.
- **Access:** notes are shared through a Firebase project (Firestore, with anonymous sign-in). The site is public, so access comes from the invite link, which carries a private board id: `AURORA%20Dashboard%20v3.dc.html?board=<board id>`. Add `&facilitator=1` for the facilitator link. The board id is not in this repo: `firestore.rules` is the template for the project's rules, with the id left out.
- **Without the link,** notes are saved in that browser only. The Firebase web config in `notes.js` is public by design; the rules are what protect the notes.
- **What a note records:** the version, page, patient, part of the page, and the settings in use (section style, text size, icons, caseload order, time format, look). On the check-in page it also records which check-in. It records the site build the page was loaded from (`build.json`, which GitHub Pages fills in with the commit and build time on each deploy), so a note written in a tab opened before an update is matched to what the reviewer saw. **Download notes (CSV)** exports them.
- Notes are review scaffolding, like the review strip: they don't print, and the note form asks reviewers to leave out patient information.

## Other files

- `DESIGN.md`: design rules (principles, word budget, tokens, components, redesign procedure). Draft for CWG review.
- `design/landing/`: the screenshots `index.html` shows, one per version. They are rendered at 2× without the review strip. Regenerate them when a version's caseload or patient page changes. `banner_gen.py` draws the landing page's aurora banner (`python3 design/landing/banner_gen.py banner.svg`, then paste the SVG into `index.html`).
- `design/`: dated before/after screenshots for each redesign round. Content audits quote the planning meetings, so they stay out of this public repo (`.gitignore`). `design/type-check.html` lists the words at each rendered text size. Serve the repo first (`python3 -m http.server 8767`), then open `http://localhost:8767/design/type-check.html`.
- `notes.js`: review notes (see above), loaded by v2 and v3. `firestore.rules`: the template for its Firebase access rules. `build.json`: the site build, filled in on deploy.
- `favicon.svg`: the AURORA mark, used as the browser-tab icon and beside the wordmark in v3 and on the landing page.
- `support.js`: the shared runtime the pages load. Keep it alongside the HTML files.
  - In a page's template, write tables with the runtime's raw tags (`sc-raw-table`, `sc-raw-thead`, `sc-raw-tbody`, `sc-raw-tr`, `sc-raw-th`, `sc-raw-td`); they render as ordinary tables. With plain `<table>` tags, the browser moves `<sc-for>` loops out of the table. The runtime repairs that only when the page is served, so a page opened straight from disk shows an empty table.
- `archive/`: earlier versions (Industry and Classical design systems), kept for reference only. They render unstyled, because the `_ds/` design-system bundles they reference aren't in this repo.

All patient data is pseudo-realistic and fictional.

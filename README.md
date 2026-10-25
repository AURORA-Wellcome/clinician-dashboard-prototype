# AURORA clinician dashboard — UI mockups

Interactive HTML mockups for the AURORA clinician dashboard, prepared for clinician working group (CWG) review.

## Viewing

Open any `.dc.html` file in a browser; there is no build step. Three versions are kept side by side so the group can compare them. `index.html` links to all three, with a short description of each. It is also the landing page of the published site, https://aurora-wellcome.github.io/clinician-dashboard-prototype/, which updates when `main` is pushed.

### v3: `AURORA Dashboard v3.dc.html`

v2 changed to follow the theoretical model (`Theoretical model/`) and the off-track rules in `Study design/Measurement/AURORA_additional_data_collection.md`. The rules are in the v3 section of `DESIGN.md`.
- **Off-track flag:** a two-branch flag on the AI estimate. "Not improving" (▬) is a new status for patients who aren't improving early in care, or who remain symptomatic after 3 months; "Stable or better" becomes "On track". In this trial only, when check-ins are too few for an estimate, the flag falls back on the PHQ-9 and says so.
- **Status line:** the patient page states the trend status, its source and the time in care.
- **Tile order:** the patient's PHQ-9 comes first and at the same size as the AI estimate.
- **Chart:** it draws the rule that applies (baseline + 6, the expected range early in care, or the 10 line).
- **Drivers panel:** "Show sleep, activity and contact" opens phone-sensing measures on the trend's weeks.
- **Mock patients:** two new ones, `haddad` (early in care, not improving) and `novak` (the PHQ-9 fallback). Add `&drivers=1` to a link to open the drivers panel.

### v2: `AURORA Dashboard v2.dc.html`

The redesign, built to the rules in `DESIGN.md`. It has three pages:
- **Caseload:** grouped by status, or by next visit, with a header for each day.
- **Patient page:** patient detail and session prep merged into one page, which prints as the one-page session brief.
- **Patient handout:** a plain-language page for the patient.

What changed from v1:
- Safety flags follow the 19 October safety design: no crisis banner or Respond buttons.
- HAM-D is removed, pending `aurora-bxi`.
- MRN, diagnosis code and medication list are removed, because AURORA won't have EHR data.
- The text describes what changed rather than prescribing actions.
- The mock data has 10 patients, with visits spread over two weeks.
- Muted line icons mark the kind of signal (medication, sleep, check-ins, and so on). The review strip has an Icons on/off switch for comparison. The icons are from [Lucide](https://lucide.dev), under the ISC licence.
- Two section styles, switched in the review strip. **Distinct** (the default) adds a white summary band on the patient page, small graphics in the severity and check-in tiles, a tinted Safety tile when there is a flag, "What changed" beside the goals, a shaded zone on the chart above baseline + 5, and tinted status bands on the caseload. **Plain** is the one-column version.
- Two text sizes, also switched in the review strip. **Larger** (the default) follows the type rules in `DESIGN.md`: 17 px body text, nothing below 15 px, safety wording at body size, and print sizes of at least 9 pt (the handout prints at 14 pt). **Current** is the earlier, smaller scale, kept for comparison.
- On the patients list, resting on a row for a moment shows a peek card: a small trend, severity with its uncertainty and baseline, the latest PHQ-9, item 9, and what changed. Rows are reachable by Tab, and Enter opens the patient.
- The ⓘ icons open their explanation at once, when pointed at or reached by Tab, instead of the browser's delayed tooltip. A click or tap keeps it open; Escape or a click elsewhere closes it.
- On the patient page, pointing at the trend chart shows each day's values: the AI estimate and range, whether that day's check-in was done, the PHQ-9 and item 9 on PHQ-9 days, and any event. From the keyboard, Tab to the chart and use the arrow keys (Shift for a week at a time). In the mock data, check-ins are expected Monday to Saturday, so 12 in 14 days. The last 14 days match each patient's check-in dots, and earlier days follow the same rate.
- Times are 12-hour by default ("2:00 PM"). Clinicians can switch to 24-hour in the account menu under their name, at top right. This setting is part of the design, not a review control.

Deep links open a specific page:
- `#view=patient&p=delgado`
- `#view=list&order=visit`
- `#view=handout&p=delgado`
- Add `&style=plain` or `&style=distinct` for the section style, `&text=current` or `&text=larger` for the text size, `&clock=24` for 24-hour times, and `&icons=0` to hide the icons.

Patient ids: `osei`, `whitfield`, `delgado`, `fernandez`, `nguyen`, `mensah`, `santoso`, `kaur`, `brooks`, `ortiz`.

### v1: `AURORA Dashboard Clinical.dc.html`

The earlier version, with a clinical/EHR look. It has three views (A · Caseload triage, B · Patient detail, C · Session prep), each with four review variants you switch between from the scaffold strip at the top.

## Other files

- `DESIGN.md`: design rules (principles, word budget, tokens, components, redesign procedure). Draft for CWG review.
- `design/landing/`: the screenshots `index.html` shows, one per version. They are rendered at 2× without the review strip. Regenerate them when a version's caseload or patient page changes.
- `design/`: dated before/after screenshots for each redesign round. Content audits quote the planning meetings, so they stay out of this public repo (`.gitignore`). `design/type-check.html` lists the words at each rendered text size. Serve the repo first (`python3 -m http.server 8767`), then open `http://localhost:8767/design/type-check.html`.
- `support.js`: the shared runtime the pages load. Keep it alongside the HTML files.
  - In a page's template, write tables with the runtime's raw tags (`sc-raw-table`, `sc-raw-thead`, `sc-raw-tbody`, `sc-raw-tr`, `sc-raw-th`, `sc-raw-td`); they render as ordinary tables. With plain `<table>` tags, the browser moves `<sc-for>` loops out of the table. The runtime repairs that only when the page is served, so a page opened straight from disk shows an empty table.
- `archive/`: earlier versions (Industry and Classical design systems), kept for reference only. They render unstyled, because the `_ds/` design-system bundles they reference aren't in this repo.

All patient data is pseudo-realistic and fictional.

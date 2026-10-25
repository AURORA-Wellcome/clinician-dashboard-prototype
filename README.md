# AURORA clinician dashboard: design mockups

Interactive mockups of the clinician dashboard for the AURORA trial, for review by the clinician working group (CWG). All patient data are fictional.

**Open the mockups:** https://aurora-wellcome.github.io/clinician-dashboard-prototype/

This public link is for looking. To leave notes the group can see, you need the private review link instead (see How to review).

## What's in the latest version

v3 has four pages:
- **Patients:** the caseload, by next visit or grouped by status, with safety flags always first. Resting on a row shows a quick summary.
- **Patient page:** how the patient is doing and what has changed. The patient's own PHQ-9 sits beside the AI estimate, the trend chart can be read day by day, and goals are in the patient's words. Sleep, activity and contact open on demand. The page prints as a one-page session brief.
- **Check-in** (draft): what happened at one check-in, and how much weight to give it, including what the protocol asks after a safety flag. What clinicians may see of the conversations is waiting on an IRB decision.
- **Patient handout:** a plain-language page to go through with the patient.

v2 and v1 stay available for comparison from the landing page. What changed in each version is in [CHANGELOG.md](CHANGELOG.md).

## How to review

- **Try the 5-second test:** look at the Patients page for five seconds. Who needs attention first?
- **Use the striped strip at the top** to switch pages and options. It isn't part of the design. Its "All versions" link goes back to the landing page.
- **Point at an ⓘ**, or reach it with Tab, for what a scale or rule means.
- **Leave notes:** notes are shared only through a private review link, which has an access code in it. Ask the study team for it, and please don't pass it on outside the group.
  - From that link, click **Notes** at bottom right, then **Add a note**, then the part of the page the note is about.
  - Have the access code but not the link? Enter it under How to review on the landing page, or in the Notes panel.
  - On the public link, notes stay in your own browser and no one else sees them; the Notes panel says so.
  - Please leave out patient information.

## Design rules

[DESIGN.md](DESIGN.md) sets out the rules every screen follows: principles, type and color, components, and a review checklist.

## For maintainers

There is no build step: open any `.dc.html` file in a browser. The published site updates when `main` is pushed. [MAINTAINING.md](MAINTAINING.md) covers deep links, the review notes setup, screenshots, and the runtime's quirks.

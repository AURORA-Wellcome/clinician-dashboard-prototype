# AURORA clinician dashboard: design mockups

Interactive mockups of the AURORA trial's clinician dashboard, for review by the clinician working group (CWG). All patient data are fictional.

**Open the mockups:** https://aurora-wellcome.github.io/clinician-dashboard-prototype/

This public link is for viewing. To leave notes the group can see, you need the private review link (see How to review).

## What's in the latest version

v3 has these pages:
- **Patients:** the caseload, grouped by status, with safety flags always first. Where a site has visit dates, it can also run by next visit. Resting the pointer on a row shows a quick summary.
- **Patient page:** how the patient is doing and what has changed. The patient's own PHQ-9 sits beside the AI estimate, the trend chart can be read day by day, and goals are in the patient's words. Sleep, activity and contact open on demand. The page prints as a one-page session brief.
- **Check-in** (draft): what happened at one check-in, and how much weight to give it. After a safety flag, the page also shows what the protocol asks. The IRB has yet to decide what clinicians may see of the conversations.
- **Patient handout:** a plain-language page to go through with the patient, then print, in the patient's language. A. Fernández's is in Spanish. The clinician can edit the parts written by AI first, or print it as it is.
- **Site PI page and Site settings** (draft): for a site's lead, which of the site's clinicians need a call or support, and what the site sets for everyone, such as its crisis line.
- **Your settings** (draft): each clinician's own settings, from the menu under their name: alerts, their name on handouts, how the list opens, and times.

The landing page links to v2 and v1 for comparison. What changed in each version is in [CHANGELOG.md](CHANGELOG.md).

## How to review

- **Try the 5-second test:** look at the Patients page for five seconds. Who needs attention first?
- **Use the striped strip at the top** to switch pages and options. It isn't part of the design. Its "All versions" link goes back to the landing page.
- **Point at an ⓘ**, or reach it with Tab, to see what a scale or rule means.
- **Leave notes:** notes are shared only through a private review link, which has an access code in it. Ask the study team for the link, and please don't pass it on outside the group.
  - From that link, click **Notes** at bottom right, then **Add a note**, then the part of the page the note is about. This works on the landing page as well as the mockups.
  - Have the access code but not the link? Enter it under How to review on the landing page, or in the Notes panel.
  - On the public link, notes stay in your own browser and no one else sees them; the Notes panel says so.
  - Please leave out patient information.
- **Answer the questions:** in v3, the Notes panel's Questions tab asks a few things about each page. Your answer is shared like a note, and others' answers appear once you've given yours. You can change your answer later.

## Design rules

[DESIGN.md](DESIGN.md) sets out the rules every screen follows: principles, type and color, components, and a review checklist.

## For maintainers

There is no build step: open any `.dc.html` file in a browser. Pushing to `main` updates the published site. [MAINTAINING.md](MAINTAINING.md) covers deep links, the review notes setup, screenshots, and the runtime's quirks.

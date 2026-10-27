# Maintaining the mockups

Notes for whoever edits the mockups. What they are is in the [README](README.md), the rules every screen follows in [DESIGN.md](DESIGN.md), and what changed in each version in [CHANGELOG.md](CHANGELOG.md).

## Running them

- There is no build step: open any `.dc.html` file in a browser, or serve the folder (`python3 -m http.server 8767`) and open `http://localhost:8767/`.
- The published site, https://aurora-wellcome.github.io/clinician-dashboard-prototype/, updates when `main` is pushed. `index.html` is its landing page.
- **Open tabs pick up new builds** (from October 26). Browsers may reuse a page for 10 minutes, so opening the link again already gets the latest version, but a tab left open never checks. So `notes.js` checks every 5 minutes while a page is in view, and whenever the reviewer comes back to it.
  - **How:** GitHub Pages stamps every file with the time of the deploy (Last-Modified), so the check compares the page's own stamp (`document.lastModified`) with a fresh HEAD request for the page. Any deploy counts, even one that changes only the docs.
  - **When the reviewer comes back** to a tab with a newer build, the page reloads itself. The address keeps the page, patient and settings. If they're typing, or partway through something a reload would lose (a note, reply, edit or answer, the handout's name, topics or wording, the site settings, Your settings or a patient's alerts), a bar offers Reload instead, as it does while they stay on the page.
  - **Before reloading,** it fetches the page's own scripts fresh into the browser's cache, so the new page can't run with old scripts. It also saves the build it reloaded for (`aurora-reload-target` in sessionStorage), so a reload that brings back the old page shows the bar rather than looping.
  - **Testing:** pages opened from disk aren't checked. A local server works: `python3 -m http.server` sends Last-Modified from each file's modification time, so touching a file stands in for a deploy.
  - Tabs opened before this change need one reload by hand.
- `support.js` is the shared runtime the pages load. Keep it alongside the HTML files.

## Deep links

A link can open a specific page and settings:
- `#view=list&dates=1` shows visit dates, which are off by default (the list is then grouped by status, by last name). With them on, `&order=visit` (by next visit, the default) or `&order=status`. By next visit, `&flagged=day` (the default) lists safety-flagged patients under their visit day, `&flagged=pinned` only in a group at the top, and `&flagged=both` in both places (v3).
- `#view=list&sort=name` or `&sort=sev` (v3: the patients list sorted by last name or by severity, safety flags first; add `&rev=1` to reverse)
- `#view=patient&p=delgado`
- `#view=handout&p=delgado`; `#view=handout&p=fernandez&lang=en` (v3: the handout in English for a patient whose check-ins are in Spanish); `&ho=simple` for the simple handout (v3)
- `#view=checkin&p=delgado&d=2026-08-10` (v3: one check-in; without `&d=`, the patient's example or latest check-in)
- `#view=site` (v3: the site PI page), `#view=settings` (v3: site settings) and `#view=account` (v3: Your settings)
- `&line=checkins` (the default), `pages`, `clinicians` or `none` sets the greeting's last line (Refined look).
- Add `&clock=24` for 24-hour times, `&drivers=1` to open the drivers panel (v3), `&look=current` for v3's Original look, and `&hero=0` to hide the greeting band.
- Older links' `&style=`, `&text=` and `&icons=` settings are ignored: those choices are settled.

Patient ids: `osei`, `whitfield`, `delgado`, `fernandez`, `nguyen`, `mensah`, `santoso`, `kaur`, `brooks`, `ortiz`, and in v3 also `haddad` and `novak`.

## Review notes

Reviewers can pin notes to any part of the v2 and v3 pages and the landing page. The notes code is in `notes.js`. The landing page loads it with `data-page="landing"`, which gives the landing page its own list of parts, with no patient or settings. A note can be marked as an idea, problem, question or like, and others can reply, +1 or resolve it.
- **Who sees what:** reviewers see others' notes on a page once they have added one there, so the first notes don't steer the rest. The facilitator link shows every note.
  - **Seeing them first** (from October 27): the panel's line about hidden notes has a "Show them now" button, and a line to hide them again. The page knows a reviewer only by their browser (an anonymous Firebase sign-in), so on a second computer or browser their earlier notes don't count and others' notes stay hidden. The choice is kept in that browser (`aurora-notes-show-others` in localStorage).
  - Answers to the questions keep their own rule: others' answers to a question appear once you've given yours, since tallies seen first would sway the group's choices more than notes do.
- **Access:** notes are shared through a Firebase project (Firestore, with anonymous sign-in). The site is public, so access comes from the review link, which carries a private board id: `AURORA%20Dashboard%20v3.dc.html?board=<board id>`. Add `&facilitator=1` for the facilitator link. The link can open a mockup page or the landing page (`https://aurora-wellcome.github.io/clinician-dashboard-prototype/?board=<board id>`); the browser then remembers the board for every page. Either way, the first page a reviewer opens from the link shows the Notes panel, so they find it.
- **Entering the code by hand:** two places open a dialog for the access code (or a whole review link): the landing page's Leave notes step, and the Notes panel whenever notes aren't shared. The code is saved in the browser (`aurora-notes-board` in localStorage), so every page, the mockups and the landing page, then shares notes. The landing page can also remove it. If the browser already holds notes saved only there, the dialog offers to copy them to the shared board; the copy happens when the page next connects (`aurora-notes-carry`). A wrong code gets a plain-language message, and until a code works, new notes stay in the browser.
- **The board id is not in this repo:** `firestore.rules` is the template for the project's rules, with the id left out. The Firebase web config in `notes.js` is public by design; the rules are what protect the notes.
- **Without the link,** notes are saved in that browser only.
- **What a note records:** the version, page, patient, part of the page, and the settings in use (section style, text size, icons, visit dates, caseload order and sorting, time format, look); by next visit, where safety-flagged patients appear; on the check-in page, which check-in; on the v3 handout, its language and style. A note’s Show link, from another page, opens its page with those settings. It also records the site build the page was loaded from (`build.json`, which GitHub Pages fills in with the commit and build time on each deploy), so a note written in a tab opened before an update is matched to what the reviewer saw. **Download notes (CSV)** exports them.
- Notes are review scaffolding, like the review strip: they don't print, and the note form asks reviewers to leave out patient information.
- **Questions** (v3): the panel's Questions tab holds questions for the working group, listed in `QUESTIONS` in `notes.js`, each with a "Show me" link to the page and settings it is about. An answer is saved as a note of kind `answer`, with the question (`q`), the choice and an optional comment, so the Firestore rules need no change. Saving again updates the reviewer's answer. Answers aren't pinned or listed with the notes. Others' answers to a question appear once a reviewer has answered it, and the facilitator link shows them all. The panel's CSV export includes them, with question and choice columns.

## Screenshots and images

- `design/landing/`: the screenshots `index.html` shows, one per version: the caseload in a 1200 × 750 window at 4/3 scale (1600 × 1000 pixels), without the review strip or the Notes button (hide `.review` and the notes' `an-` classes with injected CSS). Regenerate them when a version's caseload or patient page changes.
- `design/landing/banner_gen.py` draws the landing page's aurora banner as layers, which the page animates slowly. To regenerate it:
  1. Run `python3 design/landing/banner_gen.py banner.html plane.css`.
  2. Paste `banner.html` over the banner in `index.html`.
  3. Paste `plane.css` over the `bn-plane-a` and `bn-plane-b` keyframes (the far-off plane's arcing paths).

  The script also writes `design/landing/forest.svg`, the forest's silhouette alone, which masks the starlight the page adds to the treetops. The banner HTML includes `.bn-scene`, which holds the cabin's smoke and firelight at positions computed from the drawing. `.bn-scene` covers the same box as the forest layer, so its `cqw` units are the drawing's (1cqw is 16 units).
- `design/screenshots/`: dated before/after screenshots for each redesign round.
- Content audits quote the planning meetings, so they stay out of this public repo (`.gitignore`).
- `design/type-check.html` lists the words at each rendered text size. Serve the repo first, then open `http://localhost:8767/design/type-check.html`.

## Other files

- `notes.js`: review notes, loaded by v2, v3 and the landing page. `firestore.rules`: the template for its Firebase access rules. `build.json`: the site build, filled in on deploy.
- `favicon.svg`: the AURORA mark, used as the browser-tab icon and beside the wordmark in v3 and on the landing page.
- `archive/`: earlier explorations (Industry and Classical design systems), kept for reference only. They render unstyled, because the `_ds/` design-system bundles they reference aren't in this repo.

## Runtime quirks

- **Tables:** in a page's template, write tables with the runtime's raw tags (`sc-raw-table`, `sc-raw-thead`, `sc-raw-tbody`, `sc-raw-tr`, `sc-raw-th`, `sc-raw-td`); they render as ordinary tables. With plain `<table>` tags, the browser moves `<sc-for>` loops out of the table. The runtime repairs that only when the page is served, so a page opened straight from disk shows an empty table.
- **Values in SVG text:** the runtime wraps each `{{ }}` value in an HTML `<span>`, which SVG doesn't draw, so a value inside `<text>` must go through `T()` (a React fragment), as the charts' dates and the simple handout's scores do.
- **Boolean attributes:** give `checked`, `disabled` and the like a value, as in `checked="{{ o.on }}"`. A bare `checked` or `disabled` reaches React as an empty string, which it reads as false, so the box shows unchecked or enabled (Your settings' always-on Email box did).
- **Chart labels** are SVG text, which can't hold HTML such as an ⓘ button. The label on the baseline + 6 line ("Worse than baseline") is drawn in HTML over the chart instead, sized with the chart (see `.thr-tag`).

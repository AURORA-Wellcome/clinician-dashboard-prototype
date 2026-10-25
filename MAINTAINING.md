# Maintaining the mockups

Notes for whoever edits the mockups. What they are is in the [README](README.md), the rules every screen follows in [DESIGN.md](DESIGN.md), and what changed in each version in [CHANGELOG.md](CHANGELOG.md).

## Running them

- There is no build step: open any `.dc.html` file in a browser, or serve the folder (`python3 -m http.server 8767`) and open `http://localhost:8767/`.
- The published site, https://aurora-wellcome.github.io/clinician-dashboard-prototype/, updates when `main` is pushed. `index.html` is its landing page.
- `support.js` is the shared runtime the pages load. Keep it alongside the HTML files.

## Deep links

A link can open a specific page and settings:
- `#view=list&order=status` (`order=visit`, by next visit, is the default)
- `#view=patient&p=delgado`
- `#view=handout&p=delgado`; `#view=handout&p=fernandez&lang=en` (v3: the handout in English for a patient whose check-ins are in Spanish)
- `#view=checkin&p=delgado&d=2026-08-10` (v3: one check-in; without `&d=`, the patient's example or latest check-in)
- Add `&clock=24` for 24-hour times, `&drivers=1` to open the drivers panel (v3), `&look=current` for v3's Original look, and `&hero=0` to hide the greeting band.
- Older links' `&style=`, `&text=` and `&icons=` settings are ignored: those choices are settled.

Patient ids: `osei`, `whitfield`, `delgado`, `fernandez`, `nguyen`, `mensah`, `santoso`, `kaur`, `brooks`, `ortiz`, and in v3 also `haddad` and `novak`.

## Review notes

Reviewers can pin notes to any part of the v2 and v3 pages and the landing page. The notes code is in `notes.js`. The landing page loads it with `data-page="landing"`, which gives the landing page its own list of parts, with no patient or settings. A note can be marked as an idea, problem, question or like, and others can reply, +1 or resolve it.
- **Who sees what:** reviewers see others' notes on a page once they have added one there, so the first notes don't steer the rest. The facilitator link shows every note.
- **Access:** notes are shared through a Firebase project (Firestore, with anonymous sign-in). The site is public, so access comes from the review link, which carries a private board id: `AURORA%20Dashboard%20v3.dc.html?board=<board id>`. Add `&facilitator=1` for the facilitator link. The link can open a mockup page or the landing page (`https://aurora-wellcome.github.io/clinician-dashboard-prototype/?board=<board id>`); the browser then remembers the board for every page. Either way, the first page a reviewer opens from the link shows the Notes panel, so they find it.
- **Entering the code by hand:** two places open a dialog for the access code (or a whole review link): the landing page's Leave notes step, and the Notes panel whenever notes aren't shared. The code is saved in the browser (`aurora-notes-board` in localStorage), so every page, the mockups and the landing page, then shares notes. The landing page can also remove it. If the browser already holds notes saved only there, the dialog offers to copy them to the shared board; the copy happens when the page next connects (`aurora-notes-carry`). A wrong code gets a plain-language message, and until a code works, new notes stay in the browser.
- **The board id is not in this repo:** `firestore.rules` is the template for the project's rules, with the id left out. The Firebase web config in `notes.js` is public by design; the rules are what protect the notes.
- **Without the link,** notes are saved in that browser only.
- **What a note records:** the version, page, patient, part of the page, and the settings in use (section style, text size, icons, caseload order, time format, look); on the check-in page, which check-in; on the v3 handout, its language. It also records the site build the page was loaded from (`build.json`, which GitHub Pages fills in with the commit and build time on each deploy), so a note written in a tab opened before an update is matched to what the reviewer saw. **Download notes (CSV)** exports them.
- Notes are review scaffolding, like the review strip: they don't print, and the note form asks reviewers to leave out patient information.

## Screenshots and images

- `design/landing/`: the screenshots `index.html` shows, one per version, rendered at 2× without the review strip. Regenerate them when a version's caseload or patient page changes.
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
- **Chart labels** are SVG text, which can't hold HTML such as an ⓘ button. The label on the baseline + 6 line ("Worse than baseline") is drawn in HTML over the chart instead, sized with the chart (see `.thr-tag`).

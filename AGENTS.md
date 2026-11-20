# AGENTS.md

Guide for coding agents, and for people, working on ant-docs: the Docusaurus site for the ant ORM, published at [skudra.net](https://skudra.net). `README.md` has the full detail on each tool; this file is what to know before changing a page.

## The rule that matters most

The docs describe the **latest ant release**, the version `tools/doccheck/go.mod` requires, not ant's `main` branch. A change merged in ant but not released is not documented yet. When ant releases, bump that version (see *A new ant release* in `README.md`) and then update the pages its pull requests listed.

Every Go sample is type-checked against that release, so a page cannot name an API that does not exist. A sample proves it compiles, not that it behaves: check behaviour against ant's tests (`tests/features/<section>` in ant), or run it.

## Checks

```sh
npm install
npm run check          # samples, then the plugin tests, then a production build: run before finishing
npm run check:samples  # type-check every Go fence in docs/ and blog/ against the release
npm run fix:samples    # gofmt the fences, keeping spot comments
npm test               # tests of the llms.txt plugin and structured data
npm run api            # rewrite src/remark/api.json from the release, after bumping it
```

To check a page against unreleased ant, add a git-ignored `go.work` in `tools/doccheck` that uses your ant checkout. Remove it before you finish, so the check runs against the release again.

The owner often has `npm start` running on port 3000. Never stop it. Run a server of your own with `DOCUSAURUS_NO_PERSISTENT_CACHE=true` on another port.

## Where things are

| Path | What it holds |
|---|---|
| `docs/<section>/` | the pages, one per task. The order is in `sidebars.js` |
| `docs/quick-start.mdx`, `docs/index.mdx`, `docs/why-ant.mdx` | the first pages a newcomer reads; `why-ant` holds the comparisons with other libraries |
| `blog/` | posts, also sample-checked |
| `src/components/` | MDX components: `Compare`, `Tests` (links a page to ant's tests), `MarkedCode`, the home page widgets |
| `src/remark/` | the API link plugin and `api.json`, the names of the release's API |
| `src/plugins/llms.js`, `src/plugins/llms-intro.md` | `/llms.txt`, `/llms-full.txt` and a `.md` copy of each page. Keep `llms-intro.md` in step with ant's `skills/ant/SKILL.md` |
| `tools/doccheck/` | the sample checker; `cmd/doccheck/prelude.txt` declares what every sample can use |
| `static/`, `src/css/` | images and the theme: purple accents on cold neutrals; rose only for pain-point underlines |

## How a page reads

- A heading per task, one or two plain sentences, then the code, with the SQL it sends in `// SELECT ...` comments taken from a real run (select lists elided as `...`), then a sentence on anything surprising.
- Mark what a block is about with `// spot-next-line` or `// spot-start` and `// spot-end` (`--` in SQL). Leave the marks out if every line would be lit.
- Don't assume terms. Show N+1 as the literal statements, so a reader can count them.
- No block that repeats the sentence before it, and one structure across sections.
- A visual makes its point with no clicks, and an interactive demo plays by itself first.
- Write plainly: no em dashes, no "Let's", "Here's" or "simply", and no paragraphs that open in bold.
- Comparisons are fair. Take the other library's code from its own docs, run it where you can, and say what it does well.
- End a feature page with `<Tests path="<section>" />`.
- Renaming a heading keeps the old anchor: `## New name {#old-anchor}`.

## When the docs and ant disagree

If a page is wrong because ant is wrong, such as an API whose doc comment says something the code does not do, fix the page to match the release, and open an issue in the ant repository for the bug, not here. ant's design decisions, with an index by file and by topic, are in its `docs/decisions/` folder.

## Branches

GitHub Flow on `main`: a branch per change, rebased on `main`, and a pull request. A push to `main` deploys the site (`.github/workflows/deploy.yml`) once the check passes, so `main` must always build.

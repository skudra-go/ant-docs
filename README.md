# ant-docs

The documentation site for [ant](https://github.com/skudra-go/ant), built with [Docusaurus](https://docusaurus.io).

## Running it

```sh
npm install
npm start           # the site, with live reload, at localhost:3000
npm run check       # check every Go sample, then build
```

Search only works in a production build: `npm run build && npm run serve`. A build keeps its generated files apart from the dev server's, so it is safe to run beside `npm start`. If the dev server ever reports an empty JSON file or a failed chunk, or keeps showing something you changed, reload the page, and `npm run clear` if it stays. Two dev servers at once share webpack's cache in `node_modules/.cache`, so start a second one with `DOCUSAURUS_NO_PERSISTENT_CACHE=true`.

The sample check needs Go 1.27. It checks against the ant release that `tools/doccheck/go.mod` requires, downloaded like any other module, so the docs describe what users get.

`DOCS_URL` and `DOCS_BASE_URL` set where the site is hosted when building it. The default is `https://skudra.net`.

## Deploying

The site is published to [skudra.net](https://skudra.net) as a Cloudflare Worker that serves the static build, configured in `wrangler.jsonc`.

```sh
npm run preview     # build, then serve it locally the way Cloudflare will
npx wrangler login  # once, in a browser
npm run deploy      # build, then publish
```

A push to `main` deploys by itself (`.github/workflows/deploy.yml`), once the samples check and the site builds. That needs two repository secrets: `CLOUDFLARE_API_TOKEN`, made from the "Edit Cloudflare Workers" token template, and `CLOUDFLARE_ACCOUNT_ID`. Pull requests run the same check without deploying.

## Writing a page

Each page lives in `docs/` and is listed in `sidebars.js`. Keep to one shape: a sentence on what the thing is, a sample, and a sentence on anything surprising.

### The spotlight

Comments mark what a block is about. Everything else in the block steps back into shadow until it is hovered, and the comments never reach the page.

````md
```go
user, err := db.Users.Find(ctx, id)

// spot-next-line
user.Age++

// spot-start
err = db.SaveChanges(ctx)
// spot-end
```
````

Use `--` in place of `//` in SQL. If every line would be lit, leave the comments out.

### Before and after

The home page sets other libraries beside ant. A `marks` fence underlines part of a line: `⟦-:text⟧` is a problem, in a wavy line, and `⟦+:text⟧` is the fix. A sentence after each block says what it means, and the bullets in `Ant` say what is different.

Be fair to the other library. Use code from its own documentation, run it if you can, and say what it does well.

````md
<Pain>
<Compare>
<Others>
<Lib>

```go marks no-check title="GORM"
db.Where(⟦-:"age <= ?"⟧, 18)
```

The compiler sees a string.

</Lib>
</Others>
<Ant>

```go marks title="ant"
db.Users.Where(ant.Lte(⟦+:&Users.Age⟧, 18))
```

- A typo does not build.

</Ant>
</Compare>
</Pain>
````

### Linking to tests

End a feature page with `<Tests path="querying" />`, which links to the tests behind it, as of the release.

### Links to the API

The first mention of an API name on a page, in backticks, becomes a link to its entry on pkg.go.dev, with its declaration and the first sentence of its doc comment shown on hover. Nothing needs marking up: `ant.Open`, `migrate.Config`, `db.SaveChanges`, `b.HasMany`, `db.Users.Find`, and `Table.Where` are all recognised, and so is a bare method name like `Include` when it can only mean one thing. Mentions inside `Others` and `Lib` are left alone, and inside `Pain` only names written with their package are linked, because the other libraries have methods with the same names.

A mention like `ant.Foo` of a name that doesn't exist fails the build.

The names come from `src/remark/api.json`, which `npm run api` writes from the release's source.

## How samples are checked

`npm run check:samples` type-checks every Go fence against the ant release, and fails on anything that does not compile or is not gofmt-formatted. `npm run fix:samples` formats them first, keeping the spot comments. It lives in `tools/doccheck`.

A sample can be declarations, statements, both in that order, or a whole file. Each one sees:

- the shared `User`, `Post`, `AppDB`, `U`, `P`, `ctx`, `db`, and a few others, from `tools/doccheck/cmd/doccheck/prelude.txt`
- whatever the page declared so far, with a later declaration replacing an earlier one
- anything declared further down the page, unless the prelude already defines it
- the usual imports, so samples need not repeat them

A page that declares its own context gets `db` as that type. Setup a reader does not need can go in a fence inside an MDX comment, which is checked but not shown:

````md
{/*
```go
type PageDB struct {
	ant.Context
	Orders ant.Table[Order]
}
```
*/}
````

Flags go in the fence's info string:

| Flag | Means |
| --- | --- |
| `no-check` | Skip this sample, as for code from another library |
| `compile-fail` | This sample must not compile |
| `keep-db` | A context declared here does not change what `db` is |

## A new ant release

1. `cd tools/doccheck && go get github.com/skudra-go/ant@vX.Y.Z && go mod tidy`
2. `npm run api`, so links and hover cards match it. The build refuses to run while `api.json` is for another version.
3. `npm run check`, and fix what the release changed.

To check the docs against ant changes that aren't released yet, point doccheck at a local copy with a workspace, which git ignores:

```sh
cd tools/doccheck
go work init . ../../../ant
```

Delete `go.work` when the release is out.

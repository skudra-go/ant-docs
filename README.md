# ant-docs

The documentation site for [ant](https://github.com/skudra-go/ant), built with [Docusaurus](https://docusaurus.io).

## Running it

```sh
npm install
npm start           # the site, with live reload, at localhost:3000
npm run check       # check every Go sample, then build
```

Search only works in a production build: `npm run build && npm run serve`. A build keeps its generated files apart from the dev server's, so it is safe to run beside `npm start`. If the dev server ever reports an empty JSON file or a failed chunk, or keeps showing something you changed, reload the page, and `npm run clear` if it stays. Two dev servers at once share webpack's cache in `node_modules/.cache`, so start a second one with `DOCUSAURUS_NO_PERSISTENT_CACHE=true`.

The sample check needs Go 1.27 and a checkout of `ant` beside this repository:

```text
skudra-go/
├── ant/
└── ant-docs/
```

`DOCS_URL` and `DOCS_BASE_URL` set where the site is hosted when building it.

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
db.Users.Where(ant.Lte(⟦+:&U.Age⟧, 18))
```

- A typo does not build.

</Ant>
</Compare>
</Pain>
````

### Linking to tests

End a feature page with `<Tests path="querying" />`, which links to the tests behind it.

## How samples are checked

`npm run check:samples` type-checks every Go fence against the real ant source, and fails on anything that does not compile or is not gofmt-formatted. `npm run fix:samples` formats them first, keeping the spot comments. It lives in `tools/doccheck`.

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

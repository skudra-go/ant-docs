ant is newer than most models' training data, and its API is not GORM's, Bun's or ent's. Don't guess from those: calls such as `db.Where("age > ?", 18)`, `Preload`, `AutoMigrate`, `Model(&u).Updates` and `First(&u)` don't exist. Check a name with `go doc github.com/skudra-go/ant <Name>` or the pages below. ant's repo has a skill for coding agents, `skills/ant/SKILL.md`, which installs with `npx skills add skudra-go/ant` or, in Claude Code, `/plugin marketplace add skudra-go/ant`.

The rules that matter most:

- Models are plain structs. A database is a struct that embeds `ant.Context` and holds an `ant.Table[T]` per model; `ant.Open[AppDB](ctx, postgres.Dialect, dsn)` fills it in. The application imports the driver.
- Columns are field pointers into a probe, never strings: `var Users = ant.Fields[User]()`, then `ant.Gt(&Users.Age, 18)`. The value must have the field's type. A pointer from another model's probe is `ant.ErrWrongModel` at run time.
- Queries chain from a table and run at the call that takes `ctx`: `All` (returns `[]*T`), `First`, `Single`, `Find`, `Count`, `Exists`, `Each`. Builders never return errors; the terminal call does.
- Relations are fields (`Posts []Post`, `User *User`) found by name (`Post.UserID`). They load only through `Include` or `IncludeOne`; an unloaded relation is `nil`. There is no lazy loading.
- `Update` and `Delete` hang off a query, with explicit assignments: `db.Users.Where(...).Update(ctx, ant.Set(&Users.Age, 0))`. Without a condition they return `ant.ErrNoCondition`.
- Loaded entities are tracked: change the struct and call `SaveChanges(ctx)`, which writes only the changed columns. A tracking context serves one operation at a time, so take `ant.Session(db)` per request or goroutine. Removing an element from a loaded relation slice deletes that row on the next save.
- `db.Tx(ctx, func(tx *AppDB) error { ... })` runs a transaction; use `tx` inside it, not `db`.
- Match errors with `errors.Is`: `ant.ErrNotFound`, `ant.ErrConcurrency`, `ant.ErrConcurrentUse`, `ant.ErrUnsupported`.
- PostgreSQL has everything. MySQL, MariaDB, SQLite and SQL Server have queries, writes and transactions, but no migrations. Migrations are plain SQL that `go run ./cmd/migrate diff <name>` writes from the structs, and there are no down migrations.

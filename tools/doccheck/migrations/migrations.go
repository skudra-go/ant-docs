// Package migrations stands in for an application's embedded migrations.
package migrations

import "embed"

// Files holds the migrations.
//
//go:embed all:versions all:code
var Files embed.FS

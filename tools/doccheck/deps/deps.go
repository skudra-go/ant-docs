// Package deps imports everything a sample may use, so go.mod records it and the
// checker can find its compiled form.
package deps

import (
	_ "embed"
	_ "net/http"

	_ "github.com/jackc/pgx/v5/stdlib"

	_ "github.com/skudra-go/ant"
	_ "github.com/skudra-go/ant/anttest"
	_ "github.com/skudra-go/ant/dialect"
	_ "github.com/skudra-go/ant/dialect/mysql"
	_ "github.com/skudra-go/ant/dialect/postgres"
	_ "github.com/skudra-go/ant/dialect/postgres/pgxext"
	_ "github.com/skudra-go/ant/dialect/sqlite"
	_ "github.com/skudra-go/ant/dialect/sqlserver"
	_ "github.com/skudra-go/ant/ids"
	_ "github.com/skudra-go/ant/metrics"
	_ "github.com/skudra-go/ant/migrate"
	_ "github.com/skudra-go/ant/schema"
	_ "github.com/skudra-go/ant/secure"
	_ "github.com/skudra-go/ant/validate"

	_ "example.com/app/migrations"
	_ "example.com/app/models"
)

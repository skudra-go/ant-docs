// Package models stands in for an application's models, for samples that import
// example.com/app/models.
package models

import "github.com/skudra-go/ant"

// User is the main model of the docs.
type User struct {
	ant.Base
	Name  string
	Email string `ant:"unique"`
	Age   int
	Admin bool
	Bio   *string
	Posts []Post
}

// Post belongs to a User.
type Post struct {
	ant.Base
	UserID    int64
	Title     string
	Published bool
	User      *User
}

// Role is what seed samples create.
type Role struct {
	ID   int64
	Name string
}

// AppDB is the application's database context.
type AppDB struct {
	ant.Context
	Users ant.Table[User]
	Posts ant.Table[Post]
	Roles ant.Table[Role]
}

// Field probes.
var (
	Users = ant.Fields[User]()
	Posts = ant.Fields[Post]()
	Roles = ant.Fields[Role]()
)

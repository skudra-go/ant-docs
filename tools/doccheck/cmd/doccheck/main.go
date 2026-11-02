// Command doccheck type-checks every Go sample in the docs against the ant release
// go.mod names, so a sample cannot name an API that users do not get.
//
// A sample may be a whole file, declarations, statements, or declarations followed
// by statements. Statements run inside a function, with the page's earlier
// declarations and a shared prelude in scope, so a sample shows only what it is
// about. A later declaration replaces an earlier one of the same name, and a page
// that declares its own context gets db as that type. Setup can sit anywhere on a
// page, because declarations further down are in scope too.
//
// Samples must also be gofmt-formatted, where gofmt can parse them. The -fix flag
// formats them, keeping the spot comments that mark what a block lights up.
//
// Flags in the fence's info string:
//
//	no-check      skip this sample, as for code from another library
//	compile-fail  this sample must not compile
//	keep-db       a context declared here does not change what db is
//
// A fence inside an MDX comment is checked but not shown, which suits setup a page
// needs and readers do not.
package main

import (
	"bytes"
	"flag"
	"fmt"
	"go/ast"
	"go/format"
	"go/importer"
	"go/parser"
	"go/token"
	"go/types"
	"io"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"slices"
	"strings"

	_ "embed"
)

//go:embed prelude.txt
var prelude string

// imports are in scope for every sample. Unused ones are not errors here.
var imports = []string{
	`"context"`,
	`"crypto/hmac"`,
	`"crypto/sha256"`,
	`"encoding/hex"`,
	`"database/sql"`,
	`"database/sql/driver"`,
	`"embed"`,
	`"errors"`,
	`"fmt"`,
	`"io/fs"`,
	`"log"`,
	`"log/slog"`,
	`"net/http"`,
	`"os"`,
	`"reflect"`,
	`"regexp"`,
	`"slices"`,
	`"strings"`,
	`"sync"`,
	`"testing"`,
	`"time"`,
	`"github.com/skudra-go/ant"`,
	`"github.com/skudra-go/ant/anttest"`,
	`"github.com/skudra-go/ant/contrib/otel"`,
	`"github.com/skudra-go/ant/dialect"`,
	`"github.com/skudra-go/ant/dialect/mysql"`,
	`"github.com/skudra-go/ant/dialect/postgres"`,
	`"github.com/skudra-go/ant/dialect/postgres/pgxext"`,
	`"github.com/skudra-go/ant/dialect/sqlite"`,
	`"github.com/skudra-go/ant/dialect/sqlserver"`,
	`"github.com/skudra-go/ant/ids"`,
	`"github.com/skudra-go/ant/metrics"`,
	`"github.com/skudra-go/ant/migrate"`,
	`"github.com/skudra-go/ant/schema"`,
	`"github.com/skudra-go/ant/secure"`,
	`"github.com/skudra-go/ant/validate"`,
	`"go.opentelemetry.io/otel/trace"`,
	`"example.com/app/migrations"`,
	`"example.com/app/models"`,
}

var (
	fenceOpen = regexp.MustCompile("^\\s*(`{3,})go\\b(.*)$")
	marks     = regexp.MustCompile(`⟦[+-]:|⟧`)
	spots     = regexp.MustCompile(`(?m)^[ \t]*// spot-(start|end|next-line)\n`)
	contexts  = regexp.MustCompile(`type (\w+) struct \{\s+ant\.Context\b`)
)

// sample is one fenced Go block.
type sample struct {
	file  string
	line  int // of the first line of code
	text  string
	flags string
}

func (s sample) has(flag string) bool {
	return slices.Contains(strings.Fields(s.flags), flag)
}

// decl is one top-level declaration in scope for a page's samples.
type decl struct {
	names []string
	text  string
}

// checker holds what every page shares.
type checker struct {
	fset     *token.FileSet
	imported types.Importer
	fix      bool
	base     []decl
	failures int
	checked  int
	skipped  int
}

func main() {
	fix := flag.Bool("fix", false, "rewrite samples with gofmt, keeping spot comments")

	flag.Parse()

	if flag.NArg() != 1 {
		fmt.Fprintln(os.Stderr, "usage: doccheck [-fix] <docs folder>")
		os.Exit(2)
	}

	fset := token.NewFileSet()

	compiled, err := exportData()
	if err != nil {
		fmt.Fprintln(os.Stderr, "go list:", err)
		os.Exit(1)
	}

	c := &checker{
		fset: fset,
		fix:  *fix,
		imported: importer.ForCompiler(fset, "gc", func(path string) (io.ReadCloser, error) {
			file, ok := compiled[path]
			if !ok {
				return nil, fmt.Errorf("%s is not in the deps package", path)
			}

			return os.Open(file)
		}),
	}

	if c.base, err = declsOf(prelude, "prelude.txt", 1); err != nil {
		fmt.Fprintln(os.Stderr, "prelude:", err)
		os.Exit(1)
	}

	err = filepath.WalkDir(flag.Arg(0), func(path string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if entry.IsDir() || !strings.HasSuffix(path, ".mdx") && !strings.HasSuffix(path, ".md") {
			return nil
		}

		return c.page(path)
	})
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	fmt.Printf("%d samples checked, %d skipped, %d failed\n", c.checked, c.skipped, c.failures)

	if c.failures > 0 {
		os.Exit(1)
	}
}

// exportData builds the deps package and returns where each import's compiled form
// is, which is far quicker than type-checking ant from source for every run.
func exportData() (map[string]string, error) {
	list := exec.Command(
		"go",
		"list",
		"-export",
		"-deps",
		"-f",
		"{{.ImportPath}} {{.Export}}",
		"./deps",
	)

	list.Env = append(os.Environ(), "CGO_ENABLED=0")
	list.Stderr = os.Stderr

	out, err := list.Output()
	if err != nil {
		return nil, err
	}

	compiled := map[string]string{}

	for line := range strings.SplitSeq(string(out), "\n") {
		if path, file, ok := strings.Cut(line, " "); ok && file != "" {
			compiled[path] = file
		}
	}

	return compiled, nil
}

// page checks one document's samples in order.
func (c *checker) page(path string) error {
	if c.fix {
		if err := fixPage(path); err != nil {
			return err
		}
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	var parsed []part

	for _, s := range samples(path, string(data)) {
		if s.has("no-check") {
			c.skipped++

			continue
		}

		parsed = append(parsed, parse(s))
	}

	for i, p := range parsed {
		c.checked++

		problems := p.problems

		if p.full {
			problems = append(problems, c.check(p.sample, p.sample.text)...)
		} else if p.problems == nil {
			problems = c.check(p.sample, source(p, c.scope(parsed, i)))
		}

		// Spot comments never reach the page, so gofmt should not see them.
		shown := spots.ReplaceAllString(p.sample.text+"\n", "")

		if formatted, err := format.Source([]byte(shown)); err == nil &&
			strings.TrimSpace(string(formatted)) != strings.TrimSpace(shown) {
			problems = append(
				problems,
				"not gofmt-formatted: "+firstDifference(shown, string(formatted)),
			)
		}

		switch {
		case p.sample.has("compile-fail") && len(problems) == 0:
			c.report(p.sample, "this sample is marked compile-fail, and it compiles")
		case !p.sample.has("compile-fail"):
			for _, problem := range problems {
				c.report(p.sample, problem)
			}
		}
	}

	return nil
}

// scope is what sample i can see: the prelude, what the page has declared so far,
// then anything declared further down that the prelude does not define, so setup
// can sit anywhere on a page. A page's context always wins over the prelude's db.
func (c *checker) scope(parsed []part, i int) []decl {
	scope := slices.Clone(c.base)
	seen := map[string]bool{}

	add := func(d decl) {
		scope = replace(scope, d)

		for _, name := range d.names {
			seen[name] = true
		}
	}

	for _, p := range parsed[:i+1] {
		for _, d := range p.declared {
			add(d)
		}
	}

	for _, p := range parsed[i+1:] {
		for _, d := range p.declared {
			if !slices.ContainsFunc(d.names, func(name string) bool {
				return seen[name] || name != "db" && c.inPrelude(name)
			}) {
				add(d)
			}
		}
	}

	return scope
}

func (c *checker) inPrelude(name string) bool {
	return slices.ContainsFunc(c.base, func(d decl) bool {
		return slices.Contains(d.names, name)
	})
}

// part is a sample split into what it declares and what it runs.
type part struct {
	sample   sample
	full     bool // a whole file, with nothing to add
	head     head
	body     string
	declared []decl
	problems []string
}

func parse(s sample) part {
	if isFile(s.text) {
		return part{sample: s, full: true}
	}

	top, body, err := split(s.text)
	if err != nil {
		return part{sample: s, problems: []string{err.Error()}}
	}

	found, err := declsOf(top.text, s.file, s.line)
	if err != nil {
		return part{sample: s, problems: []string{err.Error()}}
	}

	var declared []decl

	for _, d := range found {
		declared = append(declared, d)

		// A page with its own context means db to be that context.
		if m := contexts.FindStringSubmatch(d.text); m != nil && !s.has("keep-db") {
			declared = append(declared, decl{
				names: []string{"db"},
				text:  "var db *" + m[1],
			})
		}
	}

	return part{
		sample:   s,
		head:     top,
		body:     body,
		declared: declared,
	}
}

// source writes one sample as a file, with scope in force.
func source(p part, scope []decl) string {
	var src strings.Builder

	src.WriteString("package sample\n\nimport (\n")

	for _, path := range merged(p.head.imports) {
		src.WriteString("\t" + path + "\n")
	}

	src.WriteString(")\n\n")

	for _, d := range scope {
		src.WriteString(d.text + "\n\n")
	}

	if strings.TrimSpace(p.body) != "" {
		line := p.sample.line + strings.Count(p.head.text, "\n")

		src.WriteString("func sampleBody() error {\n")
		fmt.Fprintf(&src, "//line %s:%d\n", p.sample.file, line)
		src.WriteString(p.body + "\n\n\treturn nil\n}\n")
	}

	return src.String()
}

// fixPage rewrites a page's samples with gofmt, putting spot comments back on the
// lines they marked. A sample with marks, or that gofmt reshapes, is left to you.
func fixPage(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	lines := strings.Split(string(data), "\n")
	found := samples(path, string(data))

	for _, s := range slices.Backward(found) {
		if s.has("no-check") || s.has("compile-fail") || s.has("marks") {
			continue
		}

		code := strings.Split(s.text, "\n")

		if out, ok := fixed(code); ok {
			first := s.line - 1
			lines = slices.Replace(lines, first, first+len(code), out...)
		}
	}

	out := []byte(strings.Join(lines, "\n"))

	// A write to an unchanged page would still wake a running dev server.
	if bytes.Equal(out, data) {
		return nil
	}

	return os.WriteFile(path, out, 0o644)
}

func fixed(code []string) ([]string, bool) {
	var shown []string

	before := map[int][]string{}

	for _, line := range code {
		if spots.MatchString(line + "\n") {
			before[len(shown)] = append(before[len(shown)], strings.TrimSpace(line))

			continue
		}

		shown = append(shown, line)
	}

	formatted, err := format.Source([]byte(strings.Join(shown, "\n")))
	if err != nil {
		return nil, false
	}

	result := strings.Split(strings.TrimRight(string(formatted), "\n"), "\n")
	if len(result) != len(shown) {
		return nil, false
	}

	var out []string

	for i, line := range result {
		indent := line[:len(line)-len(strings.TrimLeft(line, "\t"))]

		for _, comment := range before[i] {
			// A block ends at the depth of what it closed, as above a ")".
			if comment == "// spot-end" && i > 0 {
				prev := result[i-1]
				indent = prev[:len(prev)-len(strings.TrimLeft(prev, "\t"))]
			}

			out = append(out, indent+comment)
		}

		out = append(out, line)
	}

	return append(out, before[len(result)]...), true
}

// firstDifference shows where a sample and its formatted form part ways.
func firstDifference(have, want string) string {
	haveLines, wantLines := strings.Split(have, "\n"), strings.Split(want, "\n")

	for i := range min(len(haveLines), len(wantLines)) {
		if haveLines[i] != wantLines[i] {
			return fmt.Sprintf("have %q, want %q", haveLines[i], wantLines[i])
		}
	}

	return "at the end"
}

func (c *checker) report(s sample, problem string) {
	c.failures++

	if !strings.Contains(problem, s.file) {
		problem = fmt.Sprintf("%s:%d: %s", s.file, s.line, problem)
	}

	fmt.Println(problem)
}

// samples finds the Go fences in a document.
func samples(path, doc string) []sample {
	var (
		out    []sample
		lines  = strings.Split(doc, "\n")
		fence  string
		code   []string
		start  int
		flags  string
		inside bool
	)

	for i, line := range lines {
		if inside {
			if strings.TrimSpace(line) == fence {
				out = append(out, sample{
					file:  path,
					line:  start,
					text:  marks.ReplaceAllString(strings.Join(code, "\n"), ""),
					flags: flags,
				})

				inside = false

				continue
			}

			code = append(code, line)

			continue
		}

		if m := fenceOpen.FindStringSubmatch(line); m != nil {
			inside, fence, flags, code, start = true, m[1], m[2], nil, i+2
		}
	}

	return out
}

// check type-checks one file and returns its errors, leaving out the ones a
// fragment cannot avoid.
func (c *checker) check(s sample, src string) []string {
	file, err := parser.ParseFile(c.fset, s.file, src, parser.SkipObjectResolution)
	if err != nil {
		return []string{err.Error()}
	}

	var problems []string

	config := types.Config{
		Importer: c.imported,
		Error: func(err error) {
			text := err.Error()

			if strings.Contains(text, "declared and not used") ||
				strings.Contains(text, "imported and not used") {
				return
			}

			problems = append(problems, text)
		},
	}

	config.Check("sample", c.fset, []*ast.File{file}, nil) //nolint:errcheck // Error collects them

	return problems
}

func isFile(text string) bool {
	for line := range strings.SplitSeq(text, "\n") {
		trimmed := strings.TrimSpace(line)

		if trimmed == "" || strings.HasPrefix(trimmed, "//") {
			continue
		}

		return strings.HasPrefix(trimmed, "package ")
	}

	return false
}

// head is the declarations at the top of a sample.
type head struct {
	text    string
	imports []string
}

// split divides a sample into declarations and the statements after them, taking
// as much as it can as declarations.
func split(text string) (head, string, error) {
	lines := strings.Split(text, "\n")

	for i := len(lines); i >= 0; i-- {
		top, rest := strings.Join(lines[:i], "\n"), strings.Join(lines[i:], "\n")

		file, err := parseDecls(top)
		if err != nil || !parses("package p\nfunc _() {\n"+rest+"\n}") {
			continue
		}

		var paths []string

		for _, spec := range file.Imports {
			paths = append(paths, spec.Path.Value)
		}

		return head{text: top, imports: paths}, rest, nil
	}

	return head{}, "", fmt.Errorf("not declarations or statements")
}

func parseDecls(text string) (*ast.File, error) {
	return parser.ParseFile(token.NewFileSet(), "", "package p\n"+text, parser.SkipObjectResolution)
}

func parses(src string) bool {
	_, err := parser.ParseFile(token.NewFileSet(), "", src, parser.SkipObjectResolution)

	return err == nil
}

// declsOf splits source into declarations, each marked with where it came from.
func declsOf(text, path string, line int) ([]decl, error) {
	fset := token.NewFileSet()
	src := "package p\n" + text

	file, err := parser.ParseFile(fset, "", src, parser.SkipObjectResolution)
	if err != nil {
		return nil, err
	}

	var out []decl

	for _, d := range file.Decls {
		if g, ok := d.(*ast.GenDecl); ok && g.Tok == token.IMPORT {
			continue
		}

		start := fset.Position(d.Pos())
		first := d.Pos()

		if f, ok := d.(*ast.FuncDecl); ok && f.Doc != nil {
			first = f.Doc.Pos()
		}

		body := src[fset.Position(first).Offset:fset.Position(d.End()).Offset]

		out = append(out, decl{
			names: namesOf(d),
			text:  fmt.Sprintf("//line %s:%d\n%s", path, line+start.Line-2, body),
		})
	}

	return out, nil
}

// namesOf returns what a declaration declares. A method counts as Type.Method.
func namesOf(d ast.Decl) []string {
	var names []string

	switch d := d.(type) {
	case *ast.FuncDecl:
		if d.Recv == nil {
			return []string{d.Name.Name}
		}

		return []string{receiver(d.Recv.List[0].Type) + "." + d.Name.Name}
	case *ast.GenDecl:
		for _, spec := range d.Specs {
			switch spec := spec.(type) {
			case *ast.TypeSpec:
				names = append(names, spec.Name.Name)
			case *ast.ValueSpec:
				for _, name := range spec.Names {
					names = append(names, name.Name)
				}
			}
		}
	}

	return names
}

func receiver(e ast.Expr) string {
	switch e := e.(type) {
	case *ast.StarExpr:
		return receiver(e.X)
	case *ast.IndexExpr:
		return receiver(e.X)
	case *ast.Ident:
		return e.Name
	}

	return ""
}

func replace(scope []decl, d decl) []decl {
	scope = slices.DeleteFunc(scope, func(old decl) bool {
		return slices.ContainsFunc(old.names, func(name string) bool {
			return slices.Contains(d.names, name) && name != "_"
		})
	})

	return append(scope, d)
}

func merged(extra []string) []string {
	out := slices.Clone(imports)

	for _, path := range extra {
		if !slices.Contains(out, path) {
			out = append(out, path)
		}
	}

	return out
}

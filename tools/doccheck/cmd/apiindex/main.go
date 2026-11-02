// Command apiindex writes what the site needs to link API names to pkg.go.dev:
// every exported name in the packages the deps package imports from ant, with its
// declaration and the first sentence of its doc comment.
//
// It reads the release go.mod names, the same one doccheck checks samples against,
// so a link always points at what the samples were checked with.
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"go/ast"
	"go/doc"
	"go/parser"
	"go/printer"
	"go/token"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strconv"
	"strings"
)

const module = "github.com/skudra-go/ant"

// index is the file the site reads.
type index struct {
	Module   string          `json:"module"`
	Version  string          `json:"version"`
	Packages map[string]*pkg `json:"packages"`
}

// pkg is one package, keyed in the index by its name, as code refers to it.
type pkg struct {
	Path    string             `json:"path"`
	URL     string             `json:"url"`
	Symbols map[string]*symbol `json:"symbols"`
}

// symbol is one exported name. Members are keyed as Type.Name, which is also the
// anchor pkg.go.dev gives them. URL is set only where the anchor is on another
// page, as it is for a member of a type declared in an internal package.
type symbol struct {
	Kind      string `json:"kind"`
	Decl      string `json:"decl"`
	Doc       string `json:"doc,omitempty"`
	URL       string `json:"url,omitempty"`
	Interface bool   `json:"interface,omitempty"`
}

// alias is an exported name for a type declared elsewhere, as ant's State is for
// one in an internal package.
type alias struct {
	name   string
	path   string
	target string
}

// parsed is a package read from source.
type parsed struct {
	listed
	url     string
	symbols map[string]*symbol
	aliases []alias
}

// listed is a package as go list reports it.
type listed struct {
	ImportPath string
	Name       string
	Dir        string
	GoFiles    []string
	Module     *struct {
		Path string
	}
}

func main() {
	if len(os.Args) != 2 {
		fmt.Fprintln(os.Stderr, "usage: apiindex <output file>")
		os.Exit(2)
	}

	out, err := build()
	if err != nil {
		fmt.Fprintln(os.Stderr, "apiindex:", err)
		os.Exit(1)
	}

	data, err := json.MarshalIndent(out, "", "\t")
	if err != nil {
		fmt.Fprintln(os.Stderr, "apiindex:", err)
		os.Exit(1)
	}

	if err := os.WriteFile(os.Args[1], append(data, '\n'), 0o644); err != nil {
		fmt.Fprintln(os.Stderr, "apiindex:", err)
		os.Exit(1)
	}

	fmt.Printf("%s %s: %d packages\n", out.Module, out.Version, len(out.Packages))
}

func build() (*index, error) {
	version, err := required()
	if err != nil {
		return nil, err
	}

	list := exec.Command("go", "list", "-deps", "-json", "./deps")
	list.Env = append(os.Environ(), "CGO_ENABLED=0")
	list.Stderr = os.Stderr

	raw, err := list.Output()
	if err != nil {
		return nil, err
	}

	out := &index{
		Module:   module,
		Version:  version,
		Packages: map[string]*pkg{},
	}

	decoder := json.NewDecoder(bytes.NewReader(raw))
	all := map[string]*parsed{}

	var public []*parsed

	for decoder.More() {
		var p listed

		if err := decoder.Decode(&p); err != nil {
			return nil, err
		}

		if p.Module == nil || !strings.HasPrefix(p.Module.Path, module) {
			continue
		}

		symbols, aliases, err := read(p)
		if err != nil {
			return nil, err
		}

		all[p.ImportPath] = &parsed{
			listed:  p,
			url:     page(p, version),
			symbols: symbols,
			aliases: aliases,
		}

		if !strings.Contains(p.ImportPath, "/internal/") {
			public = append(public, all[p.ImportPath])
		}
	}

	for _, p := range public {
		if _, taken := out.Packages[p.Name]; taken {
			return nil, fmt.Errorf("two packages are named %s", p.Name)
		}

		for _, a := range p.aliases {
			if target, ok := all[a.path]; ok && strings.Contains(a.path, "/internal/") {
				follow(p, a, target)
			}
		}

		out.Packages[p.Name] = &pkg{
			Path:    p.ImportPath,
			URL:     p.url,
			Symbols: p.symbols,
		}
	}

	return out, nil
}

// follow gives an alias the members of the internal type behind it. pkg.go.dev shows
// them on the internal package's page, so that is where they link.
func follow(p *parsed, a alias, target *parsed) {
	if t, ok := target.symbols[a.target]; ok {
		p.symbols[a.name].Interface = t.Interface
	}

	for key, s := range target.symbols {
		member, ok := strings.CutPrefix(key, a.target+".")
		if !ok {
			continue
		}

		moved := *s
		moved.URL = target.url + "#" + key
		p.symbols[a.name+"."+member] = &moved
	}
}

// page is the package's page on pkg.go.dev. ant's own packages link to the release,
// and a module of its own that has no tag yet links to whatever is newest.
func page(p listed, version string) string {
	if p.Module.Path != module {
		return "https://pkg.go.dev/" + p.ImportPath
	}

	return "https://pkg.go.dev/" + module + "@" + version + strings.TrimPrefix(p.ImportPath, module)
}

// required is the version of ant that go.mod asks for, which is the one pkg.go.dev
// shows, even when a go.work points the build at a local copy.
func required() (string, error) {
	edit, err := exec.Command("go", "mod", "edit", "-json").Output()
	if err != nil {
		return "", err
	}

	var mod struct {
		Require []struct {
			Path    string
			Version string
		}
	}

	if err := json.Unmarshal(edit, &mod); err != nil {
		return "", err
	}

	for _, r := range mod.Require {
		if r.Path == module {
			return r.Version, nil
		}
	}

	return "", fmt.Errorf("go.mod does not require %s", module)
}

func read(p listed) (map[string]*symbol, []alias, error) {
	fset := token.NewFileSet()

	var files []*ast.File

	for _, name := range p.GoFiles {
		file, err := parser.ParseFile(fset, filepath.Join(p.Dir, name), nil, parser.ParseComments)
		if err != nil {
			return nil, nil, err
		}

		files = append(files, file)
	}

	docs, err := doc.NewFromFiles(fset, files, p.ImportPath)
	if err != nil {
		return nil, nil, err
	}

	r := &reader{
		fset:    fset,
		docs:    docs,
		symbols: map[string]*symbol{},
	}

	r.values("const", docs.Consts, "")
	r.values("var", docs.Vars, "")
	r.funcs(docs.Funcs, "")

	for _, t := range docs.Types {
		r.typ(t)
		r.values("const", t.Consts, t.Name)
		r.values("var", t.Vars, t.Name)
		r.funcs(t.Funcs, "")
		r.funcs(t.Methods, t.Name+".")
	}

	return r.symbols, aliasesIn(files), nil
}

func aliasesIn(files []*ast.File) []alias {
	var out []alias

	for _, file := range files {
		imports := map[string]string{}

		for _, spec := range file.Imports {
			imported, _ := strconv.Unquote(spec.Path.Value)
			name := path.Base(imported)

			if spec.Name != nil {
				name = spec.Name.Name
			}

			imports[name] = imported
		}

		for _, decl := range file.Decls {
			gen, ok := decl.(*ast.GenDecl)
			if !ok || gen.Tok != token.TYPE {
				continue
			}

			for _, spec := range gen.Specs {
				t := spec.(*ast.TypeSpec)
				sel, isSel := t.Type.(*ast.SelectorExpr)

				if !t.Assign.IsValid() || !isSel || !t.Name.IsExported() {
					continue
				}

				if x, ok := sel.X.(*ast.Ident); ok {
					out = append(out, alias{
						name:   t.Name.Name,
						path:   imports[x.Name],
						target: sel.Sel.Name,
					})
				}
			}
		}
	}

	return out
}

type reader struct {
	fset    *token.FileSet
	docs    *doc.Package
	symbols map[string]*symbol
}

func (r *reader) add(name, kind, decl, comment string) {
	r.symbols[name] = &symbol{
		Kind: kind,
		Decl: decl,
		Doc:  r.docs.Synopsis(comment),
	}
}

func (r *reader) funcs(funcs []*doc.Func, prefix string) {
	for _, f := range funcs {
		decl := *f.Decl
		decl.Doc = nil
		decl.Body = nil

		kind := "func"
		if f.Recv != "" {
			kind = "method"
		}

		r.add(prefix+f.Name, kind, r.print(&decl), f.Doc)
	}
}

// values adds each name in a const or var group. A name with no type of its own
// takes the type it is grouped under, as iota constants usually are.
func (r *reader) values(kind string, groups []*doc.Value, typeName string) {
	for _, group := range groups {
		for _, spec := range group.Decl.Specs {
			value := spec.(*ast.ValueSpec)

			comment := group.Doc
			if value.Doc != nil {
				comment = value.Doc.Text()
			} else if value.Comment != nil && comment == "" {
				comment = value.Comment.Text()
			}

			for i, name := range value.Names {
				if !name.IsExported() {
					continue
				}

				decl := kind + " " + name.Name

				switch {
				case value.Type != nil:
					decl += " " + r.print(value.Type)
				case typeName != "":
					decl += " " + typeName
				}

				if value.Type == nil && i < len(value.Values) {
					decl += " = " + r.print(value.Values[i])
				}

				r.add(name.Name, kind, oneLine(decl), comment)
			}
		}
	}
}

// typ adds a type, and the exported fields of a struct or methods of an interface,
// which pkg.go.dev anchors as Type.Name too.
func (r *reader) typ(t *doc.Type) {
	spec := t.Decl.Specs[0].(*ast.TypeSpec)

	params := ""
	if spec.TypeParams != nil {
		params = r.print(spec.TypeParams)
		params = "[" + strings.TrimSuffix(strings.TrimPrefix(params, "("), ")") + "]"
	}

	head := "type " + t.Name + params

	switch body := spec.Type.(type) {
	case *ast.StructType:
		r.add(t.Name, "type", head+" struct{ … }", t.Doc)

		for _, field := range body.Fields.List {
			for _, name := range field.Names {
				if name.IsExported() {
					r.add(t.Name+"."+name.Name, "field", name.Name+" "+r.print(field.Type), text(field.Doc, field.Comment))
				}
			}
		}
	case *ast.InterfaceType:
		r.add(t.Name, "type", head+" interface{ … }", t.Doc)
		r.symbols[t.Name].Interface = true

		for _, method := range body.Methods.List {
			for _, name := range method.Names {
				if name.IsExported() {
					r.add(t.Name+"."+name.Name, "method", name.Name+strings.TrimPrefix(r.print(method.Type), "func"), text(method.Doc, method.Comment))
				}
			}
		}
	default:
		assign := " "
		if spec.Assign.IsValid() {
			assign = " = "
		}

		r.add(t.Name, "type", oneLine(head+assign+r.print(spec.Type)), t.Doc)
	}
}

func (r *reader) print(node any) string {
	var b bytes.Buffer

	if err := printer.Fprint(&b, r.fset, node); err != nil {
		return ""
	}

	return b.String()
}

func text(groups ...*ast.CommentGroup) string {
	for _, g := range groups {
		if g != nil {
			return g.Text()
		}
	}

	return ""
}

// oneLine keeps a long value from taking over a hover card.
func oneLine(s string) string {
	s = strings.Join(strings.Fields(s), " ")

	if runes := []rune(s); len(runes) > 120 {
		s = string(runes[:117]) + "..."
	}

	return s
}

// Package export server-renders a situation's court document to a print-correct PDF.
// One HTML template (court layout) is the single source for the on-screen and PDF
// representations; chromedp turns it into an A4 PDF (CLAUDE.md golden rule #3: the
// generated da'vo arizasi must look like an authentic Uzbek court document).
package export

import (
	_ "embed"
	"html/template"
	"strings"

	"github.com/romaluev/areeza/server/internal/situation"
)

//go:embed templates/court.html.tmpl
var courtTmplRaw string

var courtTmpl = template.Must(template.New("court").Parse(courtTmplRaw))

type secView struct {
	Class string
	HTML  template.HTML
}

type docView struct {
	Sections   []secView
	Disclaimer string
}

func classForKind(kind string) string {
	switch kind {
	case "header":
		return "court"
	case "party":
		return "party"
	case "title":
		return "title"
	case "demand":
		return "demand"
	case "attachments":
		return "attachments"
	case "footer":
		return "footer"
	default:
		return "body"
	}
}

// RenderDocumentHTML renders the document's sections into the court-layout HTML.
// Section content is HTML-escaped (the CSS white-space:pre-line preserves newlines),
// so model-written text can never inject markup.
func RenderDocumentHTML(_ situation.Situation, doc situation.Document) (string, error) {
	view := docView{
		Disclaimer: "Areeza tomonidan tayyorlandi — yuridik maslahat emas. Topshirishdan oldin malakali yurist yoki yuridik klinika ko'rigidan o'tkazing.",
	}
	for _, sec := range doc.Sections {
		content := strings.TrimSpace(sec.Content)
		if content == "" {
			continue
		}
		view.Sections = append(view.Sections, secView{
			Class: classForKind(sec.Kind),
			HTML:  template.HTML(template.HTMLEscapeString(content)),
		})
	}
	var b strings.Builder
	if err := courtTmpl.Execute(&b, view); err != nil {
		return "", err
	}
	return b.String(), nil
}

package export

import (
	"context"
	"time"

	"github.com/chromedp/cdproto/page"
	"github.com/chromedp/chromedp"
)

// Renderer turns court-layout HTML into PDF bytes. Behind an interface so the demo can
// fall back to NoopRenderer on hosts without a Chrome/Chromium binary.
type Renderer interface {
	ToPDF(ctx context.Context, html string) ([]byte, error)
}

// ChromeRenderer renders via headless Chrome (chromedp.PrintToPDF). It honours the
// template's CSS @page size/margins. Requires a Chrome/Chromium binary on the host.
type ChromeRenderer struct{}

func (ChromeRenderer) ToPDF(ctx context.Context, html string) ([]byte, error) {
	ctx, cancel := chromedp.NewContext(ctx)
	defer cancel()
	ctx, cancel = context.WithTimeout(ctx, 25*time.Second)
	defer cancel()

	var pdf []byte
	err := chromedp.Run(ctx,
		chromedp.Navigate("about:blank"),
		chromedp.ActionFunc(func(ctx context.Context) error {
			tree, err := page.GetFrameTree().Do(ctx)
			if err != nil {
				return err
			}
			return page.SetDocumentContent(tree.Frame.ID, html).Do(ctx)
		}),
		chromedp.ActionFunc(func(ctx context.Context) error {
			data, _, err := page.PrintToPDF().
				WithPrintBackground(true).
				WithPreferCSSPageSize(true).
				Do(ctx)
			if err != nil {
				return err
			}
			pdf = data
			return nil
		}),
	)
	if err != nil {
		return nil, err
	}
	return pdf, nil
}

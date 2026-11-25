# Playwright: accessibility testing with axe

Source: https://playwright.dev/docs/accessibility-testing (read 2026-11-25)

- Package: `@axe-core/playwright`. `const results = await new AxeBuilder({ page }).analyze(); expect(results.violations).toEqual([]);`
- Limit to WCAG rules with `.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])`. We add `'wcag22aa'`.
- `.include(selector)` scans part of a page. `.exclude(selector)` skips known issues. `.disableRules(['duplicate-id'])` turns off a rule.
- Share common config through a test fixture.
- "Automated accessibility tests can detect some common accessibility problems ... But many accessibility problems can only be discovered through manual testing."

## Learned in this repo (2026-11-25, @axe-core/playwright 4.14.1)
When driving Playwright as a library, `AxeBuilder` rejects a page made by `browser.newPage()` with "Please use browser.newContext()".
Create the page with `(await browser.newContext()).newPage()`. The `@playwright/test` `page` fixture already does this.

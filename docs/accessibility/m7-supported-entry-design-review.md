# M7 supported entry design review

| Before                                                                                               | After                                                                                                           | Why                                                                                                             |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `/` opened the browser-local prototype while the supported platform landing lived at `/platform`.    | `/` is the canonical platform landing; `/platform` permanently redirects to it.                                 | The first product surface now communicates the supported architecture and provides one stable, indexable entry. |
| Prototype routes appeared at top-level paths and were linked as though they were current operations. | Prototype surfaces live under an explicit `/legacy/*` namespace and retain a clearly labelled legacy link.      | Operators can distinguish migration evidence from backend-driven operational truth.                             |
| Old and new public paths could become duplicate search results.                                      | Canonical metadata, sitemap, robots policy, and response headers separate public, private, and legacy surfaces. | Discovery stays focused and migration fixtures remain available without being promoted.                         |

## Interaction and motion decision

The change reuses the existing landing and operations shells. Redirects are immediate server responses and add no transition animation. Existing reduced-motion behavior and restrained press feedback remain unchanged.

## Review checklist

- Verify desktop and 390 px mobile layouts at `/` in both supported themes.
- Verify keyboard skip navigation and language controls from the canonical entry.
- Verify `/platform`, `/fdp`, and `/engineeringMode` resolve to their intended destinations.
- Verify `/legacy/*` has noindex response policy and does not appear in the sitemap.

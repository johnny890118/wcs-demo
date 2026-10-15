# UI primitive provenance and adaptation

Owned TypeScript components follow the official shadcn/ui Tailwind 3 `new-york`
registry at `https://v3.shadcn.com/r/styles/new-york/{component}.json` (inspected
2026-10-09: button, input, textarea, popover, tooltip, badge, separator, tabs).
The project does not run template init or overwrite inspected local behavior.
Upstream shadcn/ui is MIT; this attribution is not an open-source license for SWP.

Button: CVA variants, ref/Slot composition and class merging; SWP aliases and 44px
touch retained. Input/textarea/native select retain form names and native submit
semantics. Existing Popover/Tooltip use the same supported Radix architecture,
collision bounds and focus behavior. No extra independent Radix system is added.
Real URL navigation stays links, not fake ARIA tabs. Native choices are retained
where replacing them would risk established form/keyboard contracts without gain.
Lucide uses official named React imports. The independent repository-wide Legacy
migration removes Heroicons/Headless entirely; no registry code or dependency
script executes blindly.

Sheet (2026-10-11): inspected the complete official v3 `new-york/sheet.json`
source and Radix Dialog documentation. Owned Portal/Overlay/Content/Title/Trigger/
Close composition uses pinned `@radix-ui/react-dialog@1.2.0`, installed from npm
with scripts disabled. Retain SWP semantic surfaces, the right-side navigation
geometry and one localized 44px close control; omit decorative 300–500ms animation
and the upstream duplicate English-only close. Automatic modal focus management
is retained; geometry changes use the existing visible-navigation restoration.
Formal product overlays now follow the supported Radix-backed shadcn pathway.
The historical temporary Headless installation ended with the independent
Legacy migration. Owned Dialog (`dialog.tsx`) exports the same installed Radix
foundation as Sheet without copying upstream decorative styles. The Legacy
composition preserves controlled initial/return focus and explicitly qualifies
backdrop clicks for Radix 1.2's registered overlay surface; no third framework.

## Upstream notice — shadcn/ui portions only

This notice applies only to adapted shadcn/ui source, not to SWP or the
repository as a whole. Source: https://github.com/shadcn-ui/ui/blob/main/LICENSE.md

MIT License

Copyright (c) 2023 shadcn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

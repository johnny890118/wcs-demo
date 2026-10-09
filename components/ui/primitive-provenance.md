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
Lucide uses official named React imports; Heroicons remain only while Legacy needs
them. No registry code or dependency script executes blindly.

## Upstream notice — shadcn/ui portions only

This notice applies only to adapted shadcn/ui source, not to SWP or this private
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

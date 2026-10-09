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

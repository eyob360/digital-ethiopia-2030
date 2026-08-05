# SRS — Instructions

Drop original requirement documents here exactly as delivered (any format: md, pdf, docx). Never edit them — they are the untouched source of truth.

## Receiving documents

Agents: get the SRS into this folder using the first option that works, in this order:

1. **User attaches it in chat** → if your harness exposes the attachment as a readable file, copy it in, keeping the original name. Most natural for the user; not every harness supports it — if yours doesn't, fall back.
2. **User places the file here themselves** → give them the full path to this `srs/` directory and ask them to copy the file(s) in, then confirm they landed. Works with every tool, zero copy risk.
3. **User gives a local file path** → copy it (`cp`), keeping the original name. Byte-perfect, but sandboxing may block reading outside the project.
4. **User gives a URL** → fetch and save it. Requires network access; if unavailable, fall back.
5. **User pastes the text** → save it verbatim, and add `-transcribed` to the filename (e.g. `billing-srs-transcribed.md`) — pasted content may not be byte-perfect, so flag its provenance.

Whatever the route, never edit the content afterwards. Then parse it into BRDs per `../brds/INSTRUCTIONS.md`. Each BRD must cite which SRS file (and section) it came from.

## Updated versions

When a revised SRS arrives, add it alongside the old one with a version suffix (e.g. `billing-srs-v2.md`) — never overwrite. Diff it against the previous version, list the affected BRDs, and present the needed BRD updates to the user before making them.

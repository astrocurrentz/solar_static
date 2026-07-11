# Solar Static Studio Notion Sync

Small explicit CLI for syncing selected Solar Static Studio Markdown documents with selected Notion pages.

## Setup

1. Copy `.env.example` to `.env`.
2. Create a Notion internal connection with read and update content capabilities.
3. Add the connection only to the target Notion pages.
4. Copy `config/notion-pages.example.json` to `config/notion-pages.json`.
5. Replace each example page ID with the matching Notion page ID.

The real `.env`, real page mapping, and `.sync/` state are intentionally ignored by Git.

## Commands

```bash
npm run notion:list
npm run notion:status -- <document-key>
npm run notion:diff -- <document-key>
npm run notion:push -- <document-key>
npm run notion:pull -- <document-key>
npm run notion:push-all
npm run notion:pull-all
```

Flags:

```bash
--dry-run
--force
--yes
--json
```

Run `npm run verify` before handing off changes.

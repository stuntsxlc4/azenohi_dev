# Verify Journey Locally

Start the existing development frontend according to `web/README.md`, then open `http://localhost:8080/journey`. Verify the active link, heading focus and five illustrated milestones. Activate two milestones in sequence with Tab and Enter, then refresh and use browser Back and Forward.

Run `npm --prefix web run check` and `npm --prefix web run test:e2e -- --project=chromium` from the repository root. For manual screenshot checks, open Journey with `.agents/bin/playwright-cli open http://localhost:8080/journey`, resize to the requested viewport and use the screenshot command. At narrow widths, scroll down the sequence to verify every entry and the closing line.

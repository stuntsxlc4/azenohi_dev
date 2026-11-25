# Verification

From the repository root, use the project runtime and start the Vite app on port 8080. Open Journey directly, then visit Home. Pause the orbit, visit Team and Journey, and return Home through browser history. Check that the control still offers Play. Repeat with reduced motion and a narrow viewport. From Projects open Risk Miner and use the return link to verify card focus and scroll position.

Run the repository gates and the three browser projects.

```sh
make web-check api-check compose-check spec-check
uv run --project api --locked pre-commit run --all-files
npm --prefix web run test:e2e -- --project=chromium --project=webkit --project=mobile-chromium
.agents/bin/playwright-cli open http://localhost:8080/
```

For a like-for-like benchmark, serve a production build of the merged baseline and the feature on separate ports. Run the same command once per origin with the installed Chrome on Apple Metal. Each run includes the full six-configuration matrix and twenty lifecycle cycles.

```sh
node specs/004-cinematic-transitions/evidence/measure.mjs http://localhost:4187 /tmp/cinematic-samples.json
```

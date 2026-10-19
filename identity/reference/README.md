# Recovered browser reference

`client/id-next.js` and `client/id-next.css` were extracted from the checksum-verified archived staging Worker on 2026-10-20 using `pnpm extract:client`. The JavaScript is the readable browser code embedded as a string inside that bundle. These files are references for reconstruction; changing them does not change the deployed Worker.

No original server module tree or source map was present in the saved Cloudflare version. The version API returned only `worker.js`. A scoped filename search in the local Documents, Downloads and Desktop directories also did not locate an original JRVX ID package.

To reproduce the extraction locally:

```sh
pnpm check
pnpm extract:client
```

The extractor uses the original archive in a disposable local runtime with outbound networking disabled. It never reads a logged-in user's page or the production database. Active client source now lives in `../src/client/`; the source adapter builds those assets while retaining the verified authentication module. Original server module reconstruction remains outstanding.

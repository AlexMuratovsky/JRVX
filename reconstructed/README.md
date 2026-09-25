# JRVX reconstructed source

This directory is the maintainable-source reconstruction of the deployed JRVX UI.

It is intentionally isolated from the live ChatGPT Sites deployment until feature parity and compatibility checks are complete.

## Current phase

- public JRVX branding: restored
- core responsive shell: restored
- captured production routes represented
- PWA metadata represented in the recovery snapshot
- data/backend adapter: pending
- authentication adapter: pending
- production write operations: intentionally disabled
- deployment: intentionally disabled

## Run locally

```bash
npm install
npm run check:brand
npm run dev
```

## Build

```bash
npm run build
```

## Safety rule

Do not point this reconstruction at production mutation endpoints until the API/auth/storage contracts have been verified against the existing deployment. The current production snapshot remains the regression reference.

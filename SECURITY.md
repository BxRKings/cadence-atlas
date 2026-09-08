# Security notes

## Credential handling

Cadence Atlas never asks for an Audiotool password, personal access token, or payment information. The live connector uses the Nexus browser OAuth PKCE flow with `project:write`. The OAuth client ID is public by design. The client ID and project URL are stored only in the current tab's `sessionStorage`; exported OAuth tokens are never read or persisted by this application.

## Mutation boundary

The only remote mutation is the chord export a user requests from the **Authorize and write** dialog. It appends native project entities. The app does not delete existing entities, publish a project, invite collaborators, upload samples, send messages, or make purchases.

Use a disposable Audiotool project for the first live validation because every accepted export appends another track and instrument.

## Dependency audit

At the September 8, 2026 review, `@audiotool/nexus` 0.0.17 was the latest published SDK. `npm audit --omit=dev` reports advisories through its Node-only `@connectrpc/connect-node → undici@5.29.0` path. Cadence Atlas imports the browser connector in production, and the built `dist/` contains no `undici`, `connect-node`, or `permessage-deflate` code. The Node transport is used only by the offline integration tests.

An unsupported forced major upgrade was intentionally avoided. Recheck when Audiotool publishes a Nexus release with an updated Node transport.

## Reporting

Open a GitHub issue with a minimal reproduction and no credentials or private project URLs.

# JRVX

JRVX is an ecosystem of account, planning and game projects. The public entry
point is [jrvx.ru](https://jrvx.ru/), rebuilt as an ecosystem overview on
20 October 2026 at the owner's request.

## Public projects

- [JRVX ID](https://id.jrvx.ru/): account and connected services.
- [JRVX Planner](https://planner.jrvx.ru/): tasks and the embedded Arcade module.
- [JRVX CAS](https://cas.jrvx.ru/): virtual-unit table games, 18+.
- JRVX AI remains experimental, not a separate public launch.

## Source and deployment

- `ecosystem/`: a reviewable mirror of the new public homepage, project pages and assets.
- `identity/`: the JRVX ID migration and gateway work.
- `reconstructed/`: the earlier planner reconstruction, retained as a reference.
- `production-snapshot/`: historical recovery evidence.

The authoritative complete main-site source and production publishing remain in
Sites project `appgprj_6aafd5f13ddc819197f9aeb91c609a6b`. This GitHub repository
is not automatically deployed to that project. See [ecosystem deployment notes](ecosystem/README.md).

Existing planner routes and stored data remain available through `/workspace`
on the main site. New main-site work must preserve authentication, backend/API
behavior, storage isolation and existing user data.

## Branding and secrets

Canonical brand: **JRVX**. Account service: **JRVX ID**.
Use `jrvx` for new internal identifiers. Preserve legacy identifiers only when
needed for compatibility. Never commit runtime secrets or user data.

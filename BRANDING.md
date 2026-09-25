# JRVX branding rules

## Canonical brand

Use **JRVX** everywhere in public-facing product surfaces.

Approved public names:
- JRVX
- JRVX AI
- JRVX Arcade
- JRVX Poker
- JRVX Racing

Primary domain:
- https://jrvx.ru

Fallback ChatGPT Sites URL:
- https://planhelper-alemura.gleb-v-markevich.chatgpt.site

## Replacement rules

For user-facing text, documentation, build artifacts, workflow names and new public API aliases:

- old uppercase brand -> JRVX
- old title-cased brand -> JRVX
- old lowercase public identifiers -> jrvx

## Compatibility rule

Do not rename a legacy internal key, database field, storage key, route, environment variable, protocol field or persisted identifier when that would break existing users, stored data, deployed clients or integrations.

When compatibility is required:
1. keep the legacy internal identifier temporarily;
2. add a JRVX alias;
3. prefer JRVX for all new code;
4. migrate persisted data explicitly before removing the legacy alias.

## Secrets

Never commit:
- OPENAI_API_KEY
- access tokens
- passwords
- private signing keys
- database credentials

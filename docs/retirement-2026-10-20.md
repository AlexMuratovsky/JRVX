# Retirement record — 20 October 2026

The owner explicitly requested complete removal of MineCore and separately
confirmed that the JRVX: CORE game must also be removed.

## MineCore

Verified deleted:

- Cloudflare Workers `jrvx-minecore`, `jrvx-minecore-preview`, `jrvx-minecore-next`.
- Dedicated D1 database `jrvx-minecore-next-test`.
- DNS record for `minecore.jrvx.ru`.
- MineCore's catalog entry, OAuth client, grants and linked-app entries in the
  isolated next-generation ID database. Other apps and identity users were kept.
- REG.RU website `minecore.jrvx.ru` and its directory `/www/minecore.jrvx.ru`.
  The owner confirmed the final irreversible browser action at action time.

Read-back checks found no MineCore Workers, database or DNS record, and zero
matching catalog/client/link rows. The REG.RU website and file lists each showed
only CAS, ID, the root site and Planner afterward.

The shared production identity database had no matching MineCore registrations
and was not modified. Historical recovery snapshots and audit records were not
rewritten. This record does not assert that hosting backups, old certificate
objects or visitors' local/offline copies have been purged.

## CORE

The owner confirmed they deleted CORE manually while this work was in progress.
Sites then omitted it from the owned-project list and returned "project not found"
for its former exact project ID. A locally prepared retirement version was not
pushed or deployed after that removal. No claim is made that it was deployed.

The new public ecosystem site contains neither MineCore nor CORE.

All three unused REG.RU MineCore SSL certificate objects were also removed after
the owner confirmed their exact names at action time. The current root-site,
identity, planner and CAS certificates were retained.
